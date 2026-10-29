import type { ApplicationStatus, Project } from "../types/types";


const STATUS_META: Record<ApplicationStatus, { closed: boolean }> = {
  Открыта: { closed: false },
  "В обработке": { closed: false },
  Закрыта: { closed: true },
};

export const APPLICATION_STATUSES = Object.keys(
  STATUS_META,
) as ApplicationStatus[];

export const ACTIVE_STATUSES = APPLICATION_STATUSES.filter(
  (s) => !STATUS_META[s].closed,
);

export function isClosed(status: ApplicationStatus): boolean {
  return STATUS_META[status].closed;
}

const PROJECT_META: Record<Project, true> = {
  "1X": true,
  Music: true,
  Delivery: true,
};

export const PROJECTS = Object.keys(PROJECT_META) as Project[];

export interface StatusActor {
  isAdmin: boolean;
  isAuthor: boolean;
}

const TRANSITIONS: Record<
  ApplicationStatus,
  { admin: ApplicationStatus[]; author: ApplicationStatus[] }
> = {
  Открыта: { admin: ["В обработке", "Закрыта"], author: ["Закрыта"] },
  "В обработке": { admin: ["Открыта", "Закрыта"], author: ["Закрыта"] },
  Закрыта: { admin: ["Открыта", "В обработке"], author: ["Открыта"] },
};

export function allowedTransitions(
  from: ApplicationStatus,
  actor: StatusActor,
): ApplicationStatus[] {
  const result = new Set<ApplicationStatus>();
  if (actor.isAdmin) TRANSITIONS[from].admin.forEach((s) => result.add(s));
  if (actor.isAuthor) TRANSITIONS[from].author.forEach((s) => result.add(s));
  return [...result];
}

const TRANSITION_LABELS: Record<ApplicationStatus, string> = {
  Открыта: "Вернуть в открытые",
  "В обработке": "Взять в работу",
  Закрыта: "Закрыть заявку",
};

export function transitionLabel(
  from: ApplicationStatus,
  to: ApplicationStatus,
): string {
  if (to === "Открыта" && isClosed(from)) return "Открыть повторно";
  return TRANSITION_LABELS[to];
}