import type {
  ActiveAlertsResult,
  AlertView,
  AllDevicesResult,
  RoomStatusResult,
  UsageSummaryResult,
} from "../convex/queries.js";
import {
  formatKwh,
  formatRelativeTime,
  formatTimestamp,
  formatWatts,
} from "./formatters.js";
import { getRoomLabel } from "./rooms.js";

export function buildStatusRawSummary(data: AllDevicesResult): string {
  const lines = [
    `Total devices: ${data.totalDevices}.`,
    `Current total power: ${formatWatts(data.totalWatts)}.`,
  ];

  if (data.lastUpdated !== null) {
    lines.push(
      `Last updated: ${formatTimestamp(data.lastUpdated)} (${formatRelativeTime(
        data.lastUpdated,
      )}).`,
    );
  }

  for (const room of data.rooms) {
    lines.push(
      `${room.label}: ${room.fansOn} of ${room.fansTotal} fans ON, ${room.lightsOn} of ${room.lightsTotal} lights ON, ${formatWatts(room.totalWatts)}.`,
    );
  }

  return lines.join("\n");
}

export function buildRoomRawSummary(data: RoomStatusResult): string {
  const deviceLines = data.devices.map((device) => {
    const status = device.status ? "ON" : "OFF";
    return `- ${device.name} (${device.type}): ${status}, ${formatWatts(device.powerDrawWatts)}, last changed ${formatTimestamp(device.lastChanged)} (${formatRelativeTime(device.lastChanged)}).`;
  });

  return [
    data.summaryText,
    `Total room power: ${formatWatts(data.totalWatts)}.`,
    ...deviceLines,
  ].join("\n");
}

export function buildUsageRawSummary(data: UsageSummaryResult): string {
  return [
    `Total power right now: ${formatWatts(data.totalWattsNow)}.`,
    `Estimated usage today: ${formatKwh(data.estimatedKwhToday)}.`,
    `Drawing Room: ${formatWatts(data.perRoomWatts.drawing)}.`,
    `Work Room 1: ${formatWatts(data.perRoomWatts.work1)}.`,
    `Work Room 2: ${formatWatts(data.perRoomWatts.work2)}.`,
    `Computed at: ${formatTimestamp(data.computedAt)}.`,
    `Power log points used: ${data.logPointsUsed}.`,
  ].join("\n");
}

export function buildAlertRawSummary(alert: AlertView): string {
  return [
    `Alert type: ${alert.type}.`,
    `Room: ${alert.roomLabel}.`,
    `Message: ${alert.message}`,
    `Triggered: ${formatTimestamp(alert.triggeredAt)} (${formatRelativeTime(alert.triggeredAt)}).`,
    `Affected devices: ${alert.deviceIds.length}.`,
    `Dedupe key: ${alert.dedupeKey}.`,
  ].join("\n");
}

export function buildStatusFallback(data: AllDevicesResult): string {
  const roomSummaries = data.rooms.map(
    (room) =>
      `${room.label}: ${room.fansOn}/${room.fansTotal} fans ON and ${room.lightsOn}/${room.lightsTotal} lights ON`,
  );

  return `${roomSummaries.join(". ")}. Current total power is ${formatWatts(
    data.totalWatts,
  )}.`;
}

export function buildRoomFallback(data: RoomStatusResult): string {
  return `${data.summaryText} Current room power is ${formatWatts(data.totalWatts)}.`;
}

export function buildUsageFallback(data: UsageSummaryResult): string {
  return `Total power right now is ${formatWatts(
    data.totalWattsNow,
  )}. Today's estimated usage is ${formatKwh(data.estimatedKwhToday)}.`;
}

export function buildAlertFallback(alert: AlertView): string {
  return `Alert: ${alert.message} Triggered ${formatRelativeTime(alert.triggeredAt)}.`;
}

export function buildActiveAlertsFallback(data: ActiveAlertsResult): string {
  if (data.count === 0) {
    return "There are no active alerts right now.";
  }

  return data.alerts
    .map((alert) => `${getRoomLabel(alert.room)}: ${alert.message}`)
    .join("\n");
}
