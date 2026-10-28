async function main() {
  const [{ PrismaClient }, { PrismaBetterSqlite3 }, bcryptModule] = await Promise.all([
    import("@prisma/client"),
    import("@prisma/adapter-better-sqlite3"),
    import("bcryptjs"),
  ]);
  const bcrypt = bcryptModule.default;
  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL || "file:./dev.db",
    }),
  });

  try {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const employeeEmail = process.env.SEED_EMPLOYEE_EMAIL;
  const employeePassword = process.env.SEED_EMPLOYEE_PASSWORD;
  if (!adminEmail || !adminPassword || !employeeEmail || !employeePassword) {
    throw new Error(
      "Set SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_EMPLOYEE_EMAIL, and SEED_EMPLOYEE_PASSWORD before seeding."
    );
  }

  // Create restaurants
  await prisma.restaurant.upsert({
    where: { name: "Chipotle" },
    update: {},
    create: {
      name: "Chipotle",
      menuUrl: "https://www.chipotle.com/menu",
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

  await prisma.restaurant.upsert({
    where: { name: "Panera Bread" },
    update: {},
    create: {
      name: "Panera Bread",
      menuUrl: "https://www.panerabread.com/menu",
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

  await prisma.restaurant.upsert({
    where: { name: "Jimmy Johns" },
    update: {},
    create: {
      name: "Jimmy Johns",
      menuUrl: "https://www.jimmyjohns.com/menu",
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
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  const hashedEmployeePassword = await bcrypt.hash(employeePassword, 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail.trim().toLowerCase() },
    update: {},
    create: {
      email: adminEmail.trim().toLowerCase(),
      name: "Admin User",
      password: hashedAdminPassword,
      role: "admin",
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: employeeEmail.trim().toLowerCase() },
    update: {},
    create: {
      email: employeeEmail.trim().toLowerCase(),
      name: "John Employee",
      password: hashedEmployeePassword,
      role: "employee",
    },
  });

  console.log("Seed data created successfully!");
  console.log(`Created admin account: ${adminUser.email}`);
  console.log(`Created employee account: ${employeeUser.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
