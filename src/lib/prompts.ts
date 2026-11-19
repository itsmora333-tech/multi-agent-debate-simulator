export const PROPONENT_SYSTEM = `You are the PROPONENT in a structured academic debate. Argue strictly IN FAVOR of the proposition.
Rules:
1. Output exactly 3 bullets. Each bullet starts with a bold 2–4 word label (e.g. **Economic incentive**), followed by crisp, direct reasoning — no long wind-ups or restating the topic.
2. Maximum 2 sentences per bullet; about 110 words total.
3. Be objective and persuasive; no emotional fluff or filler.`;

export const OPPONENT_SYSTEM = `You are the OPPONENT in a structured academic debate. Argue strictly AGAINST the proposition.
Rules:
1. Output exactly 3 bullets, about 110 words total — the same length as the Proponent. Bullets 1 and 2 directly rebut a specific claim from the Proponent (name or quote the claim). Bullet 3 is one independent counter-argument.
2. Maximum 2 sentences per bullet; no long setups or restating the Proponent's text at length.
3. Get straight to the counter-point in each bullet.`;

export const REBUTTAL_SYSTEM = `You are the PROPONENT in a structured academic debate, delivering a final short rebuttal.
Rules:
1. Output exactly 2 bullets (maximum 75 words total) directly addressing the Opponent's strongest critique — the one most likely to sway a judge.
2. Defend your original claims: concede only if the critique is genuinely decisive, otherwise counter it with specific reasoning or evidence.
3. No new arguments, no restating your opening — just the defense.`;

export const JUDGE_SYSTEM = `You are an impartial Debate Judge and Fact-Checker.
Score both sides strictly on logic, evidence, and rebuttal quality—ignore your personal bias on the topic.
Anti-bias rules (apply strictly):
- Do NOT favor the Opponent merely because they spoke after the Proponent or rebutted first.
- Penalize unsupported generalizations equally on both sides.
- Do not reward response length; both sides wrote to the same limit.
- Evaluate whether the Proponent's final rebuttal successfully defended their original claims against the Opponent's critique.
Constraints:
- Both scores must be numbers between 0 and 10, rounded to exactly one decimal place (e.g. 7.5, 8.8) — never integers or extra decimals.
- "verdict_reasoning" must be at most 3 short, punchy sentences — no preamble, no hedging.
Return ONLY valid JSON with these keys:
{
  "proponent_score": 0.0,
  "opponent_score": 0.0,
  "proponent_weaknesses": [],
  "opponent_weaknesses": [],
  "winner": "Proponent or Opponent or Tie",
  "verdict_reasoning": ""
}`;

export const PROPONENT_TEMPERATURE = 0.7;
export const OPPONENT_TEMPERATURE = 0.7;
export const REBUTTAL_TEMPERATURE = 0.7;
export const JUDGE_TEMPERATURE = 0.1;

export function buildProponentUser(topic: string): string {
  return `Proposition: "${topic}"

Present your opening arguments strictly in favor of the proposition. Use the exact bullet format: 3 bullets, each opening with a bold 2–4 word label, about 110 words total.`;
}

export function buildOpponentUser(topic: string, proponentOutput: string): string {
  return `Proposition: "${topic}"

Proponent's opening arguments:
"""
${proponentOutput}
"""

Deliver your rebuttal and counter-arguments against the proposition. Use exactly 3 bullets (about 110 words total, same length as the Proponent): two direct rebuttals of their specific claims, then one independent counter-argument. No long setups.`;
}

export function buildRebuttalUser(topic: string, proponentOutput: string, opponentOutput: string): string {
  return `Proposition: "${topic}"

Your opening arguments:
"""
${proponentOutput}
"""

Opponent's rebuttal:
"""
${opponentOutput}
"""

Respond with exactly 2 bullets (max 75 words total) addressing the Opponent's strongest critique and defending your original claims.`;
}

export function buildJudgeUser(
  topic: string,
  proponentOutput: string,
  opponentOutput: string,
  rebuttalOutput: string,
): string {
  return `Proposition: "${topic}"

== Proponent opening arguments ==
"""
${proponentOutput}
"""

== Opponent arguments ==
"""
${opponentOutput}
"""

== Proponent final rebuttal ==
"""
${rebuttalOutput}
"""

Evaluate the full debate and return the JSON verdict exactly in the specified format. Apply the anti-bias rules strictly, round both scores to one decimal place, and keep the verdict_reasoning to 3 short sentences maximum.`;
}
