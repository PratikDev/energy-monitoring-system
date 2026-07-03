import { internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { ROOM_IDS, type AlertType, type RoomId } from "./domain";
import { isAfterOfficeHours } from "./time";

type Device = Doc<"devices">;
type Alert = Doc<"alerts">;

type AlertCondition = {
  type: AlertType;
  room: RoomId;
  message: string;
  deviceIds: Id<"devices">[];
  dedupeKey: string;
};

type AlertEvaluationResult = {
  status: "evaluated";
  activeConditions: number;
  inserted: number;
  resolved: number;
  checkedAt: number;
};

const EXPECTED_DEVICE_COUNT = 15;
const EXPECTED_ROOM_DEVICE_COUNT = 5;
const MAX_DEVICE_COUNT_CHECK = EXPECTED_DEVICE_COUNT + 1;
const MAX_UNRESOLVED_ALERTS = 50;
const SUSTAINED_ROOM_MS = 2 * 60 * 60 * 1000;

const ROOM_LABELS: Record<RoomId, string> = {
  drawing: "Drawing Room",
  work1: "Work Room 1",
  work2: "Work Room 2",
};

function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getRoomLabel(room: RoomId): string {
  return ROOM_LABELS[room];
}

function getDevicesForRoom(devices: Device[], room: RoomId): Device[] {
  return devices.filter((device) => device.room === room);
}

function buildAfterHoursConditions(
  devices: Device[],
  now: number,
): AlertCondition[] {
  if (!isAfterOfficeHours(now)) {
    return [];
  }

  return ROOM_IDS.flatMap((room) => {
    const onDevices = getDevicesForRoom(devices, room).filter(
      (device) => device.status,
    );

    if (onDevices.length === 0) {
      return [];
    }

    return [
      {
        type: "after_hours_on",
        room,
        message: `${getRoomLabel(room)} has ${pluralize(
          onDevices.length,
          "device",
        )} still on after office hours.`,
        deviceIds: onDevices.map((device) => device._id),
        dedupeKey: `after_hours_on:${room}`,
      },
    ];
  });
}

function buildSustainedRoomConditions(
  devices: Device[],
  now: number,
): AlertCondition[] {
  const cutoff = now - SUSTAINED_ROOM_MS;

  return ROOM_IDS.flatMap((room) => {
    const roomDevices = getDevicesForRoom(devices, room);
    const isSustained =
      roomDevices.length === EXPECTED_ROOM_DEVICE_COUNT &&
      roomDevices.every(
        (device) => device.status && device.lastChanged <= cutoff,
      );

    if (!isSustained) {
      return [];
    }

    return [
      {
        type: "sustained_room_usage",
        room,
        message: `All 5 devices in ${getRoomLabel(
          room,
        )} have been on for over 2 hours.`,
        deviceIds: roomDevices.map((device) => device._id),
        dedupeKey: `sustained_room_usage:${room}`,
      },
    ];
  });
}

function buildActiveConditions(devices: Device[], now: number): AlertCondition[] {
  return [
    ...buildAfterHoursConditions(devices, now),
    ...buildSustainedRoomConditions(devices, now),
  ];
}

function getUnresolvedAlertByDedupeKey(
  alerts: Alert[],
): Map<string, Alert> {
  return new Map(alerts.map((alert) => [alert.dedupeKey, alert]));
}

export async function evaluateCurrentAlerts(
  ctx: MutationCtx,
  now: number,
): Promise<AlertEvaluationResult> {
  const devices = await ctx.db.query("devices").take(MAX_DEVICE_COUNT_CHECK);

  if (devices.length !== EXPECTED_DEVICE_COUNT) {
    throw new Error(
      "Expected exactly 15 seeded devices before evaluating alerts.",
    );
  }

  const activeConditions = buildActiveConditions(devices, now);
  const activeConditionByDedupeKey = new Map(
    activeConditions.map((condition) => [condition.dedupeKey, condition]),
  );
  const unresolvedAlerts = await ctx.db
    .query("alerts")
    .withIndex("by_resolvedAt", (index) => index.eq("resolvedAt", null))
    .take(MAX_UNRESOLVED_ALERTS);
  const unresolvedAlertByDedupeKey =
    getUnresolvedAlertByDedupeKey(unresolvedAlerts);
  let inserted = 0;
  let resolved = 0;

  for (const condition of activeConditions) {
    if (unresolvedAlertByDedupeKey.has(condition.dedupeKey)) {
      continue;
    }

    await ctx.db.insert("alerts", {
      type: condition.type,
      room: condition.room,
      message: condition.message,
      triggeredAt: now,
      resolvedAt: null,
      deviceIds: condition.deviceIds,
      dedupeKey: condition.dedupeKey,
    });
    inserted += 1;
  }

  for (const alert of unresolvedAlerts) {
    if (activeConditionByDedupeKey.has(alert.dedupeKey)) {
      continue;
    }

    await ctx.db.patch(alert._id, {
      resolvedAt: now,
    });
    resolved += 1;
  }

  return {
    status: "evaluated",
    activeConditions: activeConditions.length,
    inserted,
    resolved,
    checkedAt: now,
  };
}

export const evaluateAlerts = internalMutation({
  args: {},
  handler: async (ctx): Promise<AlertEvaluationResult> => {
    return await evaluateCurrentAlerts(ctx, Date.now());
  },
});
