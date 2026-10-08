const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const WebSocket = require('ws');
const { dbOperations, dbPath } = require('./db');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Broadcast helpers
function broadcastToAll(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function broadcastTableUpdate(tableId) {
  const tableState = tableId ? dbOperations.getTableState(tableId) : null;
  const tablesOverview = dbOperations.getTablesWithSessions();
  const stats = dbOperations.getStats();

  broadcastToAll({
    type: 'TABLE_STATE_CHANGED',
    tableId,
    tableState,
    tablesOverview,
    stats,
    timestamp: Date.now()
  });
}

// WebSocket Connection Management
wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  // Send initial data to client
  try {
    const tablesOverview = dbOperations.getTablesWithSessions();
    const stats = dbOperations.getStats();
    ws.send(JSON.stringify({
      type: 'INIT_STATE',
      tablesOverview,
      stats,
      timestamp: Date.now()
    }));
  } catch (err) {
    console.error('WS Init error:', err);
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.action) {
        case 'GET_TABLE_STATE': {
          const state = dbOperations.getTableState(data.tableId);
          ws.send(JSON.stringify({
            type: 'TABLE_STATE_RESPONSE',
            tableId: data.tableId,
            tableState: state
          }));
          break;
        }

        case 'UPDATE_SCORE': {
          dbOperations.updateScore(data.tableId, data.scoreData);
          broadcastTableUpdate(data.tableId);
          break;
        }

        case 'CALL_SERVICE': {
          dbOperations.createAlert(data.tableId, data.serviceType || 'waiter');
          broadcastTableUpdate(data.tableId);
          break;
        }

        case 'RESOLVE_ALERTS': {
          dbOperations.resolveAllAlertsForTable(data.tableId);
          broadcastTableUpdate(data.tableId);
          break;
        }

        case 'PAUSE_SESSION': {
          const session = dbOperations.pauseSession(data.sessionId);
          broadcastTableUpdate(session.table_id);
          break;
        }

        case 'RESUME_SESSION': {
          const session = dbOperations.resumeSession(data.sessionId);
          broadcastTableUpdate(session.table_id);
          break;
        }

        case 'TRANSFER_SESSION': {
          const result = dbOperations.transferSession(data.sourceTableId, data.targetTableId);
          broadcastTableUpdate(data.sourceTableId);
          broadcastTableUpdate(data.targetTableId);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('WS Message error:', err);
    }
  });
});

// Periodic heartbeat
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 15000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// --- REST API ENDPOINTS ---

// Get all tables with sessions and alerts
app.get('/api/tables', (req, res) => {
  try {
    const data = dbOperations.getTablesWithSessions();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get state of specific table
app.get('/api/tables/:id', (req, res) => {
  try {
    const state = dbOperations.getTableState(Number(req.params.id));
    if (!state) return res.status(404).json({ success: false, error: 'Mesa no encontrada' });
    res.json({ success: true, data: state });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start session
app.post('/api/sessions/start', (req, res) => {
  try {
    const { tableId } = req.body;
    if (!tableId) return res.status(400).json({ success: false, error: 'tableId requerido' });
    const result = dbOperations.startSession(Number(tableId));
    broadcastTableUpdate(Number(tableId));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// End session (Cierre de cuenta con soporte de periodo de gracia)
app.post('/api/sessions/end', (req, res) => {
  try {
    const { sessionId, paymentMethod, applyGracePeriod } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId requerido' });
    const result = dbOperations.closeSession(Number(sessionId), paymentMethod, Boolean(applyGracePeriod));
    broadcastTableUpdate(result.tableId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Pause session timer
app.post('/api/sessions/:id/pause', (req, res) => {
  try {
    const session = dbOperations.pauseSession(Number(req.params.id));
    broadcastTableUpdate(session.table_id);
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Resume session timer
app.post('/api/sessions/:id/resume', (req, res) => {
  try {
    const session = dbOperations.resumeSession(Number(req.params.id));
    broadcastTableUpdate(session.table_id);
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Transfer session from one table to another
app.post('/api/sessions/transfer', (req, res) => {
  try {
    const { sourceTableId, targetTableId } = req.body;
    if (!sourceTableId || !targetTableId) {
      return res.status(400).json({ success: false, error: 'sourceTableId y targetTableId requeridos' });
    }
    const result = dbOperations.transferSession(Number(sourceTableId), Number(targetTableId));
    broadcastTableUpdate(Number(sourceTableId));
    broadcastTableUpdate(Number(targetTableId));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get session consumption breakdown by player/table
app.get('/api/sessions/:id/breakdown', (req, res) => {
  try {
    const data = dbOperations.getSessionConsumptionBreakdown(Number(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Bar Tabs / Salón endpoints (Cuentas sin mesa de billar)
app.post('/api/bar-tabs', (req, res) => {
  try {
    const { name } = req.body;
    const tab = dbOperations.createBarTab(name);
    broadcastTableUpdate(tab.tableId);
    res.json({ success: true, data: tab });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/bar-tabs/:id', (req, res) => {
  try {
    const tableId = Number(req.params.id);
    const result = dbOperations.deleteBarTab(tableId);
    broadcastTableUpdate(null);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  try {
    const data = dbOperations.getSettings();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const { key, value } = req.body;
    const data = dbOperations.updateSetting(key, value);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Add order / consumptions
app.post('/api/orders', (req, res) => {
  try {
    const { sessionId, items, assignedTo } = req.body;
    if (!sessionId || !items || !items.length) {
      return res.status(400).json({ success: false, error: 'sessionId e items requeridos' });
    }
    const result = dbOperations.addOrder(Number(sessionId), items, assignedTo || 'Mesa');
    broadcastTableUpdate(result.tableId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Trigger service alert from table
app.post('/api/tables/:id/alert', (req, res) => {
  try {
    const tableId = Number(req.params.id);
    const { type } = req.body;
    const result = dbOperations.createAlert(tableId, type || 'waiter');
    broadcastTableUpdate(tableId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Resolve specific alert
app.post('/api/alerts/:id/resolve', (req, res) => {
  try {
    const alertId = Number(req.params.id);
    const result = dbOperations.resolveAlert(alertId);
    if (result) broadcastTableUpdate(result.tableId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Resolve all alerts for a table (e.g. mesero atendió)
app.post('/api/tables/:id/resolve-alerts', (req, res) => {
  try {
    const tableId = Number(req.params.id);
    const result = dbOperations.resolveAllAlertsForTable(tableId);
    broadcastTableUpdate(tableId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update score
app.post('/api/tables/:id/score', (req, res) => {
  try {
    const tableId = Number(req.params.id);
    const updated = dbOperations.updateScore(tableId, req.body);
    broadcastTableUpdate(tableId);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Products catalog (active products for POS)
app.get('/api/products', (req, res) => {
  try {
    const data = dbOperations.getProducts();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// All products (including for admin management)
app.get('/api/admin/products', (req, res) => {
  try {
    const data = dbOperations.getAllProducts();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create product
app.post('/api/products', (req, res) => {
  try {
    const product = dbOperations.createProduct(req.body);
    broadcastTableUpdate(null);
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update product
app.put('/api/products/:id', (req, res) => {
  try {
    const product = dbOperations.updateProduct(Number(req.params.id), req.body);
    broadcastTableUpdate(null);
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Adjust product stock
app.post('/api/products/:id/stock', (req, res) => {
  try {
    const { delta } = req.body;
    const product = dbOperations.adjustProductStock(Number(req.params.id), delta);
    broadcastTableUpdate(null);
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete / Deactivate product
app.delete('/api/products/:id', (req, res) => {
  try {
    const result = dbOperations.deleteProduct(Number(req.params.id));
    broadcastTableUpdate(null);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update table configuration (rates, name, type)
app.put('/api/tables/:id', (req, res) => {
  try {
    const tableId = Number(req.params.id);
    const table = dbOperations.updateTable(tableId, req.body);
    broadcastTableUpdate(tableId);
    res.json({ success: true, data: table });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Create new table
app.post('/api/tables', (req, res) => {
  try {
    const table = dbOperations.createTable(req.body);
    broadcastTableUpdate(table.id);
    res.json({ success: true, data: table });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Daily stats
app.get('/api/stats', (req, res) => {
  try {
    const data = dbOperations.getStats();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Inventory: low stock items
app.get('/api/inventory/low-stock', (req, res) => {
  try {
    const data = dbOperations.getLowStockProducts();
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cash Shifts management
app.get('/api/shifts/current', (req, res) => {
  try {
    const shift = dbOperations.getCurrentShift();
    res.json({ success: true, data: shift });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/shifts/open', (req, res) => {
  try {
    const shift = dbOperations.openShift(req.body);
    broadcastTableUpdate(null);
    res.json({ success: true, data: shift });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/shifts/:id/initial-cash', (req, res) => {
  try {
    const { initial_cash } = req.body;
    const shift = dbOperations.updateShiftInitialCash(Number(req.params.id), initial_cash);
    res.json({ success: true, data: shift });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/shifts/movements', (req, res) => {
  try {
    const movement = dbOperations.addCashMovement(req.body);
    res.json({ success: true, data: movement });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/shifts/:id/movements', (req, res) => {
  try {
    const movements = dbOperations.getCashMovements(Number(req.params.id));
    res.json({ success: true, data: movements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/shifts/close', (req, res) => {
  try {
    const closed = dbOperations.closeShift(req.body);
    broadcastTableUpdate(null);
    res.json({ success: true, data: closed });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/shifts/history', (req, res) => {
  try {
    const history = dbOperations.getClosedShifts(Number(req.query.limit) || 10);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Shift / Arqueo report
app.get('/api/reports/shift', (req, res) => {
  try {
    const shiftId = req.query.shiftId ? Number(req.query.shiftId) : null;
    const report = dbOperations.getShiftReport(shiftId);
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Closed sessions history
app.get('/api/history/sessions', (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const data = dbOperations.getClosedSessions(limit);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Invoice details
app.get('/api/invoices/:id', (req, res) => {
  try {
    const invoice = dbOperations.getSessionInvoice(Number(req.params.id));
    if (!invoice) return res.status(404).json({ success: false, error: 'Factura no encontrada' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify Admin PIN
app.post('/api/auth/verify-pin', (req, res) => {
  try {
    const { pin } = req.body;
    const isValid = dbOperations.verifyAdminPin(String(pin || ''));
    res.json({ success: true, isValid });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update Admin PIN
app.post('/api/auth/update-pin', (req, res) => {
  try {
    const { oldPin, newPin } = req.body;
    if (!dbOperations.verifyAdminPin(String(oldPin || ''))) {
      return res.status(401).json({ success: false, error: 'PIN actual incorrecto' });
    }
    if (!newPin || newPin.length < 4) {
      return res.status(400).json({ success: false, error: 'El nuevo PIN debe tener al menos 4 dígitos' });
    }
    dbOperations.updateAdminPin(String(newPin));
    res.json({ success: true, message: 'PIN actualizado exitosamente' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Analytics and Statistical Reports
app.get('/api/admin/analytics', (req, res) => {
  try {
    const range = req.query.range || 'today';
    const data = dbOperations.getAnalytics(range);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Download SQLite Database Backup
app.get('/api/admin/backup/download', (req, res) => {
  try {
    const filename = `billarpulse-backup-${new Date().toISOString().slice(0, 10)}.db`;
    res.download(dbPath, filename);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Network LAN IP Info (For automatic QR Code generator)
app.get('/api/network/info', (req, res) => {
  try {
    const nets = os.networkInterfaces();
    let localIp = 'localhost';
    const allIps = [];

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          allIps.push({ interface: name, ip: net.address });
          if (localIp === 'localhost') localIp = net.address;
        }
      }
    }

    res.json({
      success: true,
      data: {
        port: PORT,
        localIp,
        allIps,
        hostname: os.hostname(),
        baseUrl: `http://${localIp}:${PORT}`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Static assets for production build
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// Fallback for SPA routing in Express 5
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint no encontrado' });
  }
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.send('BillarPulse API Server is running. Frontend dev server is at port 5173.');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[BillarPulse] Servidor activo en http://0.0.0.0:${PORT} (WebSocket listo)`);
});
