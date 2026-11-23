import { describe, expect, it } from "vitest";
import { ACCESSED_USER_WHERE, partitionDiscordGuildMembers } from "../analytics-filters";

describe("analytics-filters", () => {
  it("excludes raw discordId from ACCESSED_USER_WHERE so unsynced guild members do not inflate analytics", () => {
    const serialized = JSON.stringify(ACCESSED_USER_WHERE);
    expect(serialized).toContain("hasAccessedApp");
    expect(serialized).toContain("lastActiveAt");
    expect(serialized).toContain("lastLoginAt");
    expect(serialized).toContain("googleId");
    expect(serialized).toContain("email");
    expect(serialized).not.toContain("discordId");
  });

  it("separates Discord bots from human guild members", () => {
    const result = partitionDiscordGuildMembers([
      { user: { id: "1", bot: false } },
      { user: { id: "2", bot: true } },
      { user: { id: "3" } },
      { user: null },
    ]);

    expect(result.humanMembers.map((m) => m.user?.id)).toEqual(["1", "3"]);
    expect(result.botIds).toEqual(["2"]);
  });
});
