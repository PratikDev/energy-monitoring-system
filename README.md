# Energy Monitoring System

Energy Monitoring System is a live office monitoring demo for lights, fans, power usage, and alerts. The hosted dashboard shows live Convex-backed telemetry, and the Discord bot lets users ask for the same data from a Discord server.

The system uses one Convex source of truth. The dashboard and bot read the same device, usage, and alert data. The bot uses Gemini only to humanize already-computed data; it does not calculate or invent office state.

## Live Dashboard

The dashboard is already hosted at https://ems-ptsd.vercel.app/.

You do not need to run the dashboard or Convex locally to test the Discord bot.

## Discord Bot Setup

### 1. Create a Discord application and bot

1. Go to https://discord.com/developers/applications
2. Click **New Application**.
3. Name it, for example `Office Energy Monitor`.
4. Open the app.
5. Go to **Bot**.
6. Click **Add Bot** if needed.
7. Copy or reset the token.
8. Save it as `DISCORD_BOT_TOKEN`.

Never commit your Discord bot token. Put it in `.env.local`.

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
6. Save it as `DISCORD_ALERT_CHANNEL_ID`.

This channel ID is only for proactive alert posts. Commands work without `DISCORD_ALERT_CHANNEL_ID`.

### 5. Configure environment variables

Create a root `.env.local` file:

```env
# Required: hosted Convex deployment used by the bot
CONVEX_URL=https://your-convex-deployment.convex.cloud

# Required: Discord bot login token
DISCORD_BOT_TOKEN=your_discord_bot_token

# Optional but recommended: channel for proactive alert posts
DISCORD_ALERT_CHANNEL_ID=your_discord_channel_id

# Optional: Gemini humanized responses
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Optional defaults
BOT_COMMAND_PREFIX=!
ALERT_POLL_INTERVAL_MS=30000
```

Notes:

- `CONVEX_URL` can also be supplied as `VITE_CONVEX_URL`.
- `GOOGLE_GENERATIVE_AI_API_KEY` is optional.
- Without a Gemini key, the bot still works and uses plain factual fallback responses.
- `ALERT_POLL_INTERVAL_MS` is clamped to at least `10000`.
- `BOT_COMMAND_PREFIX` defaults to `!`.

### 6. Install dependencies

This repo uses Bun as its package manager.

```bash
bun install
```

### 7. Run the bot

Development mode:

```bash
bun run bot:dev
```

Normal start:

```bash
bun run bot:start
```

Expected successful output:

```text
Office energy bot is online as <bot-name>.
```

### 8. Test bot commands

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

### 9. Test proactive alerts

If you have Convex CLI access to the deployment and demo controls are enabled, you can force a test alert:

```bash
bunx convex run simulator:forceAlertState '{"room":"work2"}'
bunx convex run alerts:evaluateAlerts
```

Expected behavior:

- The bot posts one new alert message in `DISCORD_ALERT_CHANNEL_ID`.
- Existing alerts present before bot startup are marked seen and are not posted.
- New alert IDs are posted only once during the current bot process.

If you do not have Convex CLI access, you can still test normal commands. Proactive alert posting will work whenever the hosted backend creates a new active alert.

## Bot Environment Variables

| Variable | Required | Default | Purpose |
|---|---:|---|---|
| `CONVEX_URL` | Yes | fallback to `VITE_CONVEX_URL` | Hosted Convex deployment URL |
| `DISCORD_BOT_TOKEN` | Yes | none | Discord bot login token |
| `DISCORD_ALERT_CHANNEL_ID` | No | none | Channel for proactive alerts |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | none | Enables Gemini humanized responses |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |
| `BOT_COMMAND_PREFIX` | No | `!` | Prefix for bot commands |
| `ALERT_POLL_INTERVAL_MS` | No | `30000` | Alert polling interval |

## Troubleshooting

### Bot does not come online

- `DISCORD_BOT_TOKEN` is set.
- token has not been reset after copying.
- bot was invited to the server.
- `bun run bot:dev` is running.

### Bot ignores `!status`

- Message Content Intent is enabled in Developer Portal.
- bot has channel visibility.
- command prefix matches `BOT_COMMAND_PREFIX`.
- bot is not being tested in a channel it cannot read.

### Bot replies, but proactive alerts do not post

- `DISCORD_ALERT_CHANNEL_ID` is set.
- channel ID was copied with Developer Mode.
- bot has `View Channels` and `Send Messages` permission in that channel.
- active alerts that existed before startup are intentionally marked seen.
- trigger a new alert after the bot starts.

### Gemini responses are not humanized

- `GOOGLE_GENERATIVE_AI_API_KEY` is set.
- `GEMINI_MODEL` is valid.
- fallback responses are expected when the key is missing or Gemini fails.

### Convex connection error

- `CONVEX_URL` is set to the hosted Convex deployment URL.
- if using `VITE_CONVEX_URL` fallback, it points to the same deployment.
- hosted backend is reachable.

## Available Scripts

```bash
bun run bot:dev        # Run bot with watch mode
bun run bot:start      # Run bot once
bun run bot:typecheck  # Typecheck bot package
bun run lint           # Lint repo
bun run build          # Build hosted dashboard app
```

`bun run build` is not required just to run the bot. It is useful for final repo validation.

## Architecture Note

The Discord bot does not calculate office state itself. It calls the same Convex query functions used by the hosted dashboard:

- `office:getAllDevices`
- `office:getRoomStatus`
- `office:getUsageSummary`
- `office:getActiveAlerts`

Gemini only rewrites already-computed data into friendlier language. If Gemini is unavailable, the bot falls back to plain deterministic responses using the same Convex data.
