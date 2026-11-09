#!/usr/bin/env node
/**
 * =========================================================================
 * BillarPulse - Generador Maestro de Licencias Comerciales
 * Uso para Victor / Administrador del Software
 * =========================================================================
 * 
 * Ejemplos de uso:
 * 
 * 1. Licencia Anual (12 meses, 10 mesas):
 *    node generar-licencia.js --nombre "Club de Billar El Diamante" --nit "901.442.118-0" --mesas 10 --meses 12 --equipo "BP-DDB6-687C-4DB1"
 * 
 * 2. Licencia Permanente / Ilimitada:
 *    node generar-licencia.js --nombre "Billares Central" --mesas 20 --permanente --equipo "BP-DDB6-687C-4DB1"
 * 
 * 3. Licencia Universal de Demostración (Funciona en cualquier computador):
 *    node generar-licencia.js --nombre "Demo Universal" --mesas 8 --dias 30 --universal
 */

const { generateLicenseKey } = require('./server/license');

const args = process.argv.slice(2);

function getArg(flag, defaultValue = '') {
  const index = args.findIndex(a => a === flag || a.startsWith(flag + '='));
  if (index === -1) return defaultValue;
  if (args[index].includes('=')) {
    return args[index].split('=')[1];
  }
  return args[index + 1] || defaultValue;
}

const isUniversal = args.includes('--universal');
const isPerpetual = args.includes('--permanente') || args.includes('--perpetual');

const name = getArg('--nombre') || getArg('--name') || 'Club de Billar';
const nit = getArg('--nit') || '';
const tables = parseInt(getArg('--mesas') || getArg('--tables') || '10', 10);
const machineId = isUniversal ? '*' : (getArg('--equipo') || getArg('--machine') || '*');

let expiryDate = 'perpetual';
if (!isPerpetual) {
  const months = parseInt(getArg('--meses') || '0', 10);
  const days = parseInt(getArg('--dias') || '0', 10);

  const targetDate = new Date();
  if (months > 0) {
    targetDate.setMonth(targetDate.getMonth() + months);
    expiryDate = targetDate.toISOString().slice(0, 10);
  } else if (days > 0) {
    targetDate.setDate(targetDate.getDate() + days);
    expiryDate = targetDate.toISOString().slice(0, 10);
  } else {
    // Por defecto 12 meses
    targetDate.setFullYear(targetDate.getFullYear() + 1);
    expiryDate = targetDate.toISOString().slice(0, 10);
  }
}

const customExpiry = getArg('--vence');
if (customExpiry) {
  expiryDate = customExpiry;
}

const licenseKey = generateLicenseKey({
  businessName: name,
  nit,
  maxTables: tables,
  expiryDate,
  machineId
});

console.log('\n================================================================');
console.log('            🎱 BILLARPULSE - GENERADOR DE LICENCIA 🎱            ');
console.log('================================================================');
console.log(`📌 Establecimiento:    ${name}`);
console.log(`📄 NIT / Identificación: ${nit || '(No especificado)'}`);
console.log(`🎱 Mesas Autorizadas:  ${tables === 999 ? 'ILIMITADAS' : tables + ' mesas'}`);
console.log(`💻 Machine ID Destino:  ${machineId === '*' ? 'UNIVERSAL (Cualquier equipo)' : machineId}`);
console.log(`⏳ Vigencia:            ${expiryDate === 'perpetual' ? 'PERMANENTE (Vitalicia)' : 'Hasta ' + expiryDate}`);
console.log('----------------------------------------------------------------');
console.log('🔑 CLAVE DE LICENCIA GENERADA:');
console.log(`\x1b[32m%s\x1b[0m`, licenseKey);
console.log('----------------------------------------------------------------');
console.log('💡 Entrega esta clave a tu cliente para que la pegue en:');
console.log('   Administración > Licencia & Activación > Activar Licencia');
console.log('================================================================\n');

