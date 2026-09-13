import { ActivityType, Client } from "discord.js";

interface ActivityItem {
  name: string;
  type: ActivityType;
  state?: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    name: "taskpanel.ftsduaenam.web.id",
    type: ActivityType.Watching,
  },
  {
    name: "Hello there! 👋",
    type: ActivityType.Custom,
    state: "Hello there! 👋 Semangat kuliah!",
  },
  {
    name: "/help | /jadwal | /tugas",
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
    name: "Kawal bareng IPK 4.0! 📚",
    type: ActivityType.Custom,
    state: "Kawal bareng IPK 4.0! 📚",
  },
];

export function startActivityRotator(client: Client, intervalMs = 20000) {
  let currentIndex = 0;

  const updatePresence = () => {
    if (!client.user) return;
    const item = ACTIVITIES[currentIndex];
    try {
      client.user.setPresence({
        status: "online",
        activities: [
          {
            name: item.name,
            type: item.type,
            state: item.state,
          },
        ],
      });
    } catch (err) {
      console.error("[Activity Rotator Error]", err);
    }
    currentIndex = (currentIndex + 1) % ACTIVITIES.length;
  };

  // Update presence immediately
  updatePresence();

  // Rotate activities periodically
  const intervalId = setInterval(updatePresence, intervalMs);

  return intervalId;
}
