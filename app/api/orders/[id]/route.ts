import { orders, users, restaurants } from "@/app/lib/db";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const order = orders.withItems(id) as any;

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const user = users.findById(order.userId);
    const restaurant = (restaurants.findAll() as any[]).find((r) => r.id === order.restaurantId);

    return NextResponse.json({
      ...order,
      user,
      restaurant,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (
      !["pending", "confirmed", "ready", "picked-up"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    orders.updateStatus(id, status);
    const order = orders.withItems(id) as any;
    const user = users.findById(order.userId);
    const restaurant = (restaurants.findAll() as any[]).find((r) => r.id === order.restaurantId);

    return NextResponse.json({
      ...order,
      user,
      restaurant,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
