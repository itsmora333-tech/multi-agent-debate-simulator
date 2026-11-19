import { useState } from "react";
import { ChevronDown, ChevronRight, TerminalSquare } from "lucide-react";
import type { DebateRecord } from "@/lib/types";

const STEPS = [
  { key: "proponent", label: "Round 1 — Proponent" },
  { key: "opponent", label: "Round 2 — Opponent" },
  { key: "rebuttal", label: "Round 2.5 — Proponent Rebuttal" },
  { key: "judge", label: "Round 3 — Judge" },
] as const;

function CodeBlock({ text }: { text: string }) {
  return (
    <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-200">
      {text}
    </pre>
  );
}

function StepInspector({ label, record }: { label: string; record: DebateRecord["proponent"] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
        <TerminalSquare className="h-4 w-4 text-teal-600" />
        {label}
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-100 px-4 py-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              System prompt (temperature {record.temperature})
            </p>
            <CodeBlock text={record.systemPrompt} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">User message</p>
            <CodeBlock text={record.userMessage || "(empty)"} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Raw model output</p>
            <CodeBlock text={record.output || record.error || "(no output)"} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PromptInspector({ record }: { record: DebateRecord | null }) {
  return (
    <div className="space-y-3">
      {record ? (
        STEPS.map((s) => <StepInspector key={s.key} label={s.label} record={record[s.key]} />)
      ) : (
        <p className="text-sm text-slate-500">Run a debate first — the exact prompts and raw outputs for each round will appear here.</p>
      )}
    </div>
  );
}
