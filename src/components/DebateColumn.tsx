import { MessageSquarePlus, MessageSquare, Reply } from "lucide-react";

interface Props {
  side: "proponent" | "opponent";
  text: string;
  error?: string;
  rebuttal?: boolean;
}

export default function DebateColumn({ side, text, error, rebuttal }: Props) {
  const isPro = side === "proponent";
  const label = rebuttal
    ? { round: "Round 2.5", name: "Proponent Rebuttal" }
    : { round: isPro ? "Round 1" : "Round 2", name: isPro ? "Proponent" : "Opponent" };
  const Icon = rebuttal ? Reply : isPro ? MessageSquarePlus : MessageSquare;

  return (
    <div
      className={`flex min-h-[240px] flex-col overflow-hidden rounded-2xl border shadow-sm ${
        isPro ? "border-blue-200" : "border-rose-200"
      }`}
    >
      <div
        className={`flex items-center gap-2.5 px-5 py-3.5 ${
          isPro
            ? rebuttal
              ? "bg-gradient-to-r from-blue-700 to-blue-500"
              : "bg-gradient-to-r from-blue-600 to-blue-500"
            : "bg-gradient-to-r from-rose-600 to-rose-500"
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <Icon className="h-5 w-5 text-white" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/75">{label.round}</p>
          <h3 className="text-sm font-bold text-white">{label.name}</h3>
        </div>
      </div>
      <div className={`flex-1 px-5 py-4 ${isPro ? "bg-blue-50/50" : "bg-rose-50/50"}`}>
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-200">{error}</p>
        ) : text ? (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">{text}</pre>
        ) : (
          <div className="flex h-full items-center justify-center py-8">
            <p className="text-sm text-slate-400">Arguments will appear here…</p>
          </div>
        )}
      </div>
    </div>
  );
}
