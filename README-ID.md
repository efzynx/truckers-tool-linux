# 🚛 Truckers Tool Linux

Editor save game berbasis web untuk **Euro Truck Simulator 2** dan **American Truck Simulator** di Linux. Edit data profil Anda (uang, XP, skill) langsung dari browser — tanpa perlu alat pihak ketiga dari Windows.

![Dashboard Preview](https://img.shields.io/badge/Platform-Linux-blue?style=flat-square) ![Node](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square) ![Version](https://img.shields.io/badge/Version-1.0.1--beta.1.1-orange?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## ✨ Fitur

- 🎮 **Pilihan Game** — Mendukung modifikasi untuk ETS2 dan ATS
- 📂 **Pemindai Profil** — Mendeteksi profil otomatis dari path native Linux atau dari environment instalasi Wine/Proton
- 📤 **Dukungan Upload** — Upload file `.sii` atau `.zip` langsung via browser (tanpa perlu install lokal)
- 🔓 **Dekripsi Otomatis** — Mendekripsi file save binary SCS secara otomatis (on-the-fly) tanpa software luar
- 📊 **Dasbor Pintar** — Menampilkan ringkasan profil dengan lengkap: level, XP, uang, dan skill
- ⚡ **Aksi Cepat** — Tombol instan kontrol sistem seperti Inject €50k, Lunasi Hutang Bank, Tambah 10.000 XP, dan Maksimalkan Semua Skill
- 📥 **Unduh Hasil Edit** — Download file hasil edit (`game.sii`) untuk ditaruh kembali ke folder permainan
- ✏️ **Editor Terpadu** — Mengedit jumlah uang, experience point (XP), status pekerjaan, dan garasi secara bebas
- 💾 **Backup Otomatis** — Membuat salinan (`.bak`) sebelum file asli dimodifikasi
- ⚙️ **Konfigurasi Mudah** — Semua setting dapat diatur via file `settings.yml` (port, lokasi target, batas penyimpanan RAM unggahan upload)
- 🎨 **Antarmuka (UI) Pixel-Perfect Stitch** — Memanfaatkan gaya Glassmorphism modern yang interaktif, mewah dan responsif baik di desktop maupun layar sentuh (mobile).

## 📋 Persyaratan Sistem

- **Git**
- **Node.js** v18+ (script bisa install otomatis via nvm)
- **PM2** (opsional, untuk production/server deployment)
- **ETS2/ATS** installed (native Linux, Wine, or Proton) — atau upload file langsung

## 🚀 Instalasi Cepat

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

paths:                         # Default profile paths
  ets2: "~/Documents/Euro Truck Simulator 2/profiles/"
  ats: "~/Documents/American Truck Simulator/profiles/"

upload:                        # Upload limits
  max_file_size_mb: 50
  max_extracted_size_mb: 100
  temp_dir: "/tmp/truckers-tool-uploads"
```

## 🖥️ Deployment Server (PM2)

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

## 📖 Perintah Skrip (Script Commands)

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

1. **Layar Utama** → Pilih Permainan (Game)
2. **Pilih Mode** → Buka tab Upload atau Path Lokal
3. **Masukkan Path Profil** → Paste path ke folder profiles:

   | Jenis Instalasi | Path |
   |---|---|
   | **Native Linux** | `~/Documents/Euro Truck Simulator 2/profiles` |
   | **Steam Proton** | `~/.steam/steam/steamapps/compatdata/227300/pfx/drive_c/users/steamuser/Documents/Euro Truck Simulator 2/profiles/` |
   | **Wine/Lutris** | `~/YOUR_GAMES_PATH_FOLDER/<prefix>/drive_c/users/<user>/Documents/Euro Truck Simulator 2/profiles/` |

4. **Scan & Pilih Profil** → Klik "Scan Profil", kemudian pilih profilnya.
5. **Backup** → Opsional untuk mencentang mode pembuatan salinan cadangan (backup) jika menggunakan local path.
6. **Edit** → Modifikasi nilai Uang, XP, atau skill di halaman Dashboard tab manapun
7. **Simpan** → Tekan ikon disket atau tekan tombol "Simpan Perubahan/Save Changes"

### Mode Upload File

1. **Layar Utama** → Pilih Permainan
2. **Tab Upload File** → Pilih salah satu dari metode ini:
   - **game.sii** — Upload langsung satu buah file save game
   - **profiles.zip** — Kompres seluruh folder `profiles/` ke ZIP
   - **<profile_id>.zip** — Kompres 1 folder profile dalam profile ke bentuk ZIP
3. **Pilih Profil target** → (Khusus ZIP) Pilih profil dari daftar
4. **Pilih Save target** → Pilih save data mana (jalur riwayat game) yang ingin dimanipulasi
5. **Edit** → Lakukan editing data di Dashboard
6. **Download** → Terakhir klik "Download game.sii" dan salin/timpah ke folder save game aslinya di komputer.

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
| Backend | Di-host secara private (Repository Terpisah) |
| Desktop App | Electron + React |
| Decryption | [@trucky/sii-decrypt-ts](https://www.npmjs.com/package/@trucky/sii-decrypt-ts) |
| Config | settings.yml (js-yaml) |

## 📁 Project Structure

```
truckers-tool-linux/
├── ttl.sh                     # Installer & launcher script
├── settings.yml               # Config (tidak di-push, buat via ./ttl.sh setup)
├── settings.example.yml       # Template settings (di-push ke GitHub)
├── ecosystem.config.cjs       # PM2 production config
├── electron/                  # Proses utama Aplikasi Desktop Electron
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

## ❤️ Dukung Proyek Ini

Truckers Tool Linux gratis dan open-source. Jika tool ini bermanfaat, pertimbangkan untuk mendukung biaya server dan pengembangan!

[![Trakteer](https://img.shields.io/badge/Trakteer-Dukung%20Saya-red?style=flat-square&logo=buymeacoffee&logoColor=white)](https://trakteer.id/efzyn/gift)
[![Saweria](https://img.shields.io/badge/Saweria-Donasi-yellow?style=flat-square&logo=ko-fi&logoColor=black)](https://saweria.co/efzynx)

> Server backend API butuh biaya hosting. Dukunganmu membuat proyek ini tetap hidup! 🚛

## 📝 License


MIT — feel free to use and modify.

## 🙏 Credits

- [SCS Software](https://scssoft.com/) — Euro Truck Simulator 2 & American Truck Simulator
- [@trucky/sii-decrypt-ts](https://www.npmjs.com/package/@trucky/sii-decrypt-ts) — SII file decryption library
