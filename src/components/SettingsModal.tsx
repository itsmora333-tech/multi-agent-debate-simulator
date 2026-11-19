import { useEffect, useState } from "react";
import { X, KeyRound, ExternalLink } from "lucide-react";
import type { LLMConfig, Provider } from "@/lib/types";

const MODELS: Record<Provider, string[]> = {
  gemini: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
};

interface Props {
  open: boolean;
  onClose: () => void;
  config: LLMConfig;
  onChange: (c: LLMConfig) => void;
}

export default function SettingsModal({ open, onClose, config, onChange }: Props) {
  const [draft, setDraft] = useState(config);

  useEffect(() => {
    if (open) setDraft(config);
  }, [open, config]);

  if (!open) return null;

  const set = (patch: Partial<LLMConfig>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">Model & API Key</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="space-y-5 px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            onChange(draft);
            onClose();
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "gemini" as Provider, label: "Gemini API" },
                  { id: "openai" as Provider, label: "OpenAI-compatible" },
                ]
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    set({
                      provider: p.id,
                      model: MODELS[p.id][0],
                      baseUrl: p.id === "openai" ? "https://api.openai.com/v1" : "",
                    })
                  }
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                    draft.provider === p.id
                      ? "border-teal-600 bg-teal-50 text-teal-700 ring-1 ring-teal-600"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="api-key" className="mb-1.5 block text-sm font-medium text-slate-700">
              API key
            </label>
            <input
              id="api-key"
              type="password"
              autoComplete="off"
              value={draft.apiKey}
              onChange={(e) => set({ apiKey: e.target.value })}
              placeholder="Paste your Gemini API key (AIza... or AQ.)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Stored only in this browser (local storage). Never hardcoded or sent anywhere except directly to your
              chosen provider. Both older keys starting with "AIza" and new Google auth keys starting with "AQ." are
              supported — paste the key exactly as copied, with no extra spaces.
            </p>
          </div>

          <div>
            <label htmlFor="model" className="mb-1.5 block text-sm font-medium text-slate-700">
              Model
            </label>
            <input
              id="model"
              list="model-options"
              value={draft.model}
              onChange={(e) => set({ model: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
            />
            <datalist id="model-options">
              {MODELS[draft.provider].map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          {draft.provider === "openai" && (
            <div>
              <label htmlFor="base-url" className="mb-1.5 block text-sm font-medium text-slate-700">
                Base URL <span className="font-normal text-slate-400">(optional, for compatible providers)</span>
              </label>
              <input
                id="base-url"
                type="text"
                value={draft.baseUrl}
                onChange={(e) => set({ baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          )}

          {draft.provider === "gemini" && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              Get a free key at the
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-teal-600 hover:text-teal-700"
              >
                Google AI Studio <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
