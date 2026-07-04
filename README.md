# Energy Monitoring System

Energy Monitoring System is a live office monitoring demo for lights, fans, power usage, and alerts. The hosted dashboard shows live Convex-backed telemetry, and the Discord bot lets users ask for the same data from a Discord server.

The system uses one Convex source of truth. The dashboard and bot read the same device, usage, and alert data. The bot uses Gemini only to humanize already-computed data; it does not calculate or invent office state.

## Live Dashboard

The dashboard is already hosted at https://ems-ptsd.vercel.app/.

You do not need to run the dashboard or Convex locally to test the Discord bot.

## System Diagram

The high-level system design is available here:

[System diagram](docs/system-diagram.svg)

## Quick Judge Setup

The dashboard is hosted at https://ems-ptsd.vercel.app/.

To run only the Discord bot locally:

```bash
make bot
```

If `make` is not available, run the same steps directly:

```bash
node scripts/setup-bot-env.mjs && docker compose up --build bot
```

The command will prompt for:

- `DISCORD_BOT_TOKEN`
- `DISCORD_ALERT_CHANNEL_ID`
- `ALERT_POLL_INTERVAL_MS` (defaults to `30000`)
- `GOOGLE_GENERATIVE_AI_API_KEY`

The hosted Convex URL is already included in `bot/.env.example`; judges do not need to configure Convex. Docker and Node.js must be available before you run `make bot` or the fallback command.

`make bot` creates `bot/.env` from `bot/.env.example` the first time. If `bot/.env` already exists, it reuses that file and starts Docker without prompting. To change values, delete `bot/.env` and run `make bot` again.

## Discord Bot Setup

### 1. Create a Discord application and bot

1. Go to https://discord.com/developers/applications
2. Click **New Application**.
3. Name it, for example `Office Energy Monitor`.
4. Open the app.
5. Go to **Bot**.
6. Click **Add Bot** if needed.
7. Copy or reset the token.
8. Save it for the `DISCORD_BOT_TOKEN` prompt.

Never commit your Discord bot token. The setup command stores it in ignored local file `bot/.env`.

### 2. Enable Message Content Intent

This bot uses prefix commands like `!status`, so Discord's privileged Message Content Intent must be enabled.

1. Open the app in the Discord Developer Portal.
2. Go to **Bot**.
3. Enable **Message Content Intent**.
4. Save changes.

### 3. Invite the bot to your server

1. Go to **OAuth2 -> URL Generator**.
2. Under **Scopes**, select:
   - `bot`
3. Under **Bot Permissions**, select:
   - `View Channels`
   - `Send Messages`
   - `Read Message History`
4. Copy the generated URL.
5. Open the URL in your browser.
6. Choose the server.
7. Authorize the bot.

No slash-command permissions are needed.

### 4. Find the alert channel ID

1. In Discord desktop/web, open **User Settings**.
2. Go to **Advanced**.
3. Enable **Developer Mode**.
4. Right-click the channel where alert posts should appear.
5. Click **Copy Channel ID**.
6. Save it for the `DISCORD_ALERT_CHANNEL_ID` prompt.

This channel ID is used for proactive alert posts.

### 5. Run the bot

Run:

```bash
make bot
```

If `make` is not installed:

```bash
node scripts/setup-bot-env.mjs && docker compose up --build bot
```

If `bot/.env` is missing, the setup will prompt for:

```text
DISCORD_BOT_TOKEN
DISCORD_ALERT_CHANNEL_ID
ALERT_POLL_INTERVAL_MS [30000]
GOOGLE_GENERATIVE_AI_API_KEY
```

`DISCORD_BOT_TOKEN`, `DISCORD_ALERT_CHANNEL_ID`, and `GOOGLE_GENERATIVE_AI_API_KEY` are required. `ALERT_POLL_INTERVAL_MS` is optional and defaults to `30000`; values under `10000` are raised to `10000`.

Expected successful bot output:

```text
Office energy bot is online as <bot-name>.
```

### 6. Test bot commands

Send these messages in Discord:

```text
!status
!room drawing
!room work1
!room work2
!room work room 2
!room invalid
!usage
!unknown
```

Expected behavior:

- `!status` returns whole-office live device status.
- `!room <name>` returns one room.
- `!usage` returns current watts and estimated kWh today.
- invalid room gets a helpful room list.
- unknown command gets a command help message.

## Bot Environment Variables

`make bot` writes these values to `bot/.env`. The file is local and ignored by Git.

| Variable | Required | Default | Purpose |
|---|---:|---|---|
| `CONVEX_URL` | Yes | prefilled in `bot/.env.example` | Hosted Convex deployment URL |
| `DISCORD_BOT_TOKEN` | Yes | none | Discord bot login token |
| `DISCORD_ALERT_CHANNEL_ID` | Yes | none | Channel for proactive alerts |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | none | Enables Gemini humanized responses |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |
| `BOT_COMMAND_PREFIX` | No | `!` | Prefix for bot commands |
| `ALERT_POLL_INTERVAL_MS` | No | `30000` | Alert polling interval |

## Available Scripts

```bash
make bot              # Prompt for bot env if needed, then run Docker bot
make bot-stop         # Stop Docker bot service
make bot-logs         # Follow Docker bot logs
bun run bot:dev       # Developer mode without Docker
bun run bot:start     # Run bot once without Docker
bun run bot:typecheck # Typecheck bot package
bun run lint          # Lint repo
bun run build         # Build hosted dashboard app
```

`bun run build` is not required just to run the bot. It is useful for final repo validation.

## Architecture Note

The Discord bot does not calculate office state itself. It calls the same Convex query functions used by the hosted dashboard:

- `office:getAllDevices`
- `office:getRoomStatus`
- `office:getUsageSummary`
- `office:getActiveAlerts`

Gemini only rewrites already-computed data into friendlier language. If Gemini is unavailable, the bot falls back to plain deterministic responses using the same Convex data.

## How the Simulation Works

The office data is simulated inside Convex. The seed function creates 15 devices: 3 rooms with 2 fans and 3 lights each. Every device stores its room, type, on/off status, current watt draw, rated watts, and `lastChanged` timestamp.

A Convex cron runs `simulatorTick` every 10 seconds. Each tick randomly flips a small number of devices so the office changes gradually instead of all at once. When a device turns on, its watt draw is set near its rated wattage with small jitter; when it turns off, its watt draw becomes `0`. Devices that do not change keep their existing `lastChanged` value.

After each tick, Convex writes the current total watts to `powerLog` and evaluates alerts. Alerts are persisted in the `alerts` table, deduped while active, and resolved when the condition stops being true. The dashboard subscribes to this Convex data live, and the Discord bot reads the same query functions, so both interfaces reflect the same simulated office state.

For demos, `forceAlertState` can turn all devices in one room on and backdate their `lastChanged` values so the sustained-room alert can be shown without waiting two real hours. This mutation is guarded by the `ENABLE_DEMO_CONTROLS` Convex env flag.
