#!/usr/bin/env bash
#
# Truckers Tool Linux (TTL) — Installer & Launcher
# https://github.com/efzynx/truckers-tool-linux
#
# Usage:
#   ./ttl.sh install     Install app (clone + npm install)
#   ./ttl.sh setup       Generate settings.yml interaktif
#   ./ttl.sh start       Start web app (PM2 atau npm start)
#   ./ttl.sh stop        Stop PM2 processes
#   ./ttl.sh -IS         Install + setup + start
#   ./ttl.sh update      Update ke versi terbaru
#   ./ttl.sh check       Cek update dari GitHub Releases
#   ./ttl.sh version     Tampilkan versi saat ini
#   ./ttl.sh node        Install Node.js via nvm
#

set -e

# ─── Config ───────────────────────────────────────────────────────
REPO_OWNER="efzynx"
REPO_NAME="truckers-tool-linux"
REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
INSTALL_DIR="$HOME/.truckers-tool-linux"
MIN_NODE_VERSION=18

# Default ports (overridden by settings.yml)
DEFAULT_PORT_FRONTEND=3214
DEFAULT_PORT_BACKEND=8097

# Read version from package.json (single source of truth)
if [ -f "$INSTALL_DIR/package.json" ]; then
  CURRENT_VERSION=$(grep '"version"' "$INSTALL_DIR/package.json" | sed -E 's/.*"version":\s*"([^"]+)".*/\1/')
elif [ -f "$(dirname "$0")/package.json" ]; then
  CURRENT_VERSION=$(grep '"version"' "$(dirname "$0")/package.json" | sed -E 's/.*"version":\s*"([^"]+)".*/\1/')
else
  CURRENT_VERSION="unknown"
fi

# ─── Colors ───────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ─── Language System ──────────────────────────────────────────────
TTL_CONFIG_DIR="$HOME/.config/ttl"
TTL_LANG_FILE="$TTL_CONFIG_DIR/language"
TTL_LANG="en" # default

# Load saved language preference (if any)
pick_language() {
  mkdir -p "$TTL_CONFIG_DIR"
  if [ -f "$TTL_LANG_FILE" ]; then
    TTL_LANG=$(cat "$TTL_LANG_FILE")
    return
  fi
  echo ""
  echo -e "${CYAN}  ┌──────────────────────────────────────────┐"
  echo    "  │   Select language / Pilih bahasa Anda   │"
  echo    "  │   1) English (default)                  │"
  echo    "  │   2) Bahasa Indonesia                   │"
  echo -e "  └──────────────────────────────────────────┘${NC}"
  read -rp "  Choice / Pilihan [1/2]: " lang_choice
  if [ "$lang_choice" = "2" ]; then
    TTL_LANG="id"
  else
    TTL_LANG="en"
  fi
  echo "$TTL_LANG" > "$TTL_LANG_FILE"
  echo ""
}

# Change language directly (used by do_lang)
set_language() {
  local lang="$1"
  mkdir -p "$TTL_CONFIG_DIR"
  if [ "$lang" = "id" ] || [ "$lang" = "en" ]; then
    echo "$lang" > "$TTL_LANG_FILE"
    TTL_LANG="$lang"
    if [ "$lang" = "id" ]; then
      echo -e "${GREEN}[INFO]${NC} ✅ Bahasa berhasil diubah ke Bahasa Indonesia."
    else
      echo -e "${GREEN}[INFO]${NC} ✅ Language changed to English."
    fi
  else
    echo -e "${RED}[ERROR]${NC} Invalid language. Use: en or id"
    echo "  Example: ./ttl.sh lang en"
    echo "  Example: ./ttl.sh lang id"
    exit 1
  fi
}

# Dual-language message helper
# Usage: msg "English" "Indonesia"
msg() {
  if [ "$TTL_LANG" = "id" ]; then
    echo -e "$2"
  else
    echo -e "$1"
  fi
}

print_banner() {
  echo -e "${CYAN}"
  echo "  ╔══════════════════════════════════════════╗"
  echo "  ║     🚛  Truckers Tool Linux  v${CURRENT_VERSION}      ║"
  echo "  ║     ETS2 / ATS Save Editor for Linux    ║"
  echo "  ╚══════════════════════════════════════════╝"
  echo -e "${NC}"
}

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ─── Helpers ──────────────────────────────────────────────────────

check_command() {
  command -v "$1" &>/dev/null
}

check_node_version() {
  local node_ver
  node_ver=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
  if [ -z "$node_ver" ] || [ "$node_ver" -lt "$MIN_NODE_VERSION" ]; then
    return 1
  fi
  return 0
}

# Read a value from settings.yml (simple grep-based parser)
read_settings_value() {
  local key="$1"
  local default="$2"
  local settings_file

  if [ -f "$INSTALL_DIR/settings.yml" ]; then
    settings_file="$INSTALL_DIR/settings.yml"
  elif [ -f "$(dirname "$0")/settings.yml" ]; then
    settings_file="$(dirname "$0")/settings.yml"
  else
    echo "$default"
    return
  fi

  local value
  value=$(grep -E "^\s*${key}:" "$settings_file" 2>/dev/null | head -1 | sed -E 's/.*:\s*"?([^"]*)"?\s*$/\1/' | tr -d '"')
  if [ -n "$value" ]; then
    echo "$value"
  else
    echo "$default"
  fi
}

# Fetch latest release version from GitHub API
get_latest_version() {
  local api_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest"
  local version
  version=$(curl -fsSL "$api_url" 2>/dev/null | grep '"tag_name"' | head -1 | sed -E 's/.*"tag_name":\s*"[vV]?([^"]+)".*/\1/')
  echo "$version"
}

# Fetch latest beta version from GitHub API
get_latest_beta() {
  local api_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases"
  local json
  json=$(curl -fsSL "$api_url" 2>/dev/null)
  local tag
  tag=$(echo "$json" | grep -B5 '"prerelease": true' | grep '"tag_name"' | grep -i 'beta' | head -1 | sed -E 's/.*"tag_name":\s*"([^"]+)".*/\1/')
  local version
  version=$(echo "$tag" | sed -E 's/^[vV]//')
  echo "$version"
}

# Get the raw tag name for a beta release (with v prefix)
get_latest_beta_tag() {
  local api_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases"
  local tag
  tag=$(curl -fsSL "$api_url" 2>/dev/null | grep -B5 '"prerelease": true' | grep '"tag_name"' | grep -i 'beta' | head -1 | sed -E 's/.*"tag_name":\s*"([^"]+)".*/\1/')
  echo "$tag"
}

# Fetch latest alpha version from GitHub API
get_latest_alpha() {
  local api_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases"
  local json
  json=$(curl -fsSL "$api_url" 2>/dev/null)
  local tag
  tag=$(echo "$json" | grep -B5 '"prerelease": true' | grep '"tag_name"' | grep -i 'alpha' | head -1 | sed -E 's/.*"tag_name":\s*"([^"]+)".*/\1/')
  local version
  version=$(echo "$tag" | sed -E 's/^[vV]//')
  echo "$version"
}

# Get the raw tag name for an alpha release (with v prefix)
get_latest_alpha_tag() {
  local api_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases"
  local tag
  tag=$(curl -fsSL "$api_url" 2>/dev/null | grep -B5 '"prerelease": true' | grep '"tag_name"' | grep -i 'alpha' | head -1 | sed -E 's/.*"tag_name":\s*"([^"]+)".*/\1/')
  echo "$tag"
}

# Compare semantic versions: returns 0 if $1 < $2
version_lt() {
  [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$1" ] && [ "$1" != "$2" ]
}

# ─── Install Node.js ─────────────────────────────────────────────

do_install_node() {
  print_banner

  if check_command node && check_node_version; then
    info "$(msg "Node.js is already installed: $(node -v)" "Node.js sudah terinstall: $(node -v)")"
    read -rp "$(msg "Reinstall via nvm? (y/N): " "Install ulang via nvm? (y/N): ")" confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
      return 0
    fi
  fi

  info "$(msg "Installing Node.js via nvm..." "Menginstall Node.js via nvm...")"
  echo ""

  # Install nvm
  if [ ! -d "$HOME/.nvm" ]; then
    info "$(msg "Downloading nvm..." "Mengunduh nvm...")"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  else
    info "$(msg "nvm is already installed." "nvm sudah terinstall.")"
  fi

  # Load nvm
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

  # Install Node.js
  info "$(msg "Downloading and installing Node.js..." "Mengunduh dan menginstall Node.js...")"
  nvm install 24
  echo ""

  info "✅ $(msg "Node.js installed!" "Node.js terinstall!")"
  echo -e "  Node: ${BOLD}$(node -v)${NC}"
  echo -e "  npm:  ${BOLD}$(npm -v)${NC}"
  echo ""
}

# ─── Setup Settings ──────────────────────────────────────────────

do_setup() {
  local target_dir
  if [ -d "$INSTALL_DIR" ]; then
    target_dir="$INSTALL_DIR"
  else
    target_dir="$(cd "$(dirname "$0")" && pwd)"
  fi

  print_banner
  msg "📝 Setup settings.yml configuration" "📝 Setup konfigurasi settings.yml"
  echo ""

  local settings_file="$target_dir/settings.yml"

  if [ -f "$settings_file" ]; then
    warn "$(msg "settings.yml already exists at: $settings_file" "settings.yml sudah ada di: $settings_file")"
    read -rp "$(msg "Overwrite? (y/N): " "Timpa? (y/N): ")" confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
      info "$(msg "Setup cancelled." "Setup dibatalkan.")"
      return 0
    fi
  fi

  # ── Gather settings interactively ──
  echo -e "${BOLD}── App Configuration ──${NC}"
  read -rp "Port frontend [${DEFAULT_PORT_FRONTEND}]: " port_fe
  port_fe="${port_fe:-$DEFAULT_PORT_FRONTEND}"
  read -rp "Port backend [${DEFAULT_PORT_BACKEND}]: " port_be
  port_be="${port_be:-$DEFAULT_PORT_BACKEND}"
  echo ""

  echo -e "${BOLD}── Game Paths ──${NC}"
  local default_ets2="~/Documents/Euro Truck Simulator 2/profiles/"
  local default_ats="~/Documents/American Truck Simulator/profiles/"
  read -rp "ETS2 profiles path [${default_ets2}]: " path_ets2
  path_ets2="${path_ets2:-$default_ets2}"
  read -rp "ATS profiles path [${default_ats}]: " path_ats
  path_ats="${path_ats:-$default_ats}"
  echo ""

  echo -e "${BOLD}── Upload Limits ──${NC}"
  read -rp "Max upload size MB [50]: " max_upload
  max_upload="${max_upload:-50}"
  read -rp "Max extracted size MB [100]: " max_extracted
  max_extracted="${max_extracted:-100}"
  echo ""

  # ── Write settings.yml ──
  cat > "$settings_file" <<SETTINGSEOF
# Truckers Tool Linux — Settings
# Generated by ./ttl.sh setup on $(date '+%Y-%m-%d %H:%M:%S')

app:
  name: "Truckers Tool Linux"
  port_frontend: ${port_fe}
  port_backend: ${port_be}

paths:
  ets2: "${path_ets2}"
  ats: "${path_ats}"

upload:
  max_file_size_mb: ${max_upload}
  max_extracted_size_mb: ${max_extracted}
  temp_dir: "/tmp/truckers-tool-uploads"
SETTINGSEOF

  info "$(msg "✅ settings.yml created successfully!" "✅ settings.yml berhasil dibuat!")"
  echo -e "  $(msg "Location:" "Lokasi:") ${BOLD}${settings_file}${NC}"
  echo -e "  Frontend: ${BOLD}http://localhost:${port_fe}${NC}"
  echo -e "  Backend:  ${BOLD}http://localhost:${port_be}${NC}"
  echo ""
}

# ─── Install Desktop (AppImage) ──────────────────────────────────────────────────────

do_install_desktop() {
  info "$(msg "Starting Desktop App (AppImage) installation..." "Memulai instalasi Desktop App (AppImage)...")"
  echo ""

  # 1. Check Node.js via NVM (v24)
  info "$(msg "Checking Node.js v24 dependency..." "Memeriksa dependensi Node.js v24...")"
  export NVM_DIR="$HOME/.nvm"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck disable=SC1091
    \. "$NVM_DIR/nvm.sh"
  fi
  
  if ! command -v node &>/dev/null || [ "$(node -v | cut -d. -f1)" != "v24" ]; then
    info "$(msg "Downloading and installing nvm..." "Mengunduh dan memasang nvm...")"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    # shellcheck disable=SC1091
    \. "$HOME/.nvm/nvm.sh"
    info "$(msg "Installing Node.js v24..." "Memasang Node.js v24...")"
    nvm install 24
  else
    info "$(msg "Node.js v24 is already installed." "Node.js v24 sudah terinstall.")"
  fi

  # 2. Package Detection and Download
  echo ""
  local pkg_ext="AppImage"
  local native_pkg=""
  if [ -f /etc/os-release ]; then
    # shellcheck disable=SC1091
    source /etc/os-release
    if [[ "$ID" == "arch" || "$ID_LIKE" == *"arch"* ]]; then
      native_pkg="pacman"
      info "$(msg "Detected Arch Linux." "Terdeteksi Arch Linux.")"
    elif [[ "$ID" == "debian" || "$ID" == "ubuntu" || "$ID_LIKE" == *"debian"* || "$ID_LIKE" == *"ubuntu"* ]]; then
      native_pkg="deb"
      info "$(msg "Detected Debian/Ubuntu-based Linux." "Terdeteksi Debian/Ubuntu Linux.")"
    elif [[ "$ID" == "fedora" || "$ID" == "centos" || "$ID_LIKE" == *"fedora"* || "$ID_LIKE" == *"rhel"* || "$ID_LIKE" == *"suse"* ]]; then
      native_pkg="rpm"
      info "$(msg "Detected RHEL/Fedora/SUSE-based Linux." "Terdeteksi RHEL/Fedora/SUSE Linux.")"
    fi
  fi

  if [ -n "$native_pkg" ]; then
    echo "  1) Native Package (.$native_pkg) - $(msg 'Recommended' 'Rekomendasi')"
    echo "  2) AppImage"
    read -rp "$(msg 'Choice [1/2] (default: 1): ' 'Pilihan [1/2] (default: 1): ')" pkg_choice
    if [ "$pkg_choice" = "2" ]; then
      pkg_ext="AppImage"
    else
      pkg_ext="$native_pkg"
    fi
  else
    pkg_ext="AppImage"
    info "$(msg "Unknown distribution. Proceeding with AppImage." "Distribusi tidak diketahui. Melanjutkan dengan AppImage.")"
  fi

  # 3. Select Version
  echo ""
  msg "Select version to download:" "Pilih versi yang ingin diunduh:"
  echo "  1) Stable ($(msg 'Recommended' 'Rekomendasi'))"
  echo "  2) Beta (Pre-release)"
  echo "  3) Alpha ($(msg 'Experimental' 'Eksperimental'))"
  read -rp "$(msg 'Choice [1/2/3] (default: 1): ' 'Pilihan [1/2/3] (default: 1): ')" ver_choice
  
  local version_type="stable"
  if [ "$ver_choice" = "2" ]; then
    version_type="beta"
  elif [ "$ver_choice" = "3" ]; then
    version_type="alpha"
  fi
  
  echo ""
  info "$(msg "Looking for release link for $version_type version ($pkg_ext)..." "Mencari tautan rilis untuk versi $version_type ($pkg_ext)...")"
  local download_url=""
  
  if [ "$version_type" = "stable" ]; then
    download_url=$(curl -fsSL "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest" 2>/dev/null | grep '"browser_download_url"' | grep -i "\.${pkg_ext}\"" | head -1 | sed -E 's/.*"browser_download_url":\s*"([^"]+)".*/\1/')
  elif [ "$version_type" = "beta" ]; then
    local b_tag
    b_tag=$(get_latest_beta_tag)
    if [ -n "$b_tag" ]; then
      download_url=$(curl -fsSL "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${b_tag}" 2>/dev/null | grep '"browser_download_url"' | grep -i "\.${pkg_ext}\"" | head -1 | sed -E 's/.*"browser_download_url":\s*"([^"]+)".*/\1/')
    fi
  elif [ "$version_type" = "alpha" ]; then
    local a_tag
    a_tag=$(get_latest_alpha_tag)
    if [ -n "$a_tag" ]; then
      download_url=$(curl -fsSL "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${a_tag}" 2>/dev/null | grep '"browser_download_url"' | grep -i "\.${pkg_ext}\"" | head -1 | sed -E 's/.*"browser_download_url":\s*"([^"]+)".*/\1/')
    fi
  fi
  
  if [ -z "$download_url" ]; then
    error "$(msg "Failed to find download link (.$pkg_ext) for $version_type version." "Gagal menemukan tautan download (.$pkg_ext) untuk versi $version_type.")"
    exit 1
  fi
  
  info "$(msg "Downloading from:" "Mengunduh dari:")"
  info "$download_url"
  
  local dl_dir="$HOME/Downloads"
  local apps_dir="$HOME/Applications"
  local target_path=""
  local filename
  filename=$(basename "$download_url")

  if [ "$pkg_ext" = "AppImage" ]; then
    mkdir -p "$apps_dir"
    target_path="$apps_dir/$filename"
  else
    mkdir -p "$dl_dir"
    target_path="$dl_dir/$filename"
  fi
  
  curl -L "$download_url" -o "$target_path"
  
  # 4. Installation Handling
  echo ""
  if [ "$pkg_ext" = "AppImage" ]; then
    chmod +x "$target_path"
    info "$(msg "Checking AppImageLauncher..." "Memeriksa AppImageLauncher...")"
    if ! command -v appimagelauncher &>/dev/null; then
      warn "$(msg "AppImageLauncher not found. To integrate AppImage into your application menu:" "AppImageLauncher tidak ditemukan. Untuk mengintegrasikan AppImage ke menu aplikasi Anda:")"
      if [[ "$ID" == "arch" || "$ID_LIKE" == *"arch"* ]]; then
        echo -e "  $(msg "Install via AUR:" "Install via AUR:")"
        echo -e "  ${CYAN}yay -S appimagelauncher${NC} $(msg "or" "atau") ${CYAN}paru -S appimagelauncher${NC}"
      else
        echo -e "  $(msg "Please download the ${BOLD}stable${NC} release (.deb, .rpm) from the official GitHub repository:" "Silakan download rilis ${BOLD}stable${NC} (.deb, .rpm) dari repository GitHub resmi:")"
        echo -e "  ${CYAN}https://github.com/TheAssassin/AppImageLauncher/releases${NC}"
      fi
      echo ""
      warn "$(msg "Without AppImageLauncher, you have to run it manually:" "Tanpa AppImageLauncher, Anda harus menjalankannya secara manual:")"
      echo -e "  cd ~/Applications && ./${filename}"
    else
      info "$(msg 'Triggering AppImageLauncher integration...' 'Memicu integrasi AppImageLauncher...')"
      if command -v ail-cli &>/dev/null; then
        if ail-cli integrate "$target_path" 2>/dev/null; then
          info "$(msg '✅ Successfully integrated into app menu!' '✅ Berhasil diintegrasikan ke menu aplikasi!')"
        else
          warn "$(msg 'ail-cli integration failed. Try running the AppImage manually to trigger the popup.' 'Integrasi ail-cli gagal. Coba jalankan AppImage secara manual untuk memicu popup.')"
        fi
      else
        info "$(msg 'Launching AppImage to trigger integration popup...' 'Menjalankan AppImage untuk memunculkan popup integrasi...')"
        nohup "$target_path" &>/dev/null &
        sleep 2
        info "$(msg 'AppImageLauncher popup should now be visible.' 'Popup AppImageLauncher seharusnya sudah muncul.')"
        msg "  → Select 'Integrate and Run' to add TTL to your app menu." "  → Pilih 'Integrate and Run' untuk menambahkan TTL ke menu aplikasi."
      fi
    fi
    echo ""
    info "✅ $(msg 'AppImage downloaded successfully!' 'AppImage berhasil diunduh!')"
    echo -e "  $(msg 'File saved to' 'File disimpan di') ${BOLD}$target_path${NC}"
  else
    info "✅ $(msg 'Native package downloaded successfully!' 'Paket Native berhasil diunduh!')"
    echo -e "  $(msg 'File saved to' 'File disimpan di') ${BOLD}$target_path${NC}"
    echo ""
    info "$(msg "Installing the package..." "Menginstal paket...")"
    if [ "$pkg_ext" = "pacman" ]; then
      sudo pacman -U "$target_path"
    elif [ "$pkg_ext" = "deb" ]; then
      sudo apt install "$target_path" -y || sudo dpkg -i "$target_path"
    elif [ "$pkg_ext" = "rpm" ]; then
      sudo dnf install "$target_path" -y || sudo rpm -i "$target_path"
    fi
    info "✅ $(msg 'Installation completed! You can launch Truckers Tool Linux from your app menu.' 'Instalasi selesai! Anda dapat menjalankan Truckers Tool Linux dari menu aplikasi.')"
  fi
  echo ""
}

# ─── Install ──────────────────────────────────────────────────────

do_install() {
  local target_type="$1"
  print_banner
  info "$(msg "Starting Truckers Tool Linux installation..." "Memulai instalasi Truckers Tool Linux...")"
  echo ""

  if [ "$target_type" = "-w" ] || [ "$target_type" = "webapp" ]; then
    target_type="webapp"
  elif [ "$target_type" = "-d" ] || [ "$target_type" = "desktopapp" ]; then
    target_type="desktopapp"
  else
    msg "Select installation type:" "Pilih tipe instalasi:"
    echo "  1) Web App ($(msg 'Local' 'Lokal'))"
    echo "  2) Desktop App (AppImage)"
    read -rp "$(msg 'Choice [1/2] (default: 1): ' 'Pilihan [1/2] (default: 1): ')" install_choice
    
    if [ "$install_choice" = "2" ]; then
      target_type="desktopapp"
    else
      target_type="webapp"
    fi
    echo ""
  fi

  if [ "$target_type" = "desktopapp" ]; then
    do_install_desktop
    return 0
  fi

  # Check prerequisites
  info "$(msg "Checking prerequisites (Web App)..." "Memeriksa prasyarat (Web App)...")"

  if ! check_command git; then
    error "$(msg "git not found. Install with: sudo apt install git" "git tidak ditemukan. Install dengan: sudo apt install git")"
    exit 1
  fi

  if ! check_command node || ! check_node_version; then
    warn "$(msg "Node.js v${MIN_NODE_VERSION}+ not found." "Node.js v${MIN_NODE_VERSION}+ tidak ditemukan.")"
    echo ""
    echo -e "  $(msg "Run ${BOLD}./ttl.sh node${NC} to install Node.js via nvm." "Jalankan ${BOLD}./ttl.sh node${NC} untuk install Node.js via nvm.")"
    echo -e "  $(msg "Or install manually from ${CYAN}https://nodejs.org${NC}" "Atau install manual dari ${CYAN}https://nodejs.org${NC}")"
    echo ""
    read -rp "$(msg 'Install Node.js now via nvm? (Y/n): ' 'Install Node.js sekarang via nvm? (Y/n): ')" confirm
    if [[ ! "$confirm" =~ ^[Nn]$ ]]; then
      do_install_node
    else
      exit 1
    fi
  fi

  info "✅ $(msg "Prerequisites met (Node $(node -v), npm $(npm -v))" "Prasyarat terpenuhi (Node $(node -v), npm $(npm -v))")"
  echo ""

  # Clone repo
  if [ -d "$INSTALL_DIR" ]; then
    warn "$(msg "Directory $INSTALL_DIR already exists." "Direktori $INSTALL_DIR sudah ada.")"
    read -rp "$(msg 'Delete and reinstall? (y/N): ' 'Hapus dan install ulang? (y/N): ')" confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
      rm -rf "$INSTALL_DIR"
    else
      info "$(msg "Installation cancelled." "Instalasi dibatalkan.")"
      exit 0
    fi
  fi

  info "$(msg "Cloning repository..." "Mengkloning repository...")"
  git clone "$REPO_URL" "$INSTALL_DIR"
  echo ""

  # Install dependencies
  info "$(msg "Installing dependencies..." "Menginstall dependensi...")"
  cd "$INSTALL_DIR"
  npm install
  echo ""

  # Prompt to run setup
  echo ""
  read -rp "$(msg 'Run settings.yml configuration setup now? (Y/n): ' 'Jalankan setup konfigurasi settings.yml sekarang? (Y/n): ')" confirm
  if [[ ! "$confirm" =~ ^[Nn]$ ]]; then
    do_setup
  else
    info "$(msg "You can run ${BOLD}./ttl.sh setup${NC} later to create settings.yml." "Kamu bisa menjalankan ${BOLD}./ttl.sh setup${NC} nanti untuk membuat settings.yml.")"
  fi

  info "✅ $(msg "Installation complete! (v${CURRENT_VERSION})" "Instalasi selesai! (v${CURRENT_VERSION})")"
  echo ""
  echo -e "  ${BOLD}$(msg 'Location:' 'Lokasi:')${NC}    $INSTALL_DIR"
  echo -e "  ${BOLD}$(msg 'Run:' 'Jalankan:')${NC}  ./ttl.sh start"
  echo ""
}

# ─── Start ────────────────────────────────────────────────────────

do_start() {
  print_banner

  if [ ! -d "$INSTALL_DIR" ]; then
    error "$(msg "Truckers Tool is not installed." "Truckers Tool belum terinstall.")"
    echo -e "  $(msg "Run:" "Jalankan:") ${BOLD}./ttl.sh install${NC}"
    exit 1
  fi

  # Load nvm if available
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 2>/dev/null

  if ! check_command node; then
    error "$(msg "Node.js not found. Run: ./ttl.sh node" "Node.js tidak ditemukan. Jalankan: ./ttl.sh node")"
    exit 1
  fi

  cd "$INSTALL_DIR"

  # Check settings.yml
  if [ ! -f "settings.yml" ]; then
    warn "$(msg "settings.yml not found." "settings.yml tidak ditemukan.")"
    read -rp "$(msg 'Create settings.yml now? (Y/n): ' 'Buat settings.yml sekarang? (Y/n): ')" confirm
    if [[ ! "$confirm" =~ ^[Nn]$ ]]; then
      do_setup
    fi
  fi

  local port_fe
  port_fe=$(read_settings_value "port_frontend" "$DEFAULT_PORT_FRONTEND")
  local port_be
  port_be=$(read_settings_value "port_backend" "$DEFAULT_PORT_BACKEND")

  info "$(msg "Starting Truckers Tool Linux v${CURRENT_VERSION}..." "Menjalankan Truckers Tool Linux v${CURRENT_VERSION}...")"
  info "🌐 Web App: ${BOLD}http://localhost:${port_fe}${NC}"
  info "📡 API:     ${BOLD}http://localhost:${port_be}${NC}"
  echo ""

  # Build first
  info "$(msg "Building production build..." "Membangun production build...")"
  npm run build
  echo ""

  # PM2 is required to run as a background service
  if ! check_command pm2; then
    echo ""
    warn "$(msg 'PM2 is not installed.' 'PM2 belum terinstall.')"
    msg "  PM2 is required to run Truckers Tool as a background service." "  PM2 dibutuhkan untuk menjalankan Truckers Tool sebagai layanan background."
    msg "  Without PM2, the app will run in foreground (Ctrl+C to stop)." "  Tanpa PM2, app akan berjalan di foreground (Ctrl+C untuk stop)."
    echo ""
    read -rp "$(msg '  Install PM2 now? (Y/n): ' '  Install PM2 sekarang? (Y/n): ')" confirm_pm2
    if [[ "$confirm_pm2" =~ ^[Nn]$ ]]; then
      echo ""
      info "$(msg 'Running in foreground mode via npm start...' 'Menjalankan mode foreground via npm start...')"
      info "$(msg 'Press Ctrl+C to stop.' 'Tekan Ctrl+C untuk menghentikan.')"
      echo ""
      npm start
      return 0
    fi
    echo ""
    info "$(msg 'Installing PM2 globally...' 'Menginstall PM2 secara global...')"
    npm install -g pm2
    echo ""
    info "$(msg '✅ PM2 installed successfully!' '✅ PM2 berhasil diinstall!')"
  fi

  info "$(msg 'Starting via PM2...' 'Menjalankan via PM2...')"
  pm2 start ecosystem.config.cjs
  echo ""
  info "✅ $(msg 'App is running in background via PM2' 'App berjalan di background via PM2')"
  echo -e "  ${BOLD}$(msg 'Logs:' 'Log:')${NC}     pm2 logs"
  echo -e "  ${BOLD}$(msg 'Status:' 'Status:')${NC}   pm2 status"
  echo -e "  ${BOLD}$(msg 'Stop:' 'Stop:')${NC}     ./ttl.sh stop"
  echo ""
}

# ─── Stop ─────────────────────────────────────────────────────────

do_stop() {
  print_banner

  if ! check_command pm2; then
    error "$(msg "PM2 is not installed. Install with: npm install -g pm2" "PM2 tidak terinstall. Install dengan: npm install -g pm2")"
    exit 1
  fi

  info "$(msg "Stopping Truckers Tool..." "Menghentikan Truckers Tool...")"
  cd "$INSTALL_DIR" 2>/dev/null || true
  pm2 stop ecosystem.config.cjs 2>/dev/null || pm2 stop ttl-frontend ttl-backend 2>/dev/null || true
  info "✅ $(msg "App stopped." "App dihentikan.")"
  echo ""
}

# ─── Check Update ────────────────────────────────────────────────

do_check_update() {
  print_banner
  info "$(msg "Current version:" "Versi saat ini:") ${BOLD}v${CURRENT_VERSION}${NC}"
  info "$(msg "Checking for updates from GitHub Releases..." "Memeriksa update dari GitHub Releases...")"
  echo ""

  local latest
  latest=$(get_latest_version)

  if [ -z "$latest" ]; then
    warn "$(msg "Could not fetch release info. Check internet connection." "Tidak bisa mengambil info release. Cek koneksi internet.")"
    echo ""
    return
  fi

  info "$(msg "Latest stable version:" "Versi terbaru (stable):") ${BOLD}v${latest}${NC}"

  if version_lt "$CURRENT_VERSION" "$latest"; then
    echo ""
    warn "🆕 $(msg "Update available! v${CURRENT_VERSION} → v${latest}" "Update tersedia! v${CURRENT_VERSION} → v${latest}")"
    echo -e "  $(msg "Run ${BOLD}./ttl.sh update${NC} to update." "Jalankan ${BOLD}./ttl.sh update${NC} untuk update.")"
  else
    info "✅ $(msg "Already up to date!" "Sudah versi terbaru!")"
  fi

  # Check beta release
  local beta
  beta=$(get_latest_beta)
  if [ -n "$beta" ] && version_lt "$CURRENT_VERSION" "$beta"; then
    echo ""
    echo -e "  ${DIM}🧪 $(msg "Pre-release available: v${beta} (beta/tester)" "Pre-release tersedia: v${beta} (beta/tester)")${NC}"
    echo -e "  ${DIM}$(msg "Run ${BOLD}./ttl.sh update --beta${NC}${DIM} to install." "Jalankan ${BOLD}./ttl.sh update --beta${NC}${DIM} untuk install.")${NC}"
  fi

  # Check alpha release
  local alpha
  alpha=$(get_latest_alpha)
  if [ -n "$alpha" ] && version_lt "$CURRENT_VERSION" "$alpha"; then
    echo ""
    echo -e "  ${DIM}🚧 $(msg "Alpha release available: v${alpha} (experimental)" "Alpha release tersedia: v${alpha} (eksperimental)")${NC}"
    echo -e "  ${DIM}$(msg "Run ${BOLD}./ttl.sh update --alpha${NC}${DIM} to install." "Jalankan ${BOLD}./ttl.sh update --alpha${NC}${DIM} untuk install.")${NC}"
  fi
  echo ""
}

# ─── Update ──────────────────────────────────────────────────────

do_update() {
  local use_beta=false
  local use_alpha=false
  if [ "$1" = "--beta" ] || [ "$1" = "-b" ]; then
    use_beta=true
  elif [ "$1" = "--alpha" ] || [ "$1" = "-a" ]; then
    use_alpha=true
  fi

  print_banner

  if [ ! -d "$INSTALL_DIR" ]; then
    error "$(msg "Truckers Tool is not installed." "Truckers Tool belum terinstall.")"
    echo -e "  $(msg "Run:" "Jalankan:") ${BOLD}./ttl.sh install${NC}"
    exit 1
  fi

  cd "$INSTALL_DIR"

  info "$(msg "Current version:" "Versi saat ini:") ${BOLD}v${CURRENT_VERSION}${NC}"

  if [ "$use_beta" = true ]; then
    info "🧪 $(msg "Updating to ${YELLOW}beta (pre-release)${NC} version..." "Mengupdate ke versi ${YELLOW}beta (pre-release)${NC}...")"
    echo ""

    local beta_tag
    beta_tag=$(get_latest_beta_tag)

    if [ -z "$beta_tag" ]; then
      error "$(msg "No beta release available." "Tidak ada beta release yang tersedia.")"
      exit 1
    fi

    local beta_ver
    beta_ver=$(echo "$beta_tag" | sed -E 's/^[vV]//')
    info "$(msg "Latest beta:" "Beta terbaru:") ${BOLD}v${beta_ver}${NC}"

    git fetch origin --tags
    git reset --hard "$beta_tag"
    echo ""

    warn "⚠️  $(msg "You are now on beta version (${beta_tag})." "Kamu sekarang di versi beta (${beta_tag}).")"
    echo -e "  $(msg "To go back to stable:" "Untuk kembali ke stable:") ${BOLD}./ttl.sh update${NC}"
  elif [ "$use_alpha" = true ]; then
    info "🚧 $(msg "Updating to ${CYAN}alpha (experimental)${NC} version..." "Mengupdate ke versi ${CYAN}alpha (eksperimental)${NC}...")"
    echo ""

    local alpha_tag
    alpha_tag=$(get_latest_alpha_tag)

    if [ -z "$alpha_tag" ]; then
      error "$(msg "No alpha release available." "Tidak ada alpha release yang tersedia.")"
      exit 1
    fi

    local alpha_ver
    alpha_ver=$(echo "$alpha_tag" | sed -E 's/^[vV]//')
    info "$(msg "Latest alpha:" "Alpha terbaru:") ${BOLD}v${alpha_ver}${NC}"

    git fetch origin --tags
    git reset --hard "$alpha_tag"
    echo ""

    warn "⚠️  $(msg "You are now on alpha version (${alpha_tag})." "Kamu sekarang di versi alpha (${alpha_tag}).")"
    echo -e "  $(msg "To go back to stable:" "Untuk kembali ke stable:") ${BOLD}./ttl.sh update${NC}"
  else
    info "$(msg "Updating to ${GREEN}stable${NC} version..." "Mengupdate ke versi ${GREEN}stable${NC}...")"
    echo ""

    git fetch origin main
    git reset --hard origin/main
  fi
  echo ""

  info "$(msg "Updating dependencies..." "Mengupdate dependensi...")"
  npm install
  echo ""

  if [ -f "$INSTALL_DIR/ttl.sh" ]; then
    local external_script="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
    if [ "$external_script" != "$INSTALL_DIR/ttl.sh" ] && [ -w "$external_script" ]; then
      info "$(msg "Updating ttl.sh script outside install directory..." "Mengupdate script ttl.sh di luar direktori instalasi...")"
      if [ "$use_beta" = true ]; then
        curl -fsSL "https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/refs/heads/beta/ttl.sh" -o "$external_script" || cp -f "$INSTALL_DIR/ttl.sh" "$external_script"
      else
        curl -fsSL "https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/refs/heads/main/ttl.sh" -o "$external_script" || cp -f "$INSTALL_DIR/ttl.sh" "$external_script"
      fi
      chmod +x "$external_script"
    fi
  fi

  info "✅ $(msg "Update complete!" "Update selesai!")"
  echo -e "  $(msg "Run ${BOLD}./ttl.sh start${NC} to start." "Jalankan ${BOLD}./ttl.sh start${NC} untuk memulai.")"
  echo ""
}

# ─── Version ─────────────────────────────────────────────────────

do_version() {
  echo "Truckers Tool Linux v${CURRENT_VERSION}"
}

# ─── Help ─────────────────────────────────────────────────────────

# ─── Language Switch ──────────────────────────────────────────────

do_lang() {
  local target_lang="$1"
  if [ -n "$target_lang" ]; then
    set_language "$target_lang"
  else
    # Interactive picker without saving — overwrite saved file
    rm -f "$TTL_LANG_FILE"
    pick_language
    if [ "$TTL_LANG" = "id" ]; then
      echo -e "${GREEN}[INFO]${NC} ✅ Bahasa tersimpan: Bahasa Indonesia"
    else
      echo -e "${GREEN}[INFO]${NC} ✅ Language saved: English"
    fi
  fi
}

show_help() {
  print_banner
  echo -e "${BOLD}$(msg 'Usage:' 'Penggunaan:')${NC}"
  echo "  ./ttl.sh <command>"
  echo ""
  echo -e "${BOLD}$(msg 'Commands:' 'Perintah:')${NC}"
  echo "  install,  -i,  --install     $(msg 'Install app (interactive)' 'Install app (interaktif)')"
  echo "  install -d, -Id              $(msg 'Install Desktop App (AppImage)' 'Install versi desktop (AppImage)')"
  echo "  install -w, -Iw              $(msg 'Install Web App (Local)' 'Install versi web (Lokal)')"
  echo "  setup,         --setup       $(msg 'Generate settings.yml (interactive)' 'Generate settings.yml (interaktif)')"
  echo "  start,    -s,  --start       $(msg 'Start web app (PM2/npm start)' 'Jalankan web app (PM2/npm start)')"
  echo "  stop,          --stop        $(msg 'Stop app (PM2)' 'Hentikan app (PM2)')"
  echo "  update,   -u,  --update      $(msg 'Update to latest version' 'Update ke versi terbaru')"
  echo "  check,    -c,  --check       $(msg 'Check update (via GitHub Releases)' 'Cek update (via GitHub Releases)')"
  echo "  node,     -n,  --node        $(msg 'Install Node.js via nvm' 'Install Node.js via nvm')"
  echo "  lang                         $(msg 'Change language (en/id)' 'Ganti bahasa (en/id)')"
  echo "  version,  -v,  --version     $(msg 'Show current version' 'Tampilkan versi saat ini')"
  echo "  help,     -h,  --help        $(msg 'Show this help' 'Tampilkan bantuan ini')"
  echo ""
  echo -e "${BOLD}$(msg 'Options:' 'Opsi:')${NC}"
  echo "  update --beta                 $(msg 'Update to pre-release (beta)' 'Update ke pre-release (beta)')"
  echo "  update --alpha                $(msg 'Update to experimental (alpha)' 'Update ke eksperimental (alpha)')"
  echo "  -IS                           Install + setup + start"
  echo ""
  echo -e "${BOLD}$(msg 'Examples:' 'Contoh:')${NC}"
  echo "  ./ttl.sh node                # $(msg 'Install Node.js' 'Install Node.js')"
  echo "  ./ttl.sh install             # $(msg 'Install app (interactive)' 'Install app (interaktif)')"
  echo "  ./ttl.sh -Id                 # $(msg 'Install Desktop App' 'Install Desktop App')"
  echo "  ./ttl.sh -Iw                 # $(msg 'Install Web App' 'Install Web App')"
  echo "  ./ttl.sh setup               # $(msg 'Generate settings.yml' 'Generate settings.yml')"
  echo "  ./ttl.sh start               # $(msg 'Start web app' 'Jalankan web app')"
  echo "  ./ttl.sh stop                # $(msg 'Stop web app' 'Hentikan web app')"
  echo "  ./ttl.sh -IS                 # Install + setup + start"
  echo "  ./ttl.sh check               # $(msg 'Check update' 'Cek update')"
  echo "  ./ttl.sh update              # $(msg 'Update stable' 'Update ke stable')"
  echo "  ./ttl.sh update --beta       # $(msg 'Update to beta' 'Update ke beta')"
  echo "  ./ttl.sh update --alpha      # $(msg 'Update to alpha' 'Update ke alpha')"
  echo "  ./ttl.sh lang en             # $(msg 'Switch to English' 'Ganti ke Bahasa Inggris')"
  echo "  ./ttl.sh lang id             # $(msg 'Switch to Indonesian' 'Ganti ke Bahasa Indonesia')"
  echo ""
}

# ─── Main ─────────────────────────────────────────────────────────

# ─── Init Language ────────────────────────────────────────────────
pick_language

if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

case "$1" in
  install|-i|--install)       do_install "$2" ;;
  -Id)                        do_install "-d" ;;
  -Iw)                        do_install "-w" ;;
  setup|--setup)              do_setup ;;
  start|-s|--start)           do_start ;;
  stop|--stop)                do_stop ;;
  update|-u|--update)         do_update "$2" ;;
  check|-c|--check)           do_check_update ;;
  node|-n|--node)             do_install_node ;;
  lang|--lang)                do_lang "$2" ;;
  version|-v|--version)       do_version ;;
  -IS)                        do_install; do_setup; do_start ;;
  help|-h|--help)             show_help ;;
  *)
    error "$(msg "Unknown command: $1" "Command tidak dikenal: $1")"
    echo ""
    show_help
    exit 1
    ;;
esac
