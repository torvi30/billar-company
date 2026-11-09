const https = require('https');
const http = require('http');

function formatMoney(amount, settings = {}) {
  const sym = settings.currency_symbol || '$';
  const locale = settings.currency_locale || 'es-CO';
  const dec = Number(settings.currency_decimals || 0);
  const num = Number(amount || 0);

  const formatted = dec > 0
    ? num.toLocaleString(locale, { minimumFractionDigits: dec, maximumFractionDigits: dec })
    : Math.round(num).toLocaleString(locale);

  return `${sym} ${formatted}`;
}

function cleanPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+') && cleaned.length === 10) {
    // Asume Colombia si tiene 10 dígitos y empieza por 3
    if (cleaned.startsWith('3')) {
      cleaned = '+57' + cleaned;
    }
  }
  return cleaned.replace('+', '');
}

/**
 * Generates an instant WhatsApp Web / App link preloaded with the shift report
 */
function getWhatsAppLink(phone, message) {
  const clean = cleanPhoneNumber(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds the official WhatsApp formatted report
 */
function formatWhatsAppShiftMessage(shift, settings = {}) {
  const clubName = settings.business_name || 'BILLARPULSE CLUB';
  const closeDate = shift.closed_at ? new Date(shift.closed_at).toLocaleString(settings.currency_locale || 'es-CO') : new Date().toLocaleString(settings.currency_locale || 'es-CO');

  const diff = Number(shift.difference || 0);
  let diffText = '';
  if (diff === 0) {
    diffText = `✅ *Cuadre Perfecto:* ${formatMoney(0, settings)}`;
  } else if (diff > 0) {
    diffText = `🟢 *Sobrante en Caja:* +${formatMoney(diff, settings)}`;
  } else {
    diffText = `🔴 *Faltante en Caja:* ${formatMoney(diff, settings)}`;
  }

  return [
    `🎱 *BILLARPULSE - CIERRE DE TURNO (CORTE Z)*`,
    `🏢 *Club:* ${clubName}`,
    `👤 *Cerrado por:* ${shift.closed_by || 'Cajero'}`,
    `🕒 *Fecha:* ${closeDate}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 *TOTAL FACTURADO:* *${formatMoney(shift.total_sales, settings)}*`,
    `⏱️ *Tiempo en Mesas:* ${formatMoney(shift.total_time_revenue, settings)} (${shift.sessions_count || 0} sesiones)`,
    `🍻 *Consumo en Barra:* ${formatMoney(shift.total_consumption_revenue, settings)}`,
    ``,
    `💳 *Formas de Pago Recibidas:*`,
    `💵 Efectivo: ${formatMoney(shift.total_cash_sales, settings)}`,
    `📱 Transferencia / QR: ${formatMoney(shift.total_transfer_sales, settings)}`,
    `💳 Tarjetas: ${formatMoney(shift.total_card_sales, settings)}`,
    ``,
    `⚖️ *Arqueo de Efectivo:*`,
    `📥 Fondo Inicial: ${formatMoney(shift.initial_cash, settings)}`,
    `💵 Efectivo Esperado: ${formatMoney(shift.expected_cash, settings)}`,
    `🔎 Efectivo Contado: ${formatMoney(shift.actual_cash, settings)}`,
    `${diffText}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    shift.notes ? `📝 _Notas: ${shift.notes}_` : `📝 _Turno cerrado sin novedades adicionales._`
  ].join('\n');
}

/**
 * Sends webhook notification if configured (e.g. WhatsApp Bot, Zapier, n8n)
 */
function sendWebhookNotification(webhookUrl, payload) {
  return new Promise((resolve) => {
    if (!webhookUrl) return resolve({ success: false, error: 'No webhook URL' });

    try {
      const url = new URL(webhookUrl);
      const isHttps = url.protocol === 'https:';
      const lib = isHttps ? https : http;

      const data = JSON.stringify(payload);
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 8000
      };

      const req = lib.request(options, (res) => {
        resolve({ success: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode });
      });

      req.on('error', (err) => resolve({ success: false, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Timeout webhook' });
      });

      req.write(data);
      req.end();
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
}

/**
 * Dispatches shift closing summary
 */
async function sendShiftCloseNotification(shift, dbOperations) {
  try {
    const settings = dbOperations.getSettings();
    const webhookUrl = settings.webhook_url;
    const whatsappNumber = settings.owner_whatsapp;
    const message = formatWhatsAppShiftMessage(shift, settings);

    const results = {
      whatsappLink: whatsappNumber ? getWhatsAppLink(whatsappNumber, message) : null,
      message
    };

    // If a webhook gateway is configured, trigger it
    if (webhookUrl) {
      results.webhook = await sendWebhookNotification(webhookUrl, {
        event: 'shift_closed',
        phone: cleanPhoneNumber(whatsappNumber),
        clubName: settings.business_name || 'BILLARPULSE CLUB',
        shift,
        summaryText: message,
        timestamp: new Date().toISOString()
      });
    }

    return results;
  } catch (err) {
    console.error('[Notifier] Error dispatching notification:', err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  formatWhatsAppShiftMessage,
  getWhatsAppLink,
  cleanPhoneNumber,
  sendWebhookNotification,
  sendShiftCloseNotification
};
