const SERVER_HOST = window.location.hostname || 'localhost';
const HTTP_BASE = `http://${SERVER_HOST}:3001`;
const WS_BASE = `ws://${SERVER_HOST}:3001`;

class ClientNetworkManager {
  constructor() {
    this.ws = null;
    this.subscribers = new Set();
    this.isConnected = false;
    this.reconnectTimeout = null;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(WS_BASE);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifySubscribers({ type: 'CONNECTION_CHANGE', connected: true });
        console.log('[LAN WS] Conectado al servidor central BillarPulse');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifySubscribers(data);
        } catch (e) {
          console.error('[LAN WS] Error parsing message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifySubscribers({ type: 'CONNECTION_CHANGE', connected: false });
        console.warn('[LAN WS] Desconectado. Reintentando en 3s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[LAN WS] Error de socket:', err);
        this.ws.close();
      };
    } catch (err) {
      console.error('[LAN WS] No se pudo crear WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(data) {
    this.subscribers.forEach(cb => {
      try { cb(data); } catch (e) { console.error('Subscriber error:', e); }
    });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }
}

export const network = new ClientNetworkManager();

// REST API calls
export const api = {
  async getTables() {
    const res = await fetch(`${HTTP_BASE}/api/tables`);
    return res.json();
  },

  async getTableDetails(id) {
    const res = await fetch(`${HTTP_BASE}/api/tables/${id}`);
    return res.json();
  },

  async startSession(tableId) {
    const res = await fetch(`${HTTP_BASE}/api/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId })
    });
    return res.json();
  },

  async endSession(sessionId, paymentMethod = 'Efectivo', applyGracePeriod = false) {
    const res = await fetch(`${HTTP_BASE}/api/sessions/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, paymentMethod, applyGracePeriod })
    });
    return res.json();
  },

  async pauseSession(sessionId) {
    const res = await fetch(`${HTTP_BASE}/api/sessions/${sessionId}/pause`, {
      method: 'POST'
    });
    return res.json();
  },

  async resumeSession(sessionId) {
    const res = await fetch(`${HTTP_BASE}/api/sessions/${sessionId}/resume`, {
      method: 'POST'
    });
    return res.json();
  },

  async getSettings() {
    const res = await fetch(`${HTTP_BASE}/api/settings`);
    return res.json();
  },

  async updateSetting(key, value) {
    const res = await fetch(`${HTTP_BASE}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    return res.json();
  },

  async createBarTab(name) {
    const res = await fetch(`${HTTP_BASE}/api/bar-tabs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return res.json();
  },

  async deleteBarTab(tableId) {
    const res = await fetch(`${HTTP_BASE}/api/bar-tabs/${tableId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async addOrder(sessionId, items, assignedTo = 'Mesa') {
    const res = await fetch(`${HTTP_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, items, assignedTo })
    });
    return res.json();
  },

  async transferSession(sourceTableId, targetTableId) {
    const res = await fetch(`${HTTP_BASE}/api/sessions/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceTableId, targetTableId })
    });
    return res.json();
  },

  async getSessionBreakdown(sessionId) {
    const res = await fetch(`${HTTP_BASE}/api/sessions/${sessionId}/breakdown`);
    return res.json();
  },

  async triggerAlert(tableId, type = 'waiter') {
    const res = await fetch(`${HTTP_BASE}/api/tables/${tableId}/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    return res.json();
  },

  async resolveAlertsForTable(tableId) {
    const res = await fetch(`${HTTP_BASE}/api/tables/${tableId}/resolve-alerts`, {
      method: 'POST'
    });
    return res.json();
  },

  async updateScore(tableId, scoreData) {
    const res = await fetch(`${HTTP_BASE}/api/tables/${tableId}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scoreData)
    });
    return res.json();
  },

  async getProducts() {
    const res = await fetch(`${HTTP_BASE}/api/products`);
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${HTTP_BASE}/api/stats`);
    return res.json();
  },

  async getShiftReport() {
    const res = await fetch(`${HTTP_BASE}/api/reports/shift`);
    return res.json();
  },

  async getClosedSessions(limit = 50) {
    const res = await fetch(`${HTTP_BASE}/api/history/sessions?limit=${limit}`);
    return res.json();
  },

  async getInvoiceDetails(id) {
    const res = await fetch(`${HTTP_BASE}/api/invoices/${id}`);
    return res.json();
  },

  async verifyPin(pin) {
    const res = await fetch(`${HTTP_BASE}/api/auth/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    return res.json();
  },

  async updatePin(oldPin, newPin) {
    const res = await fetch(`${HTTP_BASE}/api/auth/update-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPin, newPin })
    });
    return res.json();
  },

  async getAdminProducts() {
    const res = await fetch(`${HTTP_BASE}/api/admin/products`);
    return res.json();
  },

  async createProduct(data) {
    const res = await fetch(`${HTTP_BASE}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateProduct(id, data) {
    const res = await fetch(`${HTTP_BASE}/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async adjustStock(id, delta) {
    const res = await fetch(`${HTTP_BASE}/api/products/${id}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta })
    });
    return res.json();
  },

  async deleteProduct(id) {
    const res = await fetch(`${HTTP_BASE}/api/products/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async updateTable(id, data) {
    const res = await fetch(`${HTTP_BASE}/api/tables/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async createTable(data) {
    const res = await fetch(`${HTTP_BASE}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getBackupDownloadUrl() {
    return `${HTTP_BASE}/api/admin/backup/download`;
  }
};
