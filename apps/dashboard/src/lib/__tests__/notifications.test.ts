import { afterEach, describe, expect, it } from "vitest";
import { getPublicVapidKey, isWebPushConfigured } from "../notifications";

const ORIG_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const ORIG_NEXT_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const ORIG_PRIVATE = process.env.VAPID_PRIVATE_KEY;

afterEach(() => {
  if (ORIG_PUBLIC === undefined) delete process.env.VAPID_PUBLIC_KEY;
  else process.env.VAPID_PUBLIC_KEY = ORIG_PUBLIC;

  if (ORIG_NEXT_PUBLIC === undefined) delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  else process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = ORIG_NEXT_PUBLIC;

  if (ORIG_PRIVATE === undefined) delete process.env.VAPID_PRIVATE_KEY;
  else process.env.VAPID_PRIVATE_KEY = ORIG_PRIVATE;
});

describe("notifications VAPID config", () => {
  it("reports disabled when VAPID keys are missing", () => {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;

    expect(getPublicVapidKey()).toBeNull();
    expect(isWebPushConfigured()).toBe(false);
  });

  it("accepts NEXT_PUBLIC_VAPID_PUBLIC_KEY fallback when paired with VAPID_PRIVATE_KEY", () => {
    delete process.env.VAPID_PUBLIC_KEY;
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "BTestPublicKey123";
    process.env.VAPID_PRIVATE_KEY = "TestPrivateKey123";

    expect(getPublicVapidKey()).toBe("BTestPublicKey123");
    expect(isWebPushConfigured()).toBe(true);
  });
});
