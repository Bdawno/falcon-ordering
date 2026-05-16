import { restaurants } from "@/app/lib/db";
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = params.id;

    restaurants.delete(restaurantId);

    return NextResponse.json({ success: true, message: "Restaurant deleted successfully" });
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    return NextResponse.json(
      { error: "Failed to delete restaurant" },
      { status: 500 }
    );
  }
}
