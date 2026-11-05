import { useCallback, useEffect, useRef, useState } from "react";
import { ACTIVE_STATUSES } from "../domain/statuses";
import type {
  AppNotification,
  Application,
  ApplicationCategory,
  ApplicationSort,
  ApplicationStatus,
  ChatItem,
  Project,
} from "../types/types";
import { api } from "./client";
import { apiErrorMessage } from "./errors";
import { notifyDataChanged, subscribeDataChanged } from "./events";

const APPLICATIONS_POLL_MS = 15_000;
const CHAT_POLL_MS = 5_000;
const NOTIFICATIONS_POLL_MS = 20_000;

function statusesForCategory(
  category: ApplicationCategory,
): ApplicationStatus[] | undefined {
  if (category === "Все" || category === "Мои") return undefined;
  if (category === "Актуальные") return ACTIVE_STATUSES;
  return [category];
}

export interface ApplicationsQuery {
  category: ApplicationCategory;
  project?: Project | "";
  sort?: ApplicationSort;
  search?: string;
  mine?: boolean;
  authenticated?: boolean;
}

export interface ApplicationsResult {
  items: Application[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useApplications(
  query: ApplicationsQuery,
): ApplicationsResult {
  const {
    category,
    project = "",
    sort = "newest",
    search = "",
    mine,
    authenticated = false,
  } = query;

  const isMine = mine ?? category === "Мои";
  const enabled = !isMine || authenticated;

  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const aliveRef = useRef(true);
  const requestRef = useRef(0);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!enabled) {
      if (aliveRef.current) {
        setItems([]);
        setLoading(false);
        setError(null);
      }
      return;
    }

    const statuses = statusesForCategory(category);
    try {
      const { data, error: apiError } = await api.GET("/applications", {
        params: {
          query: {
            ...(statuses ? { status: statuses } : {}),
            ...(project ? { project } : {}),
            ...(search.trim() ? { search: search.trim() } : {}),
            ...(isMine ? { mine: true } : {}),
            sort,
          },
        },
      });

      if (!aliveRef.current || requestId !== requestRef.current) return;

      if (apiError) {
        setError(apiErrorMessage(apiError, "Не удалось загрузить заявки"));
        setLoading(false);
        return;
      }

      setItems(data ?? []);
      setError(null);
      setLoading(false);
    } catch (err) {
      if (!aliveRef.current || requestId !== requestRef.current) return;
      setError(apiErrorMessage(err, "Не удалось загрузить заявки"));
      setLoading(false);
    }
  }, [category, project, sort, search, isMine, enabled]);

  useEffect(() => {
    const start = window.setTimeout(() => {
      void reload();
    }, 0);
    const timer = window.setInterval(() => {
      void reload();
    }, APPLICATIONS_POLL_MS);
    const unsubscribe = subscribeDataChanged("applications", () => {
      void reload();
    });

    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [reload]);

  return { items, loading, error, reload };
}

export interface ApplicationResult {
  application: Application | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useApplication(id: string | undefined): ApplicationResult {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const aliveRef = useRef(true);
  const requestRef = useRef(0);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!id) {
      if (aliveRef.current) {
        setApplication(null);
        setLoading(false);
        setError(null);
      }
      return;
    }

    try {
      const { data, error: apiError, response } = await api.GET(
        "/applications/{id}",
        { params: { path: { id } } },
      );

      if (!aliveRef.current || requestId !== requestRef.current) return;

      if (apiError || !data) {
        setApplication(null);
        setError(
          response.status === 404
            ? null
            : apiErrorMessage(apiError, "Не удалось загрузить заявку"),
        );
        setLoading(false);
        return;
      }

      setApplication(data);
      setError(null);
      setLoading(false);
    } catch (err) {
      if (!aliveRef.current || requestId !== requestRef.current) return;
      setApplication(null);
      setError(apiErrorMessage(err, "Не удалось загрузить заявку"));
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const start = window.setTimeout(() => {
      void reload();
    }, 0);
    const timer = window.setInterval(() => {
      void reload();
    }, APPLICATIONS_POLL_MS);
    const unsubscribe = subscribeDataChanged("applications", () => {
      void reload();
    });

    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [reload]);

  return { application, loading, error, reload };
}

export interface ChatItemsResult {
  items: ChatItem[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useChatItems(applicationId: string): ChatItemsResult {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(Boolean(applicationId));
  const [error, setError] = useState<string | null>(null);

  const aliveRef = useRef(true);
  const requestRef = useRef(0);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!applicationId) {
      if (aliveRef.current) {
        setItems([]);
        setLoading(false);
        setError(null);
      }
      return;
    }

    try {
      const { data, error: apiError } = await api.GET(
        "/applications/{id}/chat",
        { params: { path: { id: applicationId } } },
      );

      if (!aliveRef.current || requestId !== requestRef.current) return;

      if (apiError) {
        setError(apiErrorMessage(apiError, "Не удалось загрузить чат"));
        setLoading(false);
        return;
      }

      setItems(data ?? []);
      setError(null);
      setLoading(false);
    } catch (err) {
      if (!aliveRef.current || requestId !== requestRef.current) return;
      setError(apiErrorMessage(err, "Не удалось загрузить чат"));
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    const start = window.setTimeout(() => {
      void reload();
    }, 0);
    const timer = window.setInterval(() => {
      void reload();
    }, CHAT_POLL_MS);
    const unsubscribe = subscribeDataChanged("chat", () => {
      void reload();
    });

    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [reload]);

  return { items, loading, error, reload };
}

export interface NotificationViewer {
  id: string;
  isAdmin: boolean;
}

export interface NotificationsResult {
  list: AppNotification[];
  unread: number;
  loading: boolean;
  error: string | null;
  markRead: (ids: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useNotifications(
  viewer: NotificationViewer | null,
): NotificationsResult {
  const userId = viewer?.id ?? null;

  const [list, setList] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const aliveRef = useRef(true);
  const requestRef = useRef(0);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!userId) {
      if (aliveRef.current) {
        setList([]);
        setUnread(0);
        setLoading(false);
        setError(null);
      }
      return;
    }

    try {
      const { data, error: apiError } = await api.GET("/notifications", {
        params: { query: { limit: 50 } },
      });

      if (!aliveRef.current || requestId !== requestRef.current) return;

      if (apiError || !data) {
        setError(
          apiErrorMessage(apiError, "Не удалось загрузить уведомления"),
        );
        setLoading(false);
        return;
      }

      setList(data.items);
      setUnread(data.unreadCount);
      setError(null);
      setLoading(false);
    } catch (err) {
      if (!aliveRef.current || requestId !== requestRef.current) return;
      setError(apiErrorMessage(err, "Не удалось загрузить уведомления"));
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const start = window.setTimeout(() => {
      void reload();
    }, 0);
    const timer = window.setInterval(() => {
      void reload();
    }, NOTIFICATIONS_POLL_MS);
    const unsubscribe = subscribeDataChanged("notifications", () => {
      void reload();
    });

    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [reload]);

  const markRead = useCallback(
    async (ids: string[]) => {
      if (!userId || ids.length === 0) return;

      try {
        const { error: apiError } = await api.POST("/notifications/read", {
          body: { ids },
        });
        if (apiError) {
          setError(
            apiErrorMessage(apiError, "Не удалось отметить уведомления"),
          );
          return;
        }
        notifyDataChanged("notifications");
      } catch (err) {
        setError(apiErrorMessage(err, "Не удалось отметить уведомления"));
      }
    },
    [userId],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;

    try {
      const { error: apiError } = await api.POST("/notifications/read", {
        body: { all: true },
      });
      if (apiError) {
        setError(
          apiErrorMessage(apiError, "Не удалось отметить уведомления"),
        );
        return;
      }
      notifyDataChanged("notifications");
    } catch (err) {
      setError(apiErrorMessage(err, "Не удалось отметить уведомления"));
    }
  }, [userId]);

  return { list, unread, loading, error, markRead, markAllRead };
}

export async function markApplicationNotificationsRead(
  applicationId: string,
): Promise<void> {
  try {
    const { data, error } = await api.GET("/notifications", {
      params: { query: { limit: 100 } },
    });
    if (error || !data) return;

    const ids = data.items
      .filter((item) => item.applicationId === applicationId && !item.read)
      .map((item) => item.id);

    if (ids.length === 0) return;

    const { error: markError } = await api.POST("/notifications/read", {
      body: { ids },
    });
    if (!markError) notifyDataChanged("notifications");
  } catch {
    // Уведомления не критичны: ошибку сети игнорируем.
  }
}
