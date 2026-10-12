#!/usr/bin/env bash

# ========================================================
# BillarPulse - Script para Detener Todo por Completo
# ========================================================

echo "🛑 Deteniendo BillarPulse y liberando puertos..."

# 1. Matar procesos en puertos 3001 (Backend) y 5173 (Frontend Vite)
fuser -k 3001/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

# 2. Matar cualquier proceso residual de node relacionado
pkill -f "node.*server/index.js" 2>/dev/null
pkill -f "node.*dev.js" 2>/dev/null

echo "✅ Todos los procesos de BillarPulse han sido detenidos con éxito."
if command -v notify-send &> /dev/null; then
    notify-send "BillarPulse" "El sistema y todos sus procesos han sido detenidos."
fi
