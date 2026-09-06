import { apiClient } from "./client";
import {
  GetReportStatisticsParams,
  ReportStatisticsV2,
  CreateAIReportV2Request,
  AIJobResponseV2,
  ReportRequest,
  ReportResponse,
} from "@/types/report";

/**
 * AI Report v2: Fetch report statistics (Instant, without waiting for AI)
 * GET /api/v2/reports/statistics
 */
export async function getReportStatisticsV2(
  params: GetReportStatisticsParams,
  signal?: AbortSignal
): Promise<ReportStatisticsV2> {
  const query = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });

  if (params.comparison && params.comparison !== "none") {
    query.set("comparison", params.comparison);
  }
  if (params.comparison_start_date) {
    query.set("comparison_start_date", params.comparison_start_date);
  }
  if (params.comparison_end_date) {
    query.set("comparison_end_date", params.comparison_end_date);
  }

  return await apiClient<ReportStatisticsV2>(`/api/v2/reports/statistics?${query.toString()}`, {
    method: "GET",
    signal,
    timeoutMs: 25000,
  });
}

/**
 * AI Report v2: Trigger or get cached AI insight job using snapshot_hash
 * POST /api/v2/reports/ai
 */
export async function createAIReportV2(
  body: CreateAIReportV2Request,
  signal?: AbortSignal
): Promise<AIJobResponseV2> {
  return await apiClient<AIJobResponseV2>("/api/v2/reports/ai", {
    method: "POST",
    body: JSON.stringify(body),
    signal,
    timeoutMs: 30000,
  });
}

/**
 * AI Report v2: Poll AI insight job status
 * GET /api/v2/reports/ai/{id}
 */
export async function getAIReportJobV2(
  id: string,
  signal?: AbortSignal
): Promise<AIJobResponseV2> {
  return await apiClient<AIJobResponseV2>(`/api/v2/reports/ai/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
    timeoutMs: 15000,
  });
}

/**
 * Legacy v1 endpoint (Deprecated, kept for reference or fallback)
 */
export async function getAIReport(params: ReportRequest): Promise<ReportResponse | null> {
  try {
    return await apiClient<ReportResponse>("/api/v1/reports/ai", {
      method: "POST",
      body: JSON.stringify(params),
      timeoutMs: 90000,
    });
  } catch {
    return null;
  }
}
