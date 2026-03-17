# 🚛 Truckers Tool Linux
### Editor Save Game Terbaik untuk ETS2 & ATS

Editor save game berbasis web yang canggih, dirancang khusus untuk **Euro Truck Simulator 2** dan **American Truck Simulator** di Linux. Modifikasi profil, kelola armada, dan amankan progres Anda dengan antarmuka Glassmorphism yang modern.

[🇺🇸 Read in English](README.md)

<div align="center">
  <br />
  <video src="https://github.com/user-attachments/assets/5e24ae57-1105-4c20-9898-d50ba566b7ee" width="100%" autoplay muted loop style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); shadow: 0 20px 50px rgba(0,0,0,0.5);"></video>
  <br />
  <p><i>Pratinjau video antarmuka Truckers Tool Linux.</i></p>
  <br />

  ![Platform](https://img.shields.io/badge/Platform-Linux-blue?style=for-the-badge&logo=linux)
  ![Version](https://img.shields.io/badge/Version-1.1.3--alpha.3-orange?style=for-the-badge)
  ![License](https://img.shields.io/badge/License-GPL--3.0-green?style=for-the-badge)
</div>

---

## 🌟 Sorotan Utama

### 🛡️ Integritas & Keamanan Data
*   **Validasi Triple-Check:** Memverifikasi struktur file SII (`{ }`) dan header (`SiiNunit`) secara otomatis sebelum menyimpan untuk mencegah game crash.
*   **Sistem Restore Granular:** Tidak sekadar mengembalikan profil—pilih slot save spesifik yang ingin dipulihkan. Bandingkan statistik (Uang, XP, Skill, Aset) secara langsung sebelum konfirmasi.
*   **Backup Otomatis:** Setiap modifikasi akan membuat salinan cadangan (`.bak`) dari folder profil Anda.

### 💼 Manajemen Armada Elit
*   **Aksi Global:** Perbaiki dan isi bensin seluruh armada truk dan trailer hanya dengan satu klik.
*   **Pelat Nomor Kustom:** Input teks kustom secara langsung dengan tetap mempertahankan format negara asal.
*   **Ekspansi Garasi:** Buka dan tingkatkan semua garasi di peta menjadi ukuran "Besar" seketika.

### 🗺️ Dunia & Ekonomi
*   **Penemuan Peta:** Buka kunci semua kota yang pernah dikunjungi di seluruh peta secara instan.
*   **Reset Ekonomi:** Majukan waktu game untuk menyegarkan daftar Freight Market dan memperbaiki bug "Tidak ada pekerjaan".
*   **Matriks Skill:** Maksimalkan ADR, Long Distance, dan skill supir lainnya dalam sekejap.

---

## 📋 Persyaratan Sistem

| Persyaratan | Spesifikasi |
| :--- | :--- |
| **OS** | Linux (Ubuntu, Fedora, SteamOS/Steam Deck, dll.) |
| **Environment** | Native, Wine, atau Proton (Steam) |
| **Runtime** | Node.js v18 atau lebih tinggi |
| **Game** | ETS2 / ATS (Harus ditutup saat mengedit) |

---

## 🚀 Instalasi Cepat

### 1. Pasang & Setup
Jalankan perintah ini di terminal Anda untuk memulai:

```bash
# Download installer
curl -fsSL https://raw.githubusercontent.com/efzynx/truckers-tool-linux/main/ttl.sh -o ttl.sh
chmod +x ttl.sh

# Jalankan setup lengkap (Install + Konfigurasi + Jalankan)
./ttl.sh -IS
```

### 2. Akses Dasbor
Buka browser dan navigasikan ke:
**`http://localhost:3214`**

---

## 🎮 Cara Penggunaan

### A. Mode Path Lokal (Direkomendasikan untuk Desktop/Steam Deck)
1.  Pilih Game Anda (ETS2 atau ATS).
2.  Tempel path profil Anda (contoh: `~/.steam/steam/steamapps/compatdata/227300/pfx/drive_c/users/steamuser/Documents/Euro Truck Simulator 2/profiles/`).
3.  Scan dan pilih Profil Supir Anda.
4.  Modifikasi data dan tekan **Simpan** (pojok kanan bawah).

### B. Mode Upload (Untuk Akses Web)
1.  Pilih Game Anda.
2.  Upload file `game.sii` atau arsip `profiles.zip`.
3.  Edit statistik Anda di dasbor.
4.  Unduh file yang telah dimodifikasi dan timpa save lokal Anda.

---

## 🏗️ Tech Stack
*   **Frontend:** Next.js 16 + React 19 + TypeScript
*   **Styling:** Tailwind CSS v4 (Modern Glassmorphism)
*   **Backend:** Node.js Express (API Privat)
*   **Dekripsi:** `@trucky/sii-decrypt-ts`

---

## ❤️ Dukung Proyek Ini
Truckers Tool Linux gratis dan open-source. Bantu kami menjaga server tetap berjalan dan kopi tetap tersedia!

[![Trakteer](https://img.shields.io/badge/Trakteer-Dukung%20Saya-red?style=flat-square&logo=buymeacoffee&logoColor=white)](https://trakteer.id/efzyn/gift)
[![Saweria](https://img.shields.io/badge/Saweria-Donasi-yellow?style=flat-square&logo=ko-fi&logoColor=black)](https://saweria.co/efzynx)

---

## 📝 Lisensi
Didistribusikan di bawah lisensi **GNU GPLv3**. Silakan gunakan, modifikasi, dan bagikan.

**SCS Software Disclaimer:** Alat ini tidak berafiliasi dengan atau didukung oleh SCS Software. Gunakan dengan risiko Anda sendiri.
