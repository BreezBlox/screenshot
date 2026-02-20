# Screenshot Tool

Capture a full webpage from a URL into one file (`PNG` or `PDF`).

## Quick Start (Windows)

```powershell
.\capture-url.ps1 "https://example.com" -Format png
.\capture-url.ps1 "https://example.com" -Format pdf
```

Output is saved to `captures\` by default.

## Optional Arguments

- `-Output "C:\path\file.png"`: save to a specific file path.
- `-DelaySeconds 4`: wait longer before capture.
- `-TimeoutSeconds 90`: navigation timeout.
- `-Width 1440 -Height 2200`: viewport size.
- `-NoAutoScroll`: disable pre-capture auto-scroll.

## CMD Usage

```cmd
capture-url.cmd "https://example.com" -Format png
```

## Notes

- Requires Node.js (`node` and `npm`).
- Uses an installed Chromium browser channel (`Microsoft Edge` first, then `Google Chrome`).
