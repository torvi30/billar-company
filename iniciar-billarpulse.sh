#!/usr/bin/env bash

# ========================================================
# BillarPulse - Script de Inicio
# POS & Marcador Táctil Offline-First para Salones de Billar
# ========================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "========================================================"
echo "          🎱 INICIANDO BILLARPULSE LAN POS 🎱           "
echo "========================================================"

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado en este equipo."
    echo "Por favor instale Node.js (v18 o superior)."
    read -p "Presione Enter para salir..."
    exit 1
fi

# 2. Función de limpieza estricta: garantiza que NUNCA quede nada en segundo plano
cleanup() {
    echo ""
    echo "🛑 Deteniendo BillarPulse y liberando recursos..."
    if [ -n "$SERVER_PID" ]; then
        kill "$SERVER_PID" 2>/dev/null
    fi
    # Asegurar que el puerto 3001 quede completamente libre
    fuser -k 3001/tcp 2>/dev/null
    echo "✅ BillarPulse cerrado. No queda ningún proceso en segundo plano."
    exit 0
}

# Capturar cualquier señal de salida (cierre de ventana, Ctrl+C, fin del script)
trap cleanup EXIT INT TERM HUP

# 3. Si había un proceso anterior colgado en el puerto 3001, limpiarlo antes de empezar
fuser -k 3001/tcp 2>/dev/null

# 4. Detectar IP local para tablets
LOCAL_IP=$(node -e "const os = require('os'); const nets = os.networkInterfaces(); for (const n of Object.keys(nets)) { for (const net of nets[n]) { if (net.family === 'IPv4' && !net.internal) { console.log(net.address); process.exit(0); } } } console.log('localhost');")

# 5. Iniciar servidor Backend
echo "🚀 Arrancando servidor central BillarPulse..."
cd server
node index.js &
SERVER_PID=$!
cd "$DIR"

# Esperar a que el servidor esté listo (máx 6 seg)
for i in {1..12}; do
    sleep 0.5
    if (echo > /dev/tcp/localhost/3001) 2>/dev/null; then
        break
    fi
done

APP_URL="http://localhost:3001"
echo ""
echo "--------------------------------------------------------"
echo "📍 Pantalla de Caja (Este PC):  $APP_URL"
echo "📲 Para Tablets en Wi-Fi:      http://${LOCAL_IP}:3001"
echo "--------------------------------------------------------"
echo "💡 Para detener el sistema:"
echo "   - Cierra la ventana de la aplicación"
echo "   - O presiona Ctrl+C / cierra esta terminal"
echo "--------------------------------------------------------"
echo ""

# 6. Abrir ventana de la aplicación
BROWSER_PID=""
if command -v google-chrome &> /dev/null; then
    google-chrome --app="$APP_URL" --user-data-dir="/tmp/billarpulse-chrome" 2>/dev/null &
    BROWSER_PID=$!
elif command -v chromium-browser &> /dev/null; then
    chromium-browser --app="$APP_URL" --user-data-dir="/tmp/billarpulse-chrome" 2>/dev/null &
    BROWSER_PID=$!
elif command -v brave-browser &> /dev/null; then
    brave-browser --app="$APP_URL" --user-data-dir="/tmp/billarpulse-chrome" 2>/dev/null &
    BROWSER_PID=$!
elif command -v firefox &> /dev/null; then
    firefox --new-window "$APP_URL" 2>/dev/null &
    BROWSER_PID=$!
else
    xdg-open "$APP_URL" 2>/dev/null &
    BROWSER_PID=$!
fi

# 7. Mantener el script en ejecución mientras la app o el servidor estén activos
if [ -n "$BROWSER_PID" ]; then
    wait "$BROWSER_PID" 2>/dev/null
fi
if [ -n "$SERVER_PID" ]; then
    wait "$SERVER_PID" 2>/dev/null
fi
