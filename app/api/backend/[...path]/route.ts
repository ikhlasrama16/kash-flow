import { NextRequest, NextResponse } from "next/server";

function getTargetBase(): string {
  const envUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  // If envUrl is missing or points to a dead local port, route to live production API
  if (!envUrl || envUrl.includes("127.0.0.1") || envUrl.includes("localhost:8080")) {
    return "https://finance.mikra.my.id";
  }
  return envUrl;
}

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathString = "/" + path.join("/");
  const url = new URL(req.url);
  const targetBase = getTargetBase();
  const targetUrl = `${targetBase.replace(/\/+$/, "")}${pathString}${url.search}`;

  console.log(`[Proxy] ${req.method} ${pathString} -> ${targetUrl}`);

  const headers = new Headers();
  headers.set("Content-Type", req.headers.get("content-type") || "application/json");
  headers.set("Accept", req.headers.get("accept") || "application/json");

  // Ingest API key injection for notification ingestion
  if (pathString === "/api/v1/notifications" && req.method === "POST" && process.env.INGEST_API_KEY) {
    headers.set("Authorization", `Bearer ${process.env.INGEST_API_KEY}`);
  } else if (req.headers.has("authorization")) {
    headers.set("Authorization", req.headers.get("authorization")!);
  }

  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.text();
    } catch {
      body = null;
    }
  }

  try {
    const backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    const data = await backendResponse.text();
    console.log(`[Proxy] ${req.method} ${pathString} <- Status ${backendResponse.status} (${data.length} bytes)`);

    return new NextResponse(data, {
      status: backendResponse.status,
      headers: {
        "Content-Type": backendResponse.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error(`[Proxy Error] Failed to fetch ${targetUrl}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Backend API unavailable",
        detail: error instanceof Error ? error.message : "Unknown network error",
      },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const PUT = handleProxy;
export const OPTIONS = handleProxy;
