# AGENT BUILD PROMPT — Office Device Monitoring System (Discord + Web Dashboard)

You are an autonomous coding agent building a full-stack project for a hackathon deadline. Read this entire prompt before writing any code. Follow the priority order strictly — if you run low on time/budget, cut from the bottom, never from the top.

## Tech Stack (fixed, do not deviate)
- **Backend**: Convex (schema, queries, mutations, scheduled functions/crons, actions)
- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Discord Bot**: Node.js + discord.js v14, using `ConvexHttpClient` to talk to the same Convex backend as the dashboard (no separate data layer, no duplicated logic)
- **LLM for bot responses**: Vercel AI SDK + Gemini via `@ai-sdk/google` — one small wrapper function, called only to phrase already-computed data conversationally. Never let the LLM invent numbers.

## Non-negotiable architecture rule
There is exactly ONE backend (Convex). The web dashboard subscribes to Convex queries directly via `useQuery`. The Discord bot calls the exact same Convex query/mutation functions via `ConvexHttpClient`. Do not create a separate REST API, do not duplicate the simulator or alert logic anywhere else. If dashboard and bot ever need the same computed value (e.g. total power, alert state), it must live in ONE Convex query function that both consume.

---

## PRIORITY ORDER (build in this exact sequence)

### PHASE 1 — Convex schema + data model (highest priority, blocks everything else)

Create a `devices` table with this shape:
```
devices: {
  room: "drawing" | "work1" | "work2"
  type: "fan" | "light"
  name: string            // e.g. "Fan 1", "Light 3"
  status: boolean         // on/off
  powerDrawWatts: number  // current draw; 0 if off
  ratedWatts: number      // fan ~55-65W, light ~12-18W (jitter around a base)
  lastChanged: number     // unix timestamp ms
}
```
Seed exactly 15 rows: 3 rooms × (2 fans + 3 lights). Write a Convex `internalMutation` called `seedDevices` and a one-off script or admin function to run it once. Do not reseed on every deploy — guard against duplicate seeding (check count first).

Convex implementation notes:
- Define the schema in `convex/schema.ts` with explicit validators and indexes:
  - `devices.by_room` on `["room"]`
  - `powerLog.by_timestamp` on `["timestamp"]`
  - `alerts.by_resolvedAt` on `["resolvedAt"]`
  - `alerts.by_type_and_room_and_resolvedAt` on `["type", "room", "resolvedAt"]`
  - `alerts.by_dedupeKey_and_resolvedAt` on `["dedupeKey", "resolvedAt"]`
- Use `v.union(v.literal(...))` validators for room/type values, not loose strings.
- Every `query`, `mutation`, `action`, `internalQuery`, `internalMutation`, and `internalAction` must include an `args` object, even when empty.
- Keep `seedDevices` private. If a public admin/dev wrapper is needed to trigger it quickly, guard it behind an env flag and duplicate-count check, and do not expose destructive reset behavior.

Also create a `powerLog` table (or a rolling in-memory-style aggregate) to support "today's estimated kWh usage":
```
powerLog: {
  timestamp: number
  totalWatts: number
}
```
This gets a row appended by the simulator tick, and is used to integrate energy-over-time into an estimated kWh figure (Watts × hours, summed/trapezoidal over the log).

### PHASE 2 — Simulator (Convex scheduled function / cron)

Write a Convex cron job (`crons.ts`) that runs every 10–15 seconds and calls an `internalMutation` (`simulatorTick`) that:
1. Randomly selects 1–3 devices and flips their `status` (weighted so it doesn't flip everything at once — office behavior should look plausible, not chaotic: e.g. 80% of ticks change 0-1 devices, occasional bursts of 2-3).
2. When a device turns ON, set `powerDrawWatts` to `ratedWatts` ± small jitter (±5%). When turned OFF, set `powerDrawWatts` to 0.
3. Update `lastChanged` to `Date.now()` ONLY for devices whose status actually changed this tick (this field is critical for the "on >2hrs" and "after hours" alert logic — do not touch it if status didn't change).
4. Compute current total wattage across all 15 devices and append a row to `powerLog`.
5. Occasionally (e.g. once every ~20 ticks) bias toward leaving a couple devices on continuously in one room, so the "room fully on for 2+ hours" alert condition actually has a chance to trigger during a demo — see Phase 4 note on demo-friendly time compression.

**Demo-friendly time note**: A real 2-hour continuous-on window won't happen during a live demo. Add an internal "simulated clock speed multiplier" — either (a) make the cron interval + a fake elapsed-time field so 2 real hours = ~2-3 real minutes, or (b) add a hidden dev-only Convex mutation `forceAlertState()` that fast-forwards a room's `lastChanged` values into the past so the alert demonstrably fires on demand during the video recording. Build option (b) regardless — it's the safer bet for the demo video even if you also do (a). Guard `forceAlertState()` behind a typed Convex env flag such as `ENABLE_DEMO_CONTROLS` declared in `convex/convex.config.ts`; treat only the string value `"true"` as enabled, and return an error/null result without modifying data otherwise.

### PHASE 3 — Convex query functions (the shared "API" both frontend and bot use)

Build these as the single source of truth — reused by both dashboard and bot. All public Convex functions must validate args explicitly:
- `getAllDevices()` → all 15 devices grouped/annotated by room
- `getRoomStatus(room: "drawing" | "work1" | "work2")` → devices + summary for one room, formatted for easy sentence construction (counts of fans/lights on vs total)
- `getUsageSummary()` → `{ totalWattsNow, perRoomWatts: {drawing, work1, work2}, estimatedKwhToday }` — derive `estimatedKwhToday` from `powerLog` via time-integration, not a running counter that resets awkwardly
- `getActiveAlerts()` → computed (not stored, unless you also want a persisted `alerts` table for the "timestamped" requirement — recommended: persist alerts when they first trigger via a mutation, so timestamps are stable across refreshes). Two alert types:
  - **After-hours-on**: any device with `status: true` where current time is outside 9AM–5PM
  - **Sustained room usage**: a room where ALL 5 devices have been continuously `true` with `lastChanged` older than 2 hours ago (use the simulated/compressed clock from Phase 2)
  - Each alert object: `{ id, type, room, message, triggeredAt, deviceIds[] }`

Persist alerts because the dashboard needs stable timestamps and the bot needs deduped proactive posting. Add an `alerts` table and an `internalMutation` `evaluateAlerts` called from the same cron tick as the simulator.

Suggested alert shape:
```
alerts: {
  type: "after_hours_on" | "sustained_room_usage"
  room: "drawing" | "work1" | "work2"
  message: string
  triggeredAt: number
  resolvedAt: number | null
  deviceIds: Id<"devices">[]
  dedupeKey: string
}
```

Alert lifecycle:
- On each cron tick, compute the currently active alert conditions from `devices`.
- For each currently active condition, insert a new row only if there is no matching unresolved alert with the same `dedupeKey` and `resolvedAt: null`.
- For each unresolved alert whose condition is no longer true, patch `resolvedAt` to `Date.now()`.
- `getActiveAlerts()` returns only unresolved alerts (`resolvedAt: null`) and orders them by newest first.
- The proactive Discord loop should track posted alert IDs in memory for the hackathon demo; persisted `alerts` prevents duplicate alert rows across refreshes.

### PHASE 4 — Web Dashboard (Vite + Tailwind + shadcn)

Set up with `useQuery` from `convex/react` — this gives real-time updates automatically, no manual polling or refresh logic needed anywhere in the frontend. Do not write any `setInterval` polling in the dashboard; if data isn't live-updating, the bug is in the Convex subscription, not a missing poll.

Build in this sub-order:
1. **Layout shell**: header (office name, live "last updated" indicator, current total wattage badge), 3-column or tabbed room layout
2. **Live Device Status Panel**: for each of the 3 rooms, list all 5 devices with name, type icon, and a clear ON/OFF visual state (shadcn `Badge` or `Switch`-styled indicator, green glow for on / muted gray for off). Must require zero manual refresh — verify by watching the simulator tick change it live in the browser.
3. **Live Power Consumption Meter**: big total-watts number at the top, animated/transitioning on change (not a jump-cut), plus a per-room breakdown (3 small cards or a simple bar chart, e.g. using `recharts` if available, otherwise plain divs with width-based bars).
4. **Active Alerts Panel**: list of `getActiveAlerts()` results, each showing timestamp (formatted human-readable, e.g. "2 min ago"), room, and message. Use shadcn `Alert` component, color-coded by severity (after-hours = amber, sustained-2hr = red). Empty state should say something reassuring like "All clear — nothing to worry about."
5. **BONUS — Top-view office floorplan visualization** (do not skip, this is explicitly graded): build a simple SVG or CSS-grid representation of the 3 rooms side by side, each room containing icons/shapes for its 2 fans and 3 lights positioned roughly like a real room (plus a couple static decorative elements like a table/chairs outline — doesn't need to be fancy). Bind each icon's visual state to its Convex device record:
   - Lights ON → warm glow via `box-shadow`/`filter: drop-shadow` + opacity transition, OFF → dim/gray
   - Fans ON → CSS `@keyframes spin` rotation applied conditionally, OFF → static
   - Use Tailwind transition utilities so state changes animate smoothly, not snap instantly
6. Polish pass: consistent spacing, responsive layout (works on a laptop screen since that's what'll be recorded), dark-mode-friendly if time allows (not required).

### PHASE 5 — Discord Bot (Node.js + discord.js + Vercel AI SDK)

Set up a separate `bot/` directory (still same repo) with its own `package.json`, using `ConvexHttpClient` pointed at the same Convex deployment URL (via env var, shared `.env.example` documented in README).

Bot dependencies:
- `discord.js`
- `convex`
- `ai`
- `@ai-sdk/google`
- `dotenv` or the repo's existing env loading pattern

LLM provider decision:
- Use the Vercel AI SDK Core `generateText` API.
- Use the Google Gemini provider from `@ai-sdk/google`.
- Read the Gemini API key from `GOOGLE_GENERATIVE_AI_API_KEY`.
- Read the model name from `GEMINI_MODEL`, defaulting to a fast/cheap Gemini model suitable for short response rewriting.
- Keep Gemini strictly as a language humanizer. It must never call Convex directly, infer new device states, calculate watts, calculate kWh, or create alerts.
- The raw Convex-derived facts must be included in the prompt, and the system prompt must say: do not invent, omit, or alter numbers.

Implement exactly these commands, each calling the Phase 3 Convex query functions — never recompute logic locally in the bot:

- `!status` → call `getAllDevices()`, build a per-room summary string, then pass that raw summary through the Gemini humanizer with a system prompt like: *"You are a friendly office assistant. Rephrase this raw device status data into 1-2 natural, warm sentences. Do not invent numbers, only rephrase what's given."* This guarantees real data + humanized tone as required.
- `!room <name>` → validate `<name>` against `drawing`, `work1`, `work2` (case-insensitive, handle aliases like "drawing room", "work room 1"), call `getRoomStatus(room)`, humanize via the same LLM wrapper. If invalid room name, reply with a friendly help message listing valid options — do not error silently.
- `!usage` → call `getUsageSummary()`, humanize into something like the example in the brief ("Total power right now: 740W. Today's estimated usage: 4.2 kWh.") but let the LLM vary the phrasing naturally each time.

Build the Gemini humanizer as a single reusable function:

```
humanize(rawDataSummary: string, context: string): Promise<string>
```

All three commands and proactive alerts must share this function — do not write separate prompt-construction blocks per command.

Recommended wrapper shape:

```
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export async function humanize(
  rawDataSummary: string,
  context: string,
): Promise<string> {
  const { text } = await generateText({
    model: google(modelName),
    system:
      "You are a friendly office assistant. Rephrase already-computed office monitoring data into concise natural language. Do not invent, omit, or alter any numbers, room names, device counts, watts, kWh values, timestamps, or alert facts.",
    prompt: `Context: ${context}\n\nRaw data:\n${rawDataSummary}`,
  });

  return text.trim();
}
```

Keep this wrapper in one file, for example `bot/src/llm/humanize.ts`.

**BONUS — Proactive alert posting** (do not skip, cheap once Phase 3 alerts exist): add a Convex `action` (or a lightweight polling loop in the bot process, every 30-60s, calling `getActiveAlerts()`) that, when a NEW alert appears (track already-posted alert IDs to avoid duplicate spam), posts a humanized message to a designated channel via a Discord webhook URL or bot `channel.send()`. Message should read like the brief's example: casual, slightly worried tone, includes room + device counts + time. Use the same `humanize()` wrapper for tone consistency.

Error handling: bot must not crash on malformed commands, Convex connection hiccups, or Gemini/AI SDK failures — wrap each command handler in try/catch, fall back to a plain non-LLM-formatted message if the LLM call fails (never fail silently or leave the user without a reply).

### PHASE 6 — Documentation (do this incrementally, not at the end)

Write a root `README.md` covering:
- Project overview (one paragraph)
- Architecture summary (one paragraph, referencing the system diagram file, e.g. `docs/system-diagram.png` — assume it will be added manually, just leave the image reference/placeholder)
- Setup instructions in 3 clearly separated sections: **Backend (Convex)**, **Web Dashboard**, **Discord Bot** — each with exact commands (`npm install`, env vars needed, `npx convex dev`, `npm run dev`, `node bot/index.js`, etc.)
- `.env.example` files for both frontend and bot (Convex deployment URL, Discord bot token, Gemini API key, optional Gemini model name) — never commit real secrets
- A short "How the alert system works" note and a mention of the demo fast-forward mechanism from Phase 2, so evaluators understand why alerts can trigger quickly in the video
- Folder structure diagram (plain text tree is fine)

Commit frequently with clear, scoped messages (e.g. `feat: convex schema + seed`, `feat: simulator cron`, `feat: dashboard device panel`, `feat: floorplan visualization`, `feat: discord bot status command`) — do not do one giant commit at the end. This directly affects the "well structured and documented codebase, commits" scoring criterion.

---

## Explicit "do not forget" checklist (cross-check before considering any phase done)
- [ ] Exactly 15 devices seeded, correct 2 fan / 3 light split per room, no duplicates on reseed
- [ ] Dashboard updates live with zero manual refresh (verify visually, don't assume)
- [ ] Alerts are timestamped and persisted, not just computed fresh each render
- [ ] After-hours alert logic actually checks real current time against 9AM–5PM
- [ ] "2+ hours continuous" alert logic uses `lastChanged`, not a fake always-true flag
- [ ] Floorplan visualization: lights glow on ON, fans animate/spin on ON
- [ ] Bot pulls from Convex, never hardcodes or randomizes responses
- [ ] Bot responses go through the LLM humanizer, not raw string concatenation
- [ ] Proactive Discord alert posting implemented and deduplicated
- [ ] Bot and dashboard both call the SAME Convex functions — no duplicated logic anywhere
- [ ] `.env.example` present, no real secrets committed
- [ ] README setup steps actually work if followed top-to-bottom on a clean checkout

## Out of scope for this agent (handled separately by the human)
Do not attempt: the system diagram image, the Wokwi/Tinkercad circuit schematic, or the video recording/editing. Leave clearly-named placeholder paths in `docs/` (e.g. `docs/system-diagram.png`, `docs/circuit-schematic.png`) referenced from the README so they're easy to drop in later.
