import type { AppNotification, Application, ChatItem } from "../types/types";
import {
  getChatItems,
  getNotifState,
  getStoredApplications,
  markNotificationsRead,
  type NotifState,
} from "./db";

export interface NotificationViewer {
  id: string;
  isAdmin: boolean;
}

export function buildNotifications(params: {
  applications: Pick<Application, "id" | "title" | "authorId">[];
  items: ChatItem[];
  me: NotificationViewer;
  state: NotifState;
}): AppNotification[] {
  const { applications, items, me, state } = params;
  const byId = new Map(applications.map((a) => [a.id, a]));
  const since = Date.parse(state.since);
  const read = new Set(state.read);
  const result: AppNotification[] = [];

  for (const item of items) {
    if (item.authorId === me.id) continue;
    const application = byId.get(item.applicationId);
    if (!application) continue;
    if (!me.isAdmin && application.authorId !== me.id) continue;
    if (Date.parse(item.createdAt) < since) continue;

    const base = {
      id: item.id,
      applicationId: application.id,
      applicationTitle: application.title,
      actorName: item.authorName,
      createdAt: item.createdAt,
      read: read.has(item.id),
    };

    if (item.type === "message") {
      result.push({ ...base, kind: "message_created", text: item.text });
    } else if (item.previousStatus === undefined) {
      result.push({ ...base, kind: "application_created", status: item.status });
    } else {
      result.push({
        ...base,
        kind: "status_changed",
        status: item.status,
        previousStatus: item.previousStatus,
      });
    }
  }

  return result.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function markApplicationNotificationsRead(
  me: NotificationViewer,
  applicationId: string,
) {
  const state = getNotifState(me.id);
  if (!state) return;

  const ids = buildNotifications({
    applications: getStoredApplications(),
    items: getChatItems(),
    me,
    state,
  })
    .filter((n) => !n.read && n.applicationId === applicationId)
    .map((n) => n.id);

  markNotificationsRead(me.id, ids);
}