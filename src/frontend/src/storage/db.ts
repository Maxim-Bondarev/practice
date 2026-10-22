import type {
  Application,
  ApplicationStatus,
  ChatAttachment,
  ChatMessage,
  Project,
} from "../types/types";

const APPLICATIONS_KEY = "feedback:applications";
const MESSAGES_KEY = "feedback:messages";

export const MAX_MESSAGE_LENGTH = 2000;

const EMPTY_APPLICATIONS: Application[] = [];
const EMPTY_MESSAGES: ChatMessage[] = [];

const SEED_APPLICATIONS: Application[] = [
  {
    id: "1024",
    title: "Не приходит код",
    date: new Date("2026-05-12"),
    project: "1X",
    status: "На модерации",
    authorId: "seed-user",
  },
  {
    id: "1021",
    title: "Ошибка оплаты",
    date: new Date("2026-05-10"),
    project: "Music",
    status: "В обработке",
    authorId: "seed-user",
  },
  {
    id: "1018",
    title: "Смена email",
    date: new Date("2026-05-08"),
    project: "Delivery",
    status: "Новые",
    authorId: "seed-user",
  },
];

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
    if (e.key === null || e.key === APPLICATIONS_KEY || e.key === MESSAGES_KEY) {
      listener();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function read<T>(key: string, parse: (raw: string) => T, empty: T): T {
  const raw = safeGet(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;

  let value: T = empty;
  if (raw !== null) {
    try {
      value = parse(raw);
    } catch {
      value = empty;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

type StoredApplication = Omit<Application, "date"> & { date: string };

function parseApplications(raw: string): Application[] {
  const list = JSON.parse(raw) as StoredApplication[];
  return list.map((a) => ({ ...a, date: new Date(a.date) }));
}

function writeApplications(list: Application[]): boolean {
  const stored: StoredApplication[] = list.map((a) => ({
    ...a,
    date: a.date.toISOString(),
  }));
  const ok = safeSet(APPLICATIONS_KEY, JSON.stringify(stored));
  if (ok) emit();
  return ok;
}

export function getApplications(): Application[] {
  return read(APPLICATIONS_KEY, parseApplications, EMPTY_APPLICATIONS);
}

function nextApplicationId(list: Application[]): string {
  const max = list.reduce((acc, a) => {
    const n = Number(a.id);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 1024);
  return String(max + 1);
}

export function createApplication(input: {
  title: string;
  project: Project;
  authorId: string;
}): Application | null {
  const list = getApplications();
  const application: Application = {
    id: nextApplicationId(list),
    title: input.title.trim(),
    date: new Date(),
    project: input.project,
    status: "На модерации",
    authorId: input.authorId,
  };
  return writeApplications([application, ...list]) ? application : null;
}

export function setApplicationStatus(id: string, status: ApplicationStatus) {
  writeApplications(
    getApplications().map((a) => (a.id === id ? { ...a, status } : a)),
  );
}


function parseMessages(raw: string): ChatMessage[] {
  return JSON.parse(raw) as ChatMessage[];
}

export function getMessages(): ChatMessage[] {
  return read(MESSAGES_KEY, parseMessages, EMPTY_MESSAGES);
}


export function addMessage(input: {
  applicationId: string;
  authorId: string;
  authorName: string;
  isAdmin?: boolean;
  text: string;
  attachment?: ChatAttachment;
}): ChatMessage | null {
  const text = input.text.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!text) return null;

  const application = getApplications().find(
    (a) => a.id === input.applicationId,
  );
  if (!application) return null;
  if (!input.isAdmin && application.authorId !== input.authorId) return null;

  const message: ChatMessage = {
    id: crypto.randomUUID(),
    applicationId: input.applicationId,
    authorId: input.authorId,
    authorName: input.authorName,
    isAdmin: input.isAdmin ? true : undefined,
    text,
    attachment: input.attachment,
    createdAt: new Date().toISOString(),
  };

  const ok = safeSet(MESSAGES_KEY, JSON.stringify([...getMessages(), message]));
  if (!ok) return null;
  emit();
  return message;
}


export function seedIfEmpty() {
  if (safeGet(APPLICATIONS_KEY) === null) {
    writeApplications(SEED_APPLICATIONS);
  }
}