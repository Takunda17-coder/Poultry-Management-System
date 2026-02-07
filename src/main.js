import { app, BrowserWindow, session } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { registerIpcHandlers } from "./main/ipc/handlers.js";
import db from "./main/db/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Silence GPU/cache noise on Windows
app.disableHardwareAcceleration();

// Set Content Security Policy
const setCsp = () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDev = MAIN_WINDOW_VITE_DEV_SERVER_URL ? true : false;
    const scriptSrc = isDev 
      ? "'self' 'wasm-unsafe-eval' 'unsafe-inline'" 
      : "'self' 'wasm-unsafe-eval'";
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:;`,
        ],
      },
    });
  });
};

async function createWindow() {
  // Initialize database
  try {
    await db.initialize();
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }

  // Register IPC handlers
  registerIpcHandlers();

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  /**
   * IMPORTANT:
   * Forge + Vite injects these globals.
   * They already point to src/main/renderer/src correctly.
   * DO NOT hardcode paths.
   */
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    // Dev mode → Vite dev server
    await win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    // Production build → compiled renderer
    await win.loadFile(
      path.join(
        __dirname,
        `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
      )
    );
  }
}

app.whenReady().then(() => {
  setCsp();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
