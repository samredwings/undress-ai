import { URL } from "node:url";
import dns from "node:dns/promises";
import { isIP } from "node:net";
import { logger } from "./logger";

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 0) return true;
  if (parts[0] >= 224) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe80")) return true;
  return false;
}

export async function isSafeUrl(input: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(url.protocol)) return false;
  if (url.username || url.password) return false;
  if (url.hostname === "localhost" || url.hostname === "0.0.0.0") return false;

  let ips: Array<{ address: string }>;
  try {
    ips = (await dns.lookup(url.hostname, { all: true })) as Array<{ address: string }>;
  } catch {
    return false;
  }
  if (ips.length === 0) return false;

  for (const { address } of ips) {
    if (isIP(address) === 4 && isPrivateIPv4(address)) return false;
    if (isIP(address) === 6 && isPrivateIPv6(address)) return false;
  }

  return true;
}

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts?)/i,
  /forget\s+(everything|all)/i,
  /you\s+are\s+now\s+/i,
  /system\s*:\s*/i,
  /<\s*\|?\s*system\s*\|?\s*>/i,
  /\[\s*INST\s*\]/i,
  /<</i,
  /\bDAN\b.*\bmode\b/i,
  /disregard\s+(your|the)\s+(rules|guidelines)/i,
];

export function looksLikePromptInjection(input: string): boolean {
  if (typeof input !== "string") return false;
  if (input.length > 50_000) return true;
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(input)) return true;
  }
  return false;
}

export function sanitizeForLog(input: string, maxLen = 200): string {
  if (typeof input !== "string") return "[non-string]";
  return input.length > maxLen ? input.slice(0, maxLen) + "..." : input;
}

export async function fetchSafe(input: string, opts: {
  timeoutMs?: number;
  maxBytes?: number;
} = {}): Promise<Buffer> {
  const { timeoutMs = 10_000, maxBytes = 25 * 1024 * 1024 } = opts;

  if (!(await isSafeUrl(input))) {
    throw new Error("URL is not safe to fetch");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, {
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentLength = res.headers.get("content-length");
    if (contentLength && Number(contentLength) > maxBytes) {
      throw new Error("Response too large");
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > maxBytes) throw new Error("Response too large");
    return buf;
  } finally {
    clearTimeout(timer);
  }
}

export { logger };

