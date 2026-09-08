const fs = require("fs");
const path = require("path");

const BACKEND_SRC = path.join(__dirname, "..", "..", "Backend");
const DEST = path.join(__dirname, "..", "local-server", "backend");
const foldersToSync = ["controllers", "routes", "middlewares"];

for (const folder of foldersToSync) {
  const src = path.join(BACKEND_SRC, folder);
  const dest = path.join(DEST, folder);
  if (fs.existsSync(src)) {
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(src, dest, { recursive: true });
    console.log(`Synced ${folder}`);
  } else {
    console.warn(`Skipped missing folder: ${folder}`);
  }
}
console.log("Backend sync complete. local-server/backend/config was left untouched.");