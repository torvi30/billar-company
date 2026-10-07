const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'billarpulse.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'pool',
      hourly_rate REAL NOT NULL DEFAULT 8000.0,
      status TEXT NOT NULL DEFAULT 'available'
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL REFERENCES tables(id),
      start_time TEXT NOT NULL,
      end_time TEXT,
      rate_applied REAL NOT NULL,
      total_time_minutes INTEGER DEFAULT 0,
      time_cost REAL DEFAULT 0.0,
      consumption_cost REAL DEFAULT 0.0,
      total_amount REAL DEFAULT 0.0,
      payment_method TEXT,
      status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 50,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      created_at TEXT NOT NULL,
      total REAL NOT NULL DEFAULT 0.0
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER REFERENCES sessions(id),
      table_id INTEGER NOT NULL REFERENCES tables(id),
      type TEXT NOT NULL, -- 'waiter' | 'bill'
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'attended'
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL UNIQUE REFERENCES tables(id),
      player1_name TEXT DEFAULT 'Jugador 1',
      player2_name TEXT DEFAULT 'Jugador 2',
      score1 INTEGER DEFAULT 0,
      score2 INTEGER DEFAULT 0,
      sets1 INTEGER DEFAULT 0,
      sets2 INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migrations for existing DB if needed
  try { db.exec('ALTER TABLE sessions ADD COLUMN is_paused INTEGER DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE sessions ADD COLUMN paused_at TEXT;'); } catch(e) {}
  try { db.exec('ALTER TABLE sessions ADD COLUMN accumulated_seconds INTEGER DEFAULT 0;'); } catch(e) {}
  try { db.exec("ALTER TABLE order_items ADD COLUMN assigned_to TEXT DEFAULT 'Mesa';"); } catch(e) {}

  // Default settings
  db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_pin', '1234')
  `).run();
  db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('grace_period_minutes', '3')
  `).run();
  db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('rounding_mode', 'exact')
  `).run();
  db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('business_name', 'BILLARPULSE CLUB')
  `).run();
  db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('business_nit', '901.442.118-0')
  `).run();
  db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('business_phone', '300 123 4567')
  `).run();
  db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('business_address', 'Calle 50 # 70-20, Salón & Bar')
  `).run();
  db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('ticket_footer', '¡GRACIAS POR SU VISITA! VUELVA PRONTO.')
  `).run();

  // Seed default tables if empty
  const tableCount = db.prepare('SELECT COUNT(*) as count FROM tables').get().count;
  if (tableCount === 0) {
    const insertTable = db.prepare(`
      INSERT INTO tables (table_number, name, type, hourly_rate, status)
      VALUES (?, ?, ?, ?, 'available')
    `);
    const insertScore = db.prepare(`
      INSERT INTO scores (table_id, player1_name, player2_name, score1, score2, sets1, sets2, updated_at)
      VALUES (?, 'Jugador 1', 'Jugador 2', 0, 0, 0, 0, ?)
    `);

    const defaultTables = [
      { num: '01', name: 'Mesa 1 - Clásica', type: 'pool', rate: 8000 },
      { num: '02', name: 'Mesa 2 - Diamante', type: 'pool', rate: 8000 },
      { num: '03', name: 'Mesa 3 - Brunswick', type: 'pool', rate: 9000 },
      { num: '04', name: 'Mesa 4 - Tres Bandas', type: 'tres_bandas', rate: 10000 },
      { num: '05', name: 'Mesa 5 - Master Pro', type: 'pool', rate: 8000 },
      { num: '06', name: 'Mesa 6 - Snooker VIP', type: 'snooker', rate: 12000 },
    ];

    const now = new Date().toISOString();
    for (const t of defaultTables) {
      const res = insertTable.run(t.num, t.name, t.type, t.rate);
      insertScore.run(res.lastInsertRowid, now);
    }
  }

  // Seed default products if empty
  const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (prodCount === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (name, category, price, stock, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);

    const defaultProducts = [
      // Cervezas
      { name: 'Cerveza Águila 330ml', category: 'Cervezas', price: 5000, stock: 120 },
      { name: 'Cerveza Club Colombia', category: 'Cervezas', price: 6500, stock: 96 },
      { name: 'Cerveza Corona Extra', category: 'Cervezas', price: 8000, stock: 72 },
      { name: 'Cerveza Stella Artois', category: 'Cervezas', price: 8500, stock: 48 },
      { name: 'Cerveza Heineken', category: 'Cervezas', price: 8000, stock: 60 },
      { name: 'Cerveza Poker', category: 'Cervezas', price: 5000, stock: 100 },
      // Licores / Tragos
      { name: 'Aguardiente Antioqueño (Media)', category: 'Licores', price: 45000, stock: 24 },
      { name: 'Ron Medellín 3 Años (Media)', category: 'Licores', price: 48000, stock: 20 },
      { name: 'Whisky Buchanan\'s 12 (Trago)', category: 'Licores', price: 18000, stock: 30 },
      // Bebidas sin alcohol
      { name: 'Agua Manantial con Gas', category: 'Bebidas', price: 3500, stock: 50 },
      { name: 'Agua Cristal 600ml', category: 'Bebidas', price: 3000, stock: 80 },
      { name: 'Gaseosa Coca-Cola 400ml', category: 'Bebidas', price: 4000, stock: 65 },
      { name: 'Gaseosa Postobón Manzana', category: 'Bebidas', price: 3500, stock: 50 },
      { name: 'Bebida Energizante Red Bull', category: 'Bebidas', price: 10000, stock: 40 },
      // Snacks
      { name: 'Papas Margarita Pollo', category: 'Snacks', price: 3500, stock: 45 },
      { name: 'Papas Margarita Limón', category: 'Snacks', price: 3500, stock: 40 },
      { name: 'Maní Especial Salado', category: 'Snacks', price: 2500, stock: 50 },
      { name: 'Platanitos Maduros', category: 'Snacks', price: 3000, stock: 35 }
    ];

    for (const p of defaultProducts) {
      insertProd.run(p.name, p.category, p.price, p.stock);
    }
  }
}

initSchema();

// Helper database operations
const dbOperations = {
  getTablesWithSessions() {
    const tables = db.prepare("SELECT * FROM tables WHERE status != 'closed' ORDER BY id ASC").all();
    const activeSessions = db.prepare(`
      SELECT s.*, 
        COALESCE((SELECT SUM(o.total) FROM orders o WHERE o.session_id = s.id), 0) as total_consumption
      FROM sessions s
      WHERE s.status = 'active'
    `).all();

    const pendingAlerts = db.prepare(`
      SELECT * FROM service_alerts WHERE status = 'pending'
    `).all();

    const allScores = db.prepare('SELECT * FROM scores').all();

    return tables.map(table => {
      const session = activeSessions.find(s => s.table_id === table.id) || null;
      const alerts = pendingAlerts.filter(a => a.table_id === table.id);
      const score = allScores.find(sc => sc.table_id === table.id) || {
        player1_name: 'Jugador 1',
        player2_name: 'Jugador 2',
        score1: 0,
        score2: 0,
        sets1: 0,
        sets2: 0
      };

      return {
        ...table,
        current_session: session,
        alerts: alerts,
        score: score
      };
    });
  },

  getTableState(tableId) {
    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId);
    if (!table) return null;

    const session = db.prepare(`
      SELECT s.*, 
        COALESCE((SELECT SUM(o.total) FROM orders o WHERE o.session_id = s.id), 0) as total_consumption
      FROM sessions s
      WHERE s.table_id = ? AND s.status = 'active'
    `).get(tableId) || null;

    let orders = [];
    if (session) {
      orders = db.prepare(`
        SELECT oi.id, oi.quantity, oi.unit_price, oi.subtotal, COALESCE(oi.assigned_to, 'Mesa') as assigned_to, p.name as product_name, o.created_at
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        WHERE o.session_id = ?
        ORDER BY o.created_at DESC
      `).all(session.id);
    }

    const alerts = db.prepare(`
      SELECT * FROM service_alerts 
      WHERE table_id = ? AND status = 'pending'
    `).all(tableId);

    const score = db.prepare('SELECT * FROM scores WHERE table_id = ?').get(tableId) || {
      player1_name: 'Jugador 1',
      player2_name: 'Jugador 2',
      score1: 0,
      score2: 0,
      sets1: 0,
      sets2: 0
    };

    return {
      table,
      session,
      orders,
      alerts,
      score
    };
  },

  startSession(tableId) {
    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId);
    if (!table) throw new Error('Mesa no encontrada');

    const existing = db.prepare(`
      SELECT id FROM sessions WHERE table_id = ? AND status = 'active'
    `).get(tableId);

    if (existing) throw new Error('La mesa ya tiene una sesión activa');

    const startTime = new Date().toISOString();
    const insert = db.prepare(`
      INSERT INTO sessions (table_id, start_time, rate_applied, status)
      VALUES (?, ?, ?, 'active')
    `);
    const res = insert.run(tableId, startTime, table.hourly_rate);

    db.prepare('UPDATE tables SET status = \'occupied\' WHERE id = ?').run(tableId);

    // Reset scores for new game
    db.prepare(`
      INSERT INTO scores (table_id, player1_name, player2_name, score1, score2, sets1, sets2, updated_at)
      VALUES (?, 'Jugador 1', 'Jugador 2', 0, 0, 0, 0, ?)
      ON CONFLICT(table_id) DO UPDATE SET
        score1 = 0, score2 = 0, sets1 = 0, sets2 = 0, updated_at = excluded.updated_at
    `).run(tableId, startTime);

    return { sessionId: res.lastInsertRowid, startTime, tableId };
  },

  pauseSession(sessionId) {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND status = \'active\'').get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');
    if (session.is_paused) return session;

    const now = new Date();
    const startMs = new Date(session.start_time).getTime();
    const elapsedSec = Math.max(0, Math.floor((now.getTime() - startMs) / 1000));
    const newAccum = (session.accumulated_seconds || 0) + elapsedSec;

    db.prepare(`
      UPDATE sessions SET
        is_paused = 1,
        paused_at = ?,
        accumulated_seconds = ?
      WHERE id = ?
    `).run(now.toISOString(), newAccum, sessionId);

    return db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  },

  resumeSession(sessionId) {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND status = \'active\'').get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');
    if (!session.is_paused) return session;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE sessions SET
        is_paused = 0,
        paused_at = NULL,
        start_time = ?
      WHERE id = ?
    `).run(now, sessionId);

    return db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  },

  closeSession(sessionId, paymentMethod = 'Efectivo', applyGracePeriod = false) {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    if (!session || session.status !== 'active') throw new Error('Sesión no válida o ya cerrada');

    const endTime = new Date().toISOString();
    
    // Total played seconds calculation (supporting pause)
    let totalSeconds = session.accumulated_seconds || 0;
    if (!session.is_paused) {
      const startMs = new Date(session.start_time).getTime();
      const endMs = new Date(endTime).getTime();
      totalSeconds += Math.max(0, Math.floor((endMs - startMs) / 1000));
    }
    const minutes = Math.max(1, Math.round(totalSeconds / 60));

    // Get establishments rules
    const graceSetting = db.prepare("SELECT value FROM settings WHERE key = 'grace_period_minutes'").get();
    const graceMinutes = Number(graceSetting ? graceSetting.value : 3);

    const roundingSetting = db.prepare("SELECT value FROM settings WHERE key = 'rounding_mode'").get();
    const roundingMode = roundingSetting ? roundingSetting.value : 'exact';

    let effectiveMinutes = minutes;
    if (roundingMode === '15_min') {
      effectiveMinutes = Math.max(15, Math.ceil(minutes / 15) * 15);
    } else if (roundingMode === 'minimum_30') {
      effectiveMinutes = Math.max(30, minutes);
    }

    // Determine time cost (Grace period gives 0 if applicable)
    let timeCost = 0;
    if (applyGracePeriod || minutes <= graceMinutes) {
      timeCost = 0;
    } else {
      timeCost = Math.round((session.rate_applied * (effectiveMinutes / 60)));
    }

    // Total consumptions
    const consumptionResult = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total_consumption FROM orders WHERE session_id = ?
    `).get(sessionId);
    const consumptionCost = consumptionResult.total_consumption;
    const finalTotal = timeCost + consumptionCost;

    db.prepare(`
      UPDATE sessions SET
        end_time = ?,
        total_time_minutes = ?,
        time_cost = ?,
        consumption_cost = ?,
        total_amount = ?,
        payment_method = ?,
        status = 'closed'
      WHERE id = ?
    `).run(endTime, effectiveMinutes, timeCost, consumptionCost, finalTotal, paymentMethod, sessionId);

    // Free the table (or close if it was a bar tab)
    const tableInfo = db.prepare('SELECT type FROM tables WHERE id = ?').get(session.table_id);
    if (tableInfo && tableInfo.type === 'barra') {
      db.prepare("UPDATE tables SET status = 'closed' WHERE id = ?").run(session.table_id);
    } else {
      db.prepare("UPDATE tables SET status = 'available' WHERE id = ?").run(session.table_id);
    }

    // Dismiss any pending alerts for this session
    db.prepare(`
      UPDATE service_alerts SET status = 'attended', resolved_at = ? 
      WHERE table_id = ? AND status = 'pending'
    `).run(endTime, session.table_id);

    return {
      sessionId,
      tableId: session.table_id,
      minutes: effectiveMinutes,
      rawMinutes: minutes,
      timeCost,
      consumptionCost,
      finalTotal,
      endTime,
      paymentMethod,
      graceApplied: timeCost === 0 && minutes > 0
    };
  },

  addOrder(sessionId, items, defaultAssignedTo = 'Mesa') {
    // items: [{ productId, quantity, assignedTo? }]
    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND status = \'active\'').get(sessionId);
    if (!session) throw new Error('Sesión no encontrada o no activa');

    let totalOrder = 0;
    const preparedItems = [];

    const getProduct = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1');
    for (const item of items) {
      const prod = getProduct.get(item.productId);
      if (!prod) continue;
      const subtotal = prod.price * item.quantity;
      totalOrder += subtotal;
      preparedItems.push({
        productId: prod.id,
        quantity: item.quantity,
        unitPrice: prod.price,
        subtotal,
        assignedTo: item.assignedTo || defaultAssignedTo || 'Mesa'
      });
    }

    const now = new Date().toISOString();
    const insertOrder = db.prepare(`
      INSERT INTO orders (session_id, created_at, total)
      VALUES (?, ?, ?)
    `);
    const orderRes = insertOrder.run(sessionId, now, totalOrder);
    const orderId = orderRes.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const updateStock = db.prepare(`
      UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?
    `);

    for (const item of preparedItems) {
      insertItem.run(orderId, item.productId, item.quantity, item.unitPrice, item.subtotal, item.assignedTo);
      updateStock.run(item.quantity, item.productId);
    }

    return {
      orderId,
      totalOrder,
      itemsCount: preparedItems.length,
      tableId: session.table_id
    };
  },

  transferSession(sourceTableId, targetTableId) {
    const sourceTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(sourceTableId);
    const targetTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(targetTableId);
    if (!sourceTable) throw new Error('Mesa de origen no encontrada');
    if (!targetTable) throw new Error('Mesa de destino no encontrada');
    if (targetTable.status !== 'available') throw new Error(`La Mesa ${targetTable.table_number} está ocupada`);

    const session = db.prepare('SELECT * FROM sessions WHERE table_id = ? AND status = \'active\'').get(sourceTableId);
    if (!session) throw new Error('La mesa de origen no tiene una sesión activa');

    // Transfer session to target table with target table's rate
    db.prepare('UPDATE sessions SET table_id = ?, rate_applied = ? WHERE id = ?').run(targetTableId, targetTable.hourly_rate, session.id);
    db.prepare('UPDATE tables SET status = \'available\' WHERE id = ?').run(sourceTableId);
    db.prepare('UPDATE tables SET status = \'occupied\' WHERE id = ?').run(targetTableId);

    // Transfer scores to target table
    const sourceScore = db.prepare('SELECT * FROM scores WHERE table_id = ?').get(sourceTableId);
    if (sourceScore) {
      db.prepare(`
        INSERT INTO scores (table_id, player1_name, player2_name, score1, score2, sets1, sets2, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(table_id) DO UPDATE SET
          player1_name = excluded.player1_name,
          player2_name = excluded.player2_name,
          score1 = excluded.score1,
          score2 = excluded.score2,
          sets1 = excluded.sets1,
          sets2 = excluded.sets2,
          updated_at = excluded.updated_at
      `).run(
        targetTableId,
        sourceScore.player1_name,
        sourceScore.player2_name,
        sourceScore.score1,
        sourceScore.score2,
        sourceScore.sets1,
        sourceScore.sets2,
        new Date().toISOString()
      );

      // Clear source score
      db.prepare(`
        UPDATE scores SET score1 = 0, score2 = 0, sets1 = 0, sets2 = 0, updated_at = ? WHERE table_id = ?
      `).run(new Date().toISOString(), sourceTableId);
    }

    // Move pending alerts
    db.prepare('UPDATE service_alerts SET table_id = ? WHERE table_id = ? AND status = \'pending\'').run(targetTableId, sourceTableId);

    return {
      success: true,
      sourceTableId,
      targetTableId,
      sessionId: session.id,
      sourceTableNumber: sourceTable.table_number,
      targetTableNumber: targetTable.table_number
    };
  },

  getSessionConsumptionBreakdown(sessionId) {
    const items = db.prepare(`
      SELECT oi.id, oi.quantity, oi.unit_price, oi.subtotal, COALESCE(oi.assigned_to, 'Mesa') as assigned_to, 
             p.name as product_name, o.created_at
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE o.session_id = ?
      ORDER BY o.created_at ASC
    `).all(sessionId);

    const byTarget = {};
    let total = 0;

    for (const item of items) {
      const target = item.assigned_to || 'Mesa';
      if (!byTarget[target]) {
        byTarget[target] = { target, items: [], total: 0 };
      }
      byTarget[target].items.push(item);
      byTarget[target].total += item.subtotal;
      total += item.subtotal;
    }

    return {
      sessionId,
      byTarget,
      targets: Object.keys(byTarget),
      total
    };
  },

  createAlert(tableId, type) {
    const activeSession = db.prepare(`
      SELECT id FROM sessions WHERE table_id = ? AND status = 'active'
    `).get(tableId);

    const sessionId = activeSession ? activeSession.id : null;
    const now = new Date().toISOString();

    // Check if there is already a pending alert of this type
    const existing = db.prepare(`
      SELECT id FROM service_alerts WHERE table_id = ? AND type = ? AND status = 'pending'
    `).get(tableId, type);

    if (existing) {
      return { alertId: existing.id, tableId, type, status: 'already_pending' };
    }

    const insert = db.prepare(`
      INSERT INTO service_alerts (session_id, table_id, type, status, created_at)
      VALUES (?, ?, ?, 'pending', ?)
    `);
    const res = insert.run(sessionId, tableId, type, now);

    return { alertId: res.lastInsertRowid, tableId, type, status: 'pending', created_at: now };
  },

  resolveAlert(alertId) {
    const now = new Date().toISOString();
    const alert = db.prepare('SELECT * FROM service_alerts WHERE id = ?').get(alertId);
    if (!alert) return null;

    db.prepare(`
      UPDATE service_alerts SET status = 'attended', resolved_at = ? WHERE id = ?
    `).run(now, alertId);

    return { alertId, tableId: alert.table_id, status: 'attended' };
  },

  resolveAllAlertsForTable(tableId) {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE service_alerts SET status = 'attended', resolved_at = ? 
      WHERE table_id = ? AND status = 'pending'
    `).run(now, tableId);
    return { tableId, status: 'cleared' };
  },

  updateScore(tableId, { player1_name, player2_name, score1, score2, sets1, sets2 }) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO scores (table_id, player1_name, player2_name, score1, score2, sets1, sets2, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(table_id) DO UPDATE SET
        player1_name = COALESCE(excluded.player1_name, player1_name),
        player2_name = COALESCE(excluded.player2_name, player2_name),
        score1 = COALESCE(excluded.score1, score1),
        score2 = COALESCE(excluded.score2, score2),
        sets1 = COALESCE(excluded.sets1, sets1),
        sets2 = COALESCE(excluded.sets2, sets2),
        updated_at = excluded.updated_at
    `).run(tableId, player1_name, player2_name, score1, score2, sets1, sets2, now);

    return db.prepare('SELECT * FROM scores WHERE table_id = ?').get(tableId);
  },

  getProducts() {
    return db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY category ASC, name ASC').all();
  },

  getAllProducts() {
    return db.prepare('SELECT * FROM products ORDER BY category ASC, name ASC').all();
  },

  createProduct({ name, category, price, stock }) {
    const insert = db.prepare(`
      INSERT INTO products (name, category, price, stock, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    const res = insert.run(name, category, Number(price), Number(stock || 0));
    return db.prepare('SELECT * FROM products WHERE id = ?').get(res.lastInsertRowid);
  },

  updateProduct(id, { name, category, price, stock, is_active }) {
    db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        price = COALESCE(?, price),
        stock = COALESCE(?, stock),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      name, 
      category, 
      price != null ? Number(price) : null, 
      stock != null ? Number(stock) : null, 
      is_active != null ? Number(is_active) : null, 
      id
    );
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  },

  adjustProductStock(id, delta) {
    db.prepare(`
      UPDATE products SET stock = MAX(0, stock + ?) WHERE id = ?
    `).run(Number(delta), id);
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  },

  deleteProduct(id) {
    db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
    return { success: true, id };
  },

  updateTable(id, { name, hourly_rate, type }) {
    db.prepare(`
      UPDATE tables SET
        name = COALESCE(?, name),
        hourly_rate = COALESCE(?, hourly_rate),
        type = COALESCE(?, type)
      WHERE id = ?
    `).run(
      name, 
      hourly_rate != null ? Number(hourly_rate) : null, 
      type, 
      id
    );
    return db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
  },

  createTable({ table_number, name, type = 'pool', hourly_rate = 8000 }) {
    const insert = db.prepare(`
      INSERT INTO tables (table_number, name, type, hourly_rate, status)
      VALUES (?, ?, ?, ?, 'available')
    `);
    const res = insert.run(table_number, name, type, Number(hourly_rate));
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO scores (table_id, player1_name, player2_name, score1, score2, sets1, sets2, updated_at)
      VALUES (?, 'Jugador 1', 'Jugador 2', 0, 0, 0, 0, ?)
    `).run(res.lastInsertRowid, now);
    return db.prepare('SELECT * FROM tables WHERE id = ?').get(res.lastInsertRowid);
  },

  createBarTab(name) {
    const safeName = name && name.trim() ? name.trim() : 'Cuenta Barra';
    const countRow = db.prepare("SELECT COUNT(*) as count FROM tables WHERE type = 'barra'").get();
    const tabNum = `B-${String((countRow ? countRow.count : 0) + 1).padStart(2, '0')}`;

    const insert = db.prepare(`
      INSERT INTO tables (table_number, name, type, hourly_rate, status)
      VALUES (?, ?, 'barra', 0.0, 'occupied')
    `);
    const res = insert.run(tabNum, safeName);
    const tableId = res.lastInsertRowid;

    const startTime = new Date().toISOString();
    const insertSession = db.prepare(`
      INSERT INTO sessions (table_id, start_time, rate_applied, status)
      VALUES (?, ?, 0.0, 'active')
    `);
    const sessionRes = insertSession.run(tableId, startTime);

    return {
      tableId,
      sessionId: sessionRes.lastInsertRowid,
      name: safeName,
      table_number: tabNum
    };
  },

  deleteBarTab(tableId) {
    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId);
    if (!table || table.type !== 'barra') throw new Error('Cuenta de barra no encontrada');

    const activeSession = db.prepare("SELECT id FROM sessions WHERE table_id = ? AND status = 'active'").get(tableId);
    if (activeSession) {
      const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders WHERE session_id = ?").get(activeSession.id).count;
      if (orderCount > 0) {
        throw new Error('No se puede cancelar una cuenta con consumos cargados. Use Cobrar o elimine los pedidos primero.');
      }
      db.prepare("UPDATE sessions SET status = 'cancelled' WHERE id = ?").run(activeSession.id);
    }
    db.prepare("UPDATE tables SET status = 'closed' WHERE id = ?").run(tableId);
    return { success: true, tableId };
  },

  getStats() {
    const today = new Date().toISOString().slice(0, 10);
    const closedToday = db.prepare(`
      SELECT COUNT(*) as count, 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(time_cost), 0) as total_time_revenue,
        COALESCE(SUM(consumption_cost), 0) as total_consumption_revenue,
        COALESCE(SUM(total_time_minutes), 0) as total_minutes
      FROM sessions 
      WHERE status = 'closed' AND start_time LIKE ?
    `).get(`${today}%`);

    const activeCount = db.prepare(`
      SELECT COUNT(*) as count FROM sessions WHERE status = 'active'
    `).get().count;

    return {
      date: today,
      closedSessions: closedToday.count,
      activeSessions: activeCount,
      totalRevenue: closedToday.total_revenue,
      timeRevenue: closedToday.total_time_revenue,
      consumptionRevenue: closedToday.total_consumption_revenue,
      totalMinutesPlayed: closedToday.total_minutes
    };
  },

  getClosedSessions(limit = 50) {
    return db.prepare(`
      SELECT s.*, t.table_number, t.name as table_name
      FROM sessions s
      JOIN tables t ON t.id = s.table_id
      WHERE s.status = 'closed'
      ORDER BY s.end_time DESC
      LIMIT ?
    `).all(limit);
  },

  getSessionInvoice(sessionId) {
    const session = db.prepare(`
      SELECT s.*, t.table_number, t.name as table_name
      FROM sessions s
      JOIN tables t ON t.id = s.table_id
      WHERE s.id = ?
    `).get(sessionId);

    if (!session) return null;

    const items = db.prepare(`
      SELECT oi.*, p.name as product_name
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE o.session_id = ?
    `).all(sessionId);

    return { session, items };
  },

  getAnalytics(range = 'today') {
    let dateFilter = '';
    if (range === 'today') {
      dateFilter = "AND date(s.start_time) = date('now')";
    } else if (range === 'week') {
      dateFilter = "AND date(s.start_time) >= date('now', '-6 days')";
    } else if (range === 'month') {
      dateFilter = "AND date(s.start_time) >= date('now', 'start of month')";
    } else {
      dateFilter = ""; // 'all'
    }

    // 1. General KPIs
    const kpis = db.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(SUM(s.time_cost), 0) as time_revenue,
        COALESCE(SUM(s.consumption_cost), 0) as consumption_revenue,
        COALESCE(AVG(s.total_amount), 0) as avg_ticket,
        COALESCE(AVG(s.total_time_minutes), 0) as avg_minutes
      FROM sessions s
      WHERE s.status = 'closed' ${dateFilter}
    `).get();

    // 2. Top Selling Products
    const topProducts = db.prepare(`
      SELECT 
        p.name, 
        p.category, 
        SUM(oi.quantity) as total_qty, 
        SUM(oi.subtotal) as total_revenue
      FROM orders o
      JOIN sessions s ON s.id = o.session_id
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE s.status = 'closed' ${dateFilter}
      GROUP BY p.id
      ORDER BY total_qty DESC
      LIMIT 8
    `).all();

    // 3. Payment Methods Breakdown
    const paymentMethods = db.prepare(`
      SELECT 
        COALESCE(s.payment_method, 'Efectivo') as method,
        COUNT(*) as count,
        COALESCE(SUM(s.total_amount), 0) as total
      FROM sessions s
      WHERE s.status = 'closed' ${dateFilter}
      GROUP BY method
      ORDER BY total DESC
    `).all();

    // 4. Peak Hours (Distribution of sessions by start hour 00-23)
    const peakHours = db.prepare(`
      SELECT 
        CAST(strftime('%H', s.start_time) AS INTEGER) as hour,
        COUNT(*) as count,
        COALESCE(SUM(s.total_amount), 0) as revenue
      FROM sessions s
      WHERE s.status = 'closed' ${dateFilter}
      GROUP BY hour
      ORDER BY hour ASC
    `).all();

    // 5. Daily Trend
    const dailyTrend = db.prepare(`
      SELECT 
        date(s.start_time) as day,
        COUNT(*) as sessions_count,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(SUM(s.time_cost), 0) as time_revenue,
        COALESCE(SUM(s.consumption_cost), 0) as consumption_revenue
      FROM sessions s
      WHERE s.status = 'closed' ${dateFilter}
      GROUP BY day
      ORDER BY day ASC
      LIMIT 30
    `).all();

    // 6. Revenue by Table / Bar
    const byTable = db.prepare(`
      SELECT 
        t.id,
        t.table_number,
        t.name,
        t.type,
        COUNT(s.id) as sessions_count,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(SUM(s.time_cost), 0) as time_revenue,
        COALESCE(SUM(s.consumption_cost), 0) as consumption_revenue
      FROM sessions s
      JOIN tables t ON t.id = s.table_id
      WHERE s.status = 'closed' ${dateFilter}
      GROUP BY t.id
      ORDER BY total_revenue DESC
    `).all();

    return {
      range,
      kpis,
      topProducts,
      paymentMethods,
      peakHours,
      dailyTrend,
      byTable
    };
  },

  getShiftReport() {
    const today = new Date().toISOString().slice(0, 10);
    const sessions = db.prepare(`
      SELECT s.*, t.table_number, t.name as table_name
      FROM sessions s
      JOIN tables t ON t.id = s.table_id
      WHERE s.status = 'closed' AND s.start_time LIKE ?
      ORDER BY s.end_time DESC
    `).all(`${today}%`);

    let totalCash = 0;
    let totalTransfer = 0;
    let totalCard = 0;
    let totalTimeRevenue = 0;
    let totalConsumptionRevenue = 0;
    let grandTotal = 0;
    let totalMinutes = 0;

    for (const s of sessions) {
      grandTotal += s.total_amount;
      totalTimeRevenue += s.time_cost;
      totalConsumptionRevenue += s.consumption_cost;
      totalMinutes += s.total_time_minutes;

      const method = (s.payment_method || '').toLowerCase();
      if (method.includes('efectivo')) {
        totalCash += s.total_amount;
      } else if (method.includes('transferencia') || method.includes('qr') || method.includes('nequi')) {
        totalTransfer += s.total_amount;
      } else if (method.includes('tarjeta')) {
        totalCard += s.total_amount;
      } else {
        totalCash += s.total_amount; // fallback
      }
    }

    return {
      date: today,
      sessionCount: sessions.length,
      grandTotal,
      totalCash,
      totalTransfer,
      totalCard,
      totalTimeRevenue,
      totalConsumptionRevenue,
      totalMinutes,
      sessions
    };
  },

  verifyAdminPin(pin) {
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'admin_pin'").get();
    const currentPin = setting ? setting.value : '1234';
    return pin === currentPin;
  },

  updateAdminPin(newPin) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_pin', ?)").run(String(newPin));
    return true;
  },

  getSettings() {
    const rows = db.prepare("SELECT key, value FROM settings").all();
    const obj = {};
    rows.forEach(r => { obj[r.key] = r.value; });
    return obj;
  },

  updateSetting(key, value) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, String(value));
    return { key, value };
  }
};

module.exports = {
  db,
  dbOperations,
  dbPath
};
