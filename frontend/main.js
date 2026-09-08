import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import dotenv from "dotenv";

const require = createRequire(import.meta.url);
const { createLocalServer } = require("./local-server");
const { ensureDbExists } = require("./local-server/backend/config/ensureDB");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from an absolute path — process.cwd() is unreliable in a
// packaged app, so we anchor to resourcesPath (prod) or __dirname (dev).
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, ".env")
  : path.join(__dirname, ".env");

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error(`Failed to load .env from ${envPath}:`, result.error.message);
} else {
  console.log(`Loaded .env from ${envPath}`);
}

app.setAboutPanelOptions({
  applicationName: "Shahid Book Depot",
  applicationVersion: "1.0.0",
  authors: ["Khuzaima Khalid"],
  copyright: "Copyright © 2026 Trust Nexus / Khuzaima Khalid",
});

let mainWindow;
let localServer;

function startLocalServer() {
  ensureDbExists();
  const expressApp = createLocalServer();
  localServer = expressApp.listen(4321, "127.0.0.1", () => {
    console.log("Local server running on http://127.0.0.1:4321");
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Shahid Book Depot",
    show: false,
    resizable: true,
    icon: path.join(__dirname, "src/assets/logo.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.maximize();
  mainWindow.once("ready-to-show", () => mainWindow.show());

  const isDev = !app.isPackaged;
  const devUrl = process.env.ELECTRON_START_URL || "http://127.0.0.1:5173";

  if (isDev) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startLocalServer();
  createWindow();
});

app.on("window-all-closed", () => {
  if (localServer) localServer.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});