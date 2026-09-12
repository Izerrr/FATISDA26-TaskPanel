import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { ExtendedClient } from "../types.js";

export async function loadEvents(client: ExtendedClient) {
  const eventsPath = path.join(__dirname, "..", "events");
  if (!fs.existsSync(eventsPath)) return;

  const folders = fs.readdirSync(eventsPath);

  for (const folder of folders) {
    const folderPath = path.join(eventsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const eventFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of eventFiles) {
      const filePath = path.join(folderPath, file);
      const eventModule = await import(pathToFileURL(filePath).href);

      // Pengecekan ekstra lapis untuk nangkep berbagai gaya export
      const event = eventModule.default?.default || eventModule.default || eventModule.event || eventModule;

      const eventName = event?.name || event?.eventName || file.replace(/\.(ts|js)$/, "");
      const execFunc = event?.execute || event?.run;

      if (eventName && typeof execFunc === "function") {
        if (event.once) {
          client.once(eventName, (...args) => execFunc(...args, client));
        } else {
          client.on(eventName, (...args) => execFunc(...args, client));
        }
        console.log(`✅ Loaded event: [${folder}] ${eventName}`);
      } else {
        console.warn(`⚠️  Skipping ${filePath} — missing "name" or "execute" export.`);
      }
    }
  }
}
