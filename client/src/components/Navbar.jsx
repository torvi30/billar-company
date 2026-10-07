import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Volume2, LayoutGrid, Tablet, Clock, FileText, Settings, Receipt, TrendingUp } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function Navbar({ 
  currentView, 
  setView, 
  selectedTableId, 
  setSelectedTableId, 
  isConnected, 
  tables,
  onOpenShiftReport,
  onOpenAdmin,
  onOpenHistory,
  onOpenAnalytics,
  onRequestCajaAccess
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

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
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            POS & Marcador Táctil Offline-First
          </div>
        </div>
      </div>

      {/* View Switcher Controls */}
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onOpenAdmin}
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
          </div>
        )}

        {/* Table Selector if in Kiosk view */}
        {currentView === 'kiosk' && (
          <select
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(Number(e.target.value))}
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
            {tables.map(t => (
              <option key={t.id} value={t.id}>
                Mesa {t.table_number} - {t.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Status & Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

        {/* Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <Clock size={15} />
          <span className="mono">{timeStr}</span>
        </div>

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
