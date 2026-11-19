# Multi-Agent Debate & Fact-Check Simulator

A sequential multi-agent LLM web application built for a Prompt Engineering class project. Users submit any proposition—or choose from curated presets—and watch three distinct AI roles debate, rebut, and audit each other in real time.

**Live Demo:** https://multi-agent-debate-s-t8b8.bolt.host

---

## Prompt Engineering Architecture

Rather than relying on a single prompt, the app orchestrates a **4-stage sequential prompt chain** where each agent receives controlled context from previous turns:

1. **Round 1 — Proponent (`PRO_PROMPT`)**
   * **Role & Constraints:** Argues strictly *in favor* of the proposition using 3 concise, evidence-backed bullet points (~110 words max) with negative constraints preventing concessions.
2. **Round 2 — Opponent (`CON_PROMPT`)**
   * **Context Injection & Rebuttal:** Receives both the proposition and the Proponent's statement; tasked with directly dismantling specific claims, flagging unsupported assumptions, and introducing an independent counter-argument.
3. **Round 2.5 — Proponent Rebuttal (`REBUTTAL_PROMPT`)**
   * **Symmetry & Fairness:** Gives the Proponent a bounded 2-bullet reply (~75 words max) to address the Opponent's strongest critique before judgment.
4. **Round 3 — Neutral Judge & Fact-Checker (`JUDGE_PROMPT`)**
   * **Deterministic Structured Output:** Evaluates the full transcript at **low temperature (`0.1`)** and outputs strict JSON (`proponent_score`, `opponent_score`, `proponent_weaknesses`, `opponent_weaknesses`, `winner`, `verdict_reasoning`).

---

## Key Prompt Iterations & Bias Mitigation

* **Solving Asymmetric Last-Word Bias:** Early versions had only 3 turns (`Proponent → Opponent → Judge`), causing the Opponent to win almost every round simply by speaking last. Adding **Round 2.5 (Proponent Rebuttal)** balanced turn symmetry.
* **Eliminating Verbosity Bias:** Enforced strict bullet counts and sentence caps on both debaters so the Judge evaluates logical rigor rather than rewarding longer text.
* **Position & Recency Guardrails:** Explicitly instructed the Judge not to favor the second speaker and to penalize unsupported generalizations equally on both sides.

---

## Running Locally

1. Clone the repository:
   ```bash
   git clone [https://github.com/itsmora333-tech/multi-agent-debate-simulator.git](https://github.com/itsmora333-tech/multi-agent-debate-simulator.git)
   cd multi-agent-debate-simulator
