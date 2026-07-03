import { ConvexHttpClient } from "convex/browser";

import { env } from "../config/env.js";

export const convexClient = new ConvexHttpClient(env.convexUrl);
