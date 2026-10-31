// Replays a live Relay voice session (recorded by voice-live.ts) inside the frame-stepped capture.
//
// The page's Deepgram socket is replaced by one that plays back the recorded server messages:
// transcripts, function-call requests and the agent's PCM audio, byte for byte. Each message keeps
// its recorded delay after the client message it answered (Settings or a function-call response),
// and never arrives earlier than its recorded offset from Settings, so the conversation keeps its
// live pacing. The employee's line reaches the app through its real microphone path (the PCM
// worklet's port). The audio clock the agent player schedules against follows page time, so
// playback drains when it would have live, and the player's output meter (which drives the orb)
// reads the agent audio scheduled at that page time.
// The app's own code runs unchanged: tools execute against the portal and navigate it.
import { readFileSync } from "node:fs";

const ANCHORS = new Set(["Settings", "FunctionCallResponse", "InjectUserMessage"]);

function wavPcm16(file) {
  const buf = readFileSync(file);
  let at = 12;
  while (at < buf.length) {
    const id = buf.toString("ascii", at, at + 4);
    const size = buf.readUInt32LE(at + 4);
    if (id === "data") return buf.subarray(at + 8, at + 8 + size);
    at += 8 + size + (size % 2);
  }
  throw new Error(`no data chunk in ${file}`);
}

export function buildReplay(sessionFile, micWav16k) {
  const session = JSON.parse(readFileSync(sessionFile, "utf8"));
  const msgs = [...session.dg.msgs].sort((a, b) => a.at - b.at);
  const open = msgs.find((m) => m.dir === "open");
  const anchors = [{ key: "open#1", at: open.at }];
  const counts = {};
  for (const m of msgs) {
    if (m.dir !== "out" || !m.text) continue;
    const type = JSON.parse(m.text).type;
    if (!ANCHORS.has(type)) continue;
    counts[type] = (counts[type] ?? 0) + 1;
    anchors.push({ key: `${type}#${counts[type]}`, at: m.at });
  }
  const settings = anchors.find((a) => a.key === "Settings#1");
  const byAnchor = {};
  for (const m of msgs) {
    if (m.dir !== "in") continue;
    const anchor = [...anchors].reverse().find((a) => a.at <= m.at) ?? anchors[0];
    (byAnchor[anchor.key] ??= []).push({ delay: m.at - anchor.at, ...(m.text ? { text: m.text } : { bin: m.bin }) });
  }
  const anchorOffset = Object.fromEntries(anchors.map((a) => [a.key, a.at - settings.at]));
  return {
    data: {
      byAnchor,
      anchorOffset,
      // When Maya started speaking into the microphone, after Settings was sent.
      micDelay: session.spoken.startedAt - settings.at,
      mic: wavPcm16(micWav16k).toString("base64"),
    },
    recordedAt: session.recordedAt,
  };
}

// One recorded session per voice conversation: the page's Nth Deepgram socket replays sessions[N - 1].
export function replayScript(sessions) {
  const list = Array.isArray(sessions) ? sessions : [sessions];
  return `(() => {
  const S = ${JSON.stringify(list)};
  const now = () => performance.now();
  const state = (window.__voiceReplay = { log: [], phase: "ready", phases: [], settingsAt: null, micStart: null, sock: 0 });
  let sockets = 0;
  window.addEventListener("northstar:voice-state", (e) => {
    const phase = e.detail && e.detail.phase;
    if (phase && phase !== state.phase) { state.phase = phase; state.phases.push({ phase, at: now() }); }
  });

  // Audio clock follows page time (Playwright's virtual clock during capture).
  const origins = new WeakMap();
  Object.defineProperty(BaseAudioContext.prototype, "currentTime", { configurable: true, get() {
    if (!origins.has(this)) origins.set(this, now());
    return (now() - origins.get(this)) / 1000;
  } });

  // Playback meter on page time. The real audio graph renders on the wall clock, which runs far
  // ahead of the stepped page, so an AnalyserNode in a context that plays buffers is answered from
  // the buffers themselves: the samples scheduled at the context's (page-time) currentTime.
  const played = new WeakMap();
  const nativeStart = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (when = 0, ...rest) {
    const ctx = this.context;
    if (this.buffer) {
      const list = played.get(ctx) || [];
      list.push({ at: Math.max(when, ctx.currentTime), data: this.buffer.getChannelData(0), rate: this.buffer.sampleRate });
      played.set(ctx, list.filter((b) => b.at + b.data.length / b.rate > ctx.currentTime - 1));
    }
    return nativeStart.call(this, when, ...rest);
  };
  const nativeBytes = AnalyserNode.prototype.getByteTimeDomainData;
  AnalyserNode.prototype.getByteTimeDomainData = function (out) {
    const list = played.get(this.context);
    if (!list) return nativeBytes.call(this, out);
    const t = this.context.currentTime;
    out.fill(128);
    for (const b of list) {
      // The analyser's window is the latest fftSize samples; the caller reads the first out.length.
      const first = Math.round((t - b.at) * b.rate) - this.fftSize;
      for (let k = 0; k < out.length; k += 1) {
        const i = first + k;
        if (i >= 0 && i < b.data.length) out[k] = Math.max(0, Math.min(255, Math.round(128 + b.data[i] * 128)));
      }
    }
  };

  // Microphone: a silent stream for getUserMedia; the PCM worklet's port is fed Maya's line.
  const media = navigator.mediaDevices || (navigator.mediaDevices = {});
  media.getUserMedia = async () => new AudioContext().createMediaStreamDestination().stream;
  const mics = S.map((R) => { const u = Uint8Array.from(atob(R.mic), (c) => c.charCodeAt(0)); return new Int16Array(u.buffer, 0, u.length >> 1); });
  const FRAME = 320; // 20 ms at 16 kHz
  const NativeAWN = window.AudioWorkletNode;
  window.AudioWorkletNode = function (ctx, name, options) {
    if (name !== "dg-pcm-capture") return new NativeAWN(ctx, name, options);
    const node = ctx.createGain();
    const port = { onmessage: null, postMessage() {} };
    Object.defineProperty(node, "port", { value: port });
    let t = now();
    const tick = () => {
      t += 20;
      const frame = new Int16Array(FRAME);
      const mic = mics[state.sock - 1];
      if (mic && state.micStart !== null && now() >= state.micStart) {
        const i = Math.round((now() - state.micStart) / 1000 * 16000);
        if (i < mic.length) frame.set(mic.subarray(i, Math.min(mic.length, i + FRAME)));
      }
      if (port.onmessage) port.onmessage({ data: frame.buffer });
      setTimeout(tick, Math.max(0, t - now()));
    };
    setTimeout(tick, 20);
    return node;
  };

  // Deepgram socket: recorded server messages, gated on the client's own messages.
  const Native = window.WebSocket;
  const b64 = (s) => { const u = Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); return u.buffer; };
  class ReplaySocket extends EventTarget {
    constructor(url) {
      super();
      Object.assign(this, { url, readyState: 0, binaryType: "blob", protocol: "", extensions: "", bufferedAmount: 0, onopen: null, onmessage: null, onclose: null, onerror: null });
      this.counts = {};
      this.t0 = now();
      this.n = ++sockets;
      this.R = S[Math.min(this.n, S.length) - 1];
      Object.assign(state, { sock: this.n, settingsAt: null, micStart: null });
      state.log.push({ ev: "construct", at: this.t0, sock: this.n });
      this.fire("open#1", this.t0);
      setTimeout(() => { if (this.readyState === 0) { this.readyState = 1; this.emit("open"); } }, 1);
    }
    emit(type, init) {
      const ev = type === "message" ? new MessageEvent("message", init) : type === "close" ? new CloseEvent("close", init) : new Event(type);
      this.dispatchEvent(ev);
      const handler = this["on" + type];
      if (handler) handler.call(this, ev);
    }
    fire(key, sentAt) {
      const items = this.R.byAnchor[key] || [];
      // Never earlier than the live session's offset from Settings.
      const base = key === "open#1" || state.settingsAt === null ? sentAt : Math.max(sentAt, state.settingsAt + this.R.anchorOffset[key]);
      for (const item of items) setTimeout(() => this.deliver(item, key), Math.max(0, base + item.delay - now()));
    }
    deliver(item, key) {
      if (this.readyState !== 1) return;
      if (item.text) {
        state.log.push({ in: JSON.parse(item.text).type, at: now(), anchor: key, sock: this.n });
        this.emit("message", { data: item.text });
      } else {
        const buf = b64(item.bin);
        state.log.push({ in: "audio", at: now(), bytes: buf.byteLength, sock: this.n });
        this.emit("message", { data: this.binaryType === "arraybuffer" ? buf : new Blob([buf]) });
      }
    }
    send(data) {
      if (typeof data !== "string") return;
      let type;
      try { type = JSON.parse(data).type; } catch { return; }
      if (type === "KeepAlive") return;
      const at = now();
      state.log.push({ out: type, at, sock: this.n });
      if (!this.R.anchorOffset.hasOwnProperty(type + "#1")) return;
      const k = (this.counts[type] = (this.counts[type] || 0) + 1);
      if (type === "Settings" && k === 1) { state.settingsAt = at; state.micStart = at + this.R.micDelay; }
      this.fire(type + "#" + k, at);
    }
    close(code = 1000) {
      if (this.readyState === 3) return;
      this.readyState = 3;
      state.log.push({ ev: "close", at: now(), sock: this.n });
      this.emit("close", { code, reason: "", wasClean: true });
    }
  }
  for (const [k, v] of Object.entries({ CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 })) { ReplaySocket[k] = v; ReplaySocket.prototype[k] = v; }
  window.WebSocket = new Proxy(Native, { construct(target, args) {
    return /deepgram/i.test(String(args[0])) ? new ReplaySocket(String(args[0])) : Reflect.construct(target, args);
  } });
})();`;
}
