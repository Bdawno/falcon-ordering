import { initializeDatabase, restaurants, menuItems, users } from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { randomUUID, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const seedSecret = process.env.SEED_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  const suppliedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const expected = Buffer.from(seedSecret ?? "");
  const supplied = Buffer.from(suppliedSecret);

  if (
    process.env.NODE_ENV !== "development" ||
    !seedSecret ||
    seedSecret.length < 32 ||
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const employeeEmail = process.env.SEED_EMPLOYEE_EMAIL;
  const employeePassword = process.env.SEED_EMPLOYEE_PASSWORD;
  if (!adminEmail || !adminPassword || !employeeEmail || !employeePassword) {
    return NextResponse.json(
      { error: "Seed account environment variables are required" },
      { status: 503 }
    );
  }

  try {
    // Initialize database schema
    initializeDatabase();

    // Create restaurants
    const chiptoleId = randomUUID();
    restaurants.create({
      id: chiptoleId,
      name: "Chipotle",
      menuUrl: "https://www.chipotle.com/menu",
    });

    const chipotle_items = [
      { name: "Chicken Bowl", description: "Grilled chicken, rice, beans, toppings", price: 8.5 },
      { name: "Steak Bowl", description: "Steak, rice, beans, toppings", price: 9.5 },
      { name: "Carnitas Bowl", description: "Carnitas, rice, beans, toppings", price: 9.5 },
      { name: "Sofritas Bowl", description: "Tofu, rice, beans, toppings", price: 8.5 },
      { name: "Veggie Bowl", description: "Fajita veggies, rice, beans, toppings", price: 8.0 },
      { name: "Chicken Burrito", description: "Wrapped in a flour tortilla", price: 8.5 },
    ];

    for (const item of chipotle_items) {
      menuItems.create({
        id: randomUUID(),
        restaurantId: chiptoleId,
        ...item,
      });
    }

    const paneraId = randomUUID();
    restaurants.create({
      id: paneraId,
      name: "Panera Bread",
      menuUrl: "https://www.panerabread.com/menu",
    });

    const panera_items = [
      { name: "Mediterranean Veggie", description: "Roasted vegetables, feta, hummus", price: 9.0 },
      { name: "Turkey & Avocado", description: "Sliced turkey, fresh avocado, lettuce", price: 11.0 },
      { name: "Grilled Chicken Caesar", description: "Grilled chicken, croutons, Caesar dressing", price: 10.5 },
      { name: "You Pick Two", description: "Any two half sandwiches or soups", price: 10.0 },
    ];

    for (const item of panera_items) {
      menuItems.create({
        id: randomUUID(),
        restaurantId: paneraId,
        ...item,
      });
    }

    const subwayId = randomUUID();
    restaurants.create({
      id: subwayId,
      name: "Subway",
      menuUrl: "https://www.subway.com/en-us/menu",
    });

    const subway_items = [
      { name: "Italian BMT", description: "Pepperoni, ham, salami on 6-inch bread", price: 7.5 },
      { name: "Spicy Italian", description: "Pepperoni and salami on 6-inch bread", price: 7.0 },
      { name: "Turkey Breast", description: "Fresh sliced turkey on 6-inch bread", price: 7.0 },
      { name: "Veggie Delite", description: "Fresh vegetables on 6-inch bread", price: 6.0 },
      { name: "Tuna", description: "Tuna salad on 6-inch bread", price: 7.5 },
    ];

    for (const item of subway_items) {
      menuItems.create({
        id: randomUUID(),
        restaurantId: subwayId,
        ...item,
      });
    }

    // Create users
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    const hashedEmployeePassword = await bcrypt.hash(employeePassword, 10);

    users.create({
      id: randomUUID(),
      email: adminEmail.trim().toLowerCase(),
      name: "Admin User",
      password: hashedAdminPassword,
      role: "admin",
    });

    users.create({
      id: randomUUID(),
      email: employeeEmail.trim().toLowerCase(),
      name: "Test Employee",
      password: hashedEmployeePassword,
      role: "employee",
    });

    return Response.json(
      {
        success: true,
        message: "Database seeded successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
