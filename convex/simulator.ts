import { env, internalMutation, mutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { ROOM_IDS, roomValidator, type RoomId } from "./domain";
import { evaluateCurrentAlerts } from "./alerts";

type Device = Doc<"devices">;

type DevicePatch = {
  status: boolean;
  powerDrawWatts: number;
  lastChanged: number;
};

type SimulatorTickResult = {
  status: "ticked";
  changed: number;
  totalWatts: number;
  loggedAt: number;
};

type ForceAlertStateResult = {
  status: "forced";
  room: RoomId;
  updated: number;
  lastChanged: number;
};

const EXPECTED_DEVICE_COUNT = 15;
const EXPECTED_ROOM_DEVICE_COUNT = 5;
const MAX_DEVICE_COUNT_CHECK = EXPECTED_DEVICE_COUNT + 1;
const MAX_ROOM_DEVICE_COUNT_CHECK = EXPECTED_ROOM_DEVICE_COUNT + 1;
const BIAS_CHANCE = 0.05;
const SUSTAINED_ALERT_BACKDATE_MS = 2 * 60 * 60 * 1000 + 60 * 1000;

function getJitteredWatts(ratedWatts: number): number {
  const multiplier = 0.95 + Math.random() * 0.1;
  return Math.max(1, Math.round(ratedWatts * multiplier));
}

function pickChangeCount(): number {
  const roll = Math.random();

  if (roll < 0.55) {
    return 0;
  }

  if (roll < 0.8) {
    return 1;
  }

  if (roll < 0.95) {
    return 2;
  }

  return 3;
}

function pickRandomRoom(): RoomId {
  return ROOM_IDS[Math.floor(Math.random() * ROOM_IDS.length)];
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return shuffled;
}

function getTotalWatts(devices: Array<{ powerDrawWatts: number }>): number {
  return devices.reduce((total, device) => total + device.powerDrawWatts, 0);
}

function applyTurnOn(device: Device, now: number): DevicePatch {
  return {
    status: true,
    powerDrawWatts: getJitteredWatts(device.ratedWatts),
    lastChanged: now,
  };
}

function applyFlip(device: Device, now: number): DevicePatch {
  if (device.status) {
    return {
      status: false,
      powerDrawWatts: 0,
      lastChanged: now,
    };
  }

  return applyTurnOn(device, now);
}

function patchState(
  devicesById: Map<Id<"devices">, Device>,
  deviceId: Id<"devices">,
  patch: DevicePatch,
) {
  const device = devicesById.get(deviceId);

  if (!device) {
    return;
  }

  devicesById.set(deviceId, {
    ...device,
    ...patch,
  });
}

export const simulatorTick = internalMutation({
  args: {},
  handler: async (ctx): Promise<SimulatorTickResult> => {
    const devices = await ctx.db.query("devices").take(MAX_DEVICE_COUNT_CHECK);

    if (devices.length !== EXPECTED_DEVICE_COUNT) {
      throw new Error(
        "Expected exactly 15 seeded devices before running simulator.",
      );
    }

    const now = Date.now();
    const devicesById = new Map<Id<"devices">, Device>(
      devices.map((device) => [device._id, device]),
    );
    const changedDeviceIds = new Set<Id<"devices">>();
    const touchedDeviceIds = new Set<Id<"devices">>();

    const biasRoom = Math.random() < BIAS_CHANCE ? pickRandomRoom() : null;

    if (biasRoom) {
      const offDevicesInBiasRoom = shuffle(
        [...devicesById.values()].filter(
          (device) => device.room === biasRoom && !device.status,
        ),
      ).slice(0, 2);

      for (const device of offDevicesInBiasRoom) {
        const patch = applyTurnOn(device, now);
        await ctx.db.patch(device._id, patch);
        patchState(devicesById, device._id, patch);
        changedDeviceIds.add(device._id);
        touchedDeviceIds.add(device._id);
      }
    }

    const changeCount = pickChangeCount();
    const untouchedDevices = [...devicesById.values()].filter(
      (device) => !touchedDeviceIds.has(device._id),
    );
    const baseCandidates =
      untouchedDevices.length > 0 ? untouchedDevices : [...devicesById.values()];
    const preferredCandidates = biasRoom
      ? baseCandidates.filter(
          (device) => !(device.room === biasRoom && device.status),
        )
      : baseCandidates;
    const flipCandidates =
      preferredCandidates.length > 0 ? preferredCandidates : baseCandidates;
    const selectedDevices = shuffle(flipCandidates).slice(0, changeCount);

    for (const device of selectedDevices) {
      const patch = applyFlip(device, now);
      await ctx.db.patch(device._id, patch);
      patchState(devicesById, device._id, patch);
      changedDeviceIds.add(device._id);
    }

    const totalWatts = getTotalWatts([...devicesById.values()]);

    await ctx.db.insert("powerLog", {
      timestamp: now,
      totalWatts,
    });
    await evaluateCurrentAlerts(ctx, now);

    return {
      status: "ticked",
      changed: changedDeviceIds.size,
      totalWatts,
      loggedAt: now,
    };
  },
});

export const forceAlertState = mutation({
  args: {
    room: roomValidator,
  },
  handler: async (ctx, args): Promise<ForceAlertStateResult> => {
    if (env.ENABLE_DEMO_CONTROLS !== "true") {
      throw new Error("Demo controls are disabled.");
    }

    const roomDevices = await ctx.db
      .query("devices")
      .withIndex("by_room", (query) => query.eq("room", args.room))
      .take(MAX_ROOM_DEVICE_COUNT_CHECK);

    if (roomDevices.length !== EXPECTED_ROOM_DEVICE_COUNT) {
      throw new Error("Expected 5 devices for room.");
    }

    const now = Date.now();
    const forcedLastChanged = now - SUSTAINED_ALERT_BACKDATE_MS;
    const forcedPatches = new Map<Id<"devices">, DevicePatch>();

    for (const device of roomDevices) {
      const patch: DevicePatch = {
        status: true,
        powerDrawWatts: getJitteredWatts(device.ratedWatts),
        lastChanged: forcedLastChanged,
      };

      await ctx.db.patch(device._id, patch);
      forcedPatches.set(device._id, patch);
    }

    const allDevices = await ctx.db.query("devices").take(MAX_DEVICE_COUNT_CHECK);
    const totalWatts = getTotalWatts(
      allDevices.map((device) => ({
        powerDrawWatts:
          forcedPatches.get(device._id)?.powerDrawWatts ?? device.powerDrawWatts,
      })),
    );

    await ctx.db.insert("powerLog", {
      timestamp: now,
      totalWatts,
    });

    return {
      status: "forced",
      room: args.room,
      updated: roomDevices.length,
      lastChanged: forcedLastChanged,
    };
  },
});
