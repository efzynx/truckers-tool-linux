# 🚛 Truckers Tool Linux

A web-based save editor for **Euro Truck Simulator 2** and **American Truck Simulator** on Linux. Edit your profile data (money, XP, skills) directly from the browser — no Windows tools needed.

[🇮🇩 Baca dalam Bahasa Indonesia (Read in Indonesian)](README-ID.md)
[📖 Full Documentation (English)](https://github.com/efzynx/ttl-docs)

<div align="center">
  <video src="https://github.com/user-attachments/assets/5e24ae57-1105-4c20-9898-d50ba566b7ee" width="100%" autoplay muted loop></video>
</div>

![Platform](https://img.shields.io/badge/Platform-Linux-blue?style=flat-square) ![Node](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square) ![Version](https://img.shields.io/badge/Version-1.1.3-brightgreen?style=flat-square) ![License](https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square)

## ✨ Features

- 🎮 **Game Selection** — Support for ETS2 and ATS
- 📂 **Profile Scanner** — Auto-detect profiles from native or Wine/Proton paths
- 📤 **Upload Support** — Upload `.sii` or `.zip` files directly via browser (no local install required)
- 🔓 **Auto Decrypt** — Decrypt SCS binary save files on-the-fly
- 🛡️ **Data Integrity** — "Triple-Check" validation system ensuring SII file structure and headers remain valid before saving to prevent corruption.
- ⏪ **Advanced Profile Restore** — Powerful restore feature with manual save slot selector, detailed stats comparison (Diff), and granular (per-slot) or full profile recovery options.
- 📊 **Dashboard** — View profile overview: level, XP, money, skills
- ⚡ **Quick Actions** — Fast actions like Inject €50k, Clear Debt, Add 10K XP
- 📥 **Download Edited File** — Download the edited file to place it back into your save game folder
- ✏️ **Profile Editor** — Edit money, experience points, and skill levels
- 🚚 **Trailer Editor** — View and repair all owned trailers (cargo damage & body wear)
- 🗺️ **Map Discovery Editor** — Unlock all visited cities on the map
- 💾 **Save Confirmation Modal** — Review all pending changes before writing to save file
- ↩️ **Undo History** — Up to 20 levels of undo (`Ctrl+Z`)
- 🔔 **Save Success Notification** — Toast confirmation after every save (Consistent UI)
- 🐛 **GitHub Issues Reporter** — Report bugs directly from the app with auto-filled version info
- 💾 **Auto Backup** — Creates backup before any changes
- ⚙️ **Configurable** — All settings via `settings.yml` (port, paths, upload limits)
- 🎨 **Pixel-Perfect Stitch UI** — Responsive Glassmorphism UI (Mobile & Desktop Full-width)
- 🌐 **Multilingual Support** — Fully available in English and Indonesian

## 📋 Prerequisites

- **Git**
- **Node.js** v18+ (script can install it automatically via nvm)
- **PM2** (optional, for production/server deployment)
- **ETS2/ATS** installed (native Linux, Wine, or Proton) — or simply upload your files

## 🚀 Quick Start

### 1. Download installer script

```bash
curl -fsSL https://raw.githubusercontent.com/efzynx/truckers-tool-linux/main/ttl.sh -o ttl.sh
chmod +x ttl.sh
```

### 2. Install Node.js (if not already installed)

```bash
./ttl.sh node
```

### 3. Install & setup

```bash
# Install + setup + start all at once
./ttl.sh -IS
```

Open your browser at **http://localhost:3214** 🎉

## ⚙️ Configuration (settings.yml)

All settings are stored in the `settings.yml` file. This file is **not pushed to GitHub** for security reasons.

```yaml
app:
  name: "Truckers Tool Linux"
  port_frontend: 3214          # Frontend port (Next.js)
  port_backend: 8097           # Backend API port (Express)
```

## 🖥️ Production Deployment (PM2)

To run on a server/VPS:

```bash
npm run build
npm run pm2:start
```

## 📖 Script Commands

| Command | Description |
|---|---|
| `./ttl.sh install` | Install app (clone repo + npm install) |
| `./ttl.sh setup` | Generate settings.yml (interactive) |
| `./ttl.sh start` | Run web app (PM2 if available, fallback npm start) |
| `./ttl.sh stop` | Stop app (PM2) |
| `./ttl.sh -IS` | Install + setup + start |
| `./ttl.sh node` | Install Node.js via nvm |
| `./ttl.sh update` | Update to the latest version |

## ▶️ How to Use

### Local Path Mode
1. **Welcome Screen** → Click "Start Editing"
2. **Select Game** → Choose ETS2 or ATS
3. **Enter Profile Path** → Paste the path to your profiles folder
4. **Scan & Select Profile** → Choose a profile
5. **Edit & Save** → Modify data and hit the Save button (bottom-right).

### File Upload Mode
1. **Welcome Screen** → Select Game
2. **Upload File Tab** → Choose `.sii` or `.zip` file
3. **Edit & Download** → Modify stats and click "Download File".

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Node.js Express (Private API) |
| Decryption | [@trucky/sii-decrypt-ts](https://www.npmjs.com/package/@trucky/sii-decrypt-ts) |

## 📁 Project Structure

```
truckers-tool-linux/
├── server/                    # Backend API (Express)
│   ├── routes/
│   │   ├── profiles.ts        # Backup, Restore & Scan logic
│   │   └── save.ts            # SII Manipulation logic
│   └── utils/
│       └── parser.ts          # Line-Scanner & Integrity System
├── src/                       # Frontend app (Next.js)
│   ├── components/
│   │   ├── Dashboard.tsx      # Main Interface
│   │   ├── ProfileList.tsx    # Profile Selector with Toast
│   │   └── RestoreCompareModal.tsx # Advanced Restore UI
│   └── hooks/useApi.ts        # API Client
├── package.json
└── README.md
```

## ❤️ Support the Project

[![Trakteer](https://img.shields.io/badge/Trakteer-Support%20Me-red?style=flat-square&logo=buymeacoffee&logoColor=white)](https://trakteer.id/efzyn/gift)
[![Saweria](https://img.shields.io/badge/Saweria-Donate-yellow?style=flat-square&logo=ko-fi&logoColor=black)](https://saweria.co/efzynx)

## 📝 License

GNU GPLv3 — feel free to use and modify.
