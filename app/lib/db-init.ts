import { initializeDatabase } from "./db";

// Initialize database on import
try {
  initializeDatabase();
  console.log("✓ Database initialized successfully");
} catch (error) {
  console.error("✗ Failed to initialize database:", error);
}
