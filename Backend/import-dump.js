// One-time script: imports dump.sql into BookShop.db
// Run with: node import-dump.js

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DUMP_PATH = path.join(__dirname, "dump.sql");
const DB_PATH = path.join(__dirname, "BookShop.db");

if (!fs.existsSync(DUMP_PATH)) {
  console.error(`Could not find dump.sql at ${DUMP_PATH}`);
  process.exit(1);
}

const sql = fs.readFileSync(DUMP_PATH, "utf8");

const db = new Database(DB_PATH);

console.log(`Importing ${DUMP_PATH} into ${DB_PATH} ...`);

try {
  db.exec(sql);
  console.log("Import complete.");
} catch (error) {
  console.error("Import failed:", error.message);
  process.exit(1);
} finally {
  db.close();
}