import type { FunctionReturnType } from "convex/server";

import { api } from "../../../convex/_generated/api.js";

import { convexClient } from "./client.js";
import type { RoomId } from "../lib/rooms.js";

export type AllDevicesResult = FunctionReturnType<typeof api.office.getAllDevices>;
export type RoomStatusResult = FunctionReturnType<typeof api.office.getRoomStatus>;
export type UsageSummaryResult = FunctionReturnType<
  typeof api.office.getUsageSummary
>;
export type ActiveAlertsResult = FunctionReturnType<
  typeof api.office.getActiveAlerts
>;
export type AlertView = ActiveAlertsResult["alerts"][number];

export function getAllDevices(): Promise<AllDevicesResult> {
  return convexClient.query(api.office.getAllDevices, {});
}

export function getRoomStatus(room: RoomId): Promise<RoomStatusResult> {
  return convexClient.query(api.office.getRoomStatus, { room });
}

export function getUsageSummary(): Promise<UsageSummaryResult> {
  return convexClient.query(api.office.getUsageSummary, {});
}

export function getActiveAlerts(): Promise<ActiveAlertsResult> {
  return convexClient.query(api.office.getActiveAlerts, {});
}
