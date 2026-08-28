from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.logic.voice_service import GeminiVoiceBridge
from app.logs.logger import get_logger

logger = get_logger(__name__)


class VoiceRouter:
    """WebSocket endpoint that bridges the browser to the Gemini Live API."""

    def __init__(self):
        self.router = APIRouter()
        self.router.add_api_websocket_route("/voice", self._voice)

    async def _voice(self, websocket: WebSocket):
        await websocket.accept()
        logger.info("Voice websocket connected")
        bridge = GeminiVoiceBridge(websocket)
        try:
            await bridge.run()
        except* WebSocketDisconnect:
            logger.info("Voice websocket disconnected")
        except* Exception as eg:
            logger.exception(f"Voice bridge error: {eg.exceptions}")
        finally:
            try:
                await websocket.close()
            except RuntimeError:
                pass
