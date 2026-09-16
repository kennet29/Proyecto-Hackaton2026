export type ServerLogLevel = "info" | "warn" | "error";

export type ServerLogEntry = {
  id: number;
  timestamp: string;
  level: ServerLogLevel;
  message: string;
};

const MAX_ENTRIES = 500;
let nextId = 1;
const entries: ServerLogEntry[] = [];

const redact = (value: string): string =>
  value
    .replace(/(bearer\s+)[^\s,;]+/gi, "$1[REDACTED]")
    .replace(/(["']?(?:password|hashpassword|authorization|token)["']?\s*[:=]\s*)[^,\s}]+/gi, "$1[REDACTED]")
    .replace(/(eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/g, "[REDACTED_JWT]");

export function recordServerLog(level: ServerLogLevel, value: unknown): void {
  const raw = value instanceof Error ? value.message : String(value ?? "");
  const message = redact(raw).slice(0, 1500);
  if (!message) return;

  entries.push({ id: nextId++, timestamp: new Date().toISOString(), level, message });
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
}

export function getServerLogs(requestedLimit?: number | string): ServerLogEntry[] {
  const limit = Math.min(Math.max(Number(requestedLimit) || 100, 1), 200);
  return entries.slice(-limit).reverse();
}
