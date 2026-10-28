import { db, orders, orderItems, users, restaurants, menuItems } from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/app/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const requestedUserId = searchParams.get("userId");

    if (status && !["pending", "confirmed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const userId = session.role === "admin" ? requestedUserId : session.id;
    let allOrders = orders.findAll(status ? { status } : undefined) as Array<{
      id: string;
      userId: string;
      restaurantId: string;
      [key: string]: unknown;
    }>;
    if (userId) {
      allOrders = allOrders.filter((order) => order.userId === userId);
    }

    const enriched = allOrders.map((order) => {
      const user = users.findById(order.userId) as
        | { id: string; name: string; email: string }
        | undefined;
      const restaurant = (restaurants.findAll() as Array<{ id: string }>).find((r) => r.id === order.restaurantId);
      const items = (orders.withItems(order.id) as { items?: unknown[] } | null)?.items || [];
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
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { restaurantId, items, notes } = body as {
      restaurantId?: unknown;
      items?: unknown;
      notes?: unknown;
    };
    if (
      typeof restaurantId !== "string" ||
      !restaurantId ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50 ||
      (notes !== undefined && (typeof notes !== "string" || notes.length > 1000))
    ) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const restaurant = restaurants.findWithMenuItems(restaurantId) as
      | { id: string; name: string }
      | null;
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const availableItems = menuItems.findByRestaurant(restaurantId) as Array<{
      id: string;
      price: number;
    }>;
    const prices = new Map(availableItems.map((item) => [item.id, item.price]));
    const validatedItems: Array<{
      menuItemId: string;
      quantity: number;
      specialRequests?: string;
      price: number;
    }> = [];

    for (const item of items) {
      if (!item || typeof item !== "object") {
        return NextResponse.json({ error: "Invalid order item" }, { status: 400 });
      }
      const entry = item as {
        menuItemId?: unknown;
        quantity?: unknown;
        specialRequests?: unknown;
      };
      const price = typeof entry.menuItemId === "string" ? prices.get(entry.menuItemId) : undefined;
      if (
        typeof entry.menuItemId !== "string" ||
        price === undefined ||
        !Number.isInteger(entry.quantity) ||
        (entry.quantity as number) < 1 ||
        (entry.quantity as number) > 99 ||
        (entry.specialRequests !== undefined &&
          (typeof entry.specialRequests !== "string" || entry.specialRequests.length > 500))
      ) {
        return NextResponse.json({ error: "Invalid order item" }, { status: 400 });
      }
      validatedItems.push({
        menuItemId: entry.menuItemId,
        quantity: entry.quantity as number,
        specialRequests: entry.specialRequests as string | undefined,
        price,
      });
    }

    const orderId = randomUUID();
    const totalPrice = validatedItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    db.transaction(() => {
      orders.create({
        id: orderId,
        userId: session.id,
        restaurantId,
        notes: notes as string | undefined,
        totalPrice,
      });

      for (const item of validatedItems) {
        orderItems.create({
          id: randomUUID(),
          orderId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialRequests: item.specialRequests,
        });
      }
    })();

    const order = orders.withItems(orderId);
    return NextResponse.json({
      ...order,
      user: { id: session.id, name: session.name, email: session.email },
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
