import React, { useEffect } from 'react';
import { X, Tablet } from 'lucide-react';
import TableKiosk from './TableKiosk';

export default function TablePreviewModal({ 
  tableId, 
  tablesOverview, 
  isOpen, 
  onClose, 
  onStateChange 
}) {
  // Close with Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !tableId) return null;

  const currentTable = tablesOverview.find(t => t.id === tableId);
  const tableName = currentTable ? `Mesa ${currentTable.table_number} - ${currentTable.name}` : `Mesa ${tableId}`;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 8, 14, 0.94)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '0.75rem',
        cursor: 'pointer'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '98vw',
          maxWidth: '1800px',
          height: '96vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.95)',
          background: 'var(--bg-main)',
          cursor: 'default'
        }}
      >
        {/* Top Header of the Preview */}
        <div style={{
          padding: '0.75rem 1.5rem',
          background: 'rgba(10, 15, 26, 0.96)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(0, 230, 118, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-brand)'
            }}>
              <Tablet size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                  {tableName}
                </span>
                <span style={{
                  background: 'rgba(0, 230, 118, 0.15)',
                  color: 'var(--color-brand)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(0, 230, 118, 0.3)'
                }}>
                  Pantalla del Jugador (En Vivo)
                </span>
              </div>
            </div>
          </div>

          {/* Simple X close button */}
          <button
            onClick={onClose}
            title="Cerrar (Esc)"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = '#fff';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Kiosk Screen Inside Preview */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#090d16' }}>
          <TableKiosk 
            tableId={tableId}
            tablesOverview={tablesOverview}
            onStateChange={onStateChange}
          />
        </div>
      </div>
    </div>
  );
}
