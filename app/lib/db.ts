import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize database schema
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      outOfOffice INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Restaurant (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS MenuItem (
      id TEXT PRIMARY KEY,
      restaurantId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurantId) REFERENCES Restaurant(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Order" (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      restaurantId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      totalPrice REAL NOT NULL DEFAULT 0,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id),
      FOREIGN KEY (restaurantId) REFERENCES Restaurant(id)
    );

    CREATE TABLE IF NOT EXISTS OrderItem (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      menuItemId TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      specialRequests TEXT,
      FOREIGN KEY (orderId) REFERENCES "Order"(id) ON DELETE CASCADE,
      FOREIGN KEY (menuItemId) REFERENCES MenuItem(id)
    );

    CREATE TABLE IF NOT EXISTS Setting (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_order_userId ON "Order"(userId);
    CREATE INDEX IF NOT EXISTS idx_order_status ON "Order"(status);
    CREATE INDEX IF NOT EXISTS idx_menuitem_restaurant ON MenuItem(restaurantId);
    CREATE INDEX IF NOT EXISTS idx_orderitem_order ON OrderItem(orderId);
  `);
}

// Helper functions for CRUD operations
export const users = {
  create: (data: { id: string; email: string; name: string; password: string; role: string }) => {
    const stmt = db.prepare(
      "INSERT INTO User (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)"
    );
    return stmt.run(data.id, data.email, data.name, data.password, data.role);
  },
  findByEmail: (email: string) => {
    const stmt = db.prepare("SELECT * FROM User WHERE email = ?");
    return stmt.get(email);
  },
  findById: (id: string) => {
    const stmt = db.prepare("SELECT * FROM User WHERE id = ?");
    return stmt.get(id);
  },
  findAll: () => {
    const stmt = db.prepare("SELECT * FROM User ORDER BY createdAt DESC");
    return stmt.all();
  },
  updateOutOfOffice: (id: string, outOfOffice: boolean) => {
    const stmt = db.prepare("UPDATE User SET outOfOffice = ? WHERE id = ?");
    return stmt.run(outOfOffice ? 1 : 0, id);
  },
};

export const restaurants = {
  create: (data: { id: string; name: string }) => {
    const stmt = db.prepare("INSERT INTO Restaurant (id, name) VALUES (?, ?)");
    return stmt.run(data.id, data.name);
  },
  findAll: () => {
    const stmt = db.prepare("SELECT * FROM Restaurant ORDER BY name");
    return stmt.all();
  },
  findWithMenuItems: (restaurantId: string) => {
    const restaurant = db.prepare("SELECT * FROM Restaurant WHERE id = ?").get(restaurantId);
    if (!restaurant) return null;
    const menuItems = db.prepare("SELECT * FROM MenuItem WHERE restaurantId = ? ORDER BY name").all(restaurantId);
    return { ...restaurant, menuItems };
  },
  delete: (restaurantId: string) => {
    const stmt = db.prepare("DELETE FROM Restaurant WHERE id = ?");
    return stmt.run(restaurantId);
  },
};

export const menuItems = {
  create: (data: { id: string; restaurantId: string; name: string; description?: string; price: number }) => {
    const stmt = db.prepare(
      "INSERT INTO MenuItem (id, restaurantId, name, description, price) VALUES (?, ?, ?, ?, ?)"
    );
    return stmt.run(data.id, data.restaurantId, data.name, data.description || null, data.price);
  },
  findByRestaurant: (restaurantId: string) => {
    const stmt = db.prepare("SELECT * FROM MenuItem WHERE restaurantId = ? ORDER BY name");
    return stmt.all(restaurantId);
  },
};

export const orders = {
  create: (data: { id: string; userId: string; restaurantId: string; notes?: string }) => {
    const stmt = db.prepare(
      "INSERT INTO \"Order\" (id, userId, restaurantId, totalPrice, notes) VALUES (?, ?, ?, ?, ?)"
    );
    return stmt.run(data.id, data.userId, data.restaurantId, 0, data.notes || null);
  },
  findById: (id: string) => {
    const stmt = db.prepare("SELECT * FROM \"Order\" WHERE id = ?");
    return stmt.get(id);
  },
  findByUser: (userId: string) => {
    const stmt = db.prepare("SELECT * FROM \"Order\" WHERE userId = ? ORDER BY createdAt DESC");
    return stmt.all(userId);
  },
  findAll: (filters?: { status?: string }) => {
    let query = 'SELECT * FROM "Order"';
    const params: any[] = [];
    if (filters?.status) {
      query += " WHERE status = ?";
      params.push(filters.status);
    }
    query += " ORDER BY createdAt DESC";
    const stmt = db.prepare(query);
    return params.length > 0 ? stmt.all(...params) : stmt.all();
  },
  updateStatus: (id: string, status: string) => {
    const stmt = db.prepare('UPDATE "Order" SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(status, id);
  },
  withItems: (orderId: string) => {
    const order = orders.findById(orderId);
    if (!order) return null;
    const rawItems = db
      .prepare(
        `SELECT oi.id, oi.orderId, oi.menuItemId, oi.quantity, oi.specialRequests, mi.name, mi.description, mi.price 
         FROM OrderItem oi 
         JOIN MenuItem mi ON oi.menuItemId = mi.id 
         WHERE oi.orderId = ?`
      )
      .all(orderId) as any[];
    
    const items = rawItems.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      specialRequests: item.specialRequests,
      menuItem: {
        id: item.menuItemId,
        name: item.name,
        description: item.description,
        price: item.price,
      },
    }));
    
    return { ...order, items };
  },
};

export const orderItems = {
  create: (data: { id: string; orderId: string; menuItemId: string; quantity: number; specialRequests?: string }) => {
    const stmt = db.prepare(
      "INSERT INTO OrderItem (id, orderId, menuItemId, quantity, specialRequests) VALUES (?, ?, ?, ?, ?)"
    );
    return stmt.run(data.id, data.orderId, data.menuItemId, data.quantity, data.specialRequests || null);
  },
  findByOrder: (orderId: string) => {
    const stmt = db.prepare(
      `SELECT oi.*, mi.name, mi.description, mi.price 
       FROM OrderItem oi 
       JOIN MenuItem mi ON oi.menuItemId = mi.id 
       WHERE oi.orderId = ?`
    );
    return stmt.all(orderId);
  },
};

export const settings = {
  get: (key: string) => {
    const stmt = db.prepare("SELECT value FROM Setting WHERE key = ?");
    const result = stmt.get(key) as any;
    return result?.value || null;
  },
  set: (key: string, value: string) => {
    const stmt = db.prepare(
      "INSERT OR REPLACE INTO Setting (key, value, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)"
    );
    return stmt.run(key, value);
  },
};

export const getWeeklyRestaurant = () => {
  const restaurantId = settings.get("weekly_restaurant_id");
  if (!restaurantId) return null;
  const restaurant = restaurants.findWithMenuItems(restaurantId);
  return restaurant;
};

export const setWeeklyRestaurant = (restaurantId: string) => {
  return settings.set("weekly_restaurant_id", restaurantId);
};
