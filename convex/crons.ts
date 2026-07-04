import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "simulator tick",
  { seconds: 3 },
  internal.simulator.simulatorTick,
  {},
);

export default crons;
