import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { alertTypeValidator, deviceTypeValidator, roomValidator } from "./domain";

export default defineSchema({
  devices: defineTable({
    room: roomValidator,
    type: deviceTypeValidator,
    name: v.string(),
    status: v.boolean(),
    powerDrawWatts: v.number(),
    ratedWatts: v.number(),
    lastChanged: v.number(),
  }).index("by_room", ["room"]),

  powerLog: defineTable({
    timestamp: v.number(),
    totalWatts: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  alerts: defineTable({
    type: alertTypeValidator,
    room: roomValidator,
    message: v.string(),
    triggeredAt: v.number(),
    resolvedAt: v.union(v.number(), v.null()),
    deviceIds: v.array(v.id("devices")),
    dedupeKey: v.string(),
  })
    .index("by_resolvedAt", ["resolvedAt"])
    .index("by_type_and_room_and_resolvedAt", [
      "type",
      "room",
      "resolvedAt",
    ])
    .index("by_dedupeKey_and_resolvedAt", ["dedupeKey", "resolvedAt"]),
});
