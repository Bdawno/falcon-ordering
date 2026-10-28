async function main() {
  const [{ default: Database }, { default: path }] = await Promise.all([
    import("better-sqlite3"),
    import("node:path"),
  ]);
  const db = new Database(path.join(process.cwd(), "dev.db"));

  try {
    const row = db.prepare("PRAGMA table_info('Restaurant')").all();
    const hasMenuUrl = row.some((column) => column.name === "menuUrl");
    if (hasMenuUrl) {
      console.log("menuUrl column already exists in Restaurant table");
      return;
    }

    db.prepare("ALTER TABLE Restaurant ADD COLUMN menuUrl TEXT").run();
    console.log("Added menuUrl column to Restaurant table");
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error("Error altering Restaurant table:", error);
  process.exitCode = 1;
});
