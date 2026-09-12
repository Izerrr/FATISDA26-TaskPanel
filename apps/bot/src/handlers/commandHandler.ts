import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { REST, Routes } from "discord.js";
import { ExtendedClient } from "../types.js";

export async function loadCommands(client: ExtendedClient) {
  const commandsPath = path.join(__dirname, "..", "commands");
  if (!fs.existsSync(commandsPath)) return;

  const categories = fs.readdirSync(commandsPath);
  const slashCommandsData = [];

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(categoryPath).filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const commandModule = await import(pathToFileURL(filePath).href);

      // Ambil objek command dengan mengecek .default ataupun modul langsung
      const command = commandModule.default?.default || commandModule.default || commandModule;

      // Cek apakah data & fungsi eksekusi ada
      const hasData = command && (command.data || command.name);
      const hasExec = command && (typeof command.execute === "function" || typeof command.run === "function");

      if (hasData && hasExec) {
        command.category ??= category;
        const cmdName = command.data?.name || command.name;

        client.commands.set(cmdName, command);

        if (command.data && typeof command.data.toJSON === "function") {
          slashCommandsData.push(command.data.toJSON());
        } else if (command.data) {
          slashCommandsData.push(command.data);
        }

        console.log(`✅ Loaded command: [${category}] ${cmdName}`);
      } else {
        console.warn(`⚠️  Skipping ${category}/${file} — Invalid command structure.`);
      }
    }
  }

  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);
  try {
    const clientId = process.env.DISCORD_CLIENT_ID!;
    console.log(`🔄 Registering ${slashCommandsData.length} slash commands to Discord API...`);

    // 1. Daftarkan langsung ke server (Guilds) agar langsung muncul seketika (instant, tanpa delay 1 jam)
    try {
      const guilds = (await rest.get(Routes.userGuilds())) as Array<{ id: string; name: string }>;
      for (const g of guilds) {
        console.log(`⚡ Registering instant slash commands to guild: ${g.name} (${g.id})...`);
        await rest.put(Routes.applicationGuildCommands(clientId, g.id), {
          body: slashCommandsData,
        });
      }
      console.log("✅ Guild Slash Commands registered instantly!");
    } catch (guildError) {
      console.warn("⚠️  Could not register guild-specific commands:", guildError);
    }

    // 2. Daftarkan secara Global sebagai fallback
    await rest.put(Routes.applicationCommands(clientId), {
      body: slashCommandsData,
    });
    console.log("✅ Global Slash Commands registered successfully!");
  } catch (error) {
    console.error("❌ Failed to register commands:", error);
  }
}
