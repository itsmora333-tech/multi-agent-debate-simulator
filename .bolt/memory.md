# Project memory

## Product intent & audience

- **App:** "Multi-Agent Debate & Fact-Check Simulator" — a sequential multi-agent debate runner using an LLM API.
- **Audience:** Users wanting to simulate structured academic debates with automated judging/fact-checking; also graders inspecting prompts and outputs.
- **Core flow:** User enters a debate proposition → 3-stage LLM pipeline runs sequentially (Proponent → Opponent → Neutral Judge/Fact-Checker) → results rendered with scorecard and export options.
- **API handling:** User supplies their own API key via UI; key stored in browser only, never hardcoded. Supports Gemini API and OpenAI-compatible chat completions endpoints (with optional custom base URL).
- **Presets:** 3 clickable preset propositions — a tech tradeoff, a policy/ethics question, a lopsided claim.

## Brand personality & voice

- Clean, modern, academic-but-accessible. Structured and objective, matching the debate theme.
- UI labels are concise and functional (e.g. "Run Debate", "Prompts", gear icon for settings).

## Visual design & UX direction

- **Layout:** Header with app title + action buttons (Prompts inspector, settings gear). Main area has proposition input/presets, live progress indicator, then results.
- **Debate view:** Two-column layout — Proponent (blue) left, Opponent (rose) right — arguments appear progressively as each round completes.
- **Judge Scorecard:** Winner badge, numeric scores out of 10 with animated bars, verdict reasoning text, expandable weakness/fallacy lists for both sides.
- **Progress indicator:** Live step-by-step showing Round 1 (Proponent), Round 2 (Opponent), Round 3 (Judge).
- **Prompt Inspector:** Drawer/modal showing exact system prompt, user message, and raw model output per round; includes Markdown and JSON export buttons.
- **Error handling:** Error banner for failed API calls; JSON parsing gracefully strips markdown code fences and trailing commas.
- **Stack constraints:** JSX + Tailwind CSS, React hooks, Lucide React icons only. Use `@/` path alias for imports. No extra UI/icon packages.

## Decisions, constraints & rationale

- **Client-side only:** Entire app runs in-browser; API key never leaves the client. Rationale: no hardcoded secrets, safe for static hosting.
- **Sequential pipeline:** Each agent receives prior outputs (Agent 2 gets Agent 1 output; Agent 3 gets full transcript). Rationale: enables rebuttal and holistic judging.
- **Fixed system prompts:** Proponent, Opponent, and Judge prompts are exact and immutable per spec; Judge uses low temperature (0.1) for deterministic scoring.
- **Judge output:** Must be valid JSON with defined keys (scores, weaknesses arrays, winner, verdict_reasoning). Defensive parsing handles fence-wrapped or trailing-comma JSON.
- **Export:** Full debate + JSON verdict exportable as both Markdown and JSON.

## Open questions & assumptions

- **Untested live API calls:** Build compiled cleanly but actual LLM calls were not verified; user should test with a real key (free Gemini keys recommended).
- **Provider compatibility:** Assumed OpenAI-compatible endpoints follow standard chat completions schema; untested with non-standard providers.
- **Model behavior:** Judge JSON format compliance depends on model capability; fallback parsing mitigates but doesn't guarantee valid output from all models.