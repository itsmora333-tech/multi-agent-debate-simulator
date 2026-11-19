import type { Verdict } from "./types";

export class VerdictParseError extends Error {}

export function parseVerdict(raw: string): Verdict {
  let text = raw.trim();

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1].includes("{")) text = fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new VerdictParseError("The judge's response contained no JSON object.");
  }

  let body = text.slice(start, end + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    body = body.replace(/,\s*([}\]])/g, "$1");
    try {
      parsed = JSON.parse(body);
    } catch {
      throw new VerdictParseError(
        "The judge's response could not be parsed as valid JSON, even after stripping code fences.",
      );
    }
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new VerdictParseError("The judge's JSON verdict was not an object.");
  }

  const o = parsed as Record<string, unknown>;
  return {
    proponent_score: toScore(o.proponent_score),
    opponent_score: toScore(o.opponent_score),
    proponent_weaknesses: toTextList(o.proponent_weaknesses),
    opponent_weaknesses: toTextList(o.opponent_weaknesses),
    winner: normalizeWinner(o.winner),
    verdict_reasoning: typeof o.verdict_reasoning === "string" ? condenseReasoning(o.verdict_reasoning) : "",
  };
}

function toScore(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n)) return 0;
  const scaled = n > 10 && n <= 100 ? n / 10 : n;
  // Clamp to [0,10] and round to exactly one decimal place (e.g. 7.5, 8.8)
  const clamped = Math.max(0, Math.min(10, scaled));
  return Number(clamped.toFixed(1));
}

function toTextList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter((s) => s.trim().length > 0);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

function condenseReasoning(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  // Enforce the 3-sentence cap even if the model over-writes: split on sentence ends.
  const sentences = trimmed.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [trimmed];
  return sentences.slice(0, 3).map((s) => s.trim()).join(" ");
}

function normalizeWinner(v: unknown): string {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("prop")) return "Proponent";
  if (s.includes("opp")) return "Opponent";
  return "Tie";
}
