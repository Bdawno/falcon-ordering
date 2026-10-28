import { menuItems } from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/app/lib/session";
import { parseMenuItemInput } from "@/app/lib/menu-item-input";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionUser(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = menuItems.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    const input = parseMenuItemInput(await request.json());
    if (!input) {
      return NextResponse.json({ error: "Invalid menu item data" }, { status: 400 });
    }

    menuItems.update(id, input);
    return NextResponse.json({ ...existing, ...input });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionUser(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!menuItems.findById(id)) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }
    if (menuItems.isOrdered(id)) {
      return NextResponse.json(
        { error: "This item is part of existing orders and cannot be deleted" },
        { status: 409 }
      );
    }

    menuItems.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
