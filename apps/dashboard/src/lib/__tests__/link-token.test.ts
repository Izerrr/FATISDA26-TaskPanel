import { describe, it, expect } from "vitest";
import { signLinkIntent, verifyLinkIntent } from "../link-token";

describe("link-token security utility", () => {
  const secret = "test-secret-key-12345";
  const userId = "user-abc-123";

  it("should sign and successfully verify a valid link intent token", () => {
    const token = signLinkIntent(userId, secret);
    expect(token).toBeDefined();

    const verifiedUserId = verifyLinkIntent(token, secret);
    expect(verifiedUserId).toBe(userId);
  });

  it("should reject token with incorrect secret", () => {
    const token = signLinkIntent(userId, secret);
    const verifiedUserId = verifyLinkIntent(token, "wrong-secret");
    expect(verifiedUserId).toBeNull();
  });

  it("should reject tampered userId in token payload", () => {
    const token = signLinkIntent(userId, secret);
    const parts = token.split(":");
    const tampered = `attacker-id:${parts[1]}:${parts[2]}`;

    const verifiedUserId = verifyLinkIntent(tampered, secret);
    expect(verifiedUserId).toBeNull();
  });

  it("should reject malformed tokens", () => {
    expect(verifyLinkIntent("malformed-token", secret)).toBeNull();
    expect(verifyLinkIntent("a:b", secret)).toBeNull();
    expect(verifyLinkIntent("", secret)).toBeNull();
  });

  it("should reject expired token", () => {
    // Manually construct an expired token
    const pastTime = Date.now() - 10000;
    const crypto = require("crypto");
    const payload = `${userId}:${pastTime}`;
    const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const expiredToken = `${payload}:${hmac}`;

    expect(verifyLinkIntent(expiredToken, secret)).toBeNull();
  });
});
