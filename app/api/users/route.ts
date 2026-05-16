import { users } from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allUsers = (users.findAll() as any[]).map((u) => ({
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
    const { email, name, password, role } = await request.json();

    // Check if user already exists
    const existingUser = users.findByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    users.create({
      id: randomUUID(),
      email,
      name,
      password: hashedPassword,
      role: role || "employee",
    });

    return NextResponse.json({
      id: randomUUID(),
      email,
      name,
      role: role || "employee",
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
