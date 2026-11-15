import path from "path";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "packages/database/.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("mysql://")) {
  console.error(
    "[Bot Fatal] DATABASE_URL PostgreSQL tidak ditemukan atau masih menggunakan mysql://. Konfigurasikan DATABASE_URL di environment sebelum menjalankan bot.",
  );
  process.exit(1);
}

import { ActivityType, GatewayIntentBits } from "discord.js";
import { ExtendedClient } from "./types.js";
import { loadEvents } from "./handlers/eventHandler.js";
import { loadCommands } from "./handlers/commandHandler.js";
import { APP_URL } from "./lib/constants.js";

const client = new ExtendedClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers],
  presence: {
    status: "online",
    activities: [
      {
        name: APP_URL.replace(/^https?:\/\//, ""),
        type: ActivityType.Watching,
      },
    ],
  },
});

async function main() {
  await loadEvents(client);
  await loadCommands(client);
  await client.login(process.env.DISCORD_BOT_TOKEN);
}

main();
