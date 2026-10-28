import { users } from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/app/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allUsers = (users.findAll() as Array<{
      id: string;
      email: string;
      name: string;
      role: string;
      outOfOffice: number | boolean;
      createdAt: string;
    }>).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      outOfOffice: u.outOfOffice === 1 || u.outOfOffice === true,
      createdAt: u.createdAt,
    }));

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }
    const { email, name, password, role } = body as {
      email?: unknown;
      name?: unknown;
      password?: unknown;
      role?: unknown;
    };
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const userRole = role ?? "employee";
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      !normalizedName ||
      typeof password !== "string" ||
      password.length < 8 ||
      (userRole !== "employee" && userRole !== "admin")
    ) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = users.findByEmail(normalizedEmail);

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);

    users.create({
      id,
      email: normalizedEmail,
      name: normalizedName,
      password: hashedPassword,
      role: userRole,
    });

    return NextResponse.json({
      id,
      email: normalizedEmail,
      name: normalizedName,
      role: userRole,
      createdAt: new Date(),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
