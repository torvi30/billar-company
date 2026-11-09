const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { generateLicenseKey } = require('./license');

const dataDir = path.join(__dirname, 'data');
const tenantsDir = path.join(dataDir, 'tenants');
if (!fs.existsSync(tenantsDir)) {
  fs.mkdirSync(tenantsDir, { recursive: true });
}

// Master Database for CEO & multi-business management
const masterDbPath = path.join(dataDir, 'master_tenants.db');
const masterDb = new Database(masterDbPath);
masterDb.pragma('journal_mode = WAL');

// CEO Master PIN (Default: 9999, can be overridden by environment variable)
const CEO_MASTER_PIN = process.env.BP_CEO_MASTER_PIN || '9999';

// Initialize master tables
function initMasterSchema() {
  masterDb.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      nit TEXT DEFAULT '',
      city TEXT DEFAULT 'Bogotá',
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      owner_name TEXT DEFAULT 'Propietario',
      owner_email TEXT DEFAULT '',
      plan TEXT DEFAULT 'pro', -- 'starter' (6 mesas), 'pro' (12 mesas), 'enterprise' (ilimitadas)
      max_tables INTEGER DEFAULT 12,
      subscription_status TEXT DEFAULT 'active', -- 'active', 'trial', 'past_due', 'suspended'
      monthly_fee REAL DEFAULT 85000.0,
      expiry_date TEXT DEFAULT 'perpetual',
      license_key TEXT DEFAULT '',
      admin_pin TEXT DEFAULT '1234',
      created_at TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      notes TEXT DEFAULT ''
    );
  `);

  // Seed default business 1 (El Diamante) if empty
  const count = masterDb.prepare('SELECT COUNT(*) as count FROM businesses').get().count;
  if (count === 0) {
    const now = new Date().toISOString();
    const license = generateLicenseKey({
      businessName: 'Club de Billar El Diamante',
      nit: '901.442.118-0',
      maxTables: 16,
      expiryDate: 'perpetual',
      machineId: '*'
    });

    masterDb.prepare(`
      INSERT INTO businesses (
        id, slug, name, nit, city, address, phone, owner_name, owner_email,
        plan, max_tables, subscription_status, monthly_fee, expiry_date,
        license_key, admin_pin, created_at, is_active, notes
      ) VALUES (
        1, 'el-diamante', 'Club de Billar El Diamante', '901.442.118-0', 'Bogotá',
        'Calle 50 # 70-20, Salón & Bar', '300 123 4567', 'Víctor (CEO / Fundador)', 'ceo@billarpulse.com',
        'enterprise', 16, 'active', 95000.0, 'perpetual',
        ?, '1234', ?, 1, 'Sede Matriz Principal de Demostración'
      )
    `).run(license, now);
  }
}

initMasterSchema();

// Cache of active database connections per tenant
const tenantDbCache = new Map();

// Default tenant active on server
let currentActiveTenantSlug = 'el-diamante';

/**
 * Resolves the path to a tenant's database file.
 * Tenant 1 (el-diamante) maps directly to the primary billarpulse.db to preserve all existing data.
 */
function getTenantDbPath(slug) {
  if (slug === 'el-diamante' || slug === '1') {
    return path.join(dataDir, 'billarpulse.db');
  }
  return path.join(tenantsDir, `${slug}.db`);
}

/**
 * Initializes schema and default data for a brand new club database.
 */
function initializeTenantDatabase(dbInstance, businessData) {
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'pool',
      hourly_rate REAL NOT NULL DEFAULT 8000.0,
      status TEXT NOT NULL DEFAULT 'available',
      location TEXT DEFAULT '',
      customer_name TEXT DEFAULT ''
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
      status TEXT NOT NULL DEFAULT 'active',
      is_paused INTEGER DEFAULT 0,
      paused_at TEXT,
      accumulated_seconds INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 50,
      is_active INTEGER DEFAULT 1,
      min_stock INTEGER DEFAULT 10
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      created_at TEXT NOT NULL,
      total REAL NOT NULL DEFAULT 0.0,
      waiter_name TEXT DEFAULT 'Caja',
      waiter_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      assigned_to TEXT DEFAULT 'Mesa'
    );

    CREATE TABLE IF NOT EXISTS service_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER REFERENCES sessions(id),
      table_id INTEGER NOT NULL REFERENCES tables(id),
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
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

    CREATE TABLE IF NOT EXISTS cash_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      opened_by TEXT DEFAULT 'Administrador',
      closed_by TEXT,
      initial_cash REAL NOT NULL DEFAULT 0.0,
      expected_cash REAL DEFAULT 0.0,
      actual_cash REAL,
      difference REAL DEFAULT 0.0,
      total_sales REAL DEFAULT 0.0,
      total_cash_sales REAL DEFAULT 0.0,
      total_transfer_sales REAL DEFAULT 0.0,
      total_card_sales REAL DEFAULT 0.0,
      total_time_revenue REAL DEFAULT 0.0,
      total_consumption_revenue REAL DEFAULT 0.0,
      sessions_count INTEGER DEFAULT 0,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'open'
    );

    CREATE TABLE IF NOT EXISTS cash_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER REFERENCES cash_shifts(id),
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT DEFAULT 'Administrador'
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pin TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'mesero',
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  const now = new Date().toISOString();

  // Seed default settings
  const insertSetting = dbInstance.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
  insertSetting.run('business_name', businessData.name || 'Club de Billar');
  insertSetting.run('business_nit', businessData.nit || '');
  insertSetting.run('business_phone', businessData.phone || '');
  insertSetting.run('business_address', businessData.address || '');
  insertSetting.run('admin_pin', businessData.admin_pin || '1234');
  insertSetting.run('license_key', businessData.license_key || '');
  insertSetting.run('grace_period_minutes', '3');
  insertSetting.run('rounding_mode', 'exact');
  insertSetting.run('currency_symbol', '$');
  insertSetting.run('currency_code', 'COP');
  insertSetting.run('currency_locale', 'es-CO');
  insertSetting.run('currency_decimals', '0');
  insertSetting.run('app_theme', 'dark');

  // Seed default staff
  const insertStaff = dbInstance.prepare(`
    INSERT INTO staff (name, pin, role, phone, is_active, created_at)
    VALUES (?, ?, ?, ?, 1, ?)
  `);
  insertStaff.run('Administrador', businessData.admin_pin || '1234', 'admin', businessData.phone || '', now);
  insertStaff.run('Mesero 1', '1111', 'mesero', '', now);

  // Seed initial tables according to max_tables (up to 8 initial tables)
  const initialTablesCount = Math.min(Number(businessData.max_tables) || 6, 8);
  const insertTable = dbInstance.prepare(`
    INSERT INTO tables (table_number, name, type, hourly_rate, status)
    VALUES (?, ?, ?, ?, 'available')
  `);
  const insertScore = dbInstance.prepare(`
    INSERT INTO scores (table_id, player1_name, player2_name, score1, score2, sets1, sets2, updated_at)
    VALUES (?, 'Jugador 1', 'Jugador 2', 0, 0, 0, 0, ?)
  `);

  for (let i = 1; i <= initialTablesCount; i++) {
    const num = i < 10 ? `0${i}` : `${i}`;
    const type = i % 4 === 0 ? 'tres_bandas' : 'pool';
    const name = type === 'tres_bandas' ? `Mesa ${i} - Tres Bandas` : `Mesa ${i} - Pool Clásica`;
    const rate = type === 'tres_bandas' ? 10000 : 8000;
    const res = insertTable.run(num, name, type, rate);
    insertScore.run(res.lastInsertRowid, now);
  }

  // Seed standard products catalog
  const insertProduct = dbInstance.prepare(`
    INSERT INTO products (name, category, price, stock, is_active, min_stock)
    VALUES (?, ?, ?, ?, 1, 10)
  `);

  const sampleProducts = [
    { name: 'Cerveza Águila 330ml', category: 'Cervezas', price: 5000, stock: 96 },
    { name: 'Cerveza Club Colombia 330ml', category: 'Cervezas', price: 6500, stock: 72 },
    { name: 'Cerveza Corona Extra 355ml', category: 'Cervezas', price: 8000, stock: 48 },
    { name: 'Cerveza Heineken 330ml', category: 'Cervezas', price: 8000, stock: 48 },
    { name: 'Gaseosa Coca-Cola 400ml', category: 'Bebidas', price: 4000, stock: 60 },
    { name: 'Gaseosa Postobón Manzana', category: 'Bebidas', price: 3500, stock: 48 },
    { name: 'Agua Cristal 600ml', category: 'Bebidas', price: 3000, stock: 70 },
    { name: 'Bebida Energizante Red Bull', category: 'Bebidas', price: 10000, stock: 36 },
    { name: 'Papas Margarita Fritas', category: 'Snacks', price: 3500, stock: 50 },
    { name: 'Maní con Sal La Especial', category: 'Snacks', price: 3000, stock: 40 },
    { name: 'Aguardiente Antioqueño (Trago)', category: 'Licores', price: 6000, stock: 100 },
    { name: 'Whisky Buchanan\'s 12 (Trago)', category: 'Licores', price: 18000, stock: 50 }
  ];

  for (const p of sampleProducts) {
    insertProduct.run(p.name, p.category, p.price, p.stock);
  }
}

/**
 * Gets or connects to a tenant database instance.
 */
function getTenantDb(slugOrId = null) {
  let slug = slugOrId ? String(slugOrId).trim().toLowerCase() : currentActiveTenantSlug;

  // If passed an integer ID, resolve to slug
  if (/^\d+$/.test(slug)) {
    const biz = masterDb.prepare('SELECT slug FROM businesses WHERE id = ?').get(Number(slug));
    if (biz) slug = biz.slug;
  }

  if (tenantDbCache.has(slug)) {
    return tenantDbCache.get(slug);
  }

  const dbPath = getTenantDbPath(slug);
  const isNew = !fs.existsSync(dbPath);
  const dbInstance = new Database(dbPath);

  if (isNew) {
    const bizData = masterDb.prepare('SELECT * FROM businesses WHERE slug = ?').get(slug) || {
      name: 'Club de Billar',
      max_tables: 8,
      admin_pin: '1234'
    };
    initializeTenantDatabase(dbInstance, bizData);
  }

  tenantDbCache.set(slug, dbInstance);
  return dbInstance;
}

const tenantManager = {
  getCEOStats() {
    const businesses = masterDb.prepare('SELECT * FROM businesses WHERE is_active = 1').all();
    let totalMRR = 0;
    let totalMaxTables = 0;
    let totalTablesCount = 0;
    let totalActiveGames = 0;
    let totalRevenueCombined = 0;
    let activeCount = 0;
    let suspendedCount = 0;
    let expiringSoonCount = 0;
    const citiesSet = new Set();

    for (const biz of businesses) {
      if (biz.city) citiesSet.add(biz.city.trim());
      const sub = this.evaluateSubscription(biz);
      if (sub.status === 'expiring_soon') {
        expiringSoonCount++;
      }

      if (biz.subscription_status === 'active' && !sub.isLocked) {
        activeCount++;
        totalMRR += (biz.monthly_fee || 0);
      } else {
        suspendedCount++;
      }
      totalMaxTables += (biz.max_tables || 0);

      try {
        const tDb = getTenantDb(biz.slug);
        const tCount = tDb.prepare("SELECT COUNT(*) as c FROM tables WHERE status != 'closed'").get()?.c || 0;
        const aCount = tDb.prepare("SELECT COUNT(*) as c FROM sessions WHERE status = 'active'").get()?.c || 0;
        const rev = tDb.prepare("SELECT COALESCE(SUM(total_amount), 0) as s FROM sessions WHERE status = 'closed'").get()?.s || 0;
        totalTablesCount += tCount;
        totalActiveGames += aCount;
        totalRevenueCombined += rev;
      } catch (e) {
        console.error(`Error reading stats for tenant ${biz.slug}:`, e.message);
      }
    }

    return {
      totalBusinesses: businesses.length,
      activeBusinesses: activeCount,
      suspendedBusinesses: suspendedCount,
      expiringSoonBusinesses: expiringSoonCount,
      totalMRR,
      totalARR: totalMRR * 12,
      totalMaxTables,
      totalTablesInSalons: totalTablesCount,
      totalActiveGames,
      totalRevenueCombined,
      citiesCount: citiesSet.size || 1
    };
  },

  getAllBusinesses() {
    const businesses = masterDb.prepare('SELECT * FROM businesses WHERE is_active = 1 ORDER BY id ASC').all();
    return businesses.map(biz => {
      let tablesInUse = 0;
      let activeGames = 0;
      let todaySales = 0;
      let totalSales = 0;
      let totalProducts = 0;
      let totalStaff = 0;
      let dbSizeFormatted = '0 KB';

      try {
        const tDb = getTenantDb(biz.slug);
        tablesInUse = tDb.prepare("SELECT COUNT(*) as c FROM tables WHERE status != 'closed'").get()?.c || 0;
        activeGames = tDb.prepare("SELECT COUNT(*) as c FROM sessions WHERE status = 'active'").get()?.c || 0;

        const today = new Date().toISOString().slice(0, 10);
        todaySales = tDb.prepare("SELECT COALESCE(SUM(total_amount), 0) as s FROM sessions WHERE status = 'closed' AND start_time LIKE ?").get(`${today}%`)?.s || 0;
        totalSales = tDb.prepare("SELECT COALESCE(SUM(total_amount), 0) as s FROM sessions WHERE status = 'closed'").get()?.s || 0;
        totalProducts = tDb.prepare("SELECT COUNT(*) as c FROM products WHERE is_active = 1").get()?.c || 0;
        totalStaff = tDb.prepare("SELECT COUNT(*) as c FROM staff WHERE is_active = 1").get()?.c || 0;

        const dbFile = biz.slug === 'club-el-diamante'
          ? path.join(dataDir, 'billarpulse.db')
          : path.join(tenantsDir, `${biz.slug}.db`);
        if (fs.existsSync(dbFile)) {
          const stat = fs.statSync(dbFile);
          dbSizeFormatted = stat.size > 1024 * 1024
            ? `${(stat.size / (1024 * 1024)).toFixed(2)} MB`
            : `${(stat.size / 1024).toFixed(0)} KB`;
        }
      } catch (err) {
        // Fallback if tenant DB is uninitialized
      }

      const subscription = this.evaluateSubscription(biz);

      return {
        ...biz,
        subscription,
        tablesInUse,
        activeGames,
        todaySales,
        totalSales,
        totalProducts,
        totalStaff,
        dbSizeFormatted,
        isCurrent: biz.slug === currentActiveTenantSlug
      };
    });
  },

  getBusinessById(id) {
    const biz = masterDb.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
    if (!biz) return null;
    return {
      ...biz,
      isCurrent: biz.slug === currentActiveTenantSlug
    };
  },

  createBusiness(data) {
    const name = String(data.name || '').trim();
    if (!name) throw new Error('El nombre del negocio es obligatorio');

    // Generate unique slug
    let baseSlug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'billar';

    let slug = baseSlug;
    let counter = 1;
    while (masterDb.prepare('SELECT id FROM businesses WHERE slug = ?').get(slug)) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const maxTables = Number(data.max_tables || data.maxTables) || 10;
    const plan = data.plan || 'pro';
    const monthlyFee = Number(data.monthly_fee || data.monthlyFee) || 85000;
    const expiryDate = data.expiry_date || data.expiryDate || 'perpetual';
    const adminPin = String(data.admin_pin || data.adminPin || '1234').trim();

    // Generate cryptographic license
    const licenseKey = generateLicenseKey({
      businessName: name,
      nit: data.nit || '',
      maxTables: maxTables,
      expiryDate: expiryDate,
      machineId: '*'
    });

    const now = new Date().toISOString();
    const result = masterDb.prepare(`
      INSERT INTO businesses (
        slug, name, nit, city, address, phone, owner_name, owner_email,
        plan, max_tables, subscription_status, monthly_fee, expiry_date,
        license_key, admin_pin, created_at, is_active, notes
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, 'active', ?, ?,
        ?, ?, ?, 1, ?
      )
    `).run(
      slug,
      name,
      data.nit || '',
      data.city || 'Bogotá',
      data.address || '',
      data.phone || '',
      data.owner_name || data.ownerName || 'Propietario',
      data.owner_email || data.ownerEmail || '',
      plan,
      maxTables,
      monthlyFee,
      expiryDate,
      licenseKey,
      adminPin,
      now,
      data.notes || ''
    );

    const newBizId = result.lastInsertRowid;
    const newBiz = masterDb.prepare('SELECT * FROM businesses WHERE id = ?').get(newBizId);

    // Initialize database for this new business immediately
    try {
      getTenantDb(slug);
    } catch (e) {
      console.error(`Error initializing DB for new tenant ${slug}:`, e.message);
    }

    return newBiz;
  },

  updateBusiness(id, data) {
    const existing = masterDb.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
    if (!existing) throw new Error('Negocio no encontrado');

    const name = data.name !== undefined ? String(data.name).trim() : existing.name;
    const nit = data.nit !== undefined ? String(data.nit).trim() : existing.nit;
    const city = data.city !== undefined ? String(data.city).trim() : existing.city;
    const address = data.address !== undefined ? String(data.address).trim() : existing.address;
    const phone = data.phone !== undefined ? String(data.phone).trim() : existing.phone;
    const owner_name = data.owner_name || data.ownerName !== undefined ? String(data.owner_name || data.ownerName).trim() : existing.owner_name;
    const owner_email = data.owner_email || data.ownerEmail !== undefined ? String(data.owner_email || data.ownerEmail).trim() : existing.owner_email;
    const plan = data.plan !== undefined ? data.plan : existing.plan;
    const max_tables = data.max_tables || data.maxTables !== undefined ? Number(data.max_tables || data.maxTables) : existing.max_tables;
    const subscription_status = data.subscription_status || data.subscriptionStatus !== undefined ? String(data.subscription_status || data.subscriptionStatus) : existing.subscription_status;
    const monthly_fee = data.monthly_fee || data.monthlyFee !== undefined ? Number(data.monthly_fee || data.monthlyFee) : existing.monthly_fee;
    const expiry_date = data.expiry_date || data.expiryDate !== undefined ? String(data.expiry_date || data.expiryDate) : existing.expiry_date;
    const admin_pin = data.admin_pin || data.adminPin !== undefined ? String(data.admin_pin || data.adminPin).trim() : existing.admin_pin;
    const notes = data.notes !== undefined ? String(data.notes) : existing.notes;

    masterDb.prepare(`
      UPDATE businesses
      SET name = ?, nit = ?, city = ?, address = ?, phone = ?, owner_name = ?, owner_email = ?,
          plan = ?, max_tables = ?, subscription_status = ?, monthly_fee = ?, expiry_date = ?,
          admin_pin = ?, notes = ?
      WHERE id = ?
    `).run(
      name, nit, city, address, phone, owner_name, owner_email,
      plan, max_tables, subscription_status, monthly_fee, expiry_date,
      admin_pin, notes, id
    );

    // Also update settings in tenant DB if active
    try {
      const tDb = getTenantDb(existing.slug);
      const updateSetting = tDb.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      updateSetting.run('business_name', name);
      updateSetting.run('business_nit', nit);
      updateSetting.run('business_phone', phone);
      updateSetting.run('business_address', address);
      updateSetting.run('admin_pin', admin_pin);
    } catch (e) { }

    return masterDb.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
  },

  deleteBusiness(id) {
    if (Number(id) === 1) {
      throw new Error('La sede matriz principal (ID 1) no puede ser eliminada');
    }
    const biz = masterDb.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
    if (!biz) throw new Error('Negocio no encontrado');

    masterDb.prepare('UPDATE businesses SET is_active = 0 WHERE id = ?').run(id);
    return { success: true, message: `Negocio "${biz.name}" archivado correctamente` };
  },

  regenerateLicense(id, { expiryDate = 'perpetual', maxTables = null }) {
    const biz = masterDb.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
    if (!biz) throw new Error('Negocio no encontrado');

    const tables = maxTables || biz.max_tables;
    const license = generateLicenseKey({
      businessName: biz.name,
      nit: biz.nit,
      maxTables: tables,
      expiryDate: expiryDate,
      machineId: '*'
    });

    masterDb.prepare('UPDATE businesses SET license_key = ?, expiry_date = ?, max_tables = ? WHERE id = ?').run(
      license,
      expiryDate,
      tables,
      id
    );

    // Update inside tenant db
    try {
      const tDb = getTenantDb(biz.slug);
      tDb.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_key', ?)").run(license);
    } catch (e) { }

    return {
      businessId: id,
      businessName: biz.name,
      licenseKey: license,
      maxTables: tables,
      expiryDate
    };
  },

  switchActiveTenant(slugOrId) {
    let biz = null;
    if (/^\d+$/.test(String(slugOrId))) {
      biz = masterDb.prepare('SELECT * FROM businesses WHERE id = ? AND is_active = 1').get(Number(slugOrId));
    } else {
      biz = masterDb.prepare('SELECT * FROM businesses WHERE slug = ? AND is_active = 1').get(String(slugOrId).toLowerCase());
    }

    if (!biz) throw new Error(`Negocio "${slugOrId}" no encontrado o inactivo`);

    currentActiveTenantSlug = biz.slug;
    return {
      success: true,
      activeTenant: biz
    };
  },

  getActiveTenant() {
    const biz = masterDb.prepare('SELECT * FROM businesses WHERE slug = ?').get(currentActiveTenantSlug) || {
      id: 1,
      slug: 'el-diamante',
      name: 'Club de Billar El Diamante'
    };
    const sub = this.evaluateSubscription(biz);
    return {
      ...biz,
      subscription: sub,
      isLocked: sub.isLocked
    };
  },

  extendSubscription(id, duration = '1_month') {
    const biz = masterDb.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
    if (!biz) throw new Error('Negocio no encontrado');

    let newExpiry = 'perpetual';
    if (duration !== 'perpetual') {
      const now = new Date();
      let baseDate = new Date();
      if (biz.expiry_date && biz.expiry_date !== 'perpetual') {
        const currentExp = new Date(biz.expiry_date + 'T23:59:59');
        if (currentExp > now) {
          baseDate = currentExp;
        }
      }

      if (duration === '1_month' || duration === 'month') {
        baseDate.setDate(baseDate.getDate() + 30);
      } else if (duration === '3_months') {
        baseDate.setDate(baseDate.getDate() + 90);
      } else if (duration === '1_year' || duration === 'year') {
        baseDate.setDate(baseDate.getDate() + 365);
      } else if (typeof duration === 'number') {
        baseDate.setDate(baseDate.getDate() + duration);
      }
      newExpiry = baseDate.toISOString().slice(0, 10);
    }

    const license = generateLicenseKey({
      businessName: biz.name,
      nit: biz.nit,
      maxTables: biz.max_tables,
      expiryDate: newExpiry,
      machineId: '*'
    });

    masterDb.prepare(`
      UPDATE businesses 
      SET subscription_status = 'active', expiry_date = ?, license_key = ?
      WHERE id = ?
    `).run(newExpiry, license, id);

    // Update inside tenant db
    try {
      const tDb = getTenantDb(biz.slug);
      tDb.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_key', ?)").run(license);
    } catch (e) {}

    const updated = masterDb.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
    return {
      ...updated,
      subscription: this.evaluateSubscription(updated)
    };
  },

  evaluateSubscription(biz) {
    if (!biz) return { isLocked: false, status: 'unknown', daysRemaining: 30 };

    if (biz.subscription_status === 'suspended') {
      return {
        isLocked: true,
        status: 'suspended',
        reason: 'Servicio suspendido por mora o decisión del administrador',
        daysRemaining: 0
      };
    }

    if (!biz.expiry_date || biz.expiry_date === 'perpetual') {
      return {
        isLocked: false,
        status: 'active',
        isPerpetual: true,
        daysRemaining: 9999
      };
    }

    try {
      const expiry = new Date(biz.expiry_date + 'T23:59:59');
      const now = new Date();
      const diffMs = expiry.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysRemaining < 0) {
        if (biz.subscription_status !== 'suspended') {
          masterDb.prepare("UPDATE businesses SET subscription_status = 'suspended' WHERE id = ?").run(biz.id);
        }
        return {
          isLocked: true,
          status: 'expired',
          reason: `Licencia vencida el ${biz.expiry_date}. Comunícate para renovar.`,
          daysRemaining: 0
        };
      } else if (daysRemaining <= 3) {
        return {
          isLocked: false,
          status: 'expiring_soon',
          daysRemaining,
          reason: `Tu suscripción vence en ${daysRemaining} día(s). Recuerda renovar.`
        };
      }

      return {
        isLocked: false,
        status: 'active',
        daysRemaining
      };
    } catch (e) {
      return { isLocked: false, status: 'active', daysRemaining: 30 };
    }
  },

  verifyCEOPin(pin) {
    return String(pin).trim() === String(CEO_MASTER_PIN).trim();
  }
};

module.exports = {
  masterDb,
  tenantManager,
  getTenantDb,
  CEO_MASTER_PIN
};

