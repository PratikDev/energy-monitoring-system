<p align="center">
  <img src="docs/hero-banner.png" alt="Energy Monitoring System — Real-time Office Power Intelligence" width="100%" />
</p>

<p align="center">
  <strong>A live office energy dashboard and Discord bot that share a single real-time backend.</strong><br/>
  Monitor every light and fan, track power consumption, and get intelligent alerts — all from your browser or Discord.
</p>

<p align="center">
  <a href="https://ems-ptsd.vercel.app/">
    <img src="https://img.shields.io/badge/Live_Dashboard-ems--ptsd.vercel.app-000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Dashboard" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Convex-1.42-EE792D?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0id2hpdGUiLz48L3N2Zz4=&logoColor=white" alt="Convex" />
  <img src="https://img.shields.io/badge/Discord.js-14-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord.js" />
  <img src="https://img.shields.io/badge/Gemini-2.5_Flash-8E75B2?style=flat-square&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Bun-1.3-F9F1E1?style=flat-square&logo=bun&logoColor=black" alt="Bun" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## ✨ Features at a Glance

| | Feature | Description |
|---|---|---|
| 🏢 | **Interactive Office Floorplan** | Top-view SVG layout with 3 rooms, desks, and chairs. Fans spin when ON, lights glow warm when ON. Updates in real time. |
| 📊 | **Live Device Status** | All 15 devices (2 fans + 3 lights × 3 rooms) with ON/OFF badges, live wattage, and last-changed timestamps. |
| ⚡ | **Power Consumption Meter** | Total office watts + per-room breakdown with percentage bars. Estimated kWh today via trapezoidal integration. |
| 🚨 | **Smart Alerts** | Detects devices left on after office hours (9 AM–5 PM) and rooms with all devices on for 2+ hours continuously. |
| 🤖 | **Discord Bot** | `!status`, `!room`, `!usage` commands with Gemini-humanized conversational responses and deterministic fallback. |
| 📢 | **Proactive Alert Posts** | Bot automatically posts to a Discord channel when alert conditions trigger — no one needs to ask. |

---

## 📸 Dashboard Preview

<table>
  <tr>
    <td colspan="2" align="center">
      <img src="docs/Office floorplan.png" alt="Interactive office floorplan showing 3 rooms with spinning fans and glowing lights" width="100%" />
      <br/><em>Interactive office floorplan — fans spin, lights glow, tooltips show device details</em>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="docs/Device cards.png" alt="Device status cards organized by room showing ON/OFF state and wattage" width="100%" />
      <br/><em>Device status cards — every device identified with live wattage and timestamps</em>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/Power now and Estimated usage.png" alt="Power consumption showing 394W current draw and 1.941 kWh estimated today" width="100%" />
      <br/><em>Live power consumption + estimated kWh today</em>
    </td>
    <td align="center" width="50%">
      <img src="docs/Room Breakdown.png" alt="Per-room power breakdown with percentage bars" width="100%" />
      <br/><em>Per-room power breakdown with share percentages</em>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="docs/Alerts.png" alt="Active alerts panel showing all-clear state" width="60%" />
      <br/><em>Active alerts panel — timestamped anomaly detection</em>
    </td>
  </tr>
</table>

---

## 🏗️ System Architecture

The web dashboard and the Discord bot share a **single Convex backend** — one source of truth for all device state, power logs, and alerts.

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Simulator   │────▶│  Convex Backend   │◀────│  Discord Bot     │
│  (Cron 3s)   │     │  (Source of Truth)│     │  (Gemini + HTTP) │
└──────────────┘     └────────┬─────────┘     └──────────────────┘
                              │ WebSocket
                     ┌────────▼─────────┐
                     │  React Dashboard  │
                     │  (Vite + Vercel)  │
                     └──────────────────┘
```

The full system diagram (Excalidraw) is available here: [**System Diagram →**](docs/system-diagram.svg)

### Shared Query Functions

Both the dashboard and Discord bot consume the exact same Convex queries:

| Query | Returns |
|---|---|
| `office:getAllDevices` | All 15 devices grouped by room with summary stats |
| `office:getRoomStatus` | Single room detail with human-readable summary text |
| `office:getUsageSummary` | Total watts, per-room watts, estimated kWh today |
| `office:getActiveAlerts` | Unresolved alerts, newest first |

---

## 🔄 How the Simulation Works

The office data is simulated entirely inside Convex — no external processes needed.

**Seeding:** The seed function creates 15 devices across 3 rooms (Drawing Room, Work Room 1, Work Room 2). Each room gets 2 fans (~60W rated) and 3 lights (~15W rated).

**Simulation tick:** A Convex cron runs `simulatorTick` every **3 seconds**. Each tick:
1. Randomly flips 0–3 devices (weighted: 55% flip none, 25% flip one, 15% flip two, 5% flip three).
2. A 5% "bias" chance turns on up to 2 devices in a random room — naturally creating sustained-usage alert conditions over time.
3. When a device turns on, its watt draw is set to its rated wattage ±5% jitter. When off, watts drop to 0.
4. Logs total watts to `powerLog` for kWh estimation.
5. Evaluates alert conditions and creates/resolves alerts.

**Alerts are auto-managed:** New alerts are deduplicated by condition. When a condition clears, the alert is resolved automatically.

**Demo controls:** The `forceAlertState` mutation (gated behind `ENABLE_DEMO_CONTROLS` env flag) can instantly trigger a sustained-room alert by turning all devices on in a room and backdating their timestamps by 2+ hours.

---

## 🚀 Quick Start

### Dashboard

The dashboard is **already hosted** — no setup required:

👉 **https://ems-ptsd.vercel.app/**

### Discord Bot

Run a single command:

```bash
make bot
```

If `make` is unavailable:

```bash
node scripts/setup-bot-env.mjs && docker compose up --build bot
```

The setup prompts for your Discord bot token, alert channel ID, and Gemini API key. The hosted Convex URL is pre-filled — **no Convex setup needed**.

Expected output on success:

```
Office energy bot is online as <bot-name>.
```

> **Prerequisites:** [Docker](https://docs.docker.com/get-docker/) and [Node.js](https://nodejs.org/) must be installed.

---

<details>
<summary><h2>🤖 Full Discord Bot Setup Guide</h2></summary>

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and name it (e.g., `Office Energy Monitor`).
3. Go to **Bot** → click **Add Bot** if needed.
4. Copy or reset the token — save it for the setup prompt.

> ⚠️ Never commit your bot token. The setup stores it in the git-ignored `bot/.env` file.

### 2. Enable Message Content Intent

The bot uses prefix commands (`!status`), which require Discord's privileged Message Content Intent.

1. In the Developer Portal → **Bot** section.
2. Enable **Message Content Intent**.
3. Save changes.

### 3. Invite the Bot to Your Server

1. Go to **OAuth2 → URL Generator**.
2. Under **Scopes**, select `bot`.
3. Under **Bot Permissions**, select:
   - `View Channels`
   - `Send Messages`
   - `Read Message History`
4. Copy the generated URL → open in browser → choose server → authorize.

### 4. Find the Alert Channel ID

1. In Discord → **User Settings → Advanced → Enable Developer Mode**.
2. Right-click the channel for alert posts → **Copy Channel ID**.

### 5. Run the Bot

```bash
make bot
```

First run creates `bot/.env` from `bot/.env.example` and prompts for:

| Variable | Required | Default | Purpose |
|---|:---:|---|---|
| `CONVEX_URL` | Yes | pre-filled | Hosted Convex deployment |
| `DISCORD_BOT_TOKEN` | Yes | — | Discord bot login token |
| `DISCORD_ALERT_CHANNEL_ID` | Yes | — | Channel for proactive alerts |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | — | Gemini humanized responses |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |
| `BOT_COMMAND_PREFIX` | No | `!` | Prefix for bot commands |
| `ALERT_POLL_INTERVAL_MS` | No | `30000` | Alert polling interval (ms) |

If `bot/.env` already exists, the setup reuses it without prompting. Delete it to reconfigure.

### 6. Test Commands

```
!status          → whole-office device summary
!room drawing    → Drawing Room detail
!room work1      → Work Room 1 detail
!room work2      → Work Room 2 detail
!room work room 2 → also works (flexible aliases)
!room invalid    → helpful room list
!usage           → current watts + estimated kWh today
!unknown         → command help
```

</details>

---

## 🗂️ Project Structure

```
energy-monitoring-system/
├── src/                          # React dashboard (Vite)
│   ├── features/dashboard/       # Dashboard page, panels, floorplan
│   │   ├── components/           # DeviceStatusPanel, PowerSummaryPanel, AlertsPanel
│   │   ├── floorplan/            # CeilingFan, CeilingLamp, FloorplanDevice SVGs
│   │   ├── hooks/                # useDashboardData (Convex subscriptions)
│   │   └── lib/                  # Formatters, floorplan layout config
│   ├── components/ui/            # shadcn/ui primitives
│   └── lib/                      # Shared utilities
├── convex/                       # Convex backend (single source of truth)
│   ├── schema.ts                 # devices, powerLog, alerts tables
│   ├── office.ts                 # Query functions (shared by dashboard + bot)
│   ├── simulator.ts              # Simulation tick logic
│   ├── alerts.ts                 # Alert evaluation and lifecycle
│   ├── seed.ts                   # Device seeding (15 devices)
│   ├── crons.ts                  # 3-second simulator cron
│   ├── domain.ts                 # Room IDs, device types, alert types
│   └── time.ts                   # Timezone-aware office hours
├── bot/                          # Discord bot (Bun workspace)
│   └── src/
│       ├── commands/             # status, room, usage handlers
│       ├── alerts/               # Proactive alert polling loop
│       ├── llm/                  # Gemini humanization + fallback
│       ├── convex/               # Convex HTTP client wrappers
│       ├── config/               # Environment + bot config
│       └── lib/                  # Room aliases, formatters, text safety
├── docs/                         # Diagrams and screenshots
├── scripts/                      # Bot env setup script
├── Dockerfile.bot                # Docker image for the bot
├── docker-compose.yml            # Docker Compose for bot service
└── Makefile                      # make bot / bot-stop / bot-logs
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 8, TypeScript 6 | Dashboard SPA |
| **Styling** | Tailwind CSS 4, shadcn/ui, Radix UI | Component library + design system |
| **Backend** | Convex | Real-time database, queries, mutations, crons |
| **Bot Runtime** | Discord.js 14, Bun | Prefix commands, gateway events |
| **AI** | Gemini 2.5 Flash (via Vercel AI SDK) | Humanized bot responses |
| **Hosting** | Vercel (dashboard), Convex Cloud (backend) | Production deployment |
| **Bot Infra** | Docker Compose | One-command bot setup |
| **Font** | Inter Variable | Typography |

---

## 📜 Available Scripts

```bash
# Dashboard
bun run dev               # Start Vite dev server
bun run build             # TypeScript check + production build
bun run lint              # ESLint across the repo

# Discord Bot
make bot                  # Prompt for env if needed, then Docker run
make bot-stop             # Stop Docker bot
make bot-logs             # Follow Docker bot logs

# Convex
bun run convex            # Run Convex dev server once
```

---

## 📄 License

This project was built as a demonstration for an office energy monitoring challenge.
