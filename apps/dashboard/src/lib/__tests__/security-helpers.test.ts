import { describe, it, expect, afterEach } from "vitest";
import { canAccessTask } from "../task-access";
import { normalizeSafeHttpUrl, sanitizeVaultExtraLinks } from "../url-safety";
import { getAuthSecret } from "../auth-secret";

describe("canAccessTask (IDOR guard)", () => {
  it("allows PERSONAL task creator and assignee only", () => {
    const task = { scope: "PERSONAL", createdById: "u1", assignedTo: "u2", members: [] };
    expect(canAccessTask(task, "u1")).toBe(true);
    expect(canAccessTask(task, "u2")).toBe(true);
    expect(canAccessTask(task, "u3")).toBe(false);
  });

  it("allows GROUP task creator and members only", () => {
    const task = {
      scope: "GROUP",
      createdById: "leader-1",
      assignedTo: null,
      members: [{ userId: "member-1" }, { userId: "member-2" }],
    };
    expect(canAccessTask(task, "leader-1")).toBe(true);
    expect(canAccessTask(task, "member-2")).toBe(true);
    expect(canAccessTask(task, "outsider")).toBe(false);
  });

  it("allows authenticated users for CLASS tasks and rejects empty userId", () => {
    const task = { scope: "CLASS", createdById: "pj-1", members: [] };
    expect(canAccessTask(task, "student-9")).toBe(true);
    expect(canAccessTask(task, "")).toBe(false);
  });
});

describe("url-safety (XSS / dangerous URI guard)", () => {
  it("normalizes bare domains to https and preserves valid http/https URLs", () => {
    expect(normalizeSafeHttpUrl("drive.google.com/folder/123")).toBe("https://drive.google.com/folder/123");
    expect(normalizeSafeHttpUrl("https://uns.ac.id/path?q=1")).toBe("https://uns.ac.id/path?q=1");
    expect(normalizeSafeHttpUrl("http://localhost:3000")).toBe("http://localhost:3000/");
  });

  it("rejects javascript, data, vbscript, protocol-relative, and blank URLs", () => {
    expect(normalizeSafeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeSafeHttpUrl("JAVASCRIPT:alert(document.cookie)")).toBeNull();
    expect(normalizeSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(normalizeSafeHttpUrl("vbscript:msgbox(1)")).toBeNull();
    expect(normalizeSafeHttpUrl("//evil.example/payload")).toBeNull();
    expect(normalizeSafeHttpUrl("   ")).toBeNull();
    expect(normalizeSafeHttpUrl(null)).toBeNull();
  });

  it("filters unsafe extraLinks and keeps sanitized valid entries", () => {
    const result = sanitizeVaultExtraLinks([
      { id: "1", title: "XSS", url: "javascript:alert(1)", type: "OTHER" },
      { id: "2", title: "Slide Pertemuan", url: "drive.google.com/file/abc", type: "DRIVE", description: "Slide Week 1" },
      { title: "Tanpa ID", url: "https://example.com/rps.pdf", type: "INVALID_TYPE" },
      { title: "Kosong", url: "" },
    ]);

    expect(result).toEqual([
      {
        id: "2",
        title: "Slide Pertemuan",
        url: "https://drive.google.com/file/abc",
        type: "DRIVE",
        description: "Slide Week 1",
      },
      {
        id: "link-2",
        title: "Tanpa ID",
        url: "https://example.com/rps.pdf",
        type: "OTHER",
      },
    ]);
  });
});

describe("getAuthSecret", () => {
  const originalSecret = process.env.NEXTAUTH_SECRET;
  const originalEnv = process.env.NODE_ENV;
  const originalPhase = process.env.NEXT_PHASE;

  afterEach(() => {
    process.env.NEXTAUTH_SECRET = originalSecret;
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    process.env.NEXT_PHASE = originalPhase;
  });

  it("returns configured NEXTAUTH_SECRET when present", () => {
    process.env.NEXTAUTH_SECRET = "super-secret-value";
    expect(getAuthSecret()).toBe("super-secret-value");
  });

  it("throws in production runtime if NEXTAUTH_SECRET is missing", () => {
    delete process.env.NEXTAUTH_SECRET;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.NEXT_PHASE;

    expect(() => getAuthSecret()).toThrow(/NEXTAUTH_SECRET/);
  });

  it("returns ephemeral consistent secret in test/dev mode when unset", () => {
    delete process.env.NEXTAUTH_SECRET;
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    const s1 = getAuthSecret();
    const s2 = getAuthSecret();
    expect(s1).toHaveLength(64);
    expect(s1).toBe(s2);
  });
});
