# 🚛 Truckers Tool Linux

A web-based save editor for **Euro Truck Simulator 2** and **American Truck Simulator** on Linux. Edit your profile data (money, XP, skills) directly from the browser — no Windows tools needed.

![Dashboard Preview](https://img.shields.io/badge/Platform-Linux-blue?style=flat-square) ![Node](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square) ![Version](https://img.shields.io/badge/Version-1.0.0--beta.1-orange?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## ✨ Features

- 🎮 **Game Selection** — Support for ETS2 and ATS
- 📂 **Profile Scanner** — Auto-detect profiles from native or Wine/Proton paths
- 🔓 **Auto Decrypt** — Decrypt SCS binary save files on-the-fly
- 📊 **Dashboard** — View profile overview: level, XP, money, skills
- ⚡ **Quick Actions** — Fast actions like Inject €50k, Clear Debt, Add 10K XP
- ✏️ **Profile Editor** — Edit money, experience points, and skill levels
- 💾 **Auto Backup** — Creates backup before any changes
- 🎨 **Pixel-Perfect Stitch UI** — Responsive Glassmorphism UI (Mobile & Desktop Full-width)

## 📋 Prerequisites

- **Git**
- **Node.js** v18+ (script bisa install otomatis via nvm)
- **ETS2/ATS** installed (native Linux, Wine, or Proton)

## 🚀 Quick Install

### 1. Download installer script

```bash
curl -fsSL https://raw.githubusercontent.com/efzynx/truckers-tool-linux/main/ttl.sh -o ttl.sh
chmod +x ttl.sh
```

### 2. Install Node.js (jika belum ada)

```bash
# Via script (otomatis pakai nvm)
./ttl.sh node

# Atau install manual:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24
```

### 3. Install & jalankan

```bash
# Install saja
./ttl.sh install

# Start web app
./ttl.sh start

# Atau install + langsung start
./ttl.sh -IS
```

Buka browser di **http://localhost:5173** 🎉

## 📖 Script Commands

| Command | Deskripsi |
|---|---|
| `./ttl.sh install` | Install app (clone repo + npm install) |
| `./ttl.sh start` | Jalankan web app |
| `./ttl.sh -IS` | Install + langsung start |
| `./ttl.sh node` | Install Node.js via nvm |
| `./ttl.sh check` | Cek update dari GitHub Releases |
| `./ttl.sh update` | Update ke versi terbaru |
| `./ttl.sh version` | Tampilkan versi saat ini |
| `./ttl.sh help` | Tampilkan bantuan |

## ▶️ Cara Penggunaan

1. **Welcome Screen** → Click "Start Editing"
2. **Select Game** → Choose ETS2 or ATS
3. **Enter Profile Path** → Paste path ke folder profiles:

   | Install Type | Path |
   |---|---|
   | **Native Linux** | `~/Documents/Euro Truck Simulator 2/profiles` |
   | **Steam Proton** | `~/.steam/steam/steamapps/compatdata/227300/pfx/drive_c/users/steamuser/Documents/Euro Truck Simulator 2/profiles/` |
   | **Wine/Lutris** | `~/YOUR_GAMES_PATH_FOLDER/<prefix>/drive_c/users/<user>/Documents/Euro Truck Simulator 2/profiles/` |

4. **Scan & Select Profile** → Click "Scan Folder", pilih profile
5. **Backup** → Optionally create a backup (recommended!)
6. **Edit** → Ubah money, XP, skills dari Dashboard tabs
7. **Save** → Click "Save" untuk menyimpan perubahan

> ⚠️ **Important:** Selalu tutup game sebelum mengedit save file. Tool ini mengedit **autosave** (save terbaru) secara default.

## 🔄 Update

```bash
# Cek apakah ada versi baru
./ttl.sh check

# Update ke versi terbaru
./ttl.sh update
```

Versi dicek melalui [GitHub Releases](https://github.com/efzynx/truckers-tool-linux/releases). Pre-release tersedia sebagai versi beta/tester.

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
├── ttl.sh                   # Installer & launcher script
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
├── public/images/           # Game hero images
├── package.json
└── vite.config.ts
```

## 📝 License

MIT — feel free to use and modify.

## 🙏 Credits

- [SCS Software](https://scssoft.com/) — Euro Truck Simulator 2 & American Truck Simulator
- [@trucky/sii-decrypt-ts](https://www.npmjs.com/package/@trucky/sii-decrypt-ts) — SII file decryption library
