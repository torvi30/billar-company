#!/usr/bin/env bash

# ========================================================
# BillarPulse - Script de Inicio Automático en 1 Clic
# POS & Marcador Táctil Offline-First para Salones de Billar
# ========================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "========================================================"
echo "          🎱 INICIANDO BILLARPULSE LAN POS 🎱           "
echo "========================================================"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado en este equipo."
    echo "Por favor instale Node.js (v18 o superior)."
    read -p "Presione Enter para salir..."
    exit 1
fi

# Detectar IP local para tablets
LOCAL_IP=$(node -e "const os = require('os'); const nets = os.networkInterfaces(); for (const n of Object.keys(nets)) { for (const net of nets[n]) { if (net.family === 'IPv4' && !net.internal) { console.log(net.address); process.exit(0); } } } console.log('localhost');")

# Comprobar si el servidor ya está corriendo en el puerto 3001
if ! nc -z localhost 3001 2>/dev/null && ! (echo > /dev/tcp/localhost/3001) 2>/dev/null; then
    echo "🚀 Arrancando servidor central BillarPulse en segundo plano..."
    cd server
    nohup node index.js > server.log 2>&1 &
    SERVER_PID=$!
    cd "$DIR"
    echo "Servidor iniciado con PID $SERVER_PID."
    
    # Esperar hasta 5 segundos a que responda el puerto 3001
    for i in {1..10}; do
        sleep 0.5
        if (echo > /dev/tcp/localhost/3001) 2>/dev/null; then
            break
        fi
    done
else
    echo "✅ El servidor central ya está activo en el puerto 3001."
fi

APP_URL="http://localhost:3001"
echo ""
echo "--------------------------------------------------------"
echo "📍 Pantalla de Caja (Este PC):  $APP_URL"
echo "📲 Para Tablets en Wi-Fi:      http://${LOCAL_IP}:3001"
echo "--------------------------------------------------------"
echo ""

# Abrir automáticamente en el navegador favorito en modo aplicación
if command -v google-chrome &> /dev/null; then
    google-chrome --app="$APP_URL" --start-maximized &
elif command -v chromium-browser &> /dev/null; then
    chromium-browser --app="$APP_URL" --start-maximized &
elif command -v brave-browser &> /dev/null; then
    brave-browser --app="$APP_URL" --start-maximized &
elif command -v firefox &> /dev/null; then
    firefox --new-window "$APP_URL" &
else
    xdg-open "$APP_URL" &
fi

echo "🎱 BillarPulse abierto exitosamente. ¡Que disfrutes la jornada!"
sleep 2
exit 0
