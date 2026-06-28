// =============================================================================
// warroom.ts — bridge from the Wiselion server to the ClaudeClaw "War Room"
// multi-agent command center (WebSocket on WARROOM_URL, default ws://localhost:7860).
//
// War Room protocol (from claudeclaw/warroom/server.py):
//   send    {"type":"text_input","text":"@content: <prompt>"}   → routes to an agent
//   receive {"type":"routing"|"transcript"|"turn_complete"|"error", ...}
// Agents: main · comms · content · ops · research  (prefix a task with @<agent>).
//
// This is the AUTOMATION BRAIN connector. It is best-effort: if War Room isn't
// running, requests fail gracefully so the app is never blocked.
// =============================================================================
import WebSocket from 'ws';

const WARROOM_URL = process.env.WARROOM_URL || 'ws://localhost:7860';

export type Agent = 'main' | 'comms' | 'content' | 'ops' | 'research';

export class WarRoomOfflineError extends Error {
  constructor() {
    super('War Room is not reachable');
    this.name = 'WarRoomOfflineError';
  }
}

function open(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WARROOM_URL);
    const t = setTimeout(() => {
      ws.terminate();
      reject(new WarRoomOfflineError());
    }, 5000);
    ws.on('open', () => {
      clearTimeout(t);
      resolve(ws);
    });
    ws.on('error', () => {
      clearTimeout(t);
      reject(new WarRoomOfflineError());
    });
  });
}

/**
 * Fire-and-forget: hand a task to an agent. Use for actions where you don't need
 * the text back (e.g. "@ops: fulfil order 123").
 */
export async function sendToWarroom(agent: Agent, prompt: string): Promise<void> {
  const ws = await open();
  ws.send(JSON.stringify({ type: 'text_input', text: `@${agent}: ${prompt}` }));
  // Give it a beat to deliver, then close.
  setTimeout(() => ws.close(), 250);
}

/**
 * Request a DRAFT from an agent and collect its text output until the turn
 * completes. Used for the approve-first visibility flow (content the human
 * reviews before anything is published). Resolves with the concatenated text.
 */
export async function requestDraft(agent: Agent, prompt: string, timeoutMs = 60000): Promise<string> {
  const ws = await open();
  return new Promise<string>((resolve, reject) => {
    let buffer = '';
    const finish = (err?: Error) => {
      try { ws.close(); } catch {}
      err ? reject(err) : resolve(buffer.trim());
    };
    const timer = setTimeout(() => finish(buffer ? undefined : new Error('War Room timed out')), timeoutMs);

    ws.send(JSON.stringify({ type: 'text_input', text: `@${agent}: ${prompt}` }));

    ws.on('message', (raw) => {
      let msg: any;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg.type === 'transcript' && typeof msg.text === 'string') buffer += msg.text;
      else if (msg.type === 'turn_complete') { clearTimeout(timer); finish(); }
      else if (msg.type === 'error') { clearTimeout(timer); finish(new Error(msg.message || 'War Room error')); }
    });
    ws.on('close', () => { clearTimeout(timer); resolve(buffer.trim()); });
  });
}

export async function isWarRoomOnline(): Promise<boolean> {
  try {
    const ws = await open();
    ws.close();
    return true;
  } catch {
    return false;
  }
}
