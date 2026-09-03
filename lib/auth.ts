import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "mikra_session";
const DEFAULT_SECRET = "mikra-finance-jwt-secret-key-32-chars-min!";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret.padEnd(32, "!").slice(0, 32));
}

export interface SessionPayload {
  sub: string;
  name: string;
  role: string;
  exp: number;
}

export async function createSessionToken(name = "Owner"): Promise<string> {
  const secret = getSecretKey();
  const token = await new SignJWT({
    name,
    role: "admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("user_1")
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export { COOKIE_NAME };
