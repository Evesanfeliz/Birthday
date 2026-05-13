// Local-storage based identity for the nickname-only party app.
// Each browser holds onto its own player_id per room so refreshes don't kick you out.

const KEY = "razzia.players";

type Stored = Record<string, { playerId: string; nickname: string }>;

function read(): Stored {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(s: Stored) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(s));
}

export function getPlayer(roomCode: string) {
  return read()[roomCode];
}

export function setPlayer(roomCode: string, playerId: string, nickname: string) {
  const s = read();
  s[roomCode] = { playerId, nickname };
  write(s);
}

export function clearPlayer(roomCode: string) {
  const s = read();
  delete s[roomCode];
  write(s);
}
