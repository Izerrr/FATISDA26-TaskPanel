import { describe, expect, it } from "vitest";
import { extractMentionUsernames, splitTextWithMentions } from "../mentions";

describe("mentions helpers", () => {
  it("extracts unique lowercase usernames without leading @ or trailing dots", () => {
    const text = "Halo @budi.santoso dan @Ani_26, tolong cek materi dari @budi.santoso ya.";
    expect(extractMentionUsernames(text)).toEqual(["budi.santoso", "ani_26"]);
  });

  it("ignores single-character handles and returns empty array for blank strings", () => {
    expect(extractMentionUsernames("")).toEqual([]);
    expect(extractMentionUsernames("Cek @a dan emailnya")).toEqual([]);
  });

  it("splits text into plain and mention segments cleanly", () => {
    const segments = splitTextWithMentions("Tolong @fajar12 bantu review.");
    expect(segments).toEqual([
      { text: "Tolong ", isMention: false },
      { text: "@fajar12", isMention: true },
      { text: " bantu review.", isMention: false },
    ]);
  });
});
