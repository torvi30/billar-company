# 🎱 BillarPulse

**Sistema POS & Marcador Táctil Offline-First para Salas de Billar**

BillarPulse es una solución integral diseñada para salones y clubes de billar. Funciona de manera **100% autónoma en red de área local (LAN)**, eliminando la dependencia de conexión a Internet y garantizando tolerancia a cortes eléctricos.

---

## 🌟 Características Principales

### 1. Terminal Táctil de Mesa (Cliente Kiosco)
- **Interfaz Ergonómica y de Alto Contraste:** Diseñada para entornos con iluminación tenue de billar y objetivos táctiles de gran tamaño (≥120px) para evitar toques accidentales con tacos o tiza.
- **Marcador Táctil:** Conteo de puntos en tiempo real para Jugador/Equipo 1 vs Jugador/Equipo 2, contador de Chicos/Sets y reinicio seguro.
- **Cronómetro & Costo Parcial:** Cálculo automático del tiempo transcurrido y tarifa por hora calculada por marcas de tiempo absolutas (`start_time`), inmune a reinicios de tablet.
- **Visor de Saldo Acumulado:** Muestra el gran total proyectado (tiempo de juego + consumos de barra despachados desde caja).
- **Botón de Servicio Instantáneo:**
  - *Llamar Mesero:* Dispara alerta sonora (campana) y visual en caja; la tablet pasa a modo confirmación con pulso visual.
  - *Pedir Cuenta:* Notifica a caja para que prepare la liquidación.
- *Cero Fricción:* No incluye catálogo de productos ni opciones distractoras en mesa.

### 2. Panel Central de Caja & Barra (POS Central)
- **Plano Visual en Tiempo Real:** Monitor de salón con estado de cada mesa (Disponible, En Partida, Llamada de Mesero Activa).
- **Speed-POS (Consumos en 2 clics):** Modal ágil para cargar cervezas, licores y snacks a cualquier mesa ocupada en menos de 2 segundos.
- **Liquidación & Cierre de Caja:** Consolidación de tiempo + consumos, selección de forma de pago (Efectivo, QR/Transferencia, Tarjeta) y simulación de comanda/ticket térmico ESC/POS de 80mm.
- **Campana de Alertas:** Notificación sonora en vivo (Web Audio API offline) ante llamadas de salón con botón de atención rápida.

---

## 🚀 Puesta en Marcha Rápida

### Requisitos
- Node.js LTS (v18 o superior)
- Red Local LAN (Router WiFi 2.4/5GHz)

### Instalación y Ejecución
1. El servidor ya incluye las dependencias y la base de datos preconfigurada con 6 mesas y catálogo inicial de barra.
2. Iniciar el servidor local:
```bash
npm start
```
3. Abrir en el navegador:
   - **Panel de Caja / Barra:** `http://localhost:3001`
   - **Terminal Mesa 1 (Modo Kiosco):** `http://localhost:3001/?view=kiosk&table=1`
   - **Terminal Mesa 2:** `http://localhost:3001/?view=kiosk&table=2`
   - *(o utilizar el selector rápido de vista en el encabezado superior).*

---

## 📱 Configuración de Tablets en Salón (Modo Kiosco)

1. Conectar las tablets a la red Wi-Fi del local.
2. Identificar la IP local del servidor (ej. `192.168.1.50`).
3. Instalar en cada tablet **Fully Kiosk Browser** (o añadir a pantalla de inicio como PWA).
4. Configurar la URL de inicio según el número de mesa:
   `http://192.168.1.50:3001/?view=kiosk&table=X` (reemplazando `X` por el ID de la mesa).
5. Activar *"Keep Screen On"* y bloquear la barra de navegación del sistema.

---

## 🗄️ Estructura del Proyecto

```
billar-company/
├── system_architecture.md   # Especificación técnica maestra
├── package.json             # Scripts de ejecución raíz
├── server/
│   ├── index.js             # Servidor HTTP + WebSocket + API REST
│   ├── db.js                # Base de datos SQLite (WAL Mode, transacciones)
│   └── data/
│       └── billarpulse.db   # Archivo de base de datos local
└── client/
    ├── index.html           # Plantilla HTML con tipografía Outfit & Mono
    ├── src/
    │   ├── App.jsx          # Enrutador reactivo y sincronizador WS
    │   ├── index.css        # Design System (OLED Dark, Neon Green, Gold)
    │   ├── components/
    │   │   ├── Navbar.jsx           # Barra superior con estado LAN
    │   │   ├── TableKiosk.jsx       # Pantalla táctil de mesa
    │   │   ├── CajaDashboard.jsx    # Plano de mesas y POS central
    │   │   ├── SpeedPOSModal.jsx    # Carga rápida de productos
    │   │   └── CheckoutModal.jsx    # Liquidación y ticket térmico
    │   ├── services/
    │   │   └── api.js               # Gestor WebSocket y cliente REST
    │   └── utils/
    │       ├── audio.js             # Sintetizador Web Audio API offline
    │       └── formatters.js        # Formatos de moneda y cronómetro
    └── dist/                # Bundle de producción servido por Node.js
```
