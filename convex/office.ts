import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { ROOM_IDS, roomValidator, type RoomId } from "./domain";
import { getDhakaStartOfDayUtcMs } from "./time";

type Device = Doc<"devices">;
type Alert = Doc<"alerts">;

type DeviceView = {
  id: Id<"devices">;
  room: RoomId;
  roomLabel: string;
  type: "fan" | "light";
  name: string;
  status: boolean;
  powerDrawWatts: number;
  ratedWatts: number;
  lastChanged: number;
};

type RoomDeviceGroup = {
  room: RoomId;
  label: string;
  devices: DeviceView[];
  totalDevices: number;
  devicesOn: number;
  fansOn: number;
  fansTotal: number;
  lightsOn: number;
  lightsTotal: number;
  totalWatts: number;
};

type RoomStatus = RoomDeviceGroup & {
  summaryText: string;
};

type AlertView = {
  id: Id<"alerts">;
  type: "after_hours_on" | "sustained_room_usage";
  room: RoomId;
  roomLabel: string;
  message: string;
  triggeredAt: number;
  resolvedAt: null;
  deviceIds: Id<"devices">[];
  dedupeKey: string;
};

const EXPECTED_DEVICE_COUNT = 15;
const EXPECTED_ROOM_DEVICE_COUNT = 5;
const MAX_DEVICE_COUNT_CHECK = EXPECTED_DEVICE_COUNT + 1;
const MAX_ROOM_DEVICE_COUNT_CHECK = EXPECTED_ROOM_DEVICE_COUNT + 1;
const MAX_ACTIVE_ALERTS = 50;
const MAX_TODAY_POWER_LOGS = 10000;
const HOURS_IN_MS = 3_600_000;

const ROOM_LABELS: Record<RoomId, string> = {
  drawing: "Drawing Room",
  work1: "Work Room 1",
  work2: "Work Room 2",
};

function getRoomLabel(room: RoomId): string {
  return ROOM_LABELS[room];
}

function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getDeviceNameNumber(name: string): number {
  const match = name.match(/(\d+)$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function compareDevices(left: Device, right: Device): number {
  if (left.type !== right.type) {
    return left.type === "fan" ? -1 : 1;
  }

  const numberDifference =
    getDeviceNameNumber(left.name) - getDeviceNameNumber(right.name);

  if (numberDifference !== 0) {
    return numberDifference;
  }

  return left.name.localeCompare(right.name);
}

function toDeviceView(device: Device): DeviceView {
  return {
    id: device._id,
    room: device.room,
    roomLabel: getRoomLabel(device.room),
    type: device.type,
    name: device.name,
    status: device.status,
    powerDrawWatts: device.powerDrawWatts,
    ratedWatts: device.ratedWatts,
    lastChanged: device.lastChanged,
  };
}

function buildRoomGroup(room: RoomId, devices: Device[]): RoomDeviceGroup {
  const sortedDevices = [...devices].sort(compareDevices);
  const fans = sortedDevices.filter((device) => device.type === "fan");
  const lights = sortedDevices.filter((device) => device.type === "light");
  const devicesOn = sortedDevices.filter((device) => device.status).length;

  return {
    room,
    label: getRoomLabel(room),
    devices: sortedDevices.map(toDeviceView),
    totalDevices: sortedDevices.length,
    devicesOn,
    fansOn: fans.filter((device) => device.status).length,
    fansTotal: fans.length,
    lightsOn: lights.filter((device) => device.status).length,
    lightsTotal: lights.length,
    totalWatts: sortedDevices.reduce(
      (total, device) => total + device.powerDrawWatts,
      0,
    ),
  };
}

function buildRoomSummary(group: RoomDeviceGroup): string {
  if (group.devicesOn === 0) {
    return `${group.label}: all devices are off.`;
  }

  return `${group.label}: ${pluralize(group.fansOn, "fan")} ON, ${pluralize(
    group.lightsOn,
    "light",
  )} ON.`;
}

function getRoomDevices(devices: Device[], room: RoomId): Device[] {
  return devices.filter((device) => device.room === room);
}

function assertAllDevicesSeeded(devices: Device[]) {
  if (devices.length !== EXPECTED_DEVICE_COUNT) {
    throw new Error("Expected exactly 15 seeded devices.");
  }
}

function assertRoomDevicesSeeded(devices: Device[]) {
  if (devices.length !== EXPECTED_ROOM_DEVICE_COUNT) {
    throw new Error("Expected 5 devices for room.");
  }
}

function roundKwh(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function estimateKwhFromLogs(logs: Array<Doc<"powerLog">>): number {
  if (logs.length < 2) {
    return 0;
  }

  const sortedLogs = [...logs].sort((left, right) => left.timestamp - right.timestamp);
  let kwh = 0;

  for (let index = 1; index < sortedLogs.length; index += 1) {
    const previous = sortedLogs[index - 1];
    const current = sortedLogs[index];
    const hours = (current.timestamp - previous.timestamp) / HOURS_IN_MS;
    const avgWatts = (previous.totalWatts + current.totalWatts) / 2;
    kwh += (avgWatts * hours) / 1000;
  }

  return roundKwh(kwh);
}

function toAlertView(alert: Alert): AlertView {
  return {
    id: alert._id,
    type: alert.type,
    room: alert.room,
    roomLabel: getRoomLabel(alert.room),
    message: alert.message,
    triggeredAt: alert.triggeredAt,
    resolvedAt: null,
    deviceIds: alert.deviceIds,
    dedupeKey: alert.dedupeKey,
  };
}

export const getAllDevices = query({
  args: {},
  handler: async (ctx) => {
    const devices = await ctx.db.query("devices").take(MAX_DEVICE_COUNT_CHECK);
    assertAllDevicesSeeded(devices);

    const rooms = ROOM_IDS.map((room) =>
      buildRoomGroup(room, getRoomDevices(devices, room)),
    );

    return {
      rooms,
      totalDevices: devices.length,
      totalWatts: devices.reduce(
        (total, device) => total + device.powerDrawWatts,
        0,
      ),
      lastUpdated:
        devices.length > 0
          ? Math.max(...devices.map((device) => device.lastChanged))
          : null,
    };
  },
});

export const getRoomStatus = query({
  args: {
    room: roomValidator,
  },
  handler: async (ctx, args): Promise<RoomStatus> => {
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_room", (index) => index.eq("room", args.room))
      .take(MAX_ROOM_DEVICE_COUNT_CHECK);
    assertRoomDevicesSeeded(devices);

    const group = buildRoomGroup(args.room, devices);

    return {
      ...group,
      summaryText: buildRoomSummary(group),
    };
  },
});

export const getUsageSummary = query({
  args: {},
  handler: async (ctx) => {
    const computedAt = Date.now();
    const devices = await ctx.db.query("devices").take(MAX_DEVICE_COUNT_CHECK);
    assertAllDevicesSeeded(devices);

    const startOfToday = getDhakaStartOfDayUtcMs(computedAt);
    const powerLogs = await ctx.db
      .query("powerLog")
      .withIndex("by_timestamp", (index) =>
        index.gte("timestamp", startOfToday),
      )
      .take(MAX_TODAY_POWER_LOGS);
    const perRoomWatts: Record<RoomId, number> = {
      drawing: 0,
      work1: 0,
      work2: 0,
    };

    for (const device of devices) {
      perRoomWatts[device.room] += device.powerDrawWatts;
    }

    return {
      totalWattsNow: devices.reduce(
        (total, device) => total + device.powerDrawWatts,
        0,
      ),
      perRoomWatts,
      estimatedKwhToday: estimateKwhFromLogs(powerLogs),
      computedAt,
      logPointsUsed: powerLogs.length,
    };
  },
});

export const getActiveAlerts = query({
  args: {},
  handler: async (ctx) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_resolvedAt", (index) => index.eq("resolvedAt", null))
      .order("desc")
      .take(MAX_ACTIVE_ALERTS);

    return {
      alerts: alerts.map(toAlertView),
      count: alerts.length,
      generatedAt: Date.now(),
    };
  },
});
