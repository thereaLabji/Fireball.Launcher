# Fireball Launcher — prototype

A dark Electron desktop shell for Fireball, with a Python helper status check and an optional placeholder for future PHP logic.

## Implemented
- Electron desktop window and dark home page
- Fireball project status panel
- PLAY button explains that gameplay launch is unavailable
- Python helper status check
- Placeholder navigation for Installations, and Mods
- Electron security defaults: context isolation, disabled renderer Node integration, preload IPC bridge, restrictive Content Security Policy
- Working Settings (NEW!)

## Not implemented
- Minecraft/Microsoft authentication
- Minecraft metadata resolution and downloads
- Java runtime installation/detection beyond Python-independent UI
- Fireball installation management or actual game launch
- Mod management, PHP integration, Minecraft runtime bridge

The PLAY button deliberately does not start Minecraft: the Fireball runtime bridge is still in development.

## Requirements
- Node.js 20+ recommended
- npm
- Python 3.10+ optional (needed for the local helper status check)

## Run on Windows
Open PowerShell in this folder:
```powershell
npm install
npm start
```
If Python cannot be found, set its executable path:
```powershell
$env:FIREBALL_PYTHON = "C:\\Python312\\python.exe"
npm start
```
The launcher also tries `py -3` and `python` automatically on Windows.

## Run on Linux
```bash
npm install
npm start
```
The app tries `python3`, then `python`. Override if needed:
```bash
FIREBALL_PYTHON=/usr/bin/python3 npm start
```

## Structure
```text
Fireball-Launcher/
├── package.json
├── src/
│   ├── main.js
│   ├── preload.js
│   └── renderer/
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── python/fireball_helper.py
└── php/README.md
```

## Planned next steps
1. Add profiles and a version selector.
2. Implement downloads from trusted official metadata and verify checksums.
3. Add Java detection and version-aware runtime selection.
4. Implement supported Microsoft/Minecraft authentication.
5. Add Fireball launch integration once its client entry point and bridge are ready.
6. Package and test on Windows and Linux.

Security: never store Microsoft passwords in launcher files, execute arbitrary downloads, or pass untrusted strings to a shell. Verify downloaded files against trusted metadata and hashes where available.
