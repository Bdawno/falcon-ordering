import { users, orders, restaurants } from "@/app/lib/db";
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

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users
    const allUsers: any[] = users.findAll();

    // Enrich each user with their latest order status and order details
    const enrichedUsers = allUsers.map((user) => {
      const userOrders: any[] = orders.findByUser(user.id);
      const latestOrder = userOrders[0] || null; // Orders are sorted by createdAt DESC

      let confirmedOrderDetails = null;
      if (latestOrder?.status === "confirmed") {
        const orderWithItems = orders.withItems(latestOrder.id);
        if (orderWithItems) {
          const restaurant = (restaurants.findAll() as any[]).find(
            (r) => r.id === orderWithItems.restaurantId
          );
          confirmedOrderDetails = {
            id: orderWithItems.id,
            restaurant: restaurant?.name || "Unknown",
            items: orderWithItems.items || [],
            createdAt: orderWithItems.createdAt,
          };
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        outOfOffice: user.outOfOffice === 1,
        latestOrderStatus: latestOrder?.status || "no order",
        confirmedOrderDetails: confirmedOrderDetails,
        lastOrderDate: latestOrder?.createdAt || null,
      };
    });

    return NextResponse.json(enrichedUsers);
  } catch (error) {
    console.error("Error fetching users with order status:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
