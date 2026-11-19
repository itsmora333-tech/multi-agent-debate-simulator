export interface LLMCall {
  systemPrompt: string;
  userMessage: string;
  temperature: number;
}

export type Provider = "gemini" | "openai";

export interface LLMConfig {
  provider: Provider;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface Verdict {
  proponent_score: number;
  opponent_score: number;
  proponent_weaknesses: string[];
  opponent_weaknesses: string[];
  winner: string;
  verdict_reasoning: string;
}

export type RoundKey = "proponent" | "opponent" | "rebuttal" | "judge";
export type StepStatus = "pending" | "running" | "done" | "error";

export interface RoundRecord {
  systemPrompt: string;
  userMessage: string;
  temperature: number;
  output: string;
  error?: string;
  rawError?: string;
}

export interface DebateRecord {
  topic: string;
  provider: Provider;
  model: string;
  createdAt: string;
  proponent: RoundRecord;
  opponent: RoundRecord;
  rebuttal: RoundRecord;
  judge: RoundRecord;
  verdict?: Verdict;
  verdictRaw?: string;
}
