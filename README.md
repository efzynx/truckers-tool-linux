# 🚛 Truckers Tool Linux

A web-based save editor for **Euro Truck Simulator 2** and **American Truck Simulator** on Linux. Edit your profile data (money, XP, skills) directly from the browser — no Windows tools needed.

[🇮🇩 Baca dalam Bahasa Indonesia (Read in Indonesian)](README-ID.md)

![Dashboard Preview](https://img.shields.io/badge/Platform-Linux-blue?style=flat-square) ![Node](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square) ![Version](https://img.shields.io/badge/Version-1.0.1-green?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## ✨ Features

- 🎮 **Game Selection** — Support for ETS2 and ATS
- 📂 **Profile Scanner** — Auto-detect profiles from native or Wine/Proton paths
- 📤 **Upload Support** — Upload `.sii` or `.zip` files directly via browser (no local install required)
- 🔓 **Auto Decrypt** — Decrypt SCS binary save files on-the-fly
- 📊 **Dashboard** — View profile overview: level, XP, money, skills
- ⚡ **Quick Actions** — Fast actions like Inject €50k, Clear Debt, Add 10K XP
- 📥 **Download Edited File** — Download the edited file to place it back into your save game folder
- ✏️ **Profile Editor** — Edit money, experience points, and skill levels
- 💾 **Auto Backup** — Creates backup before any changes
- ⚙️ **Configurable** — All settings via `settings.yml` (port, SMTP, paths, upload limits)
- 🎨 **Pixel-Perfect Stitch UI** — Responsive Glassmorphism UI (Mobile & Desktop Full-width)
- 🌐 **Multilingual Support** — Available in English and Indonesian

## 📋 Prerequisites

- **Git**
- **Node.js** v18+ (script can install it automatically via nvm)
- **PM2** (optional, for production/server deployment)
- **ETS2/ATS** installed (native Linux, Wine, or Proton) — or simply upload your files

## 🚀 Quick Install

### 1. Download installer script

```bash
curl -fsSL https://raw.githubusercontent.com/efzynx/truckers-tool-linux/main/ttl.sh -o ttl.sh
chmod +x ttl.sh
```

### 2. Install Node.js (if not already installed)

```bash
# Via script (automatically uses nvm)
./ttl.sh node

# Or install manually:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24
```

### 3. Install & setup

```bash
# Just install
./ttl.sh install

# Setup settings.yml (interactive)
./ttl.sh setup

# Start web app
./ttl.sh start

# Or install + setup + start all at once
./ttl.sh -IS
```

Open your browser at **http://localhost:3214** 🎉

## ⚙️ Configuration (settings.yml)

All settings are stored in the `settings.yml` file. This file is **not pushed to GitHub** for security reasons.

### How to create:

```bash
# Automatic (interactive)
./ttl.sh setup

# Or manually
cp settings.example.yml settings.yml
nano settings.yml
```

### settings.yml Content:

```yaml
app:
  name: "Truckers Tool Linux"
  port_frontend: 3214          # Frontend port (Next.js)
  port_backend: 8097           # Backend API port (Express)

admin:
  email: "admin@example.com"   # Admin email
  contact: "Admin Name"        # Contact name

smtp:                          # SMTP relay (optional)
  host: "smtp.gmail.com"
  port: 587
  secure: false
  user: ""
  pass: ""

paths:                         # Default profile paths
  ets2: "~/Documents/Euro Truck Simulator 2/profiles/"
  ats: "~/Documents/American Truck Simulator/profiles/"

upload:                        # Upload limits
  max_file_size_mb: 50
  max_extracted_size_mb: 100
  temp_dir: "/tmp/truckers-tool-uploads"
```

## 🖥️ Production Deployment (PM2)

To run on a server/VPS:

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Setup settings
./ttl.sh setup

# 3. Build & start via PM2
npm run build
npm run pm2:start

# Monitoring
pm2 status                     # View status
pm2 logs                       # View logs
npm run pm2:restart            # Restart
npm run pm2:stop               # Stop
```

The PM2 config is located in `ecosystem.config.cjs` which automatically reads the port from `settings.yml`.

## 📖 Script Commands

| Command | Description |
|---|---|
| `./ttl.sh install` | Install app (clone repo + npm install) |
| `./ttl.sh setup` | Generate settings.yml (interactive) |
| `./ttl.sh start` | Run web app (PM2 if available, fallback npm start) |
| `./ttl.sh stop` | Stop app (PM2) |
| `./ttl.sh -IS` | Install + setup + start |
| `./ttl.sh node` | Install Node.js via nvm |
| `./ttl.sh check` | Check for updates from GitHub Releases |
| `./ttl.sh update` | Update to the latest version |
| `./ttl.sh version` | Show current version |
| `./ttl.sh help` | Show help |

## ▶️ How to Use

### Local Path Mode

1. **Welcome Screen** → Click "Start Editing"
2. **Select Game** → Choose ETS2 or ATS
3. **Enter Profile Path** → Paste the path to your profiles folder:

   | Install Type | Path |
   |---|---|
   | **Native Linux** | `~/Documents/Euro Truck Simulator 2/profiles` |
   | **Steam Proton** | `~/.steam/steam/steamapps/compatdata/227300/pfx/drive_c/users/steamuser/Documents/Euro Truck Simulator 2/profiles/` |
   | **Wine/Lutris** | `~/YOUR_GAMES_PATH_FOLDER/<prefix>/drive_c/users/<user>/Documents/Euro Truck Simulator 2/profiles/` |

4. **Scan & Select Profile** → Click "Scan Folder", choose a profile
5. **Backup** → Optionally create a backup (recommended!)
6. **Edit** → Modify money, XP, skills from the Dashboard tabs
7. **Save** → Click "Save" to save your changes

### File Upload Mode

1. **Welcome Screen** → Select Game
2. **Upload File Tab** → Choose one:
   - **game.sii** — Upload your save game file directly
   - **profiles.zip** — Compress the entire `profiles/` folder
   - **<profile_id>.zip** — Compress 1 profile folder
3. **Select Profile** → (for ZIP) Choose a profile from the list
4. **Select Save** → Choose the save data you want to edit
5. **Edit** → Modify money, XP, skills
6. **Download** → Click "Download File" and place it back into your save game folder

> ⚠️ **Important:** Always close the game before editing a save file.

## 🔄 Update

```bash
# Check if a new version is available
./ttl.sh check

# Update to the latest version
./ttl.sh update
```

Version checking is done via [GitHub Releases](https://github.com/efzynx/truckers-tool-linux/releases). Pre-releases are available as beta/tester versions.

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Express.js 5 + tsx |
| Decryption | [@trucky/sii-decrypt-ts](https://www.npmjs.com/package/@trucky/sii-decrypt-ts) |
| Process Manager | PM2 (production) |
| Config | settings.yml (js-yaml) |

## 📁 Project Structure

```
truckers-tool-linux/
├── ttl.sh                     # Installer & launcher script
├── settings.yml               # Config (not pushed, create via ./ttl.sh setup)
├── settings.example.yml       # Config template (pushed to GitHub)
├── ecosystem.config.cjs       # PM2 production config
├── server/                    # Backend API
│   ├── index.ts               # Express server entry
│   ├── routes/
│   │   ├── decrypt.ts         # Save file decryption
│   │   ├── profiles.ts        # Profile scanning & backup
│   │   ├── save.ts            # Parse, save, & download
│   │   ├── update.ts          # Update checker
│   │   └── upload.ts          # File upload handling
│   └── utils/
│       ├── parser.ts          # SII content parser
│       ├── settings.ts        # Settings loader (settings.yml)
│       └── uploadValidator.ts # Upload security validation
├── src/                       # Frontend React app
│   ├── App.tsx                # Main app state machine
│   ├── components/
│   │   ├── WelcomeScreen.tsx
│   │   ├── PathInput.tsx      # Local path + Upload tabs
│   │   ├── FileUpload.tsx     # Drag & drop upload
│   │   ├── ProfileList.tsx    # Local profiles
│   │   ├── SaveList.tsx       # Local saves (with filters)
│   │   ├── UploadProfileList.tsx  # ZIP profiles
│   │   ├── UploadSaveList.tsx     # ZIP saves (with filters)
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   └── editors/           # Tab editors
│   ├── hooks/useApi.ts        # API client
│   ├── types/index.ts         # TypeScript types
│   └── index.css              # Design system
├── next.config.ts             # Next.js config (reads settings.yml)
├── package.json
└── tsconfig.json
```

## 📝 License

MIT — feel free to use and modify.

## 🙏 Credits

- [SCS Software](https://scssoft.com/) — Euro Truck Simulator 2 & American Truck Simulator
- [@trucky/sii-decrypt-ts](https://www.npmjs.com/package/@trucky/sii-decrypt-ts) — SII file decryption library
