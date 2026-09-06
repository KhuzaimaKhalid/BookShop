import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";

// Safely load dotenv without breaking packaged production builds
try {
  await import("dotenv/config");
} catch (e) {
  console.log("dotenv not loaded or running in production environment");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure app metadata
app.setAboutPanelOptions({
  applicationName: "Shahid Book Depot",
  applicationVersion: "1.0.0",
  authors: ["Khuzaima Khalid"],
  copyright: "Copyright © 2026 Trust Nexus / Khuzaima Khalid",
});

let mainWindow;

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
    },
  });

  mainWindow.maximize();

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  const startUrl = process.env.ELECTRON_START_URL;

  if (startUrl) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});