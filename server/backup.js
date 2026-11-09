const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
const backupsDir = path.join(dataDir, 'backups');
const tenantsDir = path.join(dataDir, 'tenants');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

/**
 * Creates a safe, non-blocking online backup of all SQLite databases.
 * Uses SQLite's native backup API to avoid corrupting WAL mode tables during live writes.
 */
async function createSafeBackup(label = 'auto') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFolder = path.join(backupsDir, `bp-backup-${timestamp}-${label}`);
  fs.mkdirSync(backupFolder, { recursive: true });

  const backupTenantsFolder = path.join(backupFolder, 'tenants');
  fs.mkdirSync(backupTenantsFolder, { recursive: true });

  const filesBackedUp = [];
  let totalBytes = 0;

  // 1. Backup master_tenants.db
  const masterDbPath = path.join(dataDir, 'master_tenants.db');
  if (fs.existsSync(masterDbPath)) {
    const dest = path.join(backupFolder, 'master_tenants.db');
    const db = new Database(masterDbPath);
    await db.backup(dest);
    db.close();
    const stat = fs.statSync(dest);
    totalBytes += stat.size;
    filesBackedUp.push({ name: 'master_tenants.db', size: stat.size });
  }

  // 2. Backup primary billarpulse.db
  const primaryDbPath = path.join(dataDir, 'billarpulse.db');
  if (fs.existsSync(primaryDbPath)) {
    const dest = path.join(backupFolder, 'billarpulse.db');
    const db = new Database(primaryDbPath);
    await db.backup(dest);
    db.close();
    const stat = fs.statSync(dest);
    totalBytes += stat.size;
    filesBackedUp.push({ name: 'billarpulse.db', size: stat.size });
  }

  // 3. Backup all tenant databases in data/tenants/
  if (fs.existsSync(tenantsDir)) {
    const tenantFiles = fs.readdirSync(tenantsDir).filter(f => f.endsWith('.db'));
    for (const file of tenantFiles) {
      const src = path.join(tenantsDir, file);
      const dest = path.join(backupTenantsFolder, file);
      try {
        const db = new Database(src);
        await db.backup(dest);
        db.close();
        const stat = fs.statSync(dest);
        totalBytes += stat.size;
        filesBackedUp.push({ name: `tenants/${file}`, size: stat.size });
      } catch (err) {
        console.error(`[Backup] Error backing up tenant db ${file}:`, err.message);
      }
    }
  }

  // 4. Save metadata manifest
  const manifest = {
    id: `bp-backup-${timestamp}-${label}`,
    createdAt: new Date().toISOString(),
    label,
    totalFiles: filesBackedUp.length,
    totalSizeBytes: totalBytes,
    totalSizeFormatted: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`,
    files: filesBackedUp
  };

  fs.writeFileSync(path.join(backupFolder, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`[Backup] Respaldo completado exitosamente: ${manifest.id} (${manifest.totalSizeFormatted})`);

  // Run rotation to keep disk usage controlled
  rotateBackups(7);

  return manifest;
}

/**
 * Rotates backups, keeping the most recent N backups and cleaning older ones.
 */
function rotateBackups(maxKeep = 7) {
  try {
    if (!fs.existsSync(backupsDir)) return;

    const folders = fs.readdirSync(backupsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('bp-backup-'))
      .map(dirent => ({
        name: dirent.name,
        fullPath: path.join(backupsDir, dirent.name),
        time: fs.statSync(path.join(backupsDir, dirent.name)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time); // newest first

    if (folders.length > maxKeep) {
      const toDelete = folders.slice(maxKeep);
      for (const item of toDelete) {
        fs.rmSync(item.fullPath, { recursive: true, force: true });
        console.log(`[Backup] Rotación: eliminado respaldo antiguo "${item.name}"`);
      }
    }
  } catch (err) {
    console.error('[Backup] Error durante rotación de respaldos:', err.message);
  }
}

/**
 * Returns a list of all existing backups with metadata.
 */
function listBackups() {
  if (!fs.existsSync(backupsDir)) return [];

  const folders = fs.readdirSync(backupsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('bp-backup-'))
    .map(dirent => {
      const folderPath = path.join(backupsDir, dirent.name);
      const manifestPath = path.join(folderPath, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch (e) { }
      }
      const stat = fs.statSync(folderPath);
      return {
        id: dirent.name,
        createdAt: stat.mtime.toISOString(),
        label: 'manual',
        totalSizeFormatted: 'N/A'
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return folders;
}

/**
 * Schedules daily automatic backup at night or every 24h.
 */
function initBackupScheduler() {
  // Run first check after 1 minute of server boot
  setTimeout(async () => {
    try {
      const backups = listBackups();
      const today = new Date().toISOString().slice(0, 10);
      const hasBackupToday = backups.some(b => b.createdAt && b.createdAt.startsWith(today));
      if (!hasBackupToday) {
        console.log('[Backup Scheduler] No se detectó respaldo hoy. Ejecutando respaldo automático inicial...');
        await createSafeBackup('daily_boot');
      }
    } catch (e) {
      console.error('[Backup Scheduler] Error en chequeo inicial:', e.message);
    }
  }, 60 * 1000);

  // Check every 6 hours if a daily backup is needed
  setInterval(async () => {
    try {
      const backups = listBackups();
      const today = new Date().toISOString().slice(0, 10);
      const hasBackupToday = backups.some(b => b.createdAt && b.createdAt.startsWith(today));
      if (!hasBackupToday) {
        console.log('[Backup Scheduler] Ejecutando respaldo automático diario...');
        await createSafeBackup('daily');
      }
    } catch (e) {
      console.error('[Backup Scheduler] Error en tarea programada:', e.message);
    }
  }, 6 * 60 * 60 * 1000);
}

module.exports = {
  createSafeBackup,
  rotateBackups,
  listBackups,
  initBackupScheduler
};

