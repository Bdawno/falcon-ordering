import { restaurants, getWeeklyRestaurant, setWeeklyRestaurant } from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/app/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weeklyRestaurant = getWeeklyRestaurant();

    return NextResponse.json(weeklyRestaurant || null);
  } catch (error) {
    console.error("Error fetching weekly restaurant:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly restaurant" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId } = await request.json();

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    // Verify restaurant exists
    const restaurant = restaurants.findWithMenuItems(restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    setWeeklyRestaurant(restaurantId);

    return NextResponse.json({
      success: true,
      message: "Weekly restaurant updated successfully",
      restaurant,
    });
  } catch (error) {
    console.error("Error setting weekly restaurant:", error);
    return NextResponse.json(
      { error: "Failed to set weekly restaurant" },
      { status: 500 }
    );
  }
}
