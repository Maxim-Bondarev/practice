import { useMemo, useSyncExternalStore } from "react";
import type { Application, ChatMessage } from "../types/types";
import { getApplications, getMessages, subscribe } from "./db";

export function useApplications(): Application[] {
  return useSyncExternalStore(subscribe, getApplications);
}

export function useApplication(id: string | undefined): Application | undefined {
  const applications = useApplications();
  return useMemo(
    () => applications.find((a) => a.id === id),
    [applications, id],
  );
}

export function useChatMessages(applicationId: string): ChatMessage[] {
  const all = useSyncExternalStore(subscribe, getMessages);
  return useMemo(
    () => all.filter((m) => m.applicationId === applicationId),
    [all, applicationId],
  );
}