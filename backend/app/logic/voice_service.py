import asyncio
import base64
import json
import os
import pathlib

from websockets.client import connect
from websockets.exceptions import ConnectionClosed

from app.logs.logger import get_logger

logger = get_logger(__name__)

# The model is instructed with the same markdown knowledge base that powers the
# text chat (backend/docs/*.md) - no files from the standalone voice project.
DOCS_DIR = pathlib.Path(__file__).resolve().parents[2] / "docs"

# Language(s) the speech recognizer should expect for the visitor's mic input.
# Defaults to Hebrew only so Hebrew speech is always transcribed as Hebrew (a
# second candidate makes the recognizer drift and romanize the transcript).
# Override with VOICE_LANGUAGE_CODES="he-IL,en-US,..." to allow more languages.
INPUT_LANGUAGE_CODES = [
    c.strip() for c in os.getenv("VOICE_LANGUAGE_CODES", "he-IL").split(",") if c.strip()
]

ROLE = (
    "You are Ilya Rahmilevich's voice assistant on the portfolio website. Answer "
    "visitors' spoken questions about Ilya career, skills and experience "
    "using the knowledge below. Speak English by default. If the visitor speaks another "
    "language (Hebrew, Arabic, Russian, ...), understand them and reply in that same "
    "language instead, until they switch back (the knowledge below is written in English; "
    "translate from it as needed). Keep replies natural and concise; if the answer isn't "
    "in the knowledge, say so instead of guessing."
)

def voice_instruction() -> str:
    """Build the system instruction: assistant role + this project's markdown docs (backend/docs/*.md)."""
    if not DOCS_DIR.exists():
        return ROLE
    docs = [p.read_text(encoding="utf-8").strip() for p in sorted(DOCS_DIR.glob("*.md"))]
    knowledge = "\n\n".join(d for d in docs if d)
    return f"{ROLE}\n\n--- KNOWLEDGE ABOUT ILYA ---\n\n{knowledge}" if knowledge else ROLE


class GeminiVoiceBridge:
    """Relays audio between a browser WebSocket and the Gemini Live API.

    Adapted from the standalone gemini-voice-to-voice client: microphone capture
    and speaker playback now happen in the browser, so this class only bridges
    the two WebSocket connections instead of touching local audio hardware.
    """

    MODEL = "gemini-3.1-flash-live-preview"

    def __init__(self, browser_ws):
        self.browser_ws = browser_ws
        api_key = os.environ.get("GEMINI_API_KEY")
        self.uri = (
            "wss://generativelanguage.googleapis.com/ws/"
            "google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
            f"?key={api_key}"
        )
        self.gemini_ws = None
        # Gemini recycles the connection periodically (sending "GoAway" first);
        # we reconnect and resume from this handle so the session survives.
        self.session_handle = None
        self._instruction = voice_instruction()

    async def run(self):
        async with asyncio.TaskGroup() as tg:
            tg.create_task(self._browser_to_gemini())
            tg.create_task(self._session_loop())

    async def _browser_to_gemini(self):
        """Forward raw PCM16 mic chunks from the browser to Gemini."""
        while True:
            data = await self.browser_ws.receive_bytes()
            gemini_ws = self.gemini_ws
            if gemini_ws is None:
                continue
            try:
                await gemini_ws.send(json.dumps({
                    "realtime_input": {
                        "audio": {
                            "data": base64.b64encode(data).decode(),
                            "mime_type": "audio/pcm",
                        }
                    }
                }))
            except ConnectionClosed:
                pass

    async def _session_loop(self):
        first_connect = True
        while True:
            async with connect(
                self.uri,
                extra_headers={"Content-Type": "application/json"},
            ) as gemini_ws:
                self.gemini_ws = gemini_ws
                await gemini_ws.send(json.dumps({
                    "setup": {
                        "model": f"models/{self.MODEL}",
                        "generation_config": {"response_modalities": ["AUDIO"]},
                        "input_audio_transcription": {"language_codes": INPUT_LANGUAGE_CODES},
                        "output_audio_transcription": {},
                        "realtime_input_config": {
                            "automatic_activity_detection": {
                                "silence_duration_ms": 2000,
                                "end_of_speech_sensitivity": "END_SENSITIVITY_LOW",
                            }
                        },
                        "context_window_compression": {"sliding_window": {}},
                        "session_resumption": (
                            {"handle": self.session_handle}
                            if self.session_handle else {}
                        ),
                        "system_instruction": {
                            "parts": [{"text": self._instruction}]
                        },
                    }
                }))
                await gemini_ws.recv()
                if first_connect:
                    await gemini_ws.send(json.dumps({
                        "client_content": {
                            "turns": [{"role": "user", "parts": [{"text": (
                                "Greet the visitor in English in one short sentence and "
                                "invite them to ask about Ilya's experience."
                            )}]}],
                            "turn_complete": True,
                        }
                    }))
                    first_connect = False
                try:
                    await self._gemini_to_browser()
                except ConnectionClosed:
                    pass
            self.gemini_ws = None

    async def _gemini_to_browser(self):
        """Stream Gemini audio + transcripts back to the browser."""
        async for msg in self.gemini_ws:
            response = json.loads(msg)

            new_handle = response.get("sessionResumptionUpdate", {}).get("newHandle")
            if new_handle:
                self.session_handle = new_handle

            if "goAway" in response:
                # Connection about to close; return so _session_loop resumes.
                return

            server_content = response.get("serverContent", {})

            try:
                audio_b64 = server_content["modelTurn"]["parts"][0]["inlineData"]["data"]
            except (KeyError, IndexError):
                pass
            else:
                await self.browser_ws.send_bytes(base64.b64decode(audio_b64))

            user_text = server_content.get("inputTranscription", {}).get("text")
            if user_text:
                await self._send_event("user", user_text)

            model_text = server_content.get("outputTranscription", {}).get("text")
            if model_text:
                await self._send_event("model", model_text)

            if server_content.get("turnComplete"):
                await self._send_event("turn_complete", "")

    async def _send_event(self, kind: str, text: str):
        try:
            await self.browser_ws.send_json({"type": kind, "text": text})
        except RuntimeError:
            pass