import { restaurants } from "@/app/lib/db";
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

    const all = restaurants.findAll() as any[];
    const restaurantsWithMenus = all.map((restaurant) => ({
      ...restaurant,
      menuItems: (restaurants.findWithMenuItems(restaurant.id) as any)?.menuItems || [],
    }));

    return NextResponse.json(restaurantsWithMenus);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();

    const restaurant = restaurants.create({
      id: randomUUID(),
      name,
    });

    return NextResponse.json({ id: randomUUID(), name });
  } catch (error) {
    console.error("Error creating restaurant:", error);
    return NextResponse.json(
      { error: "Failed to create restaurant" },
      { status: 500 }
    );
  }
}
