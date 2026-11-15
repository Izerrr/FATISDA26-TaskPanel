import crypto from "node:crypto";

const globalForAuthSecret = globalThis as unknown as {
  __fatisdaEphemeralAuthSecret?: string;
};

/**
 * Resolves the NextAuth / JWT / HMAC signing secret consistently.
 * In production runtime, fails fast if NEXTAUTH_SECRET is unset instead of using a predictable fallback.
 * In local development, tests, or Next.js build static analysis, generates an ephemeral per-process secret.
 */
export function getAuthSecret(): string {
  const configured = process.env.NEXTAUTH_SECRET?.trim();
  if (configured) {
    return configured;
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    throw new Error(
      "[Security] NEXTAUTH_SECRET environment variable must be configured in production.",
    );
  }

  if (!globalForAuthSecret.__fatisdaEphemeralAuthSecret) {
    globalForAuthSecret.__fatisdaEphemeralAuthSecret = crypto.randomBytes(32).toString("hex");
  }

  return globalForAuthSecret.__fatisdaEphemeralAuthSecret;
}
