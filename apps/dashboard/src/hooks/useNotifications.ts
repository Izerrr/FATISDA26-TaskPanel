"use client";

import useSWR from "swr";

export type NotificationType =
  | "GROUP_INVITE"
  | "TASK_COMMENT"
  | "MENTION"
  | "DISCUSSION_REPLY"
  | "VAULT_APPROVED"
  | "VAULT_REJECTED"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  body: string;
  href?: string | null;
  actorId?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

const fetcher = async (url: string): Promise<NotificationsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Gagal memuat notifikasi");
  }
  return res.json();
};

export function useNotifications(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    enabled ? "/api/notifications" : null,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  async function markRead(ids?: string[], all = false) {
    if (!all && (!ids || ids.length === 0)) return;

    // Optimistic update
    await mutate(
      (prev) => {
        if (!prev) return prev;
        const idSet = new Set(ids ?? []);
        const updated = prev.notifications.map((n) =>
          all || idSet.has(n.id) ? { ...n, isRead: true } : n
        );
        const nextUnread = updated.filter((n) => !n.isRead).length;
        return { notifications: updated, unreadCount: nextUnread };
      },
      { revalidate: false }
    );

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(all ? { all: true } : { ids }),
      });
    } finally {
      await mutate();
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    isError: Boolean(error),
    markRead,
    mutate,
  };
}
