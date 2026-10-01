import crypto from "crypto";

export function signLinkIntent(userId: string, secret: string): string {
  const expiresAt = Date.now() + 5 * 60 * 1000; // Valid for 5 minutes
  const payload = `${userId}:${expiresAt}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}:${hmac}`;
}

export function verifyLinkIntent(tokenString: string, secret: string): string | null {
  try {
    const parts = tokenString.split(":");
    if (parts.length !== 3) return null;

    const [userId, expiresAtStr, receivedHmac] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return null;
    }

    const payload = `${userId}:${expiresAtStr}`;
    const expectedHmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    const receivedBuf = Buffer.from(receivedHmac, "hex");
    const expectedBuf = Buffer.from(expectedHmac, "hex");

    if (receivedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
      return null;
    }

    return userId;
  } catch (err) {
    console.warn("[verifyLinkIntent] Verification failed:", err);
    return null;
  }
}
