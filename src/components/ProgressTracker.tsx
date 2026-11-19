import {
  Check,
  X,
  AlertTriangle,
  Loader2,
  Circle,
  MessageSquarePlus,
  MessageSquare,
  Reply,
  Gavel,
} from "lucide-react";
import type { RoundKey, StepStatus } from "@/lib/types";

const STEPS: { key: RoundKey; label: string; sub: string; icon: typeof Gavel }[] = [
  { key: "proponent", label: "Round 1", sub: "Proponent", icon: MessageSquarePlus },
  { key: "opponent", label: "Round 2", sub: "Opponent", icon: MessageSquare },
  { key: "rebuttal", label: "Round 2.5", sub: "Proponent Rebuttal", icon: Reply },
  { key: "judge", label: "Round 3", sub: "Judge & Fact-Check", icon: Gavel },
];

export default function ProgressTracker({ steps }: { steps: Record<RoundKey, StepStatus> }) {
  return (
    <ol className="flex items-stretch gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const status = steps[s.key];
        const Icon = s.icon;
        const done = status === "done";
        const running = status === "running";
        const error = status === "error";
        return (
          <li key={s.key} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                error
                  ? "border-red-200 bg-red-50"
                  : done
                    ? "border-teal-200 bg-teal-50"
                    : running
                      ? "border-amber-200 bg-amber-50 shadow-sm"
                      : "border-slate-200 bg-slate-50"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-all duration-300 ${
                  error
                    ? "bg-red-500"
                    : done
                      ? "bg-teal-600"
                      : running
                        ? "bg-amber-500"
                        : "bg-slate-300"
                }`}
              >
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : error ? (
                  <X className="h-4 w-4" strokeWidth={3} />
                ) : running ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <p
                  className={`text-xs font-medium ${
                    done ? "text-teal-700" : error ? "text-red-700" : running ? "text-amber-700" : "text-slate-500"
                  }`}
                >
                  {s.label}
                </p>
                <p className="truncate text-sm font-semibold text-slate-800">{s.sub}</p>
              </div>
            </div>
            {i < STEPS.length - 1 && <span className="hidden h-px w-2 shrink-0 bg-slate-300 sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}

export function StatusPill({ status }: { status: StepStatus }) {
  if (status === "running")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
      </span>
    );
  if (status === "error")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        <AlertTriangle className="h-3 w-3" /> Failed
      </span>
    );
  if (status === "done")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700">
        <Check className="h-3 w-3" /> Complete
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
      <Circle className="h-2 w-2" /> Waiting
    </span>
  );
}
