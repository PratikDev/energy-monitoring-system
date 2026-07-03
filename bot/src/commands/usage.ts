import { getUsageSummary } from "../convex/queries.js";
import {
  buildUsageFallback,
  buildUsageRawSummary,
} from "../lib/fallbackResponses.js";
import { safeDiscordText } from "../lib/formatters.js";
import { humanize } from "../llm/humanize.js";

export async function runUsageCommand(): Promise<string> {
  const data = await getUsageSummary();
  const rawSummary = buildUsageRawSummary(data);

  try {
    return await humanize(
      rawSummary,
      "User asked for current office power usage.",
    );
  } catch (error) {
    console.warn("Falling back to plain usage response.", error);
    return safeDiscordText(buildUsageFallback(data));
  }
}
