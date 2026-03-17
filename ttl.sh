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

# ─── Setup Settings ──────────────────────────────────────────────

do_setup() {
  local target_dir
  if [ -d "$INSTALL_DIR" ]; then
    target_dir="$INSTALL_DIR"
  else
    target_dir="$(cd "$(dirname "$0")" && pwd)"
  fi

  print_banner
  info "📝 Setup konfigurasi settings.yml"
  echo ""

  local settings_file="$target_dir/settings.yml"

  if [ -f "$settings_file" ]; then
    warn "settings.yml sudah ada di: $settings_file"
    read -rp "Overwrite? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
      info "Setup dibatalkan."
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

  echo -e "${BOLD}── Admin Contact ──${NC}"
  read -rp "Admin email [admin@example.com]: " admin_email
  admin_email="${admin_email:-admin@example.com}"
  read -rp "Admin name [Admin]: " admin_contact
  admin_contact="${admin_contact:-Admin}"
  echo ""

  echo -e "${BOLD}── SMTP Relay (opsional, tekan Enter untuk skip) ──${NC}"
  read -rp "SMTP host [smtp.gmail.com]: " smtp_host
  smtp_host="${smtp_host:-smtp.gmail.com}"
  read -rp "SMTP port [587]: " smtp_port
  smtp_port="${smtp_port:-587}"
  read -rp "SMTP user (email): " smtp_user
  read -rsp "SMTP pass (hidden): " smtp_pass
  echo ""
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
  cat > "$settings_file" << EOF
# Truckers Tool Linux — Settings
# Generated by ./ttl.sh setup on $(date '+%Y-%m-%d %H:%M:%S')

app:
  name: "Truckers Tool Linux"
  port_frontend: ${port_fe}
  port_backend: ${port_be}

admin:
  email: "${admin_email}"
  contact: "${admin_contact}"

smtp:
  host: "${smtp_host}"
  port: ${smtp_port}
  secure: false
  user: "${smtp_user}"
  pass: "${smtp_pass}"

paths:
  ets2: "${path_ets2}"
  ats: "${path_ats}"

upload:
  max_file_size_mb: ${max_upload}
  max_extracted_size_mb: ${max_extracted}
  temp_dir: "/tmp/truckers-tool-uploads"
EOF

  info "✅ settings.yml berhasil dibuat!"
  echo -e "  Lokasi: ${BOLD}${settings_file}${NC}"
  echo -e "  Frontend: ${BOLD}http://localhost:${port_fe}${NC}"
  echo -e "  Backend:  ${BOLD}http://localhost:${port_be}${NC}"
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

  # Prompt to run setup
  echo ""
  read -rp "Jalankan setup konfigurasi settings.yml sekarang? (Y/n): " confirm
  if [[ ! "$confirm" =~ ^[Nn]$ ]]; then
    do_setup
  else
    info "Kamu bisa menjalankan ${BOLD}./ttl.sh setup${NC} nanti untuk membuat settings.yml."
  fi

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

  cd "$INSTALL_DIR"

  # Check settings.yml
  if [ ! -f "settings.yml" ]; then
    warn "settings.yml tidak ditemukan."
    read -rp "Buat settings.yml sekarang? (Y/n): " confirm
    if [[ ! "$confirm" =~ ^[Nn]$ ]]; then
      do_setup
    fi
  fi

  local port_fe
  port_fe=$(read_settings_value "port_frontend" "$DEFAULT_PORT_FRONTEND")
  local port_be
  port_be=$(read_settings_value "port_backend" "$DEFAULT_PORT_BACKEND")

  info "Menjalankan Truckers Tool Linux v${CURRENT_VERSION}..."
  info "🌐 Web App: ${BOLD}http://localhost:${port_fe}${NC}"
  info "📡 API:     ${BOLD}http://localhost:${port_be}${NC}"
  echo ""

  # Build first
  info "Membangun production build..."
  npm run build
  echo ""

  # Use PM2 if available, otherwise fallback to npm start
  if check_command pm2; then
    info "Menjalankan via PM2..."
    pm2 start ecosystem.config.cjs
    echo ""
    info "✅ App berjalan di background via PM2"
    echo -e "  ${BOLD}Logs:${NC}     pm2 logs"
    echo -e "  ${BOLD}Status:${NC}   pm2 status"
    echo -e "  ${BOLD}Stop:${NC}     ./ttl.sh stop"
    echo ""
  else
    info "PM2 tidak ditemukan. Menjalankan via npm start..."
    info "Tekan Ctrl+C untuk menghentikan."
    echo ""
    npm start
  fi
}

# ─── Stop ─────────────────────────────────────────────────────────

do_stop() {
  print_banner

  if ! check_command pm2; then
    error "PM2 tidak terinstall. Install dengan: npm install -g pm2"
    exit 1
  fi

  info "Menghentikan Truckers Tool..."
  cd "$INSTALL_DIR" 2>/dev/null || true
  pm2 stop ecosystem.config.cjs 2>/dev/null || pm2 stop ttl-frontend ttl-backend 2>/dev/null || true
  info "✅ App dihentikan."
  echo ""
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

  # Check beta release
  local beta
  beta=$(get_latest_beta)
  if [ -n "$beta" ] && version_lt "$CURRENT_VERSION" "$beta"; then
    echo ""
    echo -e "  ${DIM}🧪 Pre-release tersedia: v${beta} (beta/tester)${NC}"
    echo -e "  ${DIM}Jalankan ${BOLD}./ttl.sh update --beta${NC}${DIM} untuk install.${NC}"
  fi

  # Check alpha release
  local alpha
  alpha=$(get_latest_alpha)
  if [ -n "$alpha" ] && version_lt "$CURRENT_VERSION" "$alpha"; then
    echo ""
    echo -e "  ${DIM}🚧 Alpha release tersedia: v${alpha} (eksperimental)${NC}"
    echo -e "  ${DIM}Jalankan ${BOLD}./ttl.sh update --alpha${NC}${DIM} untuk install.${NC}"
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
    error "Truckers Tool belum terinstall."
    echo -e "  Jalankan: ${BOLD}./ttl.sh install${NC}"
    exit 1
  fi

  cd "$INSTALL_DIR"

  info "Versi saat ini: ${BOLD}v${CURRENT_VERSION}${NC}"

  if [ "$use_beta" = true ]; then
    # Update to pre-release (beta)
    info "🧪 Mengupdate ke versi ${YELLOW}beta (pre-release)${NC}..."
    echo ""

    local beta_tag
    beta_tag=$(get_latest_beta_tag)

    if [ -z "$beta_tag" ]; then
      error "Tidak ada beta release yang tersedia."
      exit 1
    fi

    local beta_ver
    beta_ver=$(echo "$beta_tag" | sed -E 's/^[vV]//')
    info "Beta terbaru: ${BOLD}v${beta_ver}${NC}"

    # Fetch all tags and hard reset
    git fetch origin --tags
    git reset --hard "$beta_tag"
    echo ""

    warn "⚠️  Kamu sekarang di versi beta (${beta_tag})."
    echo -e "  Untuk kembali ke stable: ${BOLD}./ttl.sh update${NC}"
  elif [ "$use_alpha" = true ]; then
    # Update to alpha
    info "🚧 Mengupdate ke versi ${CYAN}alpha (eksperimental)${NC}..."
    echo ""

    local alpha_tag
    alpha_tag=$(get_latest_alpha_tag)

    if [ -z "$alpha_tag" ]; then
      error "Tidak ada alpha release yang tersedia."
      exit 1
    fi

    local alpha_ver
    alpha_ver=$(echo "$alpha_tag" | sed -E 's/^[vV]//')
    info "Alpha terbaru: ${BOLD}v${alpha_ver}${NC}"

    # Fetch all tags and hard reset
    git fetch origin --tags
    git reset --hard "$alpha_tag"
    echo ""

    warn "⚠️  Kamu sekarang di versi alpha (${alpha_tag})."
    echo -e "  Untuk kembali ke stable: ${BOLD}./ttl.sh update${NC}"
  else
    # Update to stable (main branch)
    info "Mengupdate ke versi ${GREEN}stable${NC}..."
    echo ""

    git fetch origin main
    git reset --hard origin/main
  fi
  echo ""

  # Reinstall dependencies
  info "Mengupdate dependencies..."
  npm install
  echo ""

  # Update script itself outside the install directory
  if [ -f "$INSTALL_DIR/ttl.sh" ]; then
    local external_script="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
    if [ "$external_script" != "$INSTALL_DIR/ttl.sh" ] && [ -w "$external_script" ]; then
      info "Mengupdate script ttl.sh di luar direktori instalasi..."
      if [ "$use_beta" = true ]; then
        curl -fsSL "https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/refs/heads/beta/ttl.sh" -o "$external_script" || cp -f "$INSTALL_DIR/ttl.sh" "$external_script"
      else
        curl -fsSL "https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/refs/heads/main/ttl.sh" -o "$external_script" || cp -f "$INSTALL_DIR/ttl.sh" "$external_script"
      fi
      chmod +x "$external_script"
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
  echo "  setup,         --setup       Generate settings.yml (interaktif)"
  echo "  start,    -s,  --start       Jalankan web app (PM2/npm start)"
  echo "  stop,          --stop        Stop app (PM2)"
  echo "  update,   -u,  --update      Update ke versi terbaru"
  echo "  check,    -c,  --check       Cek update (via GitHub Releases)"
  echo "  node,     -n,  --node        Install Node.js via nvm"
  echo "  version,  -v,  --version     Tampilkan versi saat ini"
  echo "  help,     -h,  --help        Tampilkan bantuan ini"
  echo ""
  echo -e "${BOLD}Options:${NC}"
  echo "  update --beta                 Update ke pre-release (beta)"
  echo "  update --alpha                Update ke eksperimental (alpha)"
  echo "  -IS                           Install + setup + start"
  echo ""
  echo -e "${BOLD}Contoh:${NC}"
  echo "  ./ttl.sh node                # Install Node.js"
  echo "  ./ttl.sh install             # Install app"
  echo "  ./ttl.sh setup               # Generate settings.yml"
  echo "  ./ttl.sh start               # Jalankan web app"
  echo "  ./ttl.sh stop                # Stop web app"
  echo "  ./ttl.sh -IS                 # Install + setup + start"
  echo "  ./ttl.sh check               # Cek update"
  echo "  ./ttl.sh update              # Update stable"
  echo "  ./ttl.sh update --beta       # Update ke beta"
  echo "  ./ttl.sh update --alpha      # Update ke alpha"
  echo ""
}

# ─── Main ─────────────────────────────────────────────────────────

if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

case "$1" in
  install|-i|--install)       do_install ;;
  setup|--setup)              do_setup ;;
  start|-s|--start)           do_start ;;
  stop|--stop)                do_stop ;;
  update|-u|--update)         do_update "$2" ;;
  check|-c|--check)           do_check_update ;;
  node|-n|--node)             do_install_node ;;
  version|-v|--version)       do_version ;;
  -IS)                        do_install; do_setup; do_start ;;
  help|-h|--help)             show_help ;;
  *)
    error "Command tidak dikenal: $1"
    echo ""
    show_help
    exit 1
    ;;
esac
