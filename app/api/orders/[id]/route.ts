import { orders, users, restaurants } from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/app/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const order = orders.withItems(id) as {
      id: string;
      userId: string;
      restaurantId: string;
      [key: string]: unknown;
    } | null;

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (session.role !== "admin" && order.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userRecord = users.findById(order.userId) as
      | { id: string; name: string; email: string }
      | undefined;
    const restaurant = (restaurants.findAll() as Array<{ id: string }>).find((r) => r.id === order.restaurantId);

    return NextResponse.json({
      ...order,
      user: userRecord
        ? { id: userRecord.id, name: userRecord.name, email: userRecord.email }
        : null,
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
    const session = getSessionUser(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderExists = orders.findById(id);
    if (!orderExists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ error: "Expected JSON request" }, { status: 400 });
    }
    const body: unknown = await request.json();
    const status =
      body && typeof body === "object" && "status" in body
        ? (body as { status?: unknown }).status
        : undefined;

    if (
      typeof status !== "string" ||
      !["pending", "confirmed"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    orders.updateStatus(id, status);
    const order = orders.withItems(id) as {
      userId: string;
      restaurantId: string;
      [key: string]: unknown;
    } | null;
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const userRecord = users.findById(order.userId) as
      | { id: string; name: string; email: string }
      | undefined;
    const restaurant = (restaurants.findAll() as Array<{ id: string }>).find((r) => r.id === order.restaurantId);

    return NextResponse.json({
      ...order,
      user: userRecord
        ? { id: userRecord.id, name: userRecord.name, email: userRecord.email }
        : null,
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
