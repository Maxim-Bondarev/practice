import type {
  Application,
  ApplicationStatus,
  CreateApplicationRequest,
} from "../types/types";
import { api } from "./client";
import { apiErrorMessage } from "./errors";
import { notifyDataChanged } from "./events";

export async function createApplication(
  input: CreateApplicationRequest,
): Promise<Application> {
  const { data, error } = await api.POST("/applications", { body: input });

  if (error || !data) {
    throw new Error(apiErrorMessage(error, "Не удалось создать заявку"));
  }

  notifyDataChanged("applications", "notifications");
  return data;
}

export async function changeApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<Application> {
  const { data, error } = await api.PATCH("/applications/{id}/status", {
    params: { path: { id: applicationId } },
    body: { status },
  });

  if (error || !data) {
    throw new Error(apiErrorMessage(error, "Не удалось изменить статус"));
  }

  notifyDataChanged("applications", "chat", "notifications");
  return data;
}

export async function sendMessage(
  applicationId: string,
  input: { text: string; file?: File | null },
): Promise<void> {
  const text = input.text.trim();

  if (!text && !input.file) {
    throw new Error("Нужно передать текст или файл");
  }

  const body = new FormData();
  if (text) body.append("text", text);
  if (input.file) body.append("file", input.file);

  const { error } = await api.POST("/applications/{id}/chat/messages", {
    params: { path: { id: applicationId } },
    body: body as never,
  });

  if (error) {
    throw new Error(apiErrorMessage(error, "Не удалось отправить сообщение"));
  }

  notifyDataChanged("chat", "applications", "notifications");
}
