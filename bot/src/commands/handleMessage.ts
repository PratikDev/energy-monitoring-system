import type { Message } from "discord.js";

import { env } from "../config/env.js";
import { safeDiscordText } from "../lib/formatters.js";
import { runRoomCommand } from "./room.js";
import { runStatusCommand } from "./status.js";
import { runUsageCommand } from "./usage.js";

function getHelpMessage(): string {
  const prefix = env.botCommandPrefix;
  return `I can help with ${prefix}status, ${prefix}room drawing, ${prefix}room work1, ${prefix}room work2, and ${prefix}usage.`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return `I couldn't read the live office data right now: ${error.message}`;
  }

  return "I couldn't read the live office data right now.";
}

async function sendTyping(message: Message): Promise<void> {
  const channel = message.channel as { sendTyping?: unknown };

  if (typeof channel.sendTyping === "function") {
    await channel.sendTyping();
  }
}

export async function handleMessage(message: Message): Promise<void> {
  if (message.author.bot || !message.content.startsWith(env.botCommandPrefix)) {
    return;
  }

  const commandText = message.content.slice(env.botCommandPrefix.length).trim();

  if (!commandText) {
    await message.reply(getHelpMessage());
    return;
  }

  const [commandName = "", ...args] = commandText.split(/\s+/);
  const normalizedCommandName = commandName.toLowerCase();

  try {
    await sendTyping(message);

    if (normalizedCommandName === "status") {
      await message.reply(await runStatusCommand());
      return;
    }

    if (normalizedCommandName === "room") {
      await message.reply(await runRoomCommand(args));
      return;
    }

    if (normalizedCommandName === "usage") {
      await message.reply(await runUsageCommand());
      return;
    }

    await message.reply(getHelpMessage());
  } catch (error) {
    console.error("Failed to handle Discord command.", error);
    await message.reply(safeDiscordText(getErrorMessage(error)));
  }
}
