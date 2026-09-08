const path = require("path");
const Database = require("better-sqlite3");

// Inside the packaged app, store the DB next to the app's writable data,
// not inside the read-only installed app folder.
const { app } = require("electron");
const DB_PATH = app && app.isPackaged
  ? path.join(app.getPath("userData"), "BookShop.db")
  : path.join(__dirname, "..", "..", "..", "..", "Backend", "BookShop.db"); // dev: points at Backend/BookShop.db// dev: points at Backend/BookShop.db

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

console.log(`[local-server] SQLite connected at ${DB_PATH}`);

function normalizeArgs(args) {
  if (args.length === 1 && (Array.isArray(args[0]) || (typeof args[0] === "object" && args[0] !== null))) {
    return Array.isArray(args[0]) ? args[0] : [args[0]];
  }
  return args;
}

function makePrepare(executor) {
  return (sql) => {
    const stmt = executor.prepare(sql);
    return {
      all: (...args) => stmt.all(...normalizeArgs(args)),
      get: (...args) => stmt.get(...normalizeArgs(args)),
      run: (...args) => {
        const info = stmt.run(...normalizeArgs(args));
        return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
      },
    };
  };
}

const db = {
  execute: (sql) => sqlite.exec(sql),
  prepare: makePrepare(sqlite),
  transaction: (fn) => {
    return async (...callArgs) => {
      const txDb = { prepare: makePrepare(sqlite) };
      sqlite.exec("BEGIN");
      try {
        const result = await fn(txDb, ...callArgs);
        sqlite.exec("COMMIT");
        return result;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    };
  },
};

module.exports = db;