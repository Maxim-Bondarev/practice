import { allowedTransitions } from "../domain/statuses";
import type {
  Application,
  ApplicationStatus,
  ChatAttachment,
  ChatItem,
  ChatMessage,
  Project,
  StatusEvent,
} from "../types/types";

const PREFIX = "feedback:v2:";
const APPLICATIONS_KEY = `${PREFIX}applications`;
const CHAT_KEY = `${PREFIX}chat`;
const notifKey = (userId: string) => `${PREFIX}notifications:${userId}`;

export const MAX_MESSAGE_LENGTH = 2000;

export type StoredApplication = Omit<
  Application,
  "messagesCount" | "lastMessageAt"
>;

export interface NotifState {
  since: string;
  read: string[];
}

export interface Actor {
  id: string;
  name: string;
  isAdmin: boolean;
}

const EMPTY_APPLICATIONS: StoredApplication[] = [];
const EMPTY_ITEMS: ChatItem[] = [];

export function newId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.error("localStorage недоступен или переполнен", err);
    return false;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith(PREFIX)) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readJson<T>(key: string, empty: T): T {
  const raw = safeGet(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;

  let value = empty;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = empty;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

function writeJson(key: string, value: unknown): boolean {
  const ok = safeSet(key, JSON.stringify(value));
  if (ok) emit();
  return ok;
}

export function getStoredApplications(): StoredApplication[] {
  return readJson(APPLICATIONS_KEY, EMPTY_APPLICATIONS);
}

export function getChatItems(): ChatItem[] {
  return readJson(CHAT_KEY, EMPTY_ITEMS);
}

export function getNotifState(userId: string): NotifState | null {
  return readJson<NotifState | null>(notifKey(userId), null);
}

function nextApplicationId(list: StoredApplication[]): string {
  const max = list.reduce((acc, a) => {
    const n = Number(a.id);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 1024);
  return String(max + 1);
}

export function createApplication(input: {
  title: string;
  project: Project;
  author: Pick<Actor, "id" | "name">;
}): StoredApplication | null {
  const applications = getStoredApplications();
  const now = new Date().toISOString();

  const application: StoredApplication = {
    id: nextApplicationId(applications),
    title: input.title.trim(),
    date: now,
    project: input.project,
    status: "Открыта",
    authorId: input.author.id,
    authorName: input.author.name,
  };

  const opened: StatusEvent = {
    type: "status",
    id: newId(),
    applicationId: application.id,
    authorId: input.author.id,
    authorName: input.author.name,
    status: "Открыта",
    createdAt: now,
  };

  if (!writeJson(CHAT_KEY, [...getChatItems(), opened])) return null;
  return writeJson(APPLICATIONS_KEY, [application, ...applications])
    ? application
    : null;
}

export function changeApplicationStatus(input: {
  applicationId: string;
  status: ApplicationStatus;
  actor: Actor;
}): StoredApplication | null {
  const applications = getStoredApplications();
  const application = applications.find((a) => a.id === input.applicationId);
  if (!application) return null;

  const allowed = allowedTransitions(application.status, {
    isAdmin: input.actor.isAdmin,
    isAuthor: application.authorId === input.actor.id,
  });
  if (!allowed.includes(input.status)) return null;

  const updated: StoredApplication = { ...application, status: input.status };
  const event: StatusEvent = {
    type: "status",
    id: newId(),
    applicationId: application.id,
    authorId: input.actor.id,
    authorName: input.actor.name,
    status: input.status,
    previousStatus: application.status,
    createdAt: new Date().toISOString(),
  };

  if (!writeJson(CHAT_KEY, [...getChatItems(), event])) return null;
  return writeJson(
    APPLICATIONS_KEY,
    applications.map((a) => (a.id === updated.id ? updated : a)),
  )
    ? updated
    : null;
}

export function addMessage(input: {
  applicationId: string;
  author: Actor;
  text: string;
  attachment?: ChatAttachment;
}): ChatMessage | null {
  const text = input.text.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!text && !input.attachment) return null;

  const application = getStoredApplications().find(
    (a) => a.id === input.applicationId,
  );
  if (!application) return null;
  if (!input.author.isAdmin && application.authorId !== input.author.id) {
    return null;
  }

  const message: ChatMessage = {
    type: "message",
    id: newId(),
    applicationId: input.applicationId,
    authorId: input.author.id,
    authorName: input.author.name,
    isAdmin: input.author.isAdmin ? true : undefined,
    text,
    attachment: input.attachment,
    createdAt: new Date().toISOString(),
  };

  return writeJson(CHAT_KEY, [...getChatItems(), message]) ? message : null;
}

export function initNotifState(userId: string) {
  if (getNotifState(userId) !== null) return;
  const state: NotifState = { since: new Date().toISOString(), read: [] };
  writeJson(notifKey(userId), state);
}

export function markNotificationsRead(userId: string, ids: string[]) {
  const state = getNotifState(userId);
  if (!state || ids.length === 0) return;
  const read = Array.from(new Set([...state.read, ...ids])).slice(-1000);
  writeJson(notifKey(userId), { ...state, read });
}

const DEMO_USER = { id: "seed-user", name: "demo-user" };
const SUPPORT = { id: "seed-support", name: "support" };

function seedStatus(
  id: string,
  applicationId: string,
  who: { id: string; name: string },
  status: ApplicationStatus,
  createdAt: string,
  previousStatus?: ApplicationStatus,
): StatusEvent {
  return {
    type: "status",
    id,
    applicationId,
    authorId: who.id,
    authorName: who.name,
    status,
    ...(previousStatus ? { previousStatus } : {}),
    createdAt,
  };
}

function seedMessage(
  id: string,
  applicationId: string,
  who: { id: string; name: string },
  text: string,
  createdAt: string,
  isAdmin = false,
): ChatMessage {
  return {
    type: "message",
    id,
    applicationId,
    authorId: who.id,
    authorName: who.name,
    ...(isAdmin ? { isAdmin: true } : {}),
    text,
    createdAt,
  };
}

const SEED_APPLICATIONS: StoredApplication[] = [
  {
    id: "1024",
    title: "Не приходит код",
    date: "2026-05-12T09:00:00.000Z",
    project: "1X",
    status: "Открыта",
    authorId: DEMO_USER.id,
    authorName: DEMO_USER.name,
  },
  {
    id: "1021",
    title: "Ошибка оплаты",
    date: "2026-05-10T10:00:00.000Z",
    project: "Music",
    status: "В обработке",
    authorId: DEMO_USER.id,
    authorName: DEMO_USER.name,
  },
  {
    id: "1018",
    title: "Смена email",
    date: "2026-05-08T08:00:00.000Z",
    project: "Delivery",
    status: "Закрыта",
    authorId: DEMO_USER.id,
    authorName: DEMO_USER.name,
  },
];

const SEED_ITEMS: ChatItem[] = [
  seedStatus(
    "seed-1024-open",
    "1024",
    DEMO_USER,
    "Открыта",
    "2026-05-12T09:00:00.000Z",
  ),

  seedStatus(
    "seed-1021-open",
    "1021",
    DEMO_USER,
    "Открыта",
    "2026-05-10T10:00:00.000Z",
  ),
  seedMessage(
    "seed-1021-m1",
    "1021",
    DEMO_USER,
    "Списали деньги, но заказ не оформился",
    "2026-05-10T10:05:00.000Z",
  ),
  seedStatus(
    "seed-1021-work",
    "1021",
    SUPPORT,
    "В обработке",
    "2026-05-10T11:00:00.000Z",
    "Открыта",
  ),
  seedMessage(
    "seed-1021-m2",
    "1021",
    SUPPORT,
    "Проверяем платёж, вернёмся с ответом",
    "2026-05-10T11:05:00.000Z",
    true,
  ),

  seedStatus(
    "seed-1018-open",
    "1018",
    DEMO_USER,
    "Открыта",
    "2026-05-08T08:00:00.000Z",
  ),
  seedMessage(
    "seed-1018-m1",
    "1018",
    DEMO_USER,
    "Хочу сменить email на новый",
    "2026-05-08T08:10:00.000Z",
  ),
  seedMessage(
    "seed-1018-m2",
    "1018",
    SUPPORT,
    "Готово, email изменён",
    "2026-05-08T08:30:00.000Z",
    true,
  ),
  seedStatus(
    "seed-1018-close",
    "1018",
    SUPPORT,
    "Закрыта",
    "2026-05-08T08:31:00.000Z",
    "Открыта",
  ),
];

export function seedIfEmpty() {
  if (safeGet(APPLICATIONS_KEY) !== null) return;
  writeJson(CHAT_KEY, SEED_ITEMS);
  writeJson(APPLICATIONS_KEY, SEED_APPLICATIONS);
}
