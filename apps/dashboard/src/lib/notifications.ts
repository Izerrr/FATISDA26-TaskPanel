import * as webpush from "web-push";
import { prisma } from "./prisma";
import { extractMentionUsernames } from "./mentions";
import { isMissingTableError } from "./task-access";

export type NotificationType =
  | "GROUP_INVITE"
  | "TASK_COMMENT"
  | "DISCUSSION_REPLY"
  | "MENTION"
  | "VAULT_APPROVED"
  | "VAULT_REJECTED";

export interface NotifyUsersPayload {
  recipientIds: string[];
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
}

export function getPublicVapidKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  return key?.trim() || null;
}

export function isWebPushConfigured(): boolean {
  const pub = getPublicVapidKey();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  return Boolean(pub && priv);
}

/**
 * Resolves @username mentions in user-authored text to existing User IDs.
 */
export async function resolveUserIdsByMentions(text: string): Promise<string[]> {
  const usernames = extractMentionUsernames(text);
  if (usernames.length === 0) return [];

  const matched = await prisma.user.findMany({
    where: {
      OR: usernames.map((u) => ({
        username: { equals: u, mode: "insensitive" },
      })),
    },
    select: { id: true },
    take: 10,
  });

  return matched.map((u) => u.id);
}

/**
 * Persists in-app notifications and triggers optional Web Push notifications
 * without letting notification delivery issues break primary API mutations.
 */
export async function notifyUsers(payload: NotifyUsersPayload): Promise<{ created: number; pushed: number }> {
  const targets = Array.from(new Set(payload.recipientIds.filter((id) => Boolean(id) && id !== payload.actorId)));
  if (targets.length === 0) {
    return { created: 0, pushed: 0 };
  }

  let created = 0;
  try {
    const result = await prisma.notification.createMany({
      data: targets.map((userId) => ({
        userId,
        type: payload.type,
        title: payload.title.slice(0, 120),
        body: payload.body.slice(0, 280),
        href: payload.href ?? null,
      })),
    });
    created = result.count;
  } catch (err) {
    if (!isMissingTableError(err)) {
      console.error("[notifyUsers] createMany error:", err);
    }
    return { created: 0, pushed: 0 };
  }

  const publicKey = getPublicVapidKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) {
    return { created, pushed: 0 };
  }

  let pushed = 0;
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: targets } },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    if (subscriptions.length === 0) {
      return { created, pushed: 0 };
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT?.trim() || "mailto:admin@ftsduaenam.web.id",
      publicKey,
      privateKey,
    );

    const pushBody = JSON.stringify({
      title: payload.title.slice(0, 120),
      body: payload.body.slice(0, 220),
      href: payload.href || "/dashboard",
      tag: `fatisda-${payload.type.toLowerCase()}`,
    });

    const expiredIds: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            pushBody,
          );
          pushed += 1;
        } catch (err) {
          const statusCode =
            err && typeof err === "object" && "statusCode" in err
              ? Number((err as { statusCode?: number }).statusCode)
              : undefined;
          if (statusCode === 404 || statusCode === 410) {
            expiredIds.push(sub.id);
          }
        }
      }),
    );

    if (expiredIds.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: expiredIds } },
      }).catch(() => {});
    }
  } catch (err) {
    if (!isMissingTableError(err)) {
      console.error("[notifyUsers] web-push error:", err);
    }
  }

  return { created, pushed };
}
