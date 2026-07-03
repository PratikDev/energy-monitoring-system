import { Client, Events, GatewayIntentBits } from "discord.js";

import { startAlertLoop } from "./alerts/alertLoop.js";
import { handleMessage } from "./commands/handleMessage.js";
import { env } from "./config/env.js";

// Prefix commands require Discord's privileged Message Content Intent to be
// enabled for this bot in the Discord Developer Portal.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Office energy bot is online as ${readyClient.user.tag}.`);
  startAlertLoop(readyClient);
});

client.on(Events.MessageCreate, (message) => {
  void handleMessage(message);
});

await client.login(env.discordBotToken);
