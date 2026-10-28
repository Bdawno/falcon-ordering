import { menuItems, restaurants } from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/app/lib/session";
import { parseMenuItemInput } from "@/app/lib/menu-item-input";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionUser(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: restaurantId } = await params;
    if (!restaurants.findWithMenuItems(restaurantId)) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const input = parseMenuItemInput(await request.json());
    if (!input) {
      return NextResponse.json({ error: "Invalid menu item data" }, { status: 400 });
    }

    const id = randomUUID();
    menuItems.create({ id, restaurantId, ...input, description: input.description ?? undefined });

    return NextResponse.json({ id, restaurantId, ...input }, { status: 201 });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}
