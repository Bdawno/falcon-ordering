import { users } from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";

function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { outOfOffice, name, email, role } = await request.json();
    const { id: userId } = await params;

    // At least one field must be provided
    if (outOfOffice === undefined && !name && !email && !role) {
      return NextResponse.json(
        { error: "At least one field is required" },
        { status: 400 }
      );
    }

    const user = users.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle outOfOffice update
    if (outOfOffice !== undefined) {
      users.updateOutOfOffice(userId, outOfOffice);
    }

    // Handle name, email, role updates
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    if (Object.keys(updateData).length > 0) {
      // Check if new email is already taken by another user
      if (email && email !== user.email) {
        const existingUser = users.findByEmail(email);
        if (existingUser) {
          return NextResponse.json(
            { error: "Email already in use" },
            { status: 400 }
          );
        }
      }
      users.update(userId, updateData);
    }

    const updatedUser = users.findById(userId);
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
