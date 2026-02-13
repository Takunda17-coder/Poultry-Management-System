import { app, BrowserWindow, session, Menu } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createRequire } from "module";

import { registerIpcHandlers } from "./main/ipc/handlers.js";
import db from "./main/db/database.js";

// Import electron-updater using CommonJS require (it's a CommonJS module)
const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');

// Initialize update checker (only in production, skip in dev)
if (!process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL) {
  autoUpdater.checkForUpdatesAndNotify();
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Disable GPU acceleration to improve stability on Windows
app.disableHardwareAcceleration();

// NOTE: Windows dev builds show harmless Chromium cache warnings about disk_cache
// These are permission issues in the development environment and do NOT affect
// app functionality. The app runs perfectly despite these warnings.

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

// Check if running in developer mode
const isDeveloper = process.env.DEV_MODE === 'true' || process.env.NODE_ENV === 'development';

// Build application menu
const buildMenu = (mainWindow) => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
        ...(isDeveloper ? [
          { type: 'separator' },
          {
            label: 'Developer Tools',
            accelerator: 'F12',
            click: () => {
              mainWindow.webContents.toggleDevTools();
            },
          },
        ] : []),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            // You can create an about window here
            console.log('Poultry Management System v1.0.0');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
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

  // Set icon path using app.getAppPath() which returns the app directory
  const iconPath = path.join(app.getAppPath(), 'assets/icon.ico');
  console.log('Using icon from:', iconPath);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Build and set application menu
  buildMenu(win);

  // Open dev tools for developers in development mode
  if (isDeveloper && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools();
  }

  // Block developer tools shortcuts for non-developers
  if (!isDeveloper) {
    win.webContents.on('before-input-event', (event, input) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        input.control && input.shift && (input.key.toLowerCase() === 'i' || input.key.toLowerCase() === 'j' || input.key.toLowerCase() === 'c') ||
        input.key === 'F12'
      ) {
        event.preventDefault();
      }
    });
  }

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
