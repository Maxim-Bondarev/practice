import createClient, { type Middleware } from "openapi-fetch";
import { keycloak } from "../keycloak";
import type { paths } from "./schema";

const rawBaseUrl = import.meta.env.VITE_API_URL as string | undefined;

export const API_BASE_URL = (rawBaseUrl?.trim() || "http://localhost:9100").replace(
  /\/+$/,
  "",
);

export function fileUrl(id: string): string {
  return `${API_BASE_URL}/files/${encodeURIComponent(id)}`;
}

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    try {
      await keycloak.updateToken(30);
    } catch {
      // Пользователь не авторизован — публичные запросы всё равно разрешены.
    }
    if (keycloak.token) {
      request.headers.set("Authorization", `Bearer ${keycloak.token}`);
    }
    return request;
  },
};

export const api = createClient<paths>({
  baseUrl: API_BASE_URL,
});

api.use(authMiddleware);
