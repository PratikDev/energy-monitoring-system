import {
  copyFileSync,
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const ENV_EXAMPLE = "bot/.env.example";
const ENV_FILE = "bot/.env";
const DEFAULT_ALERT_POLL_INTERVAL_MS = 30_000;
const MIN_ALERT_POLL_INTERVAL_MS = 10_000;
const pipedAnswers = input.isTTY ? null : readFileSync(0, "utf8").split(/\r?\n/);
let createdEnvFile = false;
let pipedAnswerIndex = 0;
let rl;

function printIntro() {
  console.log(`Energy Monitoring System - Discord Bot

Dashboard:
https://ems-ptsd.vercel.app/

This command only runs the Discord bot locally.
The dashboard and Convex backend are already hosted.

Before continuing:
1. Add the bot to your Discord server.
2. Enable Message Content Intent.
3. Copy the alert channel ID using Discord Developer Mode.
`);
}

function fail(message) {
  if (createdEnvFile && existsSync(ENV_FILE)) {
    rmSync(ENV_FILE);
  }

  rl?.close();
  console.error(`Error: ${message}`);
  process.exit(1);
}

function getReadline() {
  rl ??= readline.createInterface({ input, output });
  return rl;
}

async function readVisibleValue(label) {
  if (pipedAnswers) {
    output.write(`${label}: `);
    return (pipedAnswers[pipedAnswerIndex++] ?? "").trim();
  }

  return (await getReadline().question(`${label}: `)).trim();
}

async function readSecretValue(label) {
  if (!input.isTTY) {
    return readVisibleValue(label);
  }

  return new Promise((resolve) => {
    let value = "";
    const wasRaw = input.isRaw;

    output.write(`${label}: `);
    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");

    function cleanup() {
      input.off("data", onData);
      input.setRawMode(wasRaw);
      output.write("\n");
    }

    function onData(character) {
      if (character === "\u0003") {
        cleanup();
        process.exit(130);
      }

      if (character === "\r" || character === "\n" || character === "\u0004") {
        cleanup();
        resolve(value.trim());
        return;
      }

      if (character === "\u007f" || character === "\b") {
        value = value.slice(0, -1);
        return;
      }

      value += character;
    }

    input.on("data", onData);
  });
}

async function readRequiredValue(label, { secret = false } = {}) {
  const value = secret ? await readSecretValue(label) : await readVisibleValue(label);

  if (!value) {
    fail(`${label} is required.`);
  }

  return value;
}

async function readAlertPollInterval() {
  const rawValue = await readVisibleValue(
    `ALERT_POLL_INTERVAL_MS [${DEFAULT_ALERT_POLL_INTERVAL_MS}]`,
  );

  if (!rawValue) {
    return String(DEFAULT_ALERT_POLL_INTERVAL_MS);
  }

  if (!/^\d+$/.test(rawValue)) {
    fail("ALERT_POLL_INTERVAL_MS must be numeric.");
  }

  const value = Number(rawValue);

  if (value < MIN_ALERT_POLL_INTERVAL_MS) {
    console.warn(
      `ALERT_POLL_INTERVAL_MS must be at least ${MIN_ALERT_POLL_INTERVAL_MS}. Using ${MIN_ALERT_POLL_INTERVAL_MS}.`,
    );
    return String(MIN_ALERT_POLL_INTERVAL_MS);
  }

  return String(value);
}

function setEnvValue(key, value) {
  const originalContent = readFileSync(ENV_FILE, "utf8");
  const lines = originalContent.split(/\r?\n/);
  const prefix = `${key}=`;
  let replaced = false;

  const updatedLines = lines.map((line) => {
    if (line.startsWith(prefix)) {
      replaced = true;
      return `${prefix}${value}`;
    }

    return line;
  });

  if (!replaced) {
    updatedLines.push(`${prefix}${value}`);
  }

  writeFileSync(ENV_FILE, `${updatedLines.join("\n").replace(/\n+$/, "")}\n`);
}

printIntro();

if (existsSync(ENV_FILE)) {
  console.log(`Reusing existing ${ENV_FILE}.`);
  process.exit(0);
}

if (!existsSync(ENV_EXAMPLE)) {
  fail(`${ENV_EXAMPLE} is missing.`);
}

copyFileSync(ENV_EXAMPLE, ENV_FILE);
createdEnvFile = true;

const discordBotToken = await readRequiredValue("DISCORD_BOT_TOKEN", {
  secret: true,
});
const discordAlertChannelId = await readRequiredValue("DISCORD_ALERT_CHANNEL_ID");
const alertPollIntervalMs = await readAlertPollInterval();
const googleGenerativeAiApiKey = await readRequiredValue(
  "GOOGLE_GENERATIVE_AI_API_KEY",
  { secret: true },
);

setEnvValue("DISCORD_BOT_TOKEN", discordBotToken);
setEnvValue("DISCORD_ALERT_CHANNEL_ID", discordAlertChannelId);
setEnvValue("ALERT_POLL_INTERVAL_MS", alertPollIntervalMs);
setEnvValue("GOOGLE_GENERATIVE_AI_API_KEY", googleGenerativeAiApiKey);

rl?.close();
console.log(`Created ${ENV_FILE}. Starting Docker...`);
