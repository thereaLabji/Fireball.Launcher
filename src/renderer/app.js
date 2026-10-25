
const play = document.getElementById("play");
const playMessage = document.getElementById("play-message");
const pythonStatus = document.getElementById("python-status");
const toast = document.getElementById("toast");

const homePage = document.getElementById("page-home");
const settingsPage = document.getElementById("page-settings");
const navButtons = document.querySelectorAll("[data-page]");

const gameDirectory = document.getElementById("game-directory");
const javaPath = document.getElementById("java-path");
const minMemory = document.getElementById("min-memory");
const maxMemory = document.getElementById("max-memory");
const checkUpdates = document.getElementById("check-updates");
const developmentMode = document.getElementById("development-mode");

const DEFAULTS = {
  gameDirectory: "",
  javaPath: "",
  minMemory: 2048,
  maxMemory: 4096,
  checkUpdates: true,
  developmentMode: true
};

let toastTimer;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 4500);
}

function showPage(page) {
  const isSettings = page === "Settings";

  homePage.hidden = isSettings;
  settingsPage.hidden = !isSettings;

  navButtons.forEach(button => {
    const active = button.dataset.page === page ||
      (!isSettings && button.dataset.page === "Home");

    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });

  document.querySelector("header strong").textContent =
    isSettings ? "SETTINGS" : "HOME";

  if (isSettings) loadSettings();
}

function readForm() {
  return {
    gameDirectory: gameDirectory.value.trim(),
    javaPath: javaPath.value.trim(),
    minMemory: Number(minMemory.value),
    maxMemory: Number(maxMemory.value),
    checkUpdates: checkUpdates.checked,
    developmentMode: developmentMode.checked
  };
}

function fillForm(settings) {
  gameDirectory.value = settings.gameDirectory || "";
  javaPath.value = settings.javaPath || "";
  minMemory.value = settings.minMemory ?? DEFAULTS.minMemory;
  maxMemory.value = settings.maxMemory ?? DEFAULTS.maxMemory;
  checkUpdates.checked = settings.checkUpdates ?? true;
  developmentMode.checked = settings.developmentMode ?? true;
}

async function loadSettings() {
  try {
    fillForm(await window.fireball.settings.get());
  } catch (error) {
    notify(`Could not load settings: ${error.message}`);
  }
}

async function refreshStatus() {
  pythonStatus.innerHTML = '<i class="dot"></i> CHECKING';

  try {
    const status = await window.fireball.getStatus();

    if (status.python?.available) {
      pythonStatus.innerHTML = '<i class="dot green"></i> AVAILABLE';
    } else {
      pythonStatus.innerHTML = '<i class="dot amber"></i> NOT FOUND';
    }

    pythonStatus.title = status.python?.message || "";
  } catch {
    pythonStatus.innerHTML = '<i class="dot amber"></i> UNAVAILABLE';
  }
}

play.addEventListener("click", async () => {
  playMessage.textContent =
    "Gameplay launch is disabled until the Minecraft runtime bridge is implemented.";

  try {
    notify((await window.fireball.play()).message);
  } catch {
    notify("Could not check launch status.");
  }
});

document.getElementById("refresh").addEventListener("click", refreshStatus);

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    const page = button.dataset.page;

    if (page === "Home" || page === "Settings") {
      showPage(page);
    } else {
      notify(`${page} is planned for a future version.`);
    }
  });
});

document.getElementById("pick-directory").addEventListener("click", async () => {
  try {
    const selected = await window.fireball.settings.pickDirectory();
    if (selected) gameDirectory.value = selected;
  } catch {
    notify("Could not open the directory picker.");
  }
});

document.getElementById("pick-java").addEventListener("click", async () => {
  try {
    const selected = await window.fireball.settings.pickJava();
    if (selected) javaPath.value = selected;
  } catch {
    notify("Could not open the Java picker.");
  }
});

document.getElementById("detect-java").addEventListener("click", async () => {
  try {
    const result = await window.fireball.settings.detectJava();

    if (result.found) {
      javaPath.value = result.path;
      notify("Java executable found. Save settings to keep this path.");
    } else {
      notify(result.message || "Java was not found. Browse to it manually.");
    }
  } catch {
    notify("Java detection failed.");
  }
});

document.getElementById("save-settings").addEventListener("click", async () => {
  const settings = readForm();

  if (
    !Number.isInteger(settings.minMemory) ||
    !Number.isInteger(settings.maxMemory) ||
    settings.minMemory < 512 ||
    settings.minMemory > 65536 ||
    settings.maxMemory < 512 ||
    settings.maxMemory > 65536 ||
    settings.maxMemory < settings.minMemory
) {
        notify("Enter valid memory values: 512–65536 MB, minimum no greater than maximum.");
        return;
  }

  try {
    await window.fireball.settings.save(settings);
    notify("Fireball settings saved successfully.");
  } catch (error) {
    notify(error.message || "Could not save settings.");
  }
});

document.getElementById("reset-settings").addEventListener("click", () => {
  fillForm(DEFAULTS);
  notify("Defaults restored in the form. Press Save settings to keep them.");
});

refreshStatus();
