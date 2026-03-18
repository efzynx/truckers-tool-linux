# 🚛 Truckers Tool Linux

Editor save game berbasis web untuk **Euro Truck Simulator 2** dan **American Truck Simulator** di Linux. Edit data profil Anda (uang, XP, skill) langsung dari browser — tanpa perlu alat pihak ketiga dari Windows.

[🇺🇸 Read in English](README.md)
[📖 Dokumentasi Lengkap (Bahasa Indonesia)](https://docs.ttl.efzyn.my.id/id/)

<div align="center">
  <video src="https://github.com/user-attachments/assets/5e24ae57-1105-4c20-9898-d50ba566b7ee" width="100%" autoplay muted loop></video>
</div>

![Platform](https://img.shields.io/badge/Platform-Linux-blue?style=flat-square) ![Node](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square) ![Version](https://img.shields.io/badge/Version-1.1.3-brightgreen?style=flat-square) ![License](https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square)

## ✨ Fitur

- 🎮 **Pilihan Game** — Mendukung modifikasi untuk ETS2 dan ATS.
- 📂 **Pemindai Profil** — Mendeteksi profil otomatis dari path native Linux atau dari environment instalasi Wine/Proton.
- 📤 **Dukungan Upload** — Upload file `.sii` atau `.zip` langsung via browser (tanpa perlu install lokal).
- 🔓 **Dekripsi Otomatis** — Mendekripsi file save binary SCS secara otomatis (on-the-fly) tanpa software luar.
- 🛡️ **Integritas Data** — Sistem pengecekan "Triple-Check" untuk memastikan struktur file SII dan header tetap valid sebelum disimpan guna mencegah file korup.
- ⏪ **Pemulihan Profil Canggih** — Fitur Restore yang powerful dengan pemilih slot save manual, perbandingan statistik detail (Diff), dan opsi pemulihan granular (per-slot) atau profil penuh.
- 📊 **Dasbor Pintar** — Menampilkan ringkasan profil dengan lengkap: level, XP, uang, dan skill.
- ⚡ **Aksi Cepat** — Tombol instan kontrol sistem seperti Inject €50k, Lunasi Hutang Bank, Tambah 10.000 XP, dan Maksimalkan Semua Skill.
- 📥 **Unduh Hasil Edit** — Download file hasil edit (`game.sii`) untuk ditaruh kembali ke folder permainan.
- ✏️ **Editor Terpadu** — Mengedit jumlah uang, experience point (XP), status pekerjaan, dan garasi secara bebas.
- 💼 **Manajemen Pekerjaan** — Lihat kargo aktif, reset waktu tenggat, dan perbaiki kargo tanpa damage.
- 🚚 **Editor Trailer** — Tampilkan dan perbaiki semua trailer milik pemain (kerusakan muatan & badan trailer).
- 🔄 **Reset Ekonomi** — Segarkan daftar pekerjaan Freight Market seketika untuk mengatasi bug "tidak ada pekerjaan".
- 📝 **Pelat Nomor Kustom** — Personalisasi truk Anda dengan input pelat nomor kustom secara langsung.
- 🗺️ **Editor Peta** — Buka kunci semua kota yang pernah dikunjungi di seluruh peta secara instan.
- 💾 **Modal Konfirmasi Simpan** — Tinjau semua perubahan sebelum data ditulis ke save file.
- ↩️ **Riwayat Undo** — Hingga 20 level undo (`Ctrl+Z`).
- 🔔 **Notifikasi Simpan Berhasil** — Toast konfirmasi setelah setiap penyimpanan (Konsisten di semua fitur).
- 🐛 **Pelapor Bug GitHub Issues** — Laporkan bug langsung dari aplikasi dengan info versi terisi otomatis.
- 💾 **Backup Otomatis** — Membuat salinan (`.bak`) sebelum file asli dimodifikasi.
- 🌐 **Dukungan Multibahasa** — Tersedia dalam Bahasa Indonesia dan Inggris secara penuh.

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

### 2. Jalankan setup sekaligus

```bash
./ttl.sh -IS
```

Buka browser di **http://localhost:3214** 🎉

## 🖥️ Deployment Server (PM2)

Untuk menjalankan di server/VPS:

```bash
npm run build
npm run pm2:start
```

## ▶️ Cara Penggunaan

### Mode Local Path
1. Pilih Game → Masukkan Path Profil → Scan & Pilih Profil → Edit → Simpan.

### Mode Upload File
1. Pilih Game → Tab Upload → Unggah `.sii` atau `.zip` → Edit → Download.

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Node.js Express (API Privat) |
| Decryption | [@trucky/sii-decrypt-ts](https://www.npmjs.com/package/@trucky/sii-decrypt-ts) |

## 📁 Struktur Proyek

```
truckers-tool-linux/
├── server/                    # Backend API (Express)
│   ├── routes/
│   │   ├── profiles.ts        # Logika Profile, Backup, & Restore
│   │   └── save.ts            # Logika Manipulasi SII
│   └── utils/
│       └── parser.ts          # Engine Line-Scanner & Integrity Check
├── src/                       # Frontend React app
│   ├── components/
│   │   ├── Dashboard.tsx      # Dasbor Utama
│   │   ├── ProfileList.tsx    # List Profil dengan Notifikasi Sukses
│   │   └── RestoreCompareModal.tsx # Modal Perbandingan Restore & Selector
│   └── hooks/useApi.ts        # API Client untuk Fitur Baru
├── package.json
└── README.md
```

## ❤️ Dukung Proyek Ini

[![Trakteer](https://img.shields.io/badge/Trakteer-Dukung%20Saya-red?style=flat-square&logo=buymeacoffee&logoColor=white)](https://trakteer.id/efzyn/gift)
[![Saweria](https://img.shields.io/badge/Saweria-Donasi-yellow?style=flat-square&logo=ko-fi&logoColor=black)](https://saweria.co/efzynx)

## 📝 Lisensi

GNU GPLv3.
