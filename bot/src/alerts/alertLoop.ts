import type { Client } from "discord.js";

import { env } from "../config/env.js";
import { getActiveAlerts, type AlertView } from "../convex/queries.js";
import {
  buildAlertFallback,
  buildAlertRawSummary,
} from "../lib/fallbackResponses.js";
import { safeDiscordText } from "../lib/formatters.js";
import { humanize } from "../llm/humanize.js";

type SendableChannel = {
  send: (content: string) => Promise<unknown>;
};

const seenAlertIds = new Set<string>();

function isSendableChannel(channel: unknown): channel is SendableChannel {
  const candidate = channel as { send?: unknown };
  return typeof candidate.send === "function";
}

async function buildAlertMessage(alert: AlertView): Promise<string> {
  const rawSummary = buildAlertRawSummary(alert);

  try {
    return await humanize(
      rawSummary,
      "A new active office energy alert was triggered. Write a concise Discord notification.",
    );
  } catch (error) {
    console.warn("Falling back to plain alert response.", error);
    return safeDiscordText(buildAlertFallback(alert));
  }
}

async function markCurrentAlertsSeen(): Promise<void> {
  const activeAlerts = await getActiveAlerts();

  for (const alert of activeAlerts.alerts) {
    seenAlertIds.add(alert.id);
  }
}

export function startAlertLoop(client: Client<true>): void {
  const channelId = env.discordAlertChannelId;

  if (!channelId) {
    console.warn(
      "DISCORD_ALERT_CHANNEL_ID is missing. Proactive alert posting is disabled.",
    );
    return;
  }

  void (async () => {
    const channel = await client.channels.fetch(channelId);

    if (!isSendableChannel(channel)) {
      console.warn(
        `Discord alert channel ${channelId} was not found or cannot receive messages.`,
      );
      return;
    }

    await markCurrentAlertsSeen();
    console.log(
      `Proactive alert posting enabled for channel ${channelId}. Existing active alerts are marked seen.`,
    );

    const pollAlerts = async () => {
      try {
        const activeAlerts = await getActiveAlerts();

        for (const alert of activeAlerts.alerts) {
          if (seenAlertIds.has(alert.id)) {
            continue;
          }

          seenAlertIds.add(alert.id);
          await channel.send(await buildAlertMessage(alert));
        }
      } catch (error) {
        console.error("Failed to poll active alerts.", error);
      }
    };

    setInterval(() => {
      void pollAlerts();
    }, env.alertPollIntervalMs);
  })().catch((error: unknown) => {
    console.error("Failed to start proactive alert loop.", error);
  });
}
