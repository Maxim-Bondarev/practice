export const APPLICATION_STATUSES = [
  'Открыта',
  'В обработке',
  'Закрыта',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const PROJECTS = ['1X', 'Music', 'Delivery'] as const;
export type Project = (typeof PROJECTS)[number];

export const APPLICATION_SORTS = ['newest', 'oldest', 'activity'] as const;
export type ApplicationSort = (typeof APPLICATION_SORTS)[number];

export type NotificationKind =
  'application_created' | 'message_created' | 'status_changed';

export const TRANSITIONS: Record<
  ApplicationStatus,
  { admin: ApplicationStatus[]; author: ApplicationStatus[] }
> = {
  Открыта: { admin: ['В обработке', 'Закрыта'], author: ['Закрыта'] },
  'В обработке': { admin: ['Открыта', 'Закрыта'], author: ['Закрыта'] },
  Закрыта: { admin: ['Открыта', 'В обработке'], author: ['Открыта'] },
};

export function allowedTransitions(
  from: ApplicationStatus,
  actor: { isAdmin: boolean; isAuthor: boolean },
): ApplicationStatus[] {
  const allowed = new Set<ApplicationStatus>();
  if (actor.isAdmin) TRANSITIONS[from].admin.forEach((s) => allowed.add(s));
  if (actor.isAuthor) TRANSITIONS[from].author.forEach((s) => allowed.add(s));
  return [...allowed];
}
