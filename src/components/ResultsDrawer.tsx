import { useState } from "react";
import { Code2, FileJson, FileText, X, Zap } from "lucide-react";
import PromptInspector from "@/components/PromptInspector";
import { exportJson, exportMarkdown } from "@/lib/exporters";
import type { DebateRecord } from "@/lib/types";

interface Props {
  record: DebateRecord | null;
  onClose: () => void;
}

export default function ResultsDrawer({ record, onClose }: Props) {
  const [tab, setTab] = useState<"prompts" | "export">("prompts");
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">Prompt Inspector</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close inspector"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <nav className="flex gap-1 border-b border-slate-200 px-5 pt-3">
          {(
            [
              { id: "prompts" as const, label: "System Prompts", icon: Code2 },
              { id: "export" as const, label: "Export", icon: FileJson },
            ]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? "border-b-2 border-teal-600 text-teal-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "prompts" ? (
            <PromptInspector record={record} />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Download the complete debate transcript, the exact prompts, and the judge's JSON verdict.
              </p>
              <button
                onClick={() => exportMarkdown(record)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-left transition hover:border-teal-300 hover:bg-teal-50"
              >
                <FileText className="h-5 w-5 text-teal-600" />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">Export as Markdown</span>
                  <span className="block text-xs text-slate-500">Readable transcript with verdict — .md file</span>
                </span>
              </button>
              <button
                onClick={() => exportJson(record)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-left transition hover:border-teal-300 hover:bg-teal-50"
              >
                <FileJson className="h-5 w-5 text-teal-600" />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">Export as JSON</span>
                  <span className="block text-xs text-slate-500">Full structured record including raw judge output</span>
                </span>
              </button>
              <p className="flex items-start gap-1.5 pt-2 text-xs text-slate-500">
                <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                Files download directly to your device — nothing is uploaded anywhere.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
