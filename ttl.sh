#!/usr/bin/env bash
#
# Truckers Tool Linux (TTL) — Installer & Launcher
# https://github.com/efzynx/truckers-tool-linux
#
# Usage:
#   ./ttl.sh install     Install app (clone + npm install)
#   ./ttl.sh start       Start web app
#   ./ttl.sh -IS         Install + langsung start
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

# Fetch latest release version from GitHub API
get_latest_version() {
  local api_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest"
  local version
  version=$(curl -fsSL "$api_url" 2>/dev/null | grep '"tag_name"' | head -1 | sed -E 's/.*"tag_name":\s*"[vV]?([^"]+)".*/\1/')
  echo "$version"
}

# Fetch latest pre-release tag from GitHub API
get_latest_prerelease() {
  local api_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases"
  local json
  json=$(curl -fsSL "$api_url" 2>/dev/null)
  # Find first release where prerelease is true and extract its tag
  local tag
  tag=$(echo "$json" | grep -B5 '"prerelease": true' | grep '"tag_name"' | head -1 | sed -E 's/.*"tag_name":\s*"([^"]+)".*/\1/')
  # Strip v/V prefix for version comparison
  local version
  version=$(echo "$tag" | sed -E 's/^[vV]//')
  echo "$version"
}

# Get the raw tag name for a pre-release (with v prefix)
get_latest_prerelease_tag() {
  local api_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases"
  local tag
  tag=$(curl -fsSL "$api_url" 2>/dev/null | grep -B5 '"prerelease": true' | grep '"tag_name"' | head -1 | sed -E 's/.*"tag_name":\s*"([^"]+)".*/\1/')
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
    info "Node.js sudah terinstall: $(node -v)"
    read -rp "Install ulang via nvm? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
      return 0
    fi
  fi

  info "Menginstall Node.js via nvm..."
  echo ""

  # Install nvm
  if [ ! -d "$HOME/.nvm" ]; then
    info "Downloading nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  else
    info "nvm sudah terinstall."
  fi

  # Load nvm
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

  # Install Node.js
  info "Downloading dan installing Node.js..."
  nvm install 24
  echo ""

  info "✅ Node.js terinstall!"
  echo -e "  Node: ${BOLD}$(node -v)${NC}"
  echo -e "  npm:  ${BOLD}$(npm -v)${NC}"
  echo ""
}

# ─── Install ──────────────────────────────────────────────────────

do_install() {
  print_banner
  info "Memulai instalasi Truckers Tool Linux..."
  echo ""

  # Check prerequisites
  info "Memeriksa prasyarat..."

  if ! check_command git; then
    error "git tidak ditemukan. Install dengan: sudo apt install git"
    exit 1
  fi

  if ! check_command node || ! check_node_version; then
    warn "Node.js v${MIN_NODE_VERSION}+ tidak ditemukan."
    echo ""
    echo -e "  Jalankan ${BOLD}./ttl.sh node${NC} untuk install Node.js via nvm."
    echo -e "  Atau install manual dari ${CYAN}https://nodejs.org${NC}"
    echo ""
    read -rp "Install Node.js sekarang via nvm? (Y/n): " confirm
    if [[ ! "$confirm" =~ ^[Nn]$ ]]; then
      do_install_node
    else
      exit 1
    fi
  fi

  info "✅ Prasyarat terpenuhi (Node $(node -v), npm $(npm -v))"
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

  info "✅ Instalasi selesai! (v${CURRENT_VERSION})"
  echo ""
  echo -e "  ${BOLD}Lokasi:${NC}    $INSTALL_DIR"
  echo -e "  ${BOLD}Jalankan:${NC}  ./ttl.sh start"
  echo ""
}

# ─── Start ────────────────────────────────────────────────────────

do_start() {
  print_banner

  if [ ! -d "$INSTALL_DIR" ]; then
    error "Truckers Tool belum terinstall."
    echo -e "  Jalankan: ${BOLD}./ttl.sh install${NC}"
    exit 1
  fi

  # Load nvm if available
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 2>/dev/null

  if ! check_command node; then
    error "Node.js tidak ditemukan. Jalankan: ./ttl.sh node"
    exit 1
  fi

  info "Menjalankan Truckers Tool Linux v${CURRENT_VERSION}..."
  info "🌐 Web App: ${BOLD}http://localhost:5173${NC}"
  info "📡 API:     ${BOLD}http://localhost:3001${NC}"
  echo ""
  info "Tekan Ctrl+C untuk menghentikan."
  echo ""

  cd "$INSTALL_DIR"
  npm run dev
}

# ─── Check Update ────────────────────────────────────────────────

do_check_update() {
  print_banner
  info "Versi saat ini: ${BOLD}v${CURRENT_VERSION}${NC}"
  info "Memeriksa update dari GitHub Releases..."
  echo ""

  local latest
  latest=$(get_latest_version)

  if [ -z "$latest" ]; then
    warn "Tidak bisa mengambil info release. Cek koneksi internet."
    echo ""
    return
  fi

  info "Versi terbaru (stable): ${BOLD}v${latest}${NC}"

  if version_lt "$CURRENT_VERSION" "$latest"; then
    echo ""
    warn "🆕 Update tersedia! v${CURRENT_VERSION} → v${latest}"
    echo -e "  Jalankan ${BOLD}./ttl.sh update${NC} untuk update."
  else
    info "✅ Sudah versi terbaru!"
  fi

  # Check pre-release
  local beta
  beta=$(get_latest_prerelease)
  if [ -n "$beta" ] && version_lt "$CURRENT_VERSION" "$beta"; then
    echo ""
    echo -e "  ${DIM}🧪 Pre-release tersedia: v${beta} (beta/tester)${NC}"
    echo -e "  ${DIM}Jalankan ${BOLD}./ttl.sh update --beta${NC}${DIM} untuk install.${NC}"
  fi
  echo ""
}

# ─── Update ──────────────────────────────────────────────────────

do_update() {
  local use_beta=false
  if [ "$1" = "--beta" ] || [ "$1" = "-b" ]; then
    use_beta=true
  fi

  print_banner

  if [ ! -d "$INSTALL_DIR" ]; then
    error "Truckers Tool belum terinstall."
    echo -e "  Jalankan: ${BOLD}./ttl.sh install${NC}"
    exit 1
  fi

  cd "$INSTALL_DIR"

  info "Versi saat ini: ${BOLD}v${CURRENT_VERSION}${NC}"

  if [ "$use_beta" = true ]; then
    # Update to pre-release
    info "🧪 Mengupdate ke versi ${YELLOW}beta (pre-release)${NC}..."
    echo ""

    local beta_tag
    beta_tag=$(get_latest_prerelease_tag)

    if [ -z "$beta_tag" ]; then
      error "Tidak ada pre-release yang tersedia."
      exit 1
    fi

    local beta_ver
    beta_ver=$(echo "$beta_tag" | sed -E 's/^[vV]//')
    info "Pre-release terbaru: ${BOLD}v${beta_ver}${NC}"

    # Fetch all tags and checkout
    git fetch origin --tags
    git checkout "$beta_tag"
    echo ""

    warn "⚠️  Kamu sekarang di versi beta (${beta_tag})."
    echo -e "  Untuk kembali ke stable: ${BOLD}./ttl.sh update${NC}"
  else
    # Update to stable (main branch)
    info "Mengupdate ke versi ${GREEN}stable${NC}..."
    echo ""

    # Make sure we're on main branch
    git checkout main 2>/dev/null || true
    git pull origin main
  fi
  echo ""

  # Reinstall dependencies
  info "Mengupdate dependencies..."
  npm install
  echo ""

  # Update script itself
  if [ -f "$INSTALL_DIR/ttl.sh" ]; then
    local script_path
    script_path="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
    if [ "$script_path" != "$INSTALL_DIR/ttl.sh" ]; then
      info "Mengupdate script ttl.sh..."
      cp "$INSTALL_DIR/ttl.sh" "$script_path"
      chmod +x "$script_path"
    fi
  fi

  info "✅ Update selesai!"
  echo -e "  Jalankan ${BOLD}./ttl.sh start${NC} untuk memulai."
  echo ""
}

# ─── Version ─────────────────────────────────────────────────────

do_version() {
  echo "Truckers Tool Linux v${CURRENT_VERSION}"
}

# ─── Help ─────────────────────────────────────────────────────────

show_help() {
  print_banner
  echo -e "${BOLD}Penggunaan:${NC}"
  echo "  ./ttl.sh <command>"
  echo ""
  echo -e "${BOLD}Commands:${NC}"
  echo "  install,  -i,  --install     Install app (clone + npm install)"
  echo "  start,    -s,  --start       Jalankan web app"
  echo "  update,   -u,  --update      Update ke versi terbaru"
  echo "  check,    -c,  --check       Cek update (via GitHub Releases)"
  echo "  node,     -n,  --node        Install Node.js via nvm"
  echo "  version,  -v,  --version     Tampilkan versi saat ini"
  echo "  help,     -h,  --help        Tampilkan bantuan ini"
  echo ""
  echo -e "${BOLD}Options:${NC}"
  echo "  update --beta                 Update ke pre-release (beta)"
  echo "  -IS                           Install + langsung start"
  echo ""
  echo -e "${BOLD}Contoh:${NC}"
  echo "  ./ttl.sh node                # Install Node.js"
  echo "  ./ttl.sh install             # Install app"
  echo "  ./ttl.sh start               # Jalankan web app"
  echo "  ./ttl.sh -IS                 # Install + start sekaligus"
  echo "  ./ttl.sh check               # Cek update"
  echo "  ./ttl.sh update              # Update stable"
  echo "  ./ttl.sh update --beta       # Update ke beta"
  echo ""
}

# ─── Main ─────────────────────────────────────────────────────────

if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

case "$1" in
  install|-i|--install)       do_install ;;
  start|-s|--start)           do_start ;;
  update|-u|--update)         do_update "$2" ;;
  check|-c|--check)           do_check_update ;;
  node|-n|--node)             do_install_node ;;
  version|-v|--version)       do_version ;;
  -IS)                        do_install; do_start ;;
  help|-h|--help)             show_help ;;
  *)
    error "Command tidak dikenal: $1"
    echo ""
    show_help
    exit 1
    ;;
esac
