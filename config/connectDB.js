require("dotenv").config();
const { createClient } = require("@libsql/client");

const client = createClient({
    url: "file:BookShop.db",
});

async function checkConnection() {
  try {
    await client.execute("SELECT 1");
    console.log("Turso SQLite connected successfully.");
  } catch (error) {
    console.error("Turso SQLite connection failed:", error.message);
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
      return {
        changes: res.rowsAffected,
        lastInsertRowid: res.lastInsertRowid,
      };
    },
  });
}

const db = {
  execute: (stmt) => client.execute(stmt),
  prepare: makePrepare(client),
  transaction: (fn) => {
    return async (...callArgs) => {
      const tx = await client.transaction("write");
      const txDb = { prepare: makePrepare(tx) };
      try {
        const result = await fn(txDb, ...callArgs);
        await tx.commit();
        return result;
      } catch (error) {
        await tx.rollback();
        throw error;
      } finally {
        tx.close();
      }
    };
  },
};

module.exports = db;