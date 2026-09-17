// One-time script: copies your Turso database (schema + data) into a local SQLite file.
// Run with: node export-to-local.js
// Requires .env to have TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (same ones your app already uses).

require("dotenv").config();
const path = require("path");
const { createClient } = require("@libsql/client");
const Database = require("better-sqlite3");

const OUTPUT_DB_PATH = path.join(__dirname, "BookShop-fresh.db");

async function main() {
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const local = new Database(OUTPUT_DB_PATH);
  local.pragma("foreign_keys = OFF"); // off during import so table order doesn't matter

  console.log("Connected to Turso, reading schema...");

  // 1. Get every table's CREATE statement from Turso
  const tablesResult = await turso.execute(`
    SELECT name, sql FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%'
  `);

  const tables = tablesResult.rows;
  console.log(`Found ${tables.length} tables: ${tables.map(t => t.name).join(", ")}`);

  // 2. Recreate each table locally
  for (const table of tables) {
    if (!table.sql) continue; // skip auto-indexes etc with no CREATE statement
    try {
      local.exec(table.sql);
      console.log(`Created table: ${table.name}`);
    } catch (err) {
      console.warn(`Skipping create for ${table.name}: ${err.message}`);
    }
  }

  // 3. Copy every row from every table
  for (const table of tables) {
    const tableName = table.name;
    try {
      const dataResult = await turso.execute(`SELECT * FROM "${tableName}"`);
      const rows = dataResult.rows;

      if (rows.length === 0) {
        console.log(`${tableName}: 0 rows, skipping`);
        continue;
      }

      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => "?").join(", ");
      const insertSql = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders})`;
      const insertStmt = local.prepare(insertSql);

      const insertMany = local.transaction((rows) => {
        for (const row of rows) {
          insertStmt.run(...columns.map(c => row[c]));
        }
      });

      insertMany(rows);
      console.log(`${tableName}: imported ${rows.length} rows`);
    } catch (err) {
      console.warn(`Skipping data copy for ${tableName}: ${err.message}`);
    }
  }

  // 4. Copy views too (e.g. v_course_totals, v_stationary_totals used by your controllers)
  const viewsResult = await turso.execute(`
    SELECT name, sql FROM sqlite_master WHERE type = 'view'
  `);
  for (const view of viewsResult.rows) {
    if (!view.sql) continue;
    try {
      local.exec(view.sql);
      console.log(`Created view: ${view.name}`);
    } catch (err) {
      console.warn(`Skipping view ${view.name}: ${err.message}`);
    }
  }

  local.pragma("foreign_keys = ON");
  local.close();
  console.log(`\nDone. Local database written to: ${OUTPUT_DB_PATH}`);
  console.log("Open it in DB Browser for SQLite and check your pages/categories/sales tables before using it.");
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});