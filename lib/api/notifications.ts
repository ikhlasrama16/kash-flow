import { apiClient } from "./client";
import { RawNotification, IngestNotificationInput } from "@/types/notification";

export async function getNotifications(): Promise<RawNotification[]> {
  try {
    const res = await apiClient<RawNotification[]>("/api/v1/notifications");
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function ingestNotification(input: IngestNotificationInput): Promise<unknown> {
  return apiClient<unknown>("/api/v1/notifications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
