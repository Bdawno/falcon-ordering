import { users } from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/app/lib/session";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getSessionUser(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }
    const { outOfOffice, name, email, role } = body as {
      outOfOffice?: unknown;
      name?: unknown;
      email?: unknown;
      role?: unknown;
    };
    const { id: userId } = await params;

    if (
      outOfOffice === undefined &&
      name === undefined &&
      email === undefined &&
      role === undefined
    ) {
      return NextResponse.json(
        { error: "At least one field is required" },
        { status: 400 }
      );
    }
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : email;
    if (
      (outOfOffice !== undefined && typeof outOfOffice !== "boolean") ||
      (name !== undefined && (typeof name !== "string" || !name.trim())) ||
      (email !== undefined &&
        (typeof normalizedEmail !== "string" ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))) ||
      (role !== undefined && role !== "employee" && role !== "admin")
    ) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }

    const user = users.findById(userId) as
      | { id: string; email: string; name: string }
      | undefined;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (typeof normalizedEmail === "string" && normalizedEmail !== user.email) {
      const existingUser = users.findByEmail(normalizedEmail);
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
    }

    if (outOfOffice !== undefined) users.updateOutOfOffice(userId, outOfOffice);
    users.update(userId, {
      ...(typeof name === "string" ? { name: name.trim() } : {}),
      ...(typeof normalizedEmail === "string" ? { email: normalizedEmail } : {}),
      ...(typeof role === "string" ? { role } : {}),
    });
    const updatedUser = users.findById(userId) as
      | {
          id: string;
          email: string;
          name: string;
          role: string;
          outOfOffice: number | boolean;
          createdAt: string;
        }
      | undefined;
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      outOfOffice: updatedUser.outOfOffice === 1 || updatedUser.outOfOffice === true,
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
