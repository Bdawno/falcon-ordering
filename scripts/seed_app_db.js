async function main() {
  const [
    { default: Database },
    { randomUUID },
    { default: path },
  ] = await Promise.all([
    import("better-sqlite3"),
    import("node:crypto"),
    import("node:path"),
  ]);
  const db = new Database(path.join(process.cwd(), "dev.db"));

  function createRestaurant(id, name, menuUrl) {
    const existing = db.prepare("SELECT id FROM Restaurant WHERE name = ?").get(name);
    if (existing) return existing.id;
    db.prepare(
      "INSERT INTO Restaurant (id, name, menuUrl, createdAt, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    ).run(id, name, menuUrl || null);
    return id;
  }

  function createMenuItem(id, restaurantId, name, description, price) {
    const exists = db.prepare("SELECT id FROM Restaurant WHERE id = ?").get(restaurantId);
    if (!exists) {
      throw new Error(`Restaurant id not found for menu item: ${restaurantId} ${name}`);
    }
    const existingItem = db
      .prepare("SELECT id FROM MenuItem WHERE restaurantId = ? AND name = ?")
      .get(restaurantId, name);
    if (existingItem) return existingItem.id;

    db.prepare(
      "INSERT OR IGNORE INTO MenuItem (id, restaurantId, name, description, price, createdAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
    ).run(id, restaurantId, name, description || null, price);
  }

  try {
  // Sample restaurants
  const chipotleId = randomUUID();
  const chipotleActualId = createRestaurant(chipotleId, 'Chipotle', 'https://www.chipotle.com/menu');
  console.log('Chipotle id ->', chipotleActualId);
  const chipotleItems = [
    ['Chicken Bowl', 'Grilled chicken, rice, beans, toppings', 8.5],
    ['Steak Bowl', 'Steak, rice, beans, toppings', 9.5],
    ['Carnitas Bowl', 'Carnitas, rice, beans, toppings', 9.5],
  ];
  for (const [name, desc, price] of chipotleItems) {
    createMenuItem(randomUUID(), chipotleActualId, name, desc, price);
  }

  const paneraId = randomUUID();
  const paneraActualId = createRestaurant(paneraId, 'Panera Bread', 'https://www.panerabread.com/menu');
  console.log('Panera id ->', paneraActualId);
  const paneraItems = [
    ['Mediterranean Veggie', 'Hummus, roasted veggies, feta', 9.0],
    ['Roasted Turkey', 'Turkey, cranberry, herbs', 10.0],
  ];
  for (const [name, desc, price] of paneraItems) {
    createMenuItem(randomUUID(), paneraActualId, name, desc, price);
  }

  const subwayId = randomUUID();
  const subwayActualId = createRestaurant(subwayId, 'Subway', 'https://www.subway.com/en-us/menu');
  console.log('Subway id ->', subwayActualId);
  const subwayItems = [
    ['Italian BMT', 'Pepperoni, ham, salami on 6-inch bread', 7.5],
    ['Turkey Breast', 'Fresh sliced turkey on 6-inch bread', 7.0],
  ];
  for (const [name, desc, price] of subwayItems) {
    createMenuItem(randomUUID(), subwayActualId, name, desc, price);
  }

  const davesId = randomUUID();
  const davesActualId = createRestaurant(
    davesId,
    "Dave's Hot Chicken",
    "https://daveshotchicken.com/menu/283791"
  );
  const davesItems = [
    ["Dave's #1: 2 Tenders & Fries", "Two chicken tenders with crinkle-cut fries.", 15.99],
    ["Dave's #2: 2 Sliders & Fries", "Two chicken sliders with crinkle-cut fries.", 17.99],
    ["Dave's #3: Slider, Tender & Fries", "One chicken slider, one tender, and crinkle-cut fries.", 16.99],
    ["Single Slider", "Chicken slider with kale slaw, pickles, and Dave's sauce.", 8.99],
    ["Single Tender", "Hand-breaded chicken tender.", 6.99],
    ["Crinkle-Cut Fries", "Seasoned crinkle-cut fries.", 4.99],
  ];
  for (const [name, desc, price] of davesItems) {
    createMenuItem(randomUUID(), davesActualId, name, desc, price);
  }

  console.log('Seeded app dev.db with sample restaurants and menu items');
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error("Error seeding app DB:", error);
  process.exitCode = 1;
});
