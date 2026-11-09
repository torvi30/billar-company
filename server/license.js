const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MASTER_SECRET = process.env.BP_LICENSE_SECRET || 'BILLARPULSE_PRO_CORE_2026_MASTER_SECRET_SIGNING_KEY';

const dataDir = path.join(__dirname, 'data');
const machineIdFile = path.join(dataDir, '.machine-id');

/**
 * Gets or creates a persistent, hardware-linked Machine ID for this installation.
 */
function getMachineId() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(machineIdFile)) {
      const existing = fs.readFileSync(machineIdFile, 'utf8').trim();
      if (existing && existing.startsWith('BP-')) {
        return existing;
      }
    }

    // Generate stable machine ID
    let seed = '';
    try {
      const os = require('os');
      seed = `${os.hostname()}-${os.platform()}-${os.arch()}-${os.cpus()?.[0]?.model || ''}`;
    } catch (e) {
      seed = `billar-${Date.now()}`;
    }

    const hash = crypto.createHash('sha256').update(seed + crypto.randomBytes(8).toString('hex')).digest('hex').toUpperCase();
    const machineId = `BP-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;

    fs.writeFileSync(machineIdFile, machineId, 'utf8');
    return machineId;
  } catch (err) {
    console.error('[License] Error resolving machine ID:', err);
    return 'BP-DEFAULT-NODE-0001';
  }
}

/**
 * Generates an encrypted license key (Used by Victor to distribute to clients).
 */
function generateLicenseKey({
  businessName,
  nit = '',
  maxTables = 10,
  expiryDate = 'perpetual', // 'YYYY-MM-DD' or 'perpetual'
  machineId = '*' // '*' for universal or specific 'BP-XXXX-XXXX-XXXX'
}) {
  const payload = {
    n: String(businessName).trim(),
    t: String(nit).trim(),
    m: Number(maxTables) || 10,
    e: expiryDate === 'perpetual' ? 'perpetual' : String(expiryDate).slice(0, 10),
    mid: String(machineId).trim().toUpperCase(),
    iat: Math.floor(Date.now() / 1000)
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', MASTER_SECRET);
  hmac.update(payloadStr);
  const sig = hmac.digest('hex').slice(0, 16).toUpperCase();

  return `BPL-${payloadStr}.${sig}`;
}

/**
 * Verifies a license key against the current machine ID.
 */
function verifyLicenseKey(key, currentMachineId = null) {
  if (!key || typeof key !== 'string' || !key.startsWith('BPL-')) {
    return {
      isValid: false,
      status: 'invalid',
      reason: 'Formato de clave de licencia inválido'
    };
  }

  try {
    const raw = key.slice(4); // Remove 'BPL-'
    const parts = raw.split('.');
    if (parts.length !== 2) {
      return { isValid: false, status: 'invalid', reason: 'Estructura de clave corrupta' };
    }

    const [payloadStr, sig] = parts;
    const hmac = crypto.createHmac('sha256', MASTER_SECRET);
    hmac.update(payloadStr);
    const expectedSig = hmac.digest('hex').slice(0, 16).toUpperCase();

    if (sig.toUpperCase() !== expectedSig) {
      return { isValid: false, status: 'invalid', reason: 'Firma de licencia no autorizada o alterada' };
    }

    const jsonStr = Buffer.from(payloadStr, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr);

    const actualMachineId = (currentMachineId || getMachineId()).toUpperCase();
    const licensedMachineId = (payload.mid || '*').toUpperCase();

    // Check Machine ID match unless wildcard
    if (licensedMachineId !== '*' && licensedMachineId !== actualMachineId) {
      return {
        isValid: false,
        status: 'machine_mismatch',
        reason: `Esta licencia pertenece al equipo (${licensedMachineId}) y este computador es (${actualMachineId})`
      };
    }

    // Check Expiry Date
    let isExpired = false;
    let daysRemaining = null;
    const isPerpetual = payload.e === 'perpetual';

    if (!isPerpetual) {
      const expDate = new Date(`${payload.e}T23:59:59`);
      const now = new Date();
      const diffMs = expDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) {
        isExpired = true;
      }
    }

    return {
      isValid: !isExpired,
      status: isExpired ? 'expired' : 'active',
      isExpired,
      isPerpetual,
      daysRemaining: isPerpetual ? 99999 : daysRemaining,
      expiryDate: payload.e,
      businessName: payload.n,
      nit: payload.t,
      maxTables: payload.m || 10,
      machineId: payload.mid,
      issuedAt: new Date((payload.iat || 0) * 1000).toISOString()
    };
  } catch (err) {
    return {
      isValid: false,
      status: 'error',
      reason: 'Error al decodificar la licencia: ' + err.message
    };
  }
}

/**
 * Returns complete current license summary including database checks.
 */
function getLicenseStatus(dbOperations) {
  const machineId = getMachineId();
  const settings = dbOperations.getSettings();
  const licenseKey = settings.license_key || '';

  const tables = dbOperations.getAllTables ? dbOperations.getAllTables() : [];
  const tablesInUse = tables.filter(t => t.type !== 'barra').length;

  if (!licenseKey) {
    // Modo de prueba o demostración inicial sin activar
    return {
      status: 'trial',
      isValid: true,
      isTrial: true,
      isExpired: false,
      isPerpetual: false,
      daysRemaining: 15,
      expiryDate: 'Demo / Evaluación',
      businessName: settings.business_name || 'Billar Demo',
      nit: settings.business_nit || '',
      maxTables: 8,
      tablesInUse,
      tablesRemaining: Math.max(0, 8 - tablesInUse),
      machineId,
      licenseKey: ''
    };
  }

  const verified = verifyLicenseKey(licenseKey, machineId);
  const maxTables = verified.maxTables || 10;

  return {
    ...verified,
    isTrial: false,
    tablesInUse,
    tablesRemaining: Math.max(0, maxTables - tablesInUse),
    machineId,
    licenseKey
  };
}

module.exports = {
  getMachineId,
  generateLicenseKey,
  verifyLicenseKey,
  getLicenseStatus
};

