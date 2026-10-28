import { users, orders, restaurants } from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/app/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allUsers = users.findAll() as Array<{
      id: string;
      name: string;
      email: string;
      outOfOffice: number | boolean;
    }>;

    const enrichedUsers = allUsers.map((user) => {
      const userOrders = orders.findByUser(user.id) as Array<{
        id: string;
        status: string;
        createdAt: string | null;
      }>;
      const latestOrder = userOrders[0] || null;

      let confirmedOrderDetails = null;
      if (latestOrder?.status === "confirmed") {
        const orderWithItems = orders.withItems(latestOrder.id) as
          | {
              id: string;
              restaurantId: string;
              createdAt: string;
              items: unknown[];
            }
          | null;
        if (orderWithItems) {
          const restaurant = (restaurants.findAll() as Array<{ id: string; name: string }>).find(
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
        outOfOffice: user.outOfOffice === 1 || user.outOfOffice === true,
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
