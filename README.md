# 🚛 Truckers Tool Linux

A web-based save editor for **Euro Truck Simulator 2** and **American Truck Simulator** on Linux. Edit your profile data (money, XP, skills) directly from the browser — no Windows tools needed.

![Dashboard Preview](https://img.shields.io/badge/Platform-Linux-blue?style=flat-square) ![Node](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## ✨ Features

- 🎮 **Game Selection** — Support for ETS2 and ATS
- 📂 **Profile Scanner** — Auto-detect profiles from native or Wine/Proton paths
- 🔓 **Auto Decrypt** — Decrypt SCS binary save files on-the-fly
- 📊 **Dashboard** — View profile overview: level, XP, money, skills
- ✏️ **Profile Editor** — Edit money, experience points, and skill levels
- 💾 **Auto Backup** — Creates backup before any changes
- 🎨 **Dark Theme** — Glassmorphism UI with smooth animations

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **ETS2/ATS** installed (native Linux, Wine, or Proton)

## 🚀 Quick Install (Recommended)

Download and run the installer script:

```bash
# Download the installer
curl -fsSL https://raw.githubusercontent.com/efzynx/truckers-tool-linux/main/ttl.sh -o ttl.sh
chmod +x ttl.sh

# Install (clone repo + npm install)
./ttl.sh -i

# Start the web app
./ttl.sh -S
```

Open your browser at **http://localhost:5173**

### Script Commands

| Command | Deskripsi |
|---|---|
| `./ttl.sh -i` | Install (clone + npm install) |
| `./ttl.sh -S` | Start / jalankan web app |
| `./ttl.sh -u` | Cek apakah ada update |
| `./ttl.sh -UI` | Update ke versi terbaru |
| `./ttl.sh -h` | Tampilkan bantuan |

### Manual Install (Alternative)

```bash
git clone https://github.com/efzynx/truckers-tool-linux.git
cd truckers-tool-linux
npm install
npm run dev
```

## ▶️ Usage

### Step-by-step:

1. **Welcome Screen** → Click "Start Editing"
2. **Select Game** → Choose ETS2 or ATS
3. **Enter Profile Path** → Paste the path to your profiles folder:

   | Install Type | Path |
   |---|---|
   | **Native Linux** | `~/Documents/Euro Truck Simulator 2/profiles` |
   | **Steam Proton** | `~/.steam/steam/steamapps/compatdata/227300/pfx/drive_c/users/steamuser/Documents/Euro Truck Simulator 2/profiles/` |
   | **Wine/Lutris** | `~/YOUR_GAMES_PATH_FOLDER/<prefix>/drive_c/users/<user>/Documents/Euro Truck Simulator 2/profiles/` |

4. **Scan & Select Profile** → Click "Scan Folder", then pick your profile
5. **Backup** → Optionally create a backup (recommended!)
6. **Edit** → Modify money, XP, skills from the Dashboard tabs
7. **Save** → Click "Save" to apply changes

> ⚠️ **Important:** Always close the game before editing save files. The tool edits the **autosave** (latest save) by default.

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Backend | Express.js + tsx |
| Decryption | [@trucky/sii-decrypt-ts](https://www.npmjs.com/package/@trucky/sii-decrypt-ts) |

## 📁 Project Structure

```
truckers-tool-linux/
├── server/                  # Backend API
│   ├── index.ts             # Express server entry
│   ├── routes/
│   │   ├── decrypt.ts       # Save file decryption
│   │   ├── profiles.ts      # Profile scanning & backup
│   │   └── save.ts          # Parse & save changes
│   └── utils/
│       └── parser.ts        # SII content parser
├── src/                     # Frontend React app
│   ├── components/
│   │   ├── WelcomeScreen.tsx
│   │   ├── GameSelector.tsx
│   │   ├── PathInput.tsx
│   │   ├── ProfileList.tsx
│   │   ├── BackupDialog.tsx
│   │   ├── Dashboard.tsx
│   │   └── editors/         # Tab editors
│   ├── hooks/useApi.ts      # API client
│   ├── types/index.ts       # TypeScript types
│   └── index.css            # Design system
├── public/images/            # Game hero images
├── package.json
└── vite.config.ts
```

## 📝 License

MIT — feel free to use and modify.

## 🙏 Credits

- [SCS Software](https://scssoft.com/) — Euro Truck Simulator 2 & American Truck Simulator
- [@trucky/sii-decrypt-ts](https://www.npmjs.com/package/@trucky/sii-decrypt-ts) — SII file decryption library
