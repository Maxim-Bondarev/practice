import type { ApiError } from "../types/types";

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const message = (error as Partial<ApiError>).message;
    if (Array.isArray(message)) return message.join("; ");
    if (typeof message === "string" && message) return message;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
}
