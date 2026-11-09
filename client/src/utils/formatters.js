let currentCurrencyConfig = {
  symbol: '$',
  code: 'COP',
  locale: 'es-CO',
  decimals: 0
};

export function setCurrencyConfig(config = {}) {
  if (!config) return;
  currentCurrencyConfig = {
    symbol: config.currency_symbol || config.symbol || currentCurrencyConfig.symbol,
    code: config.currency_code || config.code || currentCurrencyConfig.code,
    locale: config.currency_locale || config.locale || currentCurrencyConfig.locale,
    decimals: config.currency_decimals != null ? Number(config.currency_decimals) : currentCurrencyConfig.decimals
  };
}

export function getCurrencyConfig() {
  return { ...currentCurrencyConfig };
}

export function formatCurrency(amount, customConfig = null) {
  if (amount == null || isNaN(amount)) {
    const sym = customConfig?.symbol || currentCurrencyConfig.symbol;
    return `${sym} 0`;
  }
  const cfg = customConfig ? { ...currentCurrencyConfig, ...customConfig } : currentCurrencyConfig;
  const num = Number(amount);
  const formattedNumber = cfg.decimals > 0
    ? num.toLocaleString(cfg.locale, { minimumFractionDigits: cfg.decimals, maximumFractionDigits: cfg.decimals })
    : Math.round(num).toLocaleString(cfg.locale);

  return `${cfg.symbol} ${formattedNumber}`;
}

export function formatDuration(startIsoString, endIsoString = null) {
  if (!startIsoString) return '00:00:00';
  const start = new Date(startIsoString).getTime();
  const end = endIsoString ? new Date(endIsoString).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatSessionDuration(session) {
  if (!session) return '00:00:00';
  let totalSeconds = session.accumulated_seconds || 0;
  if (!session.is_paused && session.start_time) {
    const start = new Date(session.start_time).getTime();
    const now = Date.now();
    totalSeconds += Math.max(0, Math.floor((now - start) / 1000));
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function calculateLiveTimeCost(startIsoString, hourlyRate) {
  if (!startIsoString || !hourlyRate) return 0;
  const start = new Date(startIsoString).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - start);
  const hoursFraction = diffMs / (1000 * 60 * 60);
  return Math.round(hoursFraction * hourlyRate);
}

export function calculateSessionLiveCost(session, hourlyRate, roundingMode = 'exact') {
  if (!session || !hourlyRate) return 0;
  let totalSeconds = session.accumulated_seconds || 0;
  if (!session.is_paused && session.start_time) {
    const start = new Date(session.start_time).getTime();
    const now = Date.now();
    totalSeconds += Math.max(0, Math.floor((now - start) / 1000));
  }
  let minutes = Math.max(1, Math.round(totalSeconds / 60));
  if (roundingMode === '15_min') {
    minutes = Math.max(15, Math.ceil(minutes / 15) * 15);
  } else if (roundingMode === 'minimum_30') {
    minutes = Math.max(30, minutes);
  }
  return Math.round((hourlyRate * (minutes / 60)));
}
