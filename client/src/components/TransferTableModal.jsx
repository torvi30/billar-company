import React, { useState } from 'react';
import { X, ArrowRightLeft, Clock, Coffee, ShieldAlert, Check, Layers } from 'lucide-react';
import { formatCurrency, formatSessionDuration } from '../utils/formatters';
import { sounds } from '../utils/audio';
import { api } from '../services/api';

export default function TransferTableModal({ sourceTable, allTables, isOpen, onClose, onSuccess }) {
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !sourceTable) return null;

  // Filter tables that are available and not the current table
  const availableTables = (allTables || []).filter(
    t => t.id !== sourceTable.id && t.status === 'available'
  );

  const session = sourceTable.current_session;
  const timeElapsedStr = session ? formatSessionDuration(session) : '00:00:00';
  const barConsumption = session ? (session.total_consumption || 0) : 0;
  const selectedTarget = availableTables.find(t => t.id === selectedTargetId);

  const handleConfirmTransfer = async () => {
    if (!selectedTargetId) {
      setError('Por favor selecciona una mesa de destino libre');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      sounds.playScoreBeep(true);
      const res = await api.transferSession(sourceTable.id, selectedTargetId);
      if (!res.success) {
        throw new Error(res.error || 'Error al transferir la mesa');
      }
      sounds.playCashRegister();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo realizar el traspaso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 8, 14, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        cursor: 'pointer'
      }}
    >
      <div 
        className="glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          cursor: 'default'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--color-blue)',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <ArrowRightLeft size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Traspaso de Mesa
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                Mudar partida activa de Mesa {sourceTable.table_number} a otra mesa disponible
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-muted)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              padding: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Source Table Summary Banner */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Mesa Origen (Actual)
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                Mesa {sourceTable.table_number} - {sourceTable.name}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} color="var(--color-brand)" /> {timeElapsedStr}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Coffee size={13} color="var(--color-gold)" /> Barra: {formatCurrency(barConsumption)}
                </span>
              </div>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--color-alert)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              OCUPADA
            </div>
          </div>

          {/* Destination Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
              SELECCIONA LA MESA DE DESTINO (LIBRES):
            </label>

            {availableTables.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px dashed var(--color-alert)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-alert)'
              }}>
                <ShieldAlert size={28} style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 800 }}>No hay otras mesas libres en este momento</div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px', opacity: 0.85 }}>
                  Debes liquidar o liberar otra mesa antes de realizar un traspaso.
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem' }}>
                {availableTables.map(t => {
                  const isSelected = selectedTargetId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTargetId(t.id)}
                      style={{
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface)',
                        border: `2px solid ${isSelected ? 'var(--color-blue)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 15px rgba(59, 130, 246, 0.3)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          background: 'var(--color-brand)',
                          color: '#090d16',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          Mesa {t.table_number}
                        </span>
                        {isSelected && <Check size={18} color="var(--color-blue)" />}
                      </div>

                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: '0.5rem' }}>
                        {t.name}
                      </div>

                      <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {formatCurrency(t.hourly_rate)} / h
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transfer Notice */}
          {selectedTarget && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4
            }}>
              <strong style={{ color: '#fff' }}>¿Qué sucederá con el traspaso?</strong>
              <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0 }}>
                <li>El tiempo jugado ({timeElapsedStr}) se preserva y continuará corriendo en la Mesa {selectedTarget.table_number}.</li>
                <li>Todos los consumos ({formatCurrency(barConsumption)}) y marcadores se trasladan automáticamente.</li>
                <li>La Mesa {sourceTable.table_number} quedará disponible de inmediato para nuevos clientes.</li>
              </ul>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--color-alert)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 700
            }}>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.85rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 700
              }}
            >
              Cancelar
            </button>

            <button
              disabled={!selectedTargetId || loading || availableTables.length === 0}
              onClick={handleConfirmTransfer}
              style={{
                flex: 1,
                padding: '0.85rem',
                background: selectedTargetId ? 'var(--color-blue)' : 'var(--border-subtle)',
                color: selectedTargetId ? '#ffffff' : 'var(--text-muted)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.95rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: selectedTargetId ? 'pointer' : 'not-allowed',
                boxShadow: selectedTargetId ? '0 0 20px rgba(59, 130, 246, 0.4)' : 'none'
              }}
            >
              <ArrowRightLeft size={18} />
              {loading 
                ? 'Trasladando partida...' 
                : selectedTarget 
                  ? `Confirmar Traspaso a Mesa ${selectedTarget.table_number}` 
                  : 'Selecciona una mesa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
