# Convex Backend — Energy Monitoring System

This directory contains the entire Convex backend for the energy monitoring system.

## Structure

| File | Purpose |
|---|---|
| `schema.ts` | Database schema — `devices`, `powerLog`, `alerts` tables |
| `office.ts` | Query functions consumed by both the dashboard and Discord bot |
| `simulator.ts` | Simulation tick — flips devices, logs power, triggers alerts |
| `alerts.ts` | Alert condition evaluation and lifecycle management |
| `seed.ts` | Seeds 15 devices across 3 rooms |
| `crons.ts` | 3-second simulator cron schedule |
| `domain.ts` | Room IDs, device types, alert type definitions |
| `time.ts` | Timezone-aware office hours helper |

## Key Design Decision

Both the React dashboard and the Discord bot call the **same query functions** in `office.ts` over HTTP. This guarantees one source of truth — no duplicate logic, no sync bugs.

## Development

```bash
bun run convex          # Push functions once
bun run convex:watch    # Watch mode (auto-push on changes)
bun run convex:dash     # Open Convex dashboard
```

Deploy with:

```bash
bun run convex:deploy
```
