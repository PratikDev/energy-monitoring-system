import { v } from "convex/values";

export const ROOM_IDS = ["drawing", "work1", "work2"] as const;
export const DEVICE_TYPES = ["fan", "light"] as const;
export const ALERT_TYPES = [
  "after_hours_on",
  "sustained_room_usage",
] as const;

export type RoomId = (typeof ROOM_IDS)[number];
export type DeviceType = (typeof DEVICE_TYPES)[number];
export type AlertType = (typeof ALERT_TYPES)[number];

export const roomValidator = v.union(
  v.literal("drawing"),
  v.literal("work1"),
  v.literal("work2"),
);

export const deviceTypeValidator = v.union(
  v.literal("fan"),
  v.literal("light"),
);

export const alertTypeValidator = v.union(
  v.literal("after_hours_on"),
  v.literal("sustained_room_usage"),
);
