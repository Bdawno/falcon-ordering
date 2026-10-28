import { restaurants } from "@/app/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/app/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const all = restaurants.findAll() as Array<{ id: string }>;
    const restaurantsWithMenus = all.map((restaurant) => ({
      ...restaurant,
      menuItems: (restaurants.findWithMenuItems(restaurant.id) as { menuItems?: unknown[] } | null)?.menuItems || [],
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
    const session = getSessionUser(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const { name, menuUrl } = body as { name?: unknown; menuUrl?: unknown };
    if (
      typeof name !== "string" ||
      !name.trim() ||
      (menuUrl !== undefined && menuUrl !== null && typeof menuUrl !== "string")
    ) {
      return NextResponse.json({ error: "Invalid restaurant data" }, { status: 400 });
    }

    const id = randomUUID();
    restaurants.create({
      id,
      name: name.trim(),
      menuUrl: typeof menuUrl === "string" && menuUrl.trim() ? menuUrl.trim() : null,
    });

    return NextResponse.json({
      id,
      name: name.trim(),
      menuUrl: typeof menuUrl === "string" && menuUrl.trim() ? menuUrl.trim() : null,
    });
  } catch (error) {
    console.error("Error creating restaurant:", error);
    return NextResponse.json(
      { error: "Failed to create restaurant" },
      { status: 500 }
    );
  }
}
