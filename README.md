# 🚛 Truckers Tool Linux

A web-based save editor for **Euro Truck Simulator 2** and **American Truck Simulator** on Linux. Edit your profile data (money, XP, skills) directly from the browser — no Windows tools needed.

![Dashboard Preview](https://img.shields.io/badge/Platform-Linux-blue?style=flat-square) ![Node](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square) ![Version](https://img.shields.io/badge/Version-1.0.1--beta.1.1-orange?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## ✨ Features

- 🎮 **Game Selection** — Support for ETS2 and ATS
- 📂 **Profile Scanner** — Auto-detect profiles from native or Wine/Proton paths
- 📤 **Upload Support** — Upload `.sii` or `.zip` file langsung via browser (tanpa install lokal)
- 🔓 **Auto Decrypt** — Decrypt SCS binary save files on-the-fly
- 📊 **Dashboard** — View profile overview: level, XP, money, skills
- ⚡ **Quick Actions** — Fast actions like Inject €50k, Clear Debt, Add 10K XP
- 📥 **Download Edited** — Download file hasil edit untuk ditaruh kembali ke folder save game
- ✏️ **Profile Editor** — Edit money, experience points, and skill levels
- 💾 **Auto Backup** — Creates backup before any changes
- ⚙️ **Configurable** — Semua setting via `settings.yml` (port, SMTP, paths, upload limits)
- 🎨 **Pixel-Perfect Stitch UI** — Responsive Glassmorphism UI (Mobile & Desktop Full-width)

## 📋 Prerequisites

- **Git**
- **Node.js** v18+ (script bisa install otomatis via nvm)
- **PM2** (opsional, untuk production/server deployment)
- **ETS2/ATS** installed (native Linux, Wine, or Proton) — atau upload file langsung

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

### 3. Install & setup

```bash
# Install saja
./ttl.sh install

# Setup settings.yml (interaktif)
./ttl.sh setup

# Start web app
./ttl.sh start

# Atau install + setup + start sekaligus
./ttl.sh -IS
```

Buka browser di **http://localhost:3214** 🎉

## ⚙️ Konfigurasi (settings.yml)

Semua setting disimpan di file `settings.yml`. File ini **tidak di-push ke GitHub** untuk keamanan.

### Cara membuat:

```bash
# Otomatis (interaktif)
./ttl.sh setup

# Atau manual
cp settings.example.yml settings.yml
nano settings.yml
```

### Isi settings.yml:

```yaml
app:
  name: "Truckers Tool Linux"
  port_frontend: 3214          # Port frontend (Next.js)
  port_backend: 8097           # Port backend API (Express)

admin:
  email: "admin@example.com"   # Email admin
  contact: "Admin Name"        # Nama kontak

smtp:                          # SMTP relay (opsional)
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

Untuk menjalankan di server/VPS:

```bash
# 1. Install PM2 global
npm install -g pm2

# 2. Setup settings
./ttl.sh setup

# 3. Build & start via PM2
npm run build
npm run pm2:start

# Monitoring
pm2 status                    # Lihat status
pm2 logs                      # Lihat logs
npm run pm2:restart            # Restart
npm run pm2:stop               # Stop
```

PM2 config ada di `ecosystem.config.cjs` yang otomatis baca port dari `settings.yml`.

## 📖 Script Commands

| Command | Deskripsi |
|---|---|
| `./ttl.sh install` | Install app (clone repo + npm install) |
| `./ttl.sh setup` | Generate settings.yml (interaktif) |
| `./ttl.sh start` | Jalankan web app (PM2 jika ada, fallback npm start) |
| `./ttl.sh stop` | Stop app (PM2) |
| `./ttl.sh -IS` | Install + setup + start |
| `./ttl.sh node` | Install Node.js via nvm |
| `./ttl.sh check` | Cek update dari GitHub Releases |
| `./ttl.sh update` | Update ke versi terbaru |
| `./ttl.sh version` | Tampilkan versi saat ini |
| `./ttl.sh help` | Tampilkan bantuan |

## ▶️ Cara Penggunaan

### Mode Local Path

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

### Mode Upload File

1. **Welcome Screen** → Select Game
2. **Upload File Tab** → Pilih salah satu:
   - **game.sii** — Upload langsung file save game
   - **profiles.zip** — Kompres seluruh folder `profiles/`
   - **<profile_id>.zip** — Kompres 1 folder profile
3. **Pilih Profile** → (untuk ZIP) Pilih profile dari daftar
4. **Pilih Save** → Pilih save data yang ingin diedit
5. **Edit** → Ubah money, XP, skills
6. **Download** → Click "Download File" dan letakkan ke folder save game

> ⚠️ **Important:** Selalu tutup game sebelum mengedit save file.

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
├── settings.yml               # Config (tidak di-push, buat via ./ttl.sh setup)
├── settings.example.yml       # Template settings (di-push ke GitHub)
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
