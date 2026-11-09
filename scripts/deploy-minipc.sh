#!/usr/bin/env bash
# ==============================================================================
# BillarPulse Pro - Script de Despliegue y Automatización para Mini-PCs
# Diseñado para Ubuntu / Debian / Linux Mint (x86_64 / ARM64)
# ==============================================================================

set -e

# Colores para la consola
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}   🎱 INICIANDO DESPLIEGUE DE PRODUCCIÓN - BILLARPULSE PRO     ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "Directorio de trabajo: ${BLUE}$ROOT_DIR${NC}\n"

# 1. Verificar Node.js y npm
echo -e "${BLUE}[1/7] Verificando entorno de ejecución Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js no está instalado.${NC}"
    echo "Instala Node.js v20 LTS ejecutando:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "Node.js detectado: ${GREEN}$NODE_VERSION${NC} | npm: ${GREEN}$NPM_VERSION${NC}"

# 2. Crear directorios necesarios
echo -e "\n${BLUE}[2/7] Creando estructura de directorios de persistencia...${NC}"
mkdir -p server/data/logs
mkdir -p server/data/tenants
mkdir -p server/data/backups
echo -e "Directorios verificados: ${GREEN}server/data/{logs, tenants, backups}${NC}"

# 3. Instalar dependencias del servidor
echo -e "\n${BLUE}[3/7] Instalando dependencias de producción del servidor...${NC}"
cd "$ROOT_DIR/server"
npm install --omit=dev --no-audit --no-fund
cd "$ROOT_DIR"

# 4. Compilar frontend de producción
echo -e "\n${BLUE}[4/7] Compilando frontend optimizado con Vite...${NC}"
cd "$ROOT_DIR/client"
if [ ! -d "node_modules" ]; then
    npm install --no-audit --no-fund
fi
npm run build
cd "$ROOT_DIR"

# 5. Configurar PM2
echo -e "\n${BLUE}[5/7] Configurando gestor de procesos PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 no detectado globalmente. Instalando vía npm...${NC}"
    sudo npm install -g pm2 || npm install -g pm2
fi

echo -e "Iniciando/Recargando servicio con PM2..."
pm2 startOrReload ecosystem.config.js --update-env

# 6. Configurar persistencia al encender la Mini-PC (Arranque Automático)
echo -e "\n${BLUE}[6/7] Guardando lista de procesos para inicio automático tras apagón...${NC}"
pm2 save

# Sugerir comando de arranque del sistema si no está configurado
STARTUP_CMD=$(pm2 startup | tail -n 1 || true)
if [[ "$STARTUP_CMD" == sudo* ]]; then
    echo -e "${YELLOW}Ejecuta este comando para registrar el inicio con systemd si es primera vez:${NC}"
    echo -e "${GREEN}$STARTUP_CMD${NC}"
fi

# 7. Crear / Actualizar Accesos Directos de Escritorio
echo -e "\n${BLUE}[7/7] Configurando accesos directos de escritorio...${NC}"
DESKTOP_DIR="$HOME/Desktop"
[ ! -d "$DESKTOP_DIR" ] && DESKTOP_DIR="$HOME/Escritorio"

if [ -d "$DESKTOP_DIR" ]; then
    cat <<EOF > "$DESKTOP_DIR/BillarPulse.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=BillarPulse Pro
Comment=Sistema POS y Marcadores Táctiles de Billar
Exec=xdg-open http://localhost:3001
Icon=games-config-arcade
Terminal=false
StartupNotify=true
Categories=Office;PointOfSale;
EOF
    chmod +x "$DESKTOP_DIR/BillarPulse.desktop"

    cat <<EOF > "$DESKTOP_DIR/Reiniciar-BillarPulse.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=Reiniciar BillarPulse
Comment=Reinicia el servicio de BillarPulse en caso de emergencia
Exec=pm2 restart billarpulse-server
Icon=view-refresh
Terminal=true
Categories=System;
EOF
    chmod +x "$DESKTOP_DIR/Reiniciar-BillarPulse.desktop"
    echo -e "Accesos directos creados en: ${GREEN}$DESKTOP_DIR${NC}"
fi

# Obtener IPs locales de la red LAN
IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}   ✅ ¡DESPLIEGUE COMPLETADO CON ÉXITO! BILLARPULSE ESTÁ ACTIVO  ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "1. Terminal de Caja (Esta Mini-PC): ${BLUE}http://localhost:3001${NC}"
echo -e "2. Conexión Tablets / Meseros (Wi-Fi): ${GREEN}http://${IP_ADDR}:3001${NC}"
echo -e "3. Estado del servicio en tiempo real: ${YELLOW}pm2 status${NC}"
echo -e "4. Logs en vivo: ${YELLOW}pm2 logs billarpulse-server${NC}"
echo -e "5. Código QR de conexión: Abre el sistema y toca 'Conectar Tablets'."
echo -e "${GREEN}================================================================${NC}"

