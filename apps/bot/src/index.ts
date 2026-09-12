import path from "path";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "packages/database/.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Jika env masih menggunakan URL MySQL peninggalan lama, alihkan otomatis ke PostgreSQL Supabase
const FALLBACK_PG_URL = "postgresql://postgres.ummznagnzlejdknwnasy:bismillahinformatika@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("mysql://")) {
  process.env.DATABASE_URL = FALLBACK_PG_URL;
}

import { GatewayIntentBits } from "discord.js";
import { ExtendedClient } from "./types.js";
import { loadEvents } from "./handlers/eventHandler.js";
import { loadCommands } from "./handlers/commandHandler.js";

const client = new ExtendedClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers],
});

async function main() {
  await loadEvents(client);
  await loadCommands(client);
  await client.login(process.env.DISCORD_BOT_TOKEN);
}

main();
