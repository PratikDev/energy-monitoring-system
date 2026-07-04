# Discord Bot

The office energy bot lives here. It connects to the same [Convex backend](../convex/) as the web dashboard — same queries, same data, zero drift.

## Commands

| Command | What it does |
|---|---|
| `!status` | Whole-office device summary across all 3 rooms |
| `!room <name>` | Single room detail — e.g. `!room work1`, `!room drawing` |
| `!usage` | Current watts + estimated kWh today |

Responses are humanized by Gemini. If the API key is missing or Gemini is down, the bot falls back to deterministic plain-text responses automatically.

## Proactive Alerts

The bot polls for new alerts every 30 seconds and posts to a configured Discord channel when:

- Devices are left on **after office hours** (outside 9 AM–5 PM)
- **All 5 devices** in a room have been on for 2+ hours straight

## Running

```bash
# From the repo root:
make bot
```

Or without Make:

```bash
node scripts/setup-bot-env.mjs && docker compose up --build bot
```

First run prompts for env vars. See the [main README](../README.md) for the full setup guide.

## Environment Variables

| Variable | Required | Default | Purpose |
|---|:---:|---|---|
| `CONVEX_URL` | Yes | pre-filled | Convex deployment URL |
| `DISCORD_BOT_TOKEN` | Yes | — | Bot login token |
| `DISCORD_ALERT_CHANNEL_ID` | Yes | — | Channel for proactive alerts |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | — | Gemini humanized responses |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |
| `BOT_COMMAND_PREFIX` | No | `!` | Command prefix |
| `ALERT_POLL_INTERVAL_MS` | No | `30000` | Alert poll interval (ms) |
