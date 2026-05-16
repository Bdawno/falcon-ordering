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

    const { outOfOffice } = await request.json();
    const { id: userId } = await params;

    if (outOfOffice === undefined) {
      return NextResponse.json(
        { error: "outOfOffice field is required" },
        { status: 400 }
      );
    }

    const user = users.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    users.updateOutOfOffice(userId, outOfOffice);

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
