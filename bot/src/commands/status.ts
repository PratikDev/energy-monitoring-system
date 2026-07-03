import {
  buildStatusFallback,
  buildStatusRawSummary,
} from "../lib/fallbackResponses.js";
import { safeDiscordText } from "../lib/formatters.js";
import { humanize } from "../llm/humanize.js";
import { getAllDevices } from "../convex/queries.js";

export async function runStatusCommand(): Promise<string> {
  const data = await getAllDevices();
  const rawSummary = buildStatusRawSummary(data);

  try {
    return await humanize(
      rawSummary,
      "User asked for the whole office device status.",
    );
  } catch (error) {
    console.warn("Falling back to plain status response.", error);
    return safeDiscordText(buildStatusFallback(data));
  }
}
