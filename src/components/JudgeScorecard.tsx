import { Trophy, Scale, AlertTriangle } from "lucide-react";
import type { Verdict } from "@/lib/types";
import WeaknessList from "./WeaknessList";

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-lg font-bold text-slate-900">
          {score}
          <span className="text-sm font-medium text-slate-400">/10</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function JudgeScorecard({ verdict }: { verdict: Verdict }) {
  const winner = verdict.winner;
  const isTie = winner === "Tie";
  const proWins = winner === "Proponent";

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col items-center gap-2 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-6 py-6 text-center sm:py-8">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          {isTie ? (
            <Scale className="h-7 w-7 text-amber-600" />
          ) : (
            <Trophy className="h-7 w-7 text-amber-600" />
          )}
        </span>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Judge's Verdict</p>
        <h3 className="text-2xl font-bold text-slate-900">
          {isTie ? "Tie" : `${winner} wins`}
        </h3>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <ScoreBar label="Proponent" score={verdict.proponent_score} color="bg-blue-500" />
          <ScoreBar label="Opponent" score={verdict.opponent_score} color="bg-rose-500" />
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Verdict reasoning</p>
          <p className="text-sm leading-relaxed text-slate-700">{verdict.verdict_reasoning || "No reasoning provided."}</p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <AlertTriangle className="h-4 w-4 text-slate-400" /> Fact-check & critique
            </p>
            <div className="space-y-2">
              <WeaknessList
                title="Proponent weaknesses"
                items={verdict.proponent_weaknesses}
                tone="proponent"
              />
              <WeaknessList
                title="Opponent weaknesses"
                items={verdict.opponent_weaknesses}
                tone="opponent"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
