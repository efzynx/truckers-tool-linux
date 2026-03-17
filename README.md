# 🚛 Truckers Tool Linux
### The Ultimate Save Editor for ETS2 & ATS

A sophisticated, web-based save editor specifically designed for **Euro Truck Simulator 2** and **American Truck Simulator** on Linux. Modify your profile, manage your fleet, and secure your progress with a modern Glassmorphism interface.

[🇮🇩 Baca dalam Bahasa Indonesia](README-ID.md)

<div align="center">
  <br />
  <video src="https://github.com/user-attachments/assets/5e24ae57-1105-4c20-9898-d50ba566b7ee" width="100%" autoplay muted loop style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); shadow: 0 20px 50px rgba(0,0,0,0.5);"></video>
  <br />
  <p><i>A video preview of the Truckers Tool Linux interface.</i></p>
  <br />

  ![Platform](https://img.shields.io/badge/Platform-Linux-blue?style=for-the-badge&logo=linux)
  ![Version](https://img.shields.io/badge/Version-1.1.3--alpha.3-orange?style=for-the-badge)
  ![License](https://img.shields.io/badge/License-GPL--3.0-green?style=for-the-badge)
</div>

---

## 🌟 Key Highlights

### 🛡️ Data Integrity & Safety
*   **Triple-Check Validation:** Automatically verifies SII file structure (`{ }`) and headers (`SiiNunit`) before saving to prevent game crashes.
*   **Granular Restore System:** Don't just restore a profile—choose exactly which save slot to recover. Compare statistics (Money, XP, Skills, Assets) side-by-side before confirming.
*   **Automatic Backups:** Every modification creates a `.bak` copy of your profile folder.

### 💼 Elite Fleet Management
*   **Global Actions:** Repair and refuel your entire truck and trailer fleet with a single click.
*   **Custom License Plates:** Direct input for custom text while preserving original country formats.
*   **Garage Expansion:** Unlock and upgrade every garage on the map to "Large" instantly.

### 🗺️ World & Economy
*   **Map Discovery:** Instantly unlock all visited cities across the map.
*   **Economy Reset:** Advance game time to refresh the Freight Market and fix "No Jobs" bugs.
*   **Skill Matrix:** Maximize ADR, Long Distance, and other trucking skills instantly.

---

## 📋 System Requirements

| Requirement | Specification |
| :--- | :--- |
| **OS** | Linux (Ubuntu, Fedora, SteamOS/Steam Deck, etc.) |
| **Environment** | Native, Wine, or Proton (Steam) |
| **Runtime** | Node.js v18 or higher |
| **Game** | ETS2 / ATS (Must be closed during editing) |

---

## 🚀 Quick Start

### 1. Install & Setup
Run these commands in your terminal to get started:

```bash
# Download the installer
curl -fsSL https://raw.githubusercontent.com/efzynx/truckers-tool-linux/main/ttl.sh -o ttl.sh
chmod +x ttl.sh

# Run full setup (Install + Config + Start)
./ttl.sh -IS
```

### 2. Access the Dashboard
Open your browser and navigate to:
**`http://localhost:3214`**

---

## 🎮 How to Use

### A. Local Path Mode (Recommended for Desktop/Steam Deck)
1.  Select your Game (ETS2 or ATS).
2.  Paste your profiles path (e.g., `~/.steam/steam/steamapps/compatdata/227300/pfx/drive_c/users/steamuser/Documents/Euro Truck Simulator 2/profiles/`).
3.  Scan and choose your Driver Profile.
4.  Modify data and hit **Save** (bottom-right).

### B. Upload Mode (For Web Access)
1.  Select your Game.
2.  Upload your `game.sii` file or a `profiles.zip` archive.
3.  Edit your stats in the dashboard.
4.  Download the modified file and overwrite your local save.

---

## 🏗️ Tech Stack
*   **Frontend:** Next.js 16 + React 19 + TypeScript
*   **Styling:** Tailwind CSS v4 (Modern Glassmorphism)
*   **Backend:** Node.js Express (Private API)
*   **Decryption:** `@trucky/sii-decrypt-ts`

---

## ❤️ Support the Project
Truckers Tool Linux is free and open-source. Help keep the servers running and the coffee brewing!

[![Trakteer](https://img.shields.io/badge/Trakteer-Support%20Me-red?style=flat-square&logo=buymeacoffee&logoColor=white)](https://trakteer.id/efzyn/gift)
[![Saweria](https://img.shields.io/badge/Saweria-Donate-yellow?style=flat-square&logo=ko-fi&logoColor=black)](https://saweria.co/efzynx)

---

## 📝 License
Distributed under the **GNU GPLv3 License**. Feel free to use, modify, and share.

**SCS Software Disclaimer:** This tool is not affiliated with or endorsed by SCS Software. Use it at your own risk.
