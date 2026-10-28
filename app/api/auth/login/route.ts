import { users } from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  getSessionUser,
  setSessionCookie,
} from "@/app/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }
    const { email, password } = body as { email?: unknown; password?: unknown };

    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const user = users.findByEmail(email.trim().toLowerCase()) as
      | { id: string; email: string; name: string; role: string; password: string }
      | undefined;

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    setSessionCookie(response, user.id);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getSessionUser(request);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Session lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
