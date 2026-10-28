import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { users } from "@/app/lib/db";
import type { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "session";
// Browsers cap cookie lifetime at ~400 days; users stay signed in until they log out.
const SESSION_MAX_AGE = 60 * 60 * 24 * 400;
const developmentSecret =
  process.env.NODE_ENV === "production" ? undefined : randomBytes(32).toString("hex");

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface SessionPayload {
  userId: string;
  expiresAt: number;
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (developmentSecret) return developmentSecret;
  throw new Error("SESSION_SECRET must be configured with at least 32 characters");
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      expiresAt: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
    } satisfies SessionPayload)
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function getSessionUser(request: NextRequest): SessionUser | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [payload, signature, ...extra] = token.split(".");
  if (!payload || !signature || extra.length > 0) return null;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  let session: SessionPayload;
  try {
    session = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as SessionPayload;
  } catch {
    return null;
  }

  if (
    typeof session.userId !== "string" ||
    typeof session.expiresAt !== "number" ||
    session.expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  const user = users.findById(session.userId) as
    | { id: string; email: string; name: string; role: string }
    | undefined;
  if (!user) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export function setSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
