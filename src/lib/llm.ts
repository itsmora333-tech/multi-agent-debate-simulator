import type { LLMConfig, LLMCall } from "./types";

export class LLMError extends Error {
  readonly rawDetail: string;
  constructor(message: string, rawDetail: string) {
    super(message);
    this.rawDetail = rawDetail;
  }
}

function sanitizeKey(raw: string): string {
  return raw.trim().replace(/\s+/g, "");
}

export async function callLLM(config: LLMConfig, call: LLMCall): Promise<string> {
  const key = sanitizeKey(config.apiKey);
  if (!key) {
    throw new Error("Missing API key. Add your key in the configuration panel before running a debate.");
  }
  return config.provider === "gemini" ? callGemini(config, call, key) : callOpenAICompatible(config, call, key);
}

async function readErrorBody(res: Response): Promise<{ message: string; raw: string }> {
  const raw = await res.text().catch(() => "");
  let message = raw;
  try {
    const data = JSON.parse(raw) as { error?: { message?: string; status?: string }; message?: string };
    message = data.error?.message ?? data.message ?? raw;
  } catch {
    // keep raw text as the message
  }
  return { message, raw };
}

function hintFor(status: number, message: string, provider: string): string {
  const lower = message.toLowerCase();
  if (provider === "gemini") {
    if (lower.includes("api key not valid") || lower.includes("api_key_invalid")) {
      return " — Google rejected the key itself. Double-check it was copied in full from Google AI Studio (new \"AQ.\"-prefix auth keys are supported), has no extra spaces or quotes, and hasn't been deleted or restricted. Keys must belong to a project with the Generative Language API enabled.";
    }
    if (status === 401 || status === 403) {
      return " — check that the key is valid and its Google Cloud project has the Generative Language API enabled.";
    }
    if (status === 429) return " — rate limit or quota exceeded; wait a moment and try again.";
    if (status === 404) return " — model not found for this key; check the model name in settings.";
  }
  return "";
}

async function callGemini(config: LLMConfig, call: LLMCall, key: string): Promise<string> {
  const model = (config.model.trim() || "gemini-2.0-flash");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: call.systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: call.userMessage }] }],
        generationConfig: { temperature: call.temperature },
      }),
    });
  } catch (err) {
    throw new LLMError(
      `Network error reaching the Gemini API: ${err instanceof Error ? err.message : "request failed"}`,
      "",
    );
  }
  if (!res.ok) {
    const { message, raw } = await readErrorBody(res);
    throw new LLMError(
      `Gemini API error ${res.status}: ${message}${hintFor(res.status, message, "gemini")}`,
      raw,
    );
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };
  const parts = data.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((p) => p?.text ?? "").join("") : "";
  if (!text.trim()) {
    const reason = data.candidates?.[0]?.finishReason ?? data.promptFeedback?.blockReason ?? "empty response";
    throw new LLMError(`Gemini returned no text (reason: ${reason}).`, JSON.stringify(data, null, 2));
  }
  return text;
}

async function callOpenAICompatible(config: LLMConfig, call: LLMCall, key: string): Promise<string> {
  const base = (config.baseUrl.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");
  let res: Response;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: config.model.trim() || "gpt-4o-mini",
        temperature: call.temperature,
        messages: [
          { role: "system", content: call.systemPrompt },
          { role: "user", content: call.userMessage },
        ],
      }),
    });
  } catch (err) {
    throw new LLMError(
      `Network error reaching ${base}: ${err instanceof Error ? err.message : "request failed"}`,
      "",
    );
  }
  if (!res.ok) {
    const { message, raw } = await readErrorBody(res);
    throw new LLMError(
      `OpenAI-compatible API error ${res.status}: ${message}${hintFor(res.status, message, "openai")}`,
      raw,
    );
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) {
    throw new LLMError("The model returned an empty response.", JSON.stringify(data, null, 2));
  }
  return text;
}
