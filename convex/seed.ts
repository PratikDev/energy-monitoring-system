import { internal } from "./_generated/api";
import { env, internalMutation, mutation } from "./_generated/server";
import type { DeviceType, RoomId } from "./domain";

type SeedStatus = "seeded" | "already_seeded";

type SeedResult = {
  status: SeedStatus;
  inserted: number;
  existing: number;
};

type SeedDeviceTemplate = {
  type: DeviceType;
  name: string;
  ratedWatts: number;
};

type SeedDevice = SeedDeviceTemplate & {
  room: RoomId;
  status: boolean;
  powerDrawWatts: number;
  lastChanged: number;
};

const EXPECTED_DEVICE_COUNT = 15;

const DEVICE_TEMPLATES: SeedDeviceTemplate[] = [
  { type: "fan", name: "Fan 1", ratedWatts: 60 },
  { type: "fan", name: "Fan 2", ratedWatts: 62 },
  { type: "light", name: "Light 1", ratedWatts: 14 },
  { type: "light", name: "Light 2", ratedWatts: 15 },
  { type: "light", name: "Light 3", ratedWatts: 16 },
];

const ROOM_IDS: RoomId[] = ["drawing", "work1", "work2"];

function buildSeedDevices(now: number): SeedDevice[] {
  return ROOM_IDS.flatMap((room) =>
    DEVICE_TEMPLATES.map((device) => ({
      ...device,
      room,
      status: false,
      powerDrawWatts: 0,
      lastChanged: now,
    })),
  );
}

export const seedDevices = internalMutation({
  args: {},
  handler: async (ctx): Promise<SeedResult> => {
    const existingDevices = await ctx.db.query("devices").take(16);
    const existingCount = existingDevices.length;

    if (existingCount === EXPECTED_DEVICE_COUNT) {
      return {
        status: "already_seeded",
        inserted: 0,
        existing: EXPECTED_DEVICE_COUNT,
      };
    }

    if (existingCount > EXPECTED_DEVICE_COUNT) {
      throw new Error(
        "Refusing to seed because the devices table has more than 15 rows.",
      );
    }

    if (existingCount > 0) {
      throw new Error(
        "Refusing to seed because the devices table is partially populated.",
      );
    }

    const now = Date.now();
    const devices = buildSeedDevices(now);

    for (const device of devices) {
      await ctx.db.insert("devices", device);
    }

    return {
      status: "seeded",
      inserted: devices.length,
      existing: 0,
    };
  },
});

export const seedDevicesForDemo = mutation({
  args: {},
  handler: async (ctx): Promise<SeedResult> => {
    if (env.ENABLE_DEMO_CONTROLS !== "true") {
      throw new Error("Demo controls are disabled.");
    }

    const result: SeedResult = await ctx.runMutation(
      internal.seed.seedDevices,
      {},
    );
    return result;
  },
});
