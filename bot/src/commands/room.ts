import { getRoomStatus } from "../convex/queries.js";
import {
  buildRoomFallback,
  buildRoomRawSummary,
} from "../lib/fallbackResponses.js";
import { safeDiscordText } from "../lib/formatters.js";
import { parseRoom } from "../lib/rooms.js";
import { humanize } from "../llm/humanize.js";

const INVALID_ROOM_RESPONSE = "Please choose one room: drawing, work1, or work2.";

export async function runRoomCommand(args: string[]): Promise<string> {
  const room = parseRoom(args.join(" "));

  if (!room) {
    return INVALID_ROOM_RESPONSE;
  }

  const data = await getRoomStatus(room);
  const rawSummary = buildRoomRawSummary(data);

  try {
    return await humanize(
      rawSummary,
      "User asked for one room's current device status.",
    );
  } catch (error) {
    console.warn("Falling back to plain room response.", error);
    return safeDiscordText(buildRoomFallback(data));
  }
}
