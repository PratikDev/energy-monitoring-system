import { config } from "dotenv";

const MIN_ALERT_POLL_INTERVAL_MS = 10_000;
const DEFAULT_ALERT_POLL_INTERVAL_MS = 30_000;
const DEFAULT_COMMAND_PREFIX = "!";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const envFiles = [
  "../../../.env.local", // root level
  "../../../.env", // root level
  "../../.env.local", // inside bot dir
  "../../.env", // inside bot dir
] as const;

for (const path of envFiles) {
  config({
    path: new URL(path, import.meta.url),
    override: false,
    quiet: true,
  });
}

export type BotEnv = {
  convexUrl: string;
  discordBotToken: string;
  discordAlertChannelId: string | null;
  googleGenerativeAiApiKey: string | null;
  geminiModel: string;
  botCommandPrefix: string;
  alertPollIntervalMs: number;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function readConvexUrl(): string {
  const value = readOptionalEnv("CONVEX_URL") ?? readOptionalEnv("VITE_CONVEX_URL");

  if (!value) {
    throw new Error(
      "Missing required environment variable: CONVEX_URL or VITE_CONVEX_URL",
    );
  }

  return value;
}

function readAlertPollIntervalMs(): number {
  const rawValue = readOptionalEnv("ALERT_POLL_INTERVAL_MS");

  if (!rawValue) {
    return DEFAULT_ALERT_POLL_INTERVAL_MS;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    return DEFAULT_ALERT_POLL_INTERVAL_MS;
  }

  return Math.max(MIN_ALERT_POLL_INTERVAL_MS, parsedValue);
}

export const env: BotEnv = {
  convexUrl: readConvexUrl(),
  discordBotToken: readRequiredEnv("DISCORD_BOT_TOKEN"),
  discordAlertChannelId: readOptionalEnv("DISCORD_ALERT_CHANNEL_ID"),
  googleGenerativeAiApiKey: readOptionalEnv("GOOGLE_GENERATIVE_AI_API_KEY"),
  geminiModel: readOptionalEnv("GEMINI_MODEL") ?? DEFAULT_GEMINI_MODEL,
  botCommandPrefix: readOptionalEnv("BOT_COMMAND_PREFIX") ?? DEFAULT_COMMAND_PREFIX,
  alertPollIntervalMs: readAlertPollIntervalMs(),
};

if (!env.googleGenerativeAiApiKey) {
  console.warn(
    "GOOGLE_GENERATIVE_AI_API_KEY is missing. Bot responses will use plain fallback text.",
  );
}
