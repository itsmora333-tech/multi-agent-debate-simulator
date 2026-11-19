import type { DebateRecord } from "./types";

export function exportMarkdown(record: DebateRecord): void {
  downloadFile(`${slugify(record.topic)}-debate.md`, debateToMarkdown(record), "text/markdown");
}

export function exportJson(record: DebateRecord): void {
  downloadFile(`${slugify(record.topic)}-verdict.json`, debateToJson(record), "application/json");
}

function slugify(topic: string): string {
  return (
    topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "debate"
  );
}

function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function debateToMarkdown(record: DebateRecord): string {
  const lines: string[] = [];
  lines.push(`# Debate: ${record.topic}`);
  lines.push("");
  lines.push(`- **Model:** ${record.model} (${record.provider})`);
  lines.push(`- **Date:** ${record.createdAt}`);
  if (record.verdict) {
    lines.push(`- **Winner:** ${record.verdict.winner}`);
    lines.push(`- **Scores:** Proponent ${record.verdict.proponent_score}/10 — Opponent ${record.verdict.opponent_score}/10`);
  }
  lines.push("");
  lines.push("## Round 1 — Proponent");
  lines.push("");
  lines.push(record.proponent.output || "_No output._");
  lines.push("");
  lines.push("## Round 2 — Opponent");
  lines.push("");
  lines.push(record.opponent.output || "_No output._");
  lines.push("");
  lines.push("## Round 2.5 — Proponent Rebuttal");
  lines.push("");
  lines.push(record.rebuttal.output || "_No output._");
  if (record.verdict) {
    lines.push("");
    lines.push("## Round 3 — Judge Scorecard");
    lines.push("");
    lines.push(`**Winner:** ${record.verdict.winner}`);
    lines.push("");
    lines.push(`**Proponent score:** ${record.verdict.proponent_score}/10`);
    lines.push("");
    lines.push(`**Opponent score:** ${record.verdict.opponent_score}/10`);
    lines.push("");
    lines.push(`**Verdict reasoning:** ${record.verdict.verdict_reasoning}`);
    if (record.verdict.proponent_weaknesses.length) {
      lines.push("");
      lines.push("**Proponent weaknesses:**");
      record.verdict.proponent_weaknesses.forEach((w) => lines.push(`- ${w}`));
    }
    if (record.verdict.opponent_weaknesses.length) {
      lines.push("");
      lines.push("**Opponent weaknesses:**");
      record.verdict.opponent_weaknesses.forEach((w) => lines.push(`- ${w}`));
    }
  } else if (record.judge.error) {
    lines.push("");
    lines.push(`## Round 3 — Judge: Error`);
    lines.push("");
    lines.push(record.judge.error);
  }
  return lines.join("\n");
}

export function debateToJson(record: DebateRecord): string {
  return JSON.stringify(
    {
      topic: record.topic,
      provider: record.provider,
      model: record.model,
      createdAt: record.createdAt,
      transcript: {
        proponent: record.proponent.output,
        opponent: record.opponent.output,
        proponentRebuttal: record.rebuttal.output,
      },
      verdict: record.verdict ?? null,
      judgeRaw: record.verdictRaw ?? null,
      errors: {
        proponent: record.proponent.error ?? null,
        opponent: record.opponent.error ?? null,
        rebuttal: record.rebuttal.error ?? null,
        judge: record.judge.error ?? null,
      },
    },
    null,
    2,
  );
}
