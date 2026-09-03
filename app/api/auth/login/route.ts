import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const entered = typeof password === "string" ? password.trim() : "";
    const expected = (
      process.env.ADMIN_PASSWORD || process.env.APP_PASSWORD || "admin123"
    ).trim();

    if (!entered) {
      return NextResponse.json(
        { success: false, error: "Password wajib diisi" },
        { status: 400 }
      );
    }

    if (entered !== expected) {
      return NextResponse.json(
        { success: false, error: "Password salah. Silakan coba lagi." },
        { status: 401 }
      );
    }

    const token = await createSessionToken("Ikhlas");
    const isProd = process.env.NODE_ENV === "production";

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memproses login";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
