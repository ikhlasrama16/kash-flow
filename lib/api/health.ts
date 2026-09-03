import { apiClient } from "./client";

export interface HealthStatus {
  status: string;
}

export async function checkLiveness(): Promise<HealthStatus> {
  return apiClient<HealthStatus>("/api/v1/health");
}

export async function checkReadiness(): Promise<HealthStatus> {
  return apiClient<HealthStatus>("/api/v1/ready");
}
