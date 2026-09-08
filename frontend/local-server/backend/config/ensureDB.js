const fs = require("fs");
const path = require("path");
const { app } = require("electron");

function ensureDbExists() {
  if (!app || !app.isPackaged) return; // dev mode already points at the real file directly

  const userDataDb = path.join(app.getPath("userData"), "BookShop.db");
  const seedDb = path.join(process.resourcesPath, "BookShop.db");

  if (!fs.existsSync(userDataDb) && fs.existsSync(seedDb)) {
    fs.copyFileSync(seedDb, userDataDb);
    console.log(`Seeded database into ${userDataDb}`);
  }
}

module.exports = { ensureDbExists };