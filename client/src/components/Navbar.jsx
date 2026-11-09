import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Volume2, LayoutGrid, Tablet, Clock, FileText, Settings, Receipt, TrendingUp, QrCode, Lock, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function Navbar({ 
  currentView, 
  setView, 
  selectedTableId, 
  setSelectedTableId, 
  isConnected, 
  tables,
  isDirectTable = false,
  onOpenShiftReport,
  onOpenAdmin,
  onOpenHistory,
  onOpenAnalytics,
  onOpenConnectDevices,
  onRequestCajaAccess,
  lowStockCount = 0,
  licenseInfo = null,
  currentStaff = null,
  theme = 'dark',
  onToggleTheme = () => {},
  onOpenStaffLogin = () => {},
  onOpenCEOHub = null,
  currentBusiness = null,
  isCEOMode = false,
  onExitCEOMode = null
}) {
  const [timeStr, setTimeStr] = useState('');
  const isWaiter = currentStaff?.role === 'mesero';

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Stealth CEO Hub access (5 rapid clicks on logo for Victor & partner)
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 700) {
      const count = logoClicks + 1;
      setLogoClicks(count);
      if (count >= 5) {
        setLogoClicks(0);
        sounds.playCashRegister();
        if (onOpenCEOHub) onOpenCEOHub();
      }
    } else {
      setLogoClicks(1);
    }
    setLastClickTime(now);
  };

  const handleCajaClick = () => {
    if (currentView === 'kiosk') {
      onRequestCajaAccess();
    } else {
      setView('caja');
    }
  };

  return (
    <header style={{
      background: 'rgba(10, 15, 26, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand (Clic 5 veces aquí para acceso secreto de dueños) */}
      <div 
        onClick={handleLogoClick}
        title=""
        style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'default', userSelect: 'none' }}
      >
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #00e676, #008744)',
          boxShadow: 'var(--shadow-neon-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#090d16',
          fontWeight: '900',
          fontSize: '1.1rem'
        }}>
          8
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              Billar<span style={{ color: 'var(--color-brand)' }}>Pulse</span>
            </span>
            {licenseInfo?.status === 'trial' ? (
              <span
                onClick={() => onOpenAdmin('license')}
                title="Modo de evaluación. Clic para activar clave de licencia."
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: 'rgba(234, 179, 8, 0.2)',
                  color: '#facc15',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  cursor: 'pointer'
                }}
              >
                DEMO ({licenseInfo.daysRemaining || 15}d)
              </span>
            ) : licenseInfo?.status === 'active' ? (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'rgba(0, 230, 118, 0.15)',
                color: 'var(--color-brand)',
                border: '1px solid rgba(0, 230, 118, 0.3)'
              }}>
                PRO ({licenseInfo.maxTables} mesas)
              </span>
            ) : (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(0, 230, 118, 0.15)',
                color: 'var(--color-brand)',
                border: '1px solid rgba(0, 230, 118, 0.3)'
              }}>
                LAN v1.0
              </span>
            )}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <span>{currentBusiness?.name || licenseInfo?.businessName || 'POS & Marcador Táctil Offline-First'}</span>
            {currentBusiness?.city && <span style={{ opacity: 0.6 }}>• {currentBusiness.city}</span>}
          </div>
        </div>
      </div>

      {/* View Switcher Controls / Direct Table Header */}
      {isDirectTable ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            padding: '0.45rem 1.15rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(0, 230, 118, 0.12)',
            border: '1px solid rgba(0, 230, 118, 0.35)',
            color: 'var(--color-brand)',
            fontWeight: 800,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-neon-green)'
          }}>
            <span>🎱 Mesa {tables.find(t => t.id === selectedTableId)?.table_number || selectedTableId}</span>
            <span style={{ fontSize: '0.75rem', color: '#fff', opacity: 0.8 }}>• Pantalla en Vivo</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            gap: '4px'
          }}>
          <button
            onClick={handleCajaClick}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: currentView === 'caja' ? 'var(--color-brand)' : 'transparent',
              color: currentView === 'caja' ? '#090d16' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              gap: '0.5rem'
            }}
          >
            <LayoutGrid size={16} />
            Caja & Barra
          </button>

          <button
            onClick={() => setView('kiosk')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: currentView === 'kiosk' ? 'var(--color-brand)' : 'transparent',
              color: currentView === 'kiosk' ? '#090d16' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              gap: '0.5rem'
            }}
          >
            <Tablet size={16} />
            Pantalla Mesa (Kiosco)
          </button>
        </div>

        {/* Action Buttons if in Caja view */}
        {currentView === 'caja' && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!isWaiter && lowStockCount > 0 && (
              <button
                onClick={() => onOpenAdmin('inventory-low-stock')}
                style={{
                  padding: '0.45rem 0.85rem',
                  background: 'rgba(251, 191, 36, 0.15)',
                  color: 'var(--color-gold)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  gap: '0.4rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(251, 191, 36, 0.25)'
                }}
                title="Hay productos con stock por debajo de la alerta mínima configurada. Clic para ver y reabastecer."
              >
                ⚠️ {lowStockCount} Bajo Stock
              </button>
            )}

            {!isWaiter && (
              <button
                onClick={() => onOpenAdmin('inventory')}
                style={{
                  padding: '0.5rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <Settings size={15} color="var(--color-blue)" />
                Administración
              </button>
            )}

            {!isWaiter && (
              <button
                onClick={onOpenAnalytics}
                style={{
                  padding: '0.5rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <TrendingUp size={15} color="var(--color-brand)" />
                Estadísticas
              </button>
            )}

            <button
              onClick={onOpenHistory}
              style={{
                padding: '0.5rem 0.85rem',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 700,
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <Receipt size={15} color="var(--color-gold)" />
              Historial
            </button>

            {!isWaiter && (
              <button
                onClick={onOpenShiftReport}
                style={{
                  padding: '0.5rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <FileText size={15} color="var(--color-gold)" />
                Arqueo de Turno
              </button>
            )}
          </div>
        )}

        {/* Table Selector if in Kiosk view (solo si no es link directo) */}
        {!isDirectTable && currentView === 'kiosk' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={() => {
                const pool = tables.filter(t => t.type !== 'barra');
                const idx = pool.findIndex(t => t.id === selectedTableId);
                const prev = idx > 0 ? pool[idx - 1] : pool[pool.length - 1];
                if (prev) {
                  sounds.playScoreBeep(true);
                  setSelectedTableId(prev.id);
                }
              }}
              title="Mesa anterior (←)"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <select
              value={selectedTableId}
              onChange={(e) => {
                sounds.playScoreBeep(true);
                setSelectedTableId(Number(e.target.value));
              }}
              style={{
                background: 'var(--bg-card)',
                color: '#fff',
                border: '1px solid var(--border-subtle)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {tables.filter(t => t.type !== 'barra').map(t => (
                <option key={t.id} value={t.id}>
                  🎱 M-{t.table_number}: {t.name} ({t.status === 'occupied' ? '🟢 En Juego' : '⚪ Libre'})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                const pool = tables.filter(t => t.type !== 'barra');
                const idx = pool.findIndex(t => t.id === selectedTableId);
                const next = idx < pool.length - 1 ? pool[idx + 1] : pool[0];
                if (next) {
                  sounds.playScoreBeep(true);
                  setSelectedTableId(next.id);
                }
              }}
              title="Mesa siguiente (→)"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      )}

      {/* Status & Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Sound Test trigger */}
        <button
          onClick={() => sounds.playWaiterBell()}
          title="Probar sonido de campana de mesero"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.45rem',
            cursor: 'pointer'
          }}
        >
          <Volume2 size={16} />
        </button>

        {/* Theme Toggle Button (Light / Dark) */}
        <button
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Cambiar a Modo Oscuro (Noche)' : 'Cambiar a Modo Claro (Día)'}
          style={{
            background: theme === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
            color: theme === 'light' ? '#0f172a' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.45rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} color="var(--color-gold)" />}
        </button>

        {/* Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <Clock size={15} />
          <span className="mono">{timeStr}</span>
        </div>

        {/* Active Staff / Mesero Switch Button */}
        <button
          onClick={onOpenStaffLogin}
          title="Cambiar de mesero o iniciar sesión con PIN"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: currentStaff?.role === 'admin'
              ? 'rgba(251, 191, 36, 0.15)'
              : currentStaff?.role === 'cajero'
              ? 'rgba(59, 130, 246, 0.15)'
              : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${
              currentStaff?.role === 'admin'
                ? 'rgba(251, 191, 36, 0.4)'
                : currentStaff?.role === 'cajero'
                ? 'rgba(59, 130, 246, 0.4)'
                : 'rgba(16, 185, 129, 0.4)'
            }`,
            color: currentStaff?.role === 'admin' ? 'var(--color-gold)' : '#fff',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <span style={{ fontSize: '0.88rem' }}>
            {currentStaff?.role === 'admin' ? '👑' : currentStaff?.role === 'cajero' ? '💼' : '🍸'}
          </span>
          <span style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentStaff ? currentStaff.name : 'Personal'}
          </span>
          <span style={{
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            background: 'rgba(0,0,0,0.25)',
            padding: '1px 5px',
            borderRadius: '4px'
          }}>
            PIN
          </span>
        </button>

        {/* Exit CEO Auditor Mode if currently inspecting another club */}
        {isCEOMode && onExitCEOMode && (
          <button
            onClick={onExitCEOMode}
            title="Volver a la sede matriz principal"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.38rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: 'var(--color-alert)',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>↩️</span>
            <span>Salir Auditoría</span>
          </button>
        )}

        {/* Connect tablets QR button */}
        <button
          onClick={onOpenConnectDevices}
          title="Ver códigos QR para conectar tablets y celulares por Wi-Fi"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 0.8rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(0, 230, 118, 0.12)',
            border: '1px solid rgba(0, 230, 118, 0.35)',
            color: 'var(--color-brand)',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <QrCode size={15} />
          Conectar Tablets
        </button>

        {/* Connection status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          background: isConnected ? 'rgba(0, 230, 118, 0.1)' : 'rgba(244, 63, 94, 0.1)',
          border: `1px solid ${isConnected ? 'rgba(0, 230, 118, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
        }}>
          {isConnected ? (
            <>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--color-brand)',
                boxShadow: '0 0 8px var(--color-brand)'
              }} />
              <Wifi size={14} color="var(--color-brand)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand)' }}>LAN 100% OK</span>
            </>
          ) : (
            <>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--color-alert)'
              }} />
              <WifiOff size={14} color="var(--color-alert)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-alert)' }}>Reconectando...</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
