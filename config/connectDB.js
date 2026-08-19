const { createClient } = require("@libsql/client");

const db = createClient({
  url: "file:BookShop.db",
});

async function connectDB() {
    try {
      await db.execute("SELECT 1;");
      console.log("Connected to SQLite/Turso database successfully!");
    } catch (error) {
      console.error("Database connection error:", error);
    }
  }
  
module.exports = { db, connectDB };