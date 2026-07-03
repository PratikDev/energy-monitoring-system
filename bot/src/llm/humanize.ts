import { google } from "@ai-sdk/google";
import { generateText } from "ai";

import { env } from "../config/env.js";
import { safeDiscordText } from "../lib/formatters.js";

const SYSTEM_PROMPT =
  "You are a friendly office assistant. Rephrase already-computed office monitoring data into concise natural language. Do not invent, omit, or alter any numbers, room names, device counts, watts, kWh values, timestamps, or alert facts. Keep the answer under 2 short sentences unless the raw data clearly needs a short list.";

export class HumanizeUnavailableError extends Error {
  constructor() {
    super("Gemini humanizer is unavailable because GOOGLE_GENERATIVE_AI_API_KEY is missing.");
  }
}

export async function humanize(
  rawDataSummary: string,
  context: string,
): Promise<string> {
  if (!env.googleGenerativeAiApiKey) {
    throw new HumanizeUnavailableError();
  }

  const { text } = await generateText({
    model: google(env.geminiModel),
    system: SYSTEM_PROMPT,
    prompt: `Context: ${context}\n\nRaw data:\n${rawDataSummary}`,
  });
  const safeText = safeDiscordText(text);

  if (!safeText) {
    throw new Error("Gemini returned an empty response.");
  }

  return safeText;
}
