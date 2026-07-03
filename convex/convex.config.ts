import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    ENABLE_DEMO_CONTROLS: v.optional(v.string()),
  },
});

export default app;
