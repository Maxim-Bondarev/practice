import {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { AppNotification, Application, ChatItem } from "../types/types";
import {
  getChatItems,
  getNotifState,
  getStoredApplications,
  initNotifState,
  markNotificationsRead,
  subscribe,
  type StoredApplication,
} from "./db";
import { buildNotifications, type NotificationViewer } from "./notifications";

function withStats(
  stored: StoredApplication[],
  items: ChatItem[],
): Application[] {
  const stats = new Map<string, { count: number; last: string | null }>();

  for (const item of items) {
    if (item.type !== "message") continue;
    const s = stats.get(item.applicationId) ?? { count: 0, last: null };
    s.count += 1;
    if (!s.last || item.createdAt > s.last) s.last = item.createdAt;
    stats.set(item.applicationId, s);
  }

  return stored.map((a) => ({
    ...a,
    messagesCount: stats.get(a.id)?.count ?? 0,
    lastMessageAt: stats.get(a.id)?.last ?? null,
  }));
}

export function useApplications(): Application[] {
  const stored = useSyncExternalStore(subscribe, getStoredApplications);
  const items = useSyncExternalStore(subscribe, getChatItems);
  return useMemo(() => withStats(stored, items), [stored, items]);
}

export function useApplication(id: string | undefined): Application | undefined {
  const applications = useApplications();
  return useMemo(
    () => applications.find((a) => a.id === id),
    [applications, id],
  );
}

export function useChatItems(applicationId: string): ChatItem[] {
  const all = useSyncExternalStore(subscribe, getChatItems);
  return useMemo(
    () =>
      all
        .filter((i) => i.applicationId === applicationId)
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
    [all, applicationId],
  );
}

const EMPTY_NOTIFICATIONS: AppNotification[] = [];

export function useNotifications(viewer: NotificationViewer | null) {
  const userId = viewer?.id ?? null;
  const isAdmin = viewer?.isAdmin ?? false;

  const state = useSyncExternalStore(subscribe, () =>
    userId ? getNotifState(userId) : null,
  );
  const applications = useSyncExternalStore(subscribe, getStoredApplications);
  const items = useSyncExternalStore(subscribe, getChatItems);

  useEffect(() => {
    if (userId) initNotifState(userId);
  }, [userId]);

  const list = useMemo(() => {
    if (!userId || !state) return EMPTY_NOTIFICATIONS;
    return buildNotifications({
      applications,
      items,
      me: { id: userId, isAdmin },
      state,
    });
  }, [applications, items, userId, isAdmin, state]);

  const unread = useMemo(() => list.filter((n) => !n.read).length, [list]);

  const markRead = useCallback(
    (ids: string[]) => {
      if (userId) markNotificationsRead(userId, ids);
    },
    [userId],
  );

  const markAllRead = useCallback(() => {
    if (userId) {
      markNotificationsRead(
        userId,
        list.filter((n) => !n.read).map((n) => n.id),
      );
    }
  }, [userId, list]);

  return { list, unread, markRead, markAllRead };
}