import { orders, orderItems, users, restaurants, menuItems } from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    let allOrders: any[] = orders.findAll(status ? { status } : undefined) as any[];

    if (userId) {
      allOrders = allOrders.filter((order) => order.userId === userId);
    }

    const enriched = allOrders.map((order) => {
      const user = users.findById(order.userId);
      const restaurant = (restaurants.findAll() as any[]).find((r) => r.id === order.restaurantId);
      const items = (orders.withItems(order.id) as any)?.items || [];
      return {
        ...order,
        user: { id: user?.id, name: user?.name, email: user?.email },
        restaurant,
        items,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId, items, notes } = await request.json();

    if (!restaurantId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const orderId = randomUUID();
    orders.create({
      id: orderId,
      userId: session.id,
      restaurantId,
      notes,
    });

    for (const item of items) {
      orderItems.create({
        id: randomUUID(),
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        specialRequests: item.specialRequests,
      });
    }

    const order = orders.withItems(orderId);
    const user = users.findById(session.id);
    const restaurant = (restaurants.findAll() as any[]).find((r) => r.id === restaurantId);

    return NextResponse.json({
      ...order,
      user,
      restaurant,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
