import { useCallback, useEffect, useMemo, useState } from "react";
import { Settings, Scale, Eye, AlertCircle, Loader2, Play } from "lucide-react";
import SettingsModal from "@/components/SettingsModal";
import ResultsDrawer from "@/components/ResultsDrawer";
import ProgressTracker, { StatusPill } from "@/components/ProgressTracker";
import DebateColumn from "@/components/DebateColumn";
import JudgeScorecard from "@/components/JudgeScorecard";
import { callLLM, LLMError } from "@/lib/llm";
import { parseVerdict, VerdictParseError } from "@/lib/verdict";
import {
  PROPONENT_SYSTEM,
  OPPONENT_SYSTEM,
  REBUTTAL_SYSTEM,
  JUDGE_SYSTEM,
  PROPONENT_TEMPERATURE,
  OPPONENT_TEMPERATURE,
  REBUTTAL_TEMPERATURE,
  JUDGE_TEMPERATURE,
  buildProponentUser,
  buildOpponentUser,
  buildRebuttalUser,
  buildJudgeUser,
} from "@/lib/prompts";
import type { DebateRecord, LLMConfig, RoundKey, RoundRecord, StepStatus } from "@/lib/types";

const STORAGE_KEY = "debate-simulator-config";

const PRESETS = [
  {
    label: "Tech tradeoff",
    topic: "Social media platforms should be required to verify the identity of all users.",
  },
  {
    label: "Policy & ethics",
    topic: "Governments should pay every adult citizen a universal basic income.",
  },
  {
    label: "Lopsided claim",
    topic: "Human decision-making is always superior to algorithmic decision-making.",
  },
];

function emptyRound(systemPrompt: string, temperature: number): RoundRecord {
  return { systemPrompt, userMessage: "", temperature, output: "" };
}

function freshRecord(topic: string, config: LLMConfig): DebateRecord {
  return {
    topic,
    provider: config.provider,
    model: config.model,
    createdAt: new Date().toISOString(),
    proponent: emptyRound(PROPONENT_SYSTEM, PROPONENT_TEMPERATURE),
    opponent: emptyRound(OPPONENT_SYSTEM, OPPONENT_TEMPERATURE),
    rebuttal: emptyRound(REBUTTAL_SYSTEM, REBUTTAL_TEMPERATURE),
    judge: emptyRound(JUDGE_SYSTEM, JUDGE_TEMPERATURE),
  };
}

function loadConfig(): LLMConfig {
  const fallback: LLMConfig = { provider: "gemini", apiKey: "", model: "gemini-2.0-flash", baseUrl: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<LLMConfig>;
    return {
      provider: parsed.provider === "openai" ? "openai" : "gemini",
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      model: typeof parsed.model === "string" && parsed.model ? parsed.model : fallback.model,
      baseUrl: typeof parsed.baseUrl === "string" ? parsed.baseUrl : "",
    };
  } catch {
    return fallback;
  }
}

export default function App() {
  const [config, setConfig] = useState<LLMConfig>(loadConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [record, setRecord] = useState<DebateRecord | null>(null);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Record<RoundKey, StepStatus>>({
    proponent: "pending",
    opponent: "pending",
    rebuttal: "pending",
    judge: "pending",
  });
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // storage unavailable (private mode) — config just won't persist
    }
  }, [config]);

  const hasKey = config.apiKey.trim().length > 0;

  const run = useCallback(async () => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic || running) return;
    if (!hasKey) {
      setFatalError("Add your API key first — click the gear icon to open settings.");
      setSettingsOpen(true);
      return;
    }

    setRunning(true);
    setFatalError(null);
    setRawError(null);
    const base = freshRecord(trimmedTopic, config);
    setRecord(base);
    setSteps({ proponent: "running", opponent: "pending", rebuttal: "pending", judge: "pending" });

    const patch = (key: RoundKey, data: Partial<RoundRecord>) =>
      setRecord((r) => (r ? { ...r, [key]: { ...r[key], ...data } } : r));
    const step = (key: RoundKey, status: StepStatus) =>
      setSteps((s) => ({ ...s, [key]: status }));

    const fail = (key: RoundKey, message: string, raw?: string) => {
      patch(key, { error: message, rawError: raw });
      step(key, "error");
      setFatalError(message);
      setRawError(raw ?? null);
    };

    const describe = (err: unknown): { message: string; raw?: string } => {
      if (err instanceof LLMError) return { message: err.message, raw: err.rawDetail };
      if (err instanceof Error) return { message: err.message };
      return { message: "Unknown error calling the model." };
    };

    let proOutput = "";
    let oppOutput = "";
    let rebuttalOutput = "";

    // Round 1 — Proponent
    base.proponent.userMessage = buildProponentUser(trimmedTopic);
    patch("proponent", { userMessage: base.proponent.userMessage });
    try {
      proOutput = await callLLM(config, {
        systemPrompt: base.proponent.systemPrompt,
        userMessage: base.proponent.userMessage,
        temperature: base.proponent.temperature,
      });
      base.proponent.output = proOutput;
      patch("proponent", { output: proOutput });
      step("proponent", "done");
    } catch (err) {
      const { message, raw } = describe(err);
      fail("proponent", message, raw);
      setRunning(false);
      return;
    }

    // Round 2 — Opponent
    step("opponent", "running");
    base.opponent.userMessage = buildOpponentUser(trimmedTopic, proOutput);
    patch("opponent", { userMessage: base.opponent.userMessage });
    try {
      oppOutput = await callLLM(config, {
        systemPrompt: base.opponent.systemPrompt,
        userMessage: base.opponent.userMessage,
        temperature: base.opponent.temperature,
      });
      base.opponent.output = oppOutput;
      patch("opponent", { output: oppOutput });
      step("opponent", "done");
    } catch (err) {
      const { message, raw } = describe(err);
      fail("opponent", message, raw);
      setRunning(false);
      return;
    }

    // Round 3 — Proponent Rebuttal
    step("rebuttal", "running");
    base.rebuttal.userMessage = buildRebuttalUser(trimmedTopic, proOutput, oppOutput);
    patch("rebuttal", { userMessage: base.rebuttal.userMessage });
    try {
      rebuttalOutput = await callLLM(config, {
        systemPrompt: base.rebuttal.systemPrompt,
        userMessage: base.rebuttal.userMessage,
        temperature: base.rebuttal.temperature,
      });
      base.rebuttal.output = rebuttalOutput;
      patch("rebuttal", { output: rebuttalOutput });
      step("rebuttal", "done");
    } catch (err) {
      const { message, raw } = describe(err);
      fail("rebuttal", message, raw);
      setRunning(false);
      return;
    }

    // Round 4 — Judge
    step("judge", "running");
    base.judge.userMessage = buildJudgeUser(trimmedTopic, proOutput, oppOutput, rebuttalOutput);
    patch("judge", { userMessage: base.judge.userMessage });
    try {
      const raw = await callLLM(config, {
        systemPrompt: base.judge.systemPrompt,
        userMessage: base.judge.userMessage,
        temperature: base.judge.temperature,
      });
      base.judge.output = raw;
      patch("judge", { output: raw });
      try {
        const verdict = parseVerdict(raw);
        base.verdict = verdict;
        base.verdictRaw = raw;
        setRecord((r) => (r ? { ...r, verdict, verdictRaw: raw } : r));
        step("judge", "done");
      } catch (err) {
        const msg =
          err instanceof VerdictParseError
            ? `Judge scoring failed: ${err.message}`
            : "Judge scoring failed: unexpected error parsing the verdict.";
        fail("judge", msg);
      }
    } catch (err) {
      const { message, raw } = describe(err);
      fail("judge", message, raw);
    }

    setRunning(false);
  }, [topic, running, config, hasKey]);

  const canExport = useMemo(
    () => Boolean(record && (record.proponent.output || record.opponent.output)),
    [record],
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600">
              <Scale className="h-5 w-5 text-white" />
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight sm:text-lg">Multi-Agent Debate Simulator</h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Proponent vs. Opponent, judged & fact-checked by AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {record && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Prompts</span>
              </button>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                hasKey
                  ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                  : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{hasKey ? "Settings" : "Add API key"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-slate-700">
            Debate proposition
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void run();
              }}
              placeholder="e.g. Remote work should become the default for all knowledge jobs"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              onClick={() => void run()}
              disabled={running || !topic.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "Debating…" : "Run Debate"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setTopic(p.topic)}
                disabled={running}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-40"
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {fatalError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800">Something went wrong</p>
              <p className="mt-0.5 break-words text-sm text-red-700">{fatalError}</p>
              {rawError && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-red-600 hover:text-red-800">
                    Show raw error from the provider
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-red-950/90 p-3 text-[11px] leading-relaxed text-red-100">
                    {rawError}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {record && (
          <>
            <ProgressTracker steps={steps} />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <StatusPill status={steps.proponent} />
                <DebateColumn side="proponent" text={record.proponent.output} error={record.proponent.error} />
              </div>
              <div className="space-y-2">
                <StatusPill status={steps.opponent} />
                <DebateColumn side="opponent" text={record.opponent.output} error={record.opponent.error} />
              </div>
            </div>
            {steps.rebuttal !== "pending" && (
              <div className="space-y-2">
                <StatusPill status={steps.rebuttal} />
                <DebateColumn side="proponent" text={record.rebuttal.output} error={record.rebuttal.error} rebuttal />
              </div>
            )}
            {(steps.judge === "running" || record.verdict || record.judge.error) && (
              <div className="space-y-2">
                <StatusPill status={steps.judge} />
                {record.verdict ? (
                  <JudgeScorecard verdict={record.verdict} />
                ) : steps.judge === "running" ? (
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-10 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Judge is scoring the debate…
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}

        {!record && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100">
              <Scale className="h-6 w-6 text-teal-700" />
            </span>
            <h2 className="text-lg font-semibold text-slate-800">No debate yet</h2>
            <p className="max-w-sm text-sm text-slate-500">
              Enter a proposition above (or pick a preset), add your API key in settings, and run the debate:
              Proponent argues for, Opponent rebuts, the Proponent gets one short defense, and the Judge scores the
              full transcript.
            </p>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 sm:px-6">
        {canExport && (
          <p className="text-center text-xs text-slate-400">
            Use the Prompts button in the header to inspect exact system prompts and export results.
          </p>
        )}
      </footer>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        onChange={setConfig}
      />
      <ResultsDrawer record={drawerOpen ? record : null} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
