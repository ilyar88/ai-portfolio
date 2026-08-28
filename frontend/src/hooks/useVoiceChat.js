import { useCallback, useEffect, useRef, useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const WS_URL = BACKEND_URL.replace(/^http/i, 'ws') + '/voice';

const INPUT_RATE = 16000; // Gemini Live expects 16 kHz PCM16 mono input
const OUTPUT_RATE = 24000; // Gemini Live sends 24 kHz PCM16 mono output
const PLAYBACK_RATE = Math.round(OUTPUT_RATE * 0.85); // slow the voice slightly, like the desktop client

const floatTo16BitPCM = (input) => {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
};

const downsample = (input, inRate, outRate) => {
  if (outRate >= inRate) return input;
  const ratio = inRate / outRate;
  const length = Math.round(input.length / ratio);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) output[i] = input[Math.floor(i * ratio)];
  return output;
};

const playChunk = (refs, arrayBuffer) => {
  const ctx = refs.outCtx;
  const int16 = new Int16Array(arrayBuffer);
  if (!ctx || !int16.length) return;
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 0x8000;

  const buffer = ctx.createBuffer(1, float32.length, ctx.sampleRate);
  buffer.getChannelData(0).set(float32);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);

  const now = ctx.currentTime;
  const startAt = Math.max(now, refs.playHead || 0);
  source.start(startAt);
  refs.playHead = startAt + buffer.duration;
};

/**
 * Voice-to-voice chat with Gemini through the backend `/voice` websocket.
 * Captures the microphone in the browser, streams PCM to the backend (which
 * relays to the Gemini Live API), and plays Gemini's audio response back.
 */
export const useVoiceChat = ({ onEvent } = {}) => {
  const [status, setStatus] = useState('idle'); // idle | connecting | live | error
  const refs = useRef({});
  const activeRef = useRef(false);

  const stop = useCallback(() => {
    const r = refs.current;
    activeRef.current = false;
    try { if (r.processor) r.processor.onaudioprocess = null; } catch { /* noop */ }
    try { r.processor?.disconnect(); } catch { /* noop */ }
    try { r.source?.disconnect(); } catch { /* noop */ }
    try { r.micStream?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
    try { if (r.inCtx && r.inCtx.state !== 'closed') r.inCtx.close(); } catch { /* noop */ }
    try { if (r.outCtx && r.outCtx.state !== 'closed') r.outCtx.close(); } catch { /* noop */ }
    try { if (r.ws) { r.ws.onclose = null; r.ws.close(); } } catch { /* noop */ }
    refs.current = {};
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (activeRef.current) return;
    activeRef.current = true;
    setStatus('connecting');

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      if (!activeRef.current) {
        micStream.getTracks().forEach((t) => t.stop());
        return;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const r = refs.current;
      r.micStream = micStream;
      r.inCtx = new AudioCtx({ sampleRate: INPUT_RATE });
      r.outCtx = new AudioCtx({ sampleRate: PLAYBACK_RATE });
      r.playHead = 0;
      await r.inCtx.resume?.();
      await r.outCtx.resume?.();

      const ws = new WebSocket(WS_URL);
      ws.binaryType = 'arraybuffer';
      r.ws = ws;
      ws.onopen = () => { if (activeRef.current) setStatus('live'); };
      ws.onerror = () => setStatus('error');
      ws.onclose = () => { if (activeRef.current) stop(); };
      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try { onEvent?.(JSON.parse(event.data)); } catch { /* noop */ }
          return;
        }
        playChunk(r, event.data);
      };

      const source = r.inCtx.createMediaStreamSource(micStream);
      const processor = r.inCtx.createScriptProcessor(4096, 1, 1);
      r.source = source;
      r.processor = processor;
      processor.onaudioprocess = (e) => {
        // Full duplex: getUserMedia echoCancellation handles speaker bleed, so we
        // keep sending mic audio even while Gemini is speaking (lets the visitor
        // talk/interrupt - the half-duplex mute was dropping their speech).
        if (!activeRef.current || ws.readyState !== WebSocket.OPEN) return;
        let data = e.inputBuffer.getChannelData(0);
        if (r.inCtx.sampleRate !== INPUT_RATE) data = downsample(data, r.inCtx.sampleRate, INPUT_RATE);
        ws.send(floatTo16BitPCM(data).buffer);
      };
      source.connect(processor);
      processor.connect(r.inCtx.destination); // node only runs while connected; it outputs silence
    } catch (err) {
      console.error('Voice chat failed to start:', err);
      setStatus('error');
      stop();
    }
  }, [onEvent, stop]);

  const toggle = useCallback(() => {
    if (activeRef.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => stop, [stop]);

  return { status, toggle, start, stop };
};
