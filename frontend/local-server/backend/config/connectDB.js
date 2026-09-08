const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");
const os = require("os");

const dbDir = path.join(os.homedir(), ".shahid-book-depot");
fs.mkdirSync(dbDir, { recursive: true });
const dbFile = path.join(dbDir, "local-replica.db");

const client = createClient({
  url: `file:${dbFile}`,
  syncUrl: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_READONLY_TOKEN,
  syncInterval: 30,
});

async function checkConnection() {
  try {
    await client.sync();
    console.log("Local Turso replica synced.");
  } catch (error) {
    console.error("Local replica sync failed:", error.message);
  }
}
checkConnection();

const parseArgs = (args) => {
  if (args.length === 1 && (Array.isArray(args[0]) || typeof args[0] === "object")) {
    return args[0];
  }
  return args;
};

function makePrepare(executor) {
  return (sql) => ({
    all: async (...args) => {
      const res = await executor.execute({ sql, args: parseArgs(args) });
      return res.rows;
    },
    get: async (...args) => {
      const res = await executor.execute({ sql, args: parseArgs(args) });
      return res.rows[0] || null;
    },
    run: async (...args) => {
      const res = await executor.execute({ sql, args: parseArgs(args) });
      return { changes: res.rowsAffected, lastInsertRowid: res.lastInsertRowid };
    },
  });
}

const db = {
  execute: (stmt) => client.execute(stmt),
  prepare: makePrepare(client),
  sync: () => client.sync(),
};

module.exports = db;