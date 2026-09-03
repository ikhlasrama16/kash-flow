import { apiClient } from "./client";
import { ReportRequest, ReportResponse } from "@/types/report";

export async function getAIReport(params: ReportRequest): Promise<ReportResponse | null> {
  try {
    return await apiClient<ReportResponse>("/api/v1/reports/ai", {
      method: "POST",
      body: JSON.stringify(params),
      timeoutMs: 90000, // 90 seconds allowance for uncached OpenRouter/LLM generation
    });
  } catch {
    return null;
  }
}
