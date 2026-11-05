export type DataScope = "applications" | "chat" | "notifications";

type Listener = () => void;

const listeners: Record<DataScope, Set<Listener>> = {
  applications: new Set(),
  chat: new Set(),
  notifications: new Set(),
};

export function subscribeDataChanged(
  scope: DataScope,
  listener: Listener,
): () => void {
  listeners[scope].add(listener);
  return () => {
    listeners[scope].delete(listener);
  };
}

export function notifyDataChanged(...scopes: DataScope[]): void {
  for (const scope of scopes) {
    listeners[scope].forEach((listener) => listener());
  }
}
