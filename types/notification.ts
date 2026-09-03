export type NotificationStatus = "pending" | "parsed" | "ignored" | "failed" | "detached";

export interface RawNotification {
  id: number;
  source_app: string;
  title?: string | null;
  body: string;
  received_at: string;
  status: NotificationStatus;
  parser_name?: string | null;
  fingerprint?: string | null;
  error_message?: string | null;
  transaction_id?: number | null;
  created_at: string;
}

export interface IngestNotificationInput {
  source_app: string;
  title?: string;
  body: string;
  received_at?: string;
  raw_payload?: Record<string, unknown>;
}
