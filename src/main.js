
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { spawn } = require("node:child_process");

const DEFAULTS = {
  gameDirectory: "",
  javaPath: "",
  minMemory: 2048,
  maxMemory: 4096,
  checkUpdates: true,
  developmentMode: true
};

let settingsQueue = Promise.resolve();

function settingsFile() {
  return path.join(app.getPath("userData"), "settings.json");
}

async function readSettings() {
  try {
    const data = JSON.parse(await fs.readFile(settingsFile(), "utf8"));
    return { ...DEFAULTS, ...data };
  } catch {
    return { ...DEFAULTS };
  }
}

async function saveSettings(value) {
  const settings = {
    gameDirectory: String(value.gameDirectory || "").slice(0, 2048),
    javaPath: String(value.javaPath || "").slice(0, 2048),
    minMemory: Number(value.minMemory),
    maxMemory: Number(value.maxMemory),
    checkUpdates: Boolean(value.checkUpdates),
    developmentMode: Boolean(value.developmentMode)
  };

  const validMemory = n =>
    Number.isInteger(n) && n >= 512 && n <= 65536;

  if (
    !validMemory(settings.minMemory) ||
    !validMemory(settings.maxMemory) ||
    settings.minMemory > settings.maxMemory
  ) {
    throw new Error("Memory must be between 512 and 65536 MB, with minimum no greater than maximum.");
  }

  const file = settingsFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(settings, null, 2), "utf8");
  return settings;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: "#0b0e14",
    title: "Fireball Launcher",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

function pythonStatus() {
  return new Promise(resolve => {
    const script = path.join(__dirname, "..", "python", "fireball_helper.py");
    const candidates = process.env.FIREBALL_PYTHON
      ? [process.env.FIREBALL_PYTHON]
      : process.platform === "win32"
        ? ["py", "python"]
        : ["python3", "python"];

    function tryAt(i) {
      if (i >= candidates.length) {
        resolve({
          available: false,
          message: "Python was not found. The launcher UI still works."
        });
        return;
      }

      const command = candidates[i];
      const args = command === "py"
        ? ["-3", script, "--status"]
        : [script, "--status"];

      let output = "";
      let settled = false;
      let child;

      try {
        child = spawn(command, args, {
          windowsHide: true,
          stdio: ["ignore", "pipe", "ignore"]
        });
      } catch {
        tryAt(i + 1);
        return;
      }

      child.stdout.on("data", chunk => output += chunk.toString());
      child.on("error", () => {
        if (!settled) {
          settled = true;
          tryAt(i + 1);
        }
      });
      child.on("close", code => {
        if (settled) return;
        settled = true;

        if (code === 0) {
          try {
            resolve(JSON.parse(output));
          } catch {
            resolve({
              available: true,
              message: "Python returned an unreadable status."
            });
          }
        } else {
          tryAt(i + 1);
        }
      });
    }

    tryAt(0);
  });
}

function choosePath(properties, filters) {
  return async () => {
    const result = await dialog.showOpenDialog({
      properties,
      ...(filters ? { filters } : {})
    });
    return result.canceled ? null : result.filePaths[0] || null;
  };
}

ipcMain.handle("fireball:get-status", async () => ({
  appVersion: app.getVersion(),
  runtimeBridge: "in-development",
  gameplayLaunchAvailable: false,
  python: await pythonStatus()
}));

ipcMain.handle("fireball:play", async () => ({
  ok: false,
  code: "BRIDGE_NOT_READY",
  message: "The Minecraft runtime bridge is still in development. Gameplay launch is not available in this build."
}));

ipcMain.handle("fireball:settings:get", () => readSettings());

ipcMain.handle("fireball:settings:save", async (_event, value) => {
  // Serialize writes to prevent overlapping saves.
  const operation = settingsQueue.then(() => saveSettings(value));
  settingsQueue = operation.catch(() => {});
  return operation;
});

ipcMain.handle(
  "fireball:settings:pick-directory",
  choosePath(["openDirectory", "createDirectory"])
);

ipcMain.handle(
  "fireball:settings:pick-java",
  choosePath(
    ["openFile"],
    process.platform === "win32"
      ? [{ name: "Java executable", extensions: ["exe", "bat", "cmd"] }]
      : [{ name: "Executable files", extensions: ["*"] }]
  )
);

ipcMain.handle("fireball:settings:detect-java", async () => {
  const candidates = process.platform === "win32"
    ? ["java.exe", "java"]
    : ["java"];

  for (const command of candidates) {
    const found = await new Promise(resolve => {
      let child;
      try {
        child = spawn(
          process.platform === "win32" ? "where.exe" : "which",
          [command],
          { windowsHide: true, stdio: ["ignore", "pipe", "ignore"] }
        );
      } catch {
        resolve("");
        return;
      }

      let output = "";
      child.stdout.on("data", chunk => output += chunk.toString());
      child.on("error", () => resolve(""));
      child.on("close", code => resolve(code === 0 ? output.trim().split(/\r?\n/)[0] : ""));
    });

    if (found) return { found: true, path: found };
  }

  return { found: false, path: "", message: "Java was not found on PATH." };
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
