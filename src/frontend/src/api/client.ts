import createClient, { type Middleware } from "openapi-fetch";
import { keycloak } from "../keycloak";
import type { paths } from "./schema";


const authMiddleware: Middleware = {
  async onRequest({ request }) {
    try {
      await keycloak.updateToken(30);
    } catch {
    }
    if (keycloak.token) {
      request.headers.set("Authorization", `Bearer ${keycloak.token}`);
    }
    return request;
  },
};

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL as string,
});

api.use(authMiddleware);