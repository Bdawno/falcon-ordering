import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create restaurants
  const chipotle = await prisma.restaurant.upsert({
    where: { name: "Chipotle" },
    update: {},
    create: {
      name: "Chipotle",
      menuItems: {
        create: [
          { name: "Chicken Bowl", description: "Grilled chicken, rice, beans, toppings", price: 8.5 },
          { name: "Steak Bowl", description: "Steak, rice, beans, toppings", price: 9.5 },
          { name: "Carnitas Bowl", description: "Carnitas, rice, beans, toppings", price: 9.5 },
          { name: "Sofritas Bowl", description: "Tofu, rice, beans, toppings", price: 8.5 },
          { name: "Veggie Bowl", description: "Fajita veggies, rice, beans, toppings", price: 8.0 },
          { name: "Chicken Burrito", description: "Wrapped in a flour tortilla", price: 8.5 },
          { name: "Steak Burrito", description: "Wrapped in a flour tortilla", price: 9.5 },
        ],
      },
    },
  });

  const panera = await prisma.restaurant.upsert({
    where: { name: "Panera Bread" },
    update: {},
    create: {
      name: "Panera Bread",
      menuItems: {
        create: [
          { name: "Mediterranean Veggie", description: "Hummus, roasted veggies, feta", price: 9.0 },
          { name: "Roasted Turkey", description: "Turkey, cranberry, herbs", price: 10.0 },
          { name: "Half Asian Sesame Chicken", description: "Chicken, sesame seeds", price: 9.5 },
          { name: "Baked Potato", description: "Loaded with toppings", price: 7.5 },
          { name: "Broccoli Cheddar Soup", description: "Cup or bowl", price: 5.0 },
          { name: "Tomato Soup", description: "Cup or bowl", price: 5.0 },
          { name: "Asiago Cheese Bagel", description: "Toasted with butter", price: 4.5 },
        ],
      },
    },
  });

  const jimmyJohns = await prisma.restaurant.upsert({
    where: { name: "Jimmy Johns" },
    update: {},
    create: {
      name: "Jimmy Johns",
      menuItems: {
        create: [
          { name: "Pepe", description: "Roast beef, provolone, mayo", price: 7.5 },
          { name: "Big John", description: "Roast beef, mayo, lettuce", price: 7.5 },
          { name: "Italian Nightclub", description: "Mortadella, salami, provolone", price: 8.5 },
          { name: "Hunter's Club", description: "Roast beef, turkey, bacon", price: 9.0 },
          { name: "Club Tuna", description: "Tuna salad, bacon, tomato", price: 8.5 },
          { name: "Vito", description: "Italian meats and cheese", price: 8.5 },
        ],
      },
    },
  });

  // Create test users
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@falconnorthwest.com" },
    update: {},
    create: {
      email: "admin@falconnorthwest.com",
      name: "Admin User",
      password: hashedPassword,
      role: "admin",
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: "employee@falconnorthwest.com" },
    update: {},
    create: {
      email: "employee@falconnorthwest.com",
      name: "John Employee",
      password: hashedPassword,
      role: "employee",
    },
  });

  console.log("Seed data created successfully!");
  console.log("Test credentials:");
  console.log("Admin: admin@falconnorthwest.com / password123");
  console.log("Employee: employee@falconnorthwest.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
