#!/usr/bin/env bash
#
# Truckers Tool Linux (TTL) — Installer & Launcher
# https://github.com/efzynx/truckers-tool-linux
#

set -e

# ─── Config ───────────────────────────────────────────────────────
REPO_URL="https://github.com/efzynx/truckers-tool-linux.git"
INSTALL_DIR="$HOME/.truckers-tool-linux"
SCRIPT_NAME="ttl.sh"
MIN_NODE_VERSION=18

# ─── Colors ───────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

print_banner() {
  echo -e "${CYAN}"
  echo "  ╔══════════════════════════════════════════╗"
  echo "  ║     🚛  Truckers Tool Linux  v2.0       ║"
  echo "  ║     ETS2 / ATS Save Editor for Linux    ║"
  echo "  ╚══════════════════════════════════════════╝"
  echo -e "${NC}"
}

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ─── Helpers ──────────────────────────────────────────────────────

check_command() {
  if ! command -v "$1" &>/dev/null; then
    error "$1 tidak ditemukan. Silahkan install terlebih dahulu."
    exit 1
  fi
}

check_node_version() {
  local node_ver
  node_ver=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
  if [ -z "$node_ver" ] || [ "$node_ver" -lt "$MIN_NODE_VERSION" ]; then
    error "Node.js v${MIN_NODE_VERSION}+ diperlukan. Versi saat ini: $(node -v 2>/dev/null || echo 'tidak terinstall')"
    exit 1
  fi
}

# ─── Install ──────────────────────────────────────────────────────

do_install() {
  print_banner
  info "Memulai instalasi Truckers Tool Linux..."
  echo ""

  # Check prerequisites
  info "Memeriksa prasyarat..."
  check_command git
  check_command node
  check_command npm
  check_node_version
  info "✅ Semua prasyarat terpenuhi (Node $(node -v), npm $(npm -v))"
  echo ""

  # Clone repo
  if [ -d "$INSTALL_DIR" ]; then
    warn "Direktori $INSTALL_DIR sudah ada."
    read -rp "Hapus dan install ulang? (y/N): " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
      rm -rf "$INSTALL_DIR"
    else
      info "Instalasi dibatalkan."
      exit 0
    fi
  fi

  info "Cloning repository..."
  git clone "$REPO_URL" "$INSTALL_DIR"
  echo ""

  # Install dependencies
  info "Menginstall dependencies..."
  cd "$INSTALL_DIR"
  npm install
  echo ""

  # Copy script to install dir
  cp "$INSTALL_DIR/$SCRIPT_NAME" "$INSTALL_DIR/$SCRIPT_NAME" 2>/dev/null || true

  info "✅ Instalasi selesai!"
  echo ""
  echo -e "  ${BOLD}Lokasi:${NC}  $INSTALL_DIR"
  echo -e "  ${BOLD}Jalankan:${NC} $0 -S"
  echo ""
  echo -e "  ${CYAN}Atau masuk ke direktori dan jalankan manual:${NC}"
  echo -e "  cd $INSTALL_DIR && npm run dev"
  echo ""
}

# ─── Start ────────────────────────────────────────────────────────

do_start() {
  print_banner

  if [ ! -d "$INSTALL_DIR" ]; then
    error "Truckers Tool belum terinstall. Jalankan: $0 -i"
    exit 1
  fi

  info "Menjalankan Truckers Tool Linux..."
  info "Frontend: http://localhost:5173"
  info "Backend:  http://localhost:3001"
  echo ""
  info "Tekan Ctrl+C untuk menghentikan server."
  echo ""

  cd "$INSTALL_DIR"
  npm run dev
}

# ─── Check Update ────────────────────────────────────────────────

do_check_update() {
  print_banner

  if [ ! -d "$INSTALL_DIR" ]; then
    error "Truckers Tool belum terinstall. Jalankan: $0 -i"
    exit 1
  fi

  cd "$INSTALL_DIR"

  info "Memeriksa update..."
  git fetch origin main 2>/dev/null

  LOCAL=$(git rev-parse HEAD 2>/dev/null)
  REMOTE=$(git rev-parse origin/main 2>/dev/null)

  if [ "$LOCAL" = "$REMOTE" ]; then
    info "✅ Sudah versi terbaru!"
  else
    BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null)
    warn "Ada ${BEHIND} commit baru tersedia."
    echo ""
    echo -e "  Jalankan ${BOLD}$0 -UI${NC} untuk update."
  fi
  echo ""
}

# ─── Update ──────────────────────────────────────────────────────

do_update() {
  print_banner

  if [ ! -d "$INSTALL_DIR" ]; then
    error "Truckers Tool belum terinstall. Jalankan: $0 -i"
    exit 1
  fi

  cd "$INSTALL_DIR"

  info "Mengupdate Truckers Tool Linux..."

  # Pull latest changes
  git pull origin main
  echo ""

  # Reinstall dependencies (in case package.json changed)
  info "Mengupdate dependencies..."
  npm install
  echo ""

  info "✅ Update selesai!"
  echo -e "  Jalankan ${BOLD}$0 -S${NC} untuk memulai."
  echo ""
}

# ─── Help ─────────────────────────────────────────────────────────

show_help() {
  print_banner
  echo -e "${BOLD}Penggunaan:${NC}"
  echo "  ./ttl.sh [opsi]"
  echo ""
  echo -e "${BOLD}Opsi:${NC}"
  echo "  -i     Install Truckers Tool Linux (clone + npm install)"
  echo "  -S     Start / jalankan web app"
  echo "  -u     Cek apakah ada update terbaru"
  echo "  -UI    Update app (git pull + npm install)"
  echo "  -h     Tampilkan bantuan ini"
  echo ""
  echo -e "${BOLD}Contoh:${NC}"
  echo "  ./ttl.sh -i      # Install pertama kali"
  echo "  ./ttl.sh -S      # Jalankan web app"
  echo "  ./ttl.sh -u      # Cek update"
  echo "  ./ttl.sh -UI     # Update ke versi terbaru"
  echo ""
}

# ─── Main ─────────────────────────────────────────────────────────

if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

case "$1" in
  -i)   do_install ;;
  -S)   do_start ;;
  -u)   do_check_update ;;
  -UI)  do_update ;;
  -h|--help) show_help ;;
  *)
    error "Opsi tidak dikenal: $1"
    show_help
    exit 1
    ;;
esac
