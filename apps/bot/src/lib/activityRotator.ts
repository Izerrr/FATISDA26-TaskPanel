import { ActivityType, Client } from "discord.js";

export interface ActivityItem {
  name: string;
  type: ActivityType;
}

export const ACTIVITIES: ActivityItem[] = [
  {
    name: "taskpanel.ftsduaenam.web.id",
    type: ActivityType.Watching,
  },
  {
    name: "Hello there! 👋 | /help",
    type: ActivityType.Playing,
  },
  {
    name: "Jadwal & Tugas FATISDA '26",
    type: ActivityType.Watching,
  },
  {
    name: "Diskusi Mahasiswa FATISDA",
    type: ActivityType.Listening,
  },
  {
    name: "TaskPanel v3.0 Web App",
    type: ActivityType.Playing,
  },
  {
    name: "IPK 4.0 FATISDA UNS 2026 🎓",
    type: ActivityType.Competing,
  },
  {
    name: "/jadwal & /tugas",
    type: ActivityType.Listening,
  },
];

export function startActivityRotator(client: Client, intervalMs = 20000) {
  let currentIndex = 0;

  const updatePresence = () => {
    if (!client.user) return;
    const item = ACTIVITIES[currentIndex];
    try {
      client.user.setActivity(item.name, { type: item.type });
      console.log(`[Presence] Set activity: ${ActivityType[item.type]} "${item.name}"`);
    } catch (err) {
      console.error("[Activity Rotator Error]", err);
    }
    currentIndex = (currentIndex + 1) % ACTIVITIES.length;
  };

  // Set initial activity immediately
  updatePresence();

  // Rotate periodically
  const intervalId = setInterval(updatePresence, intervalMs);

  return intervalId;
}
