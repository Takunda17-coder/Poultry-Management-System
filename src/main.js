import { app, BrowserWindow, session, Menu, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { registerIpcHandlers } from "./main/ipc/handlers.js";
import db from "./main/db/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Disable GPU acceleration for Windows stability
app.disableHardwareAcceleration();

// Content Security Policy
const setCsp = () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDev = !!MAIN_WINDOW_VITE_DEV_SERVER_URL;
    const scriptSrc = isDev
      ? "'self' 'wasm-unsafe-eval' 'unsafe-inline'"
      : "'self' 'wasm-unsafe-eval' 'unsafe-inline' file:";

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          `default-src 'self' 'unsafe-inline' data: file:; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline' file:; font-src 'self' data: file:; img-src 'self' data: https: file:;`,
        ],
      },
    });
  });
};

// Detect dev mode
const isDeveloper =
  process.env.DEV_MODE === "true" || process.env.NODE_ENV === "development";

// Build application menu
const buildMenu = (mainWindow) => {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Backup Database",
          click: async () => {
            const { filePath } = await dialog.showSaveDialog(mainWindow, {
              title: "Backup Database",
              defaultPath: path.join(app.getPath("documents"), "poultry_backup.db"),
              filters: [{ name: "SQLite Database", extensions: ["db"] }],
            });

            if (filePath) {
              try {
                await db.backup(filePath);
                dialog.showMessageBox(mainWindow, {
                  type: "info",
                  title: "Backup Successful",
                  message: `Database saved to:\n${filePath}`,
                });
              } catch (error) {
                dialog.showErrorBox("Backup Failed", error.message);
              }
            }
          },
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "Redo", accelerator: "CmdOrCtrl+Y", role: "redo" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow.reload(),
        },
        {
          label: "Toggle Full Screen",
          accelerator: "F11",
          click: () =>
            mainWindow.setFullScreen(!mainWindow.isFullScreen()),
        },
        ...(isDeveloper
          ? [
            { type: "separator" },
            {
              label: "Developer Tools",
              accelerator: "F12",
              click: () => mainWindow.webContents.toggleDevTools(),
            },
          ]
          : []),
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About",
          click: () =>
            console.log("Poultry Management System v1.0.0"),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

async function createWindow() {
  // Init database
  try {
    await db.initialize();
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }

  registerIpcHandlers();

  // ✅ ASAR-safe icon path
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "assets", "icon.ico")
    : path.join(app.getAppPath(), "assets", "icon.ico");

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Security: Prevent navigation to external URLs
  win.webContents.on("will-navigate", (event, url) => {
    if (url !== win.webContents.getURL()) {
      event.preventDefault();
      console.warn("Blocked navigation to:", url);
    }
  });

  // Security: Prevent new window creation
  win.webContents.setWindowOpenHandler(({ url }) => {
    console.warn("Blocked new window:", url);
    return { action: "deny" };
  });

  buildMenu(win);

  // DevTools: Open only in development or if explicitly requested via menu
  if (!app.isPackaged) {
    win.webContents.openDevTools();
  }

  /**
   * IMPORTANT:
   * Forge + Vite injects these globals.
   * They already point to src/main/renderer/src correctly.
   * DO NOT hardcode paths.
   */
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    await win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    // Correct path resolution: .vite/build/main.js -> .vite/build/renderer/index.html
    await win.loadFile(
      path.join(__dirname, `renderer/index.html`)
    );
  }
}

app.whenReady().then(() => {
  setCsp();
  // Security: Block all permission requests (camera, mic, etc.)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    // Deny all permissions by default
    callback(false);
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
