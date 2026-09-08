import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { createLocalServer } = require("./local-server");

try {
  await import("dotenv/config");
} catch (e) {
  console.log("dotenv not loaded or running in production environment");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.setAboutPanelOptions({
  applicationName: "Shahid Book Depot",
  applicationVersion: "1.0.0",
  authors: ["Khuzaima Khalid"],
  copyright: "Copyright © 2026 Trust Nexus / Khuzaima Khalid",
});

let mainWindow;
let localServer;

function startLocalServer() {
  const expressApp = createLocalServer();
  localServer = expressApp.listen(4321, "127.0.0.1", () => {
    console.log("Local read server running on http://127.0.0.1:4321");
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
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.maximize();
  mainWindow.once("ready-to-show", () => mainWindow.show());

  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
  }

  mainWindow.on("closed", () => { mainWindow = null; });
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