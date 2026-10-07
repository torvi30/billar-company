import React, { useState } from 'react';
import { Lock, X, Delete } from 'lucide-react';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

export default function PinModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit) => {
    sounds.playScoreBeep(true);
    if (pin.length < 4) {
      setError(false);
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verify(nextPin);
      }
    }
  };

  const handleClear = () => {
    sounds.playScoreBeep(false);
    setPin('');
    setError(false);
  };

  const verify = async (codeToVerify) => {
    setLoading(true);
    try {
      const res = await api.verifyPin(codeToVerify);
      if (res.success && res.isValid) {
        sounds.playCashRegister();
        setPin('');
        onSuccess();
        onClose();
      } else {
        sounds.playScoreBeep(false);
        setError(true);
        setPin('');
      }
    } catch (e) {
      setError(true);
      setPin('');
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
        background: 'rgba(5, 8, 14, 0.92)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem',
        cursor: 'pointer'
      }}
    >
      <div 
        className="glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'default',
        gap: '1.25rem',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-muted)',
            borderRadius: '50%',
            width: '32px',
            height: '32px'
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(0, 230, 118, 0.1)',
          border: '2px solid var(--color-brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-neon-green)'
        }}>
          <Lock size={26} color="var(--color-brand)" />
        </div>

        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Acceso a Administración
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Ingresa el PIN de seguridad (Por defecto: 1234)
          </p>
        </div>

        {/* PIN Dots Display */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          margin: '0.5rem 0',
          justifyContent: 'center'
        }}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: isFilled 
                    ? 'var(--color-brand)' 
                    : error ? 'var(--color-alert)' : 'var(--bg-surface)',
                  border: `2px solid ${isFilled ? 'var(--color-brand)' : (error ? 'var(--color-alert)' : 'var(--border-subtle)')}`,
                  boxShadow: isFilled ? '0 0 12px var(--color-brand-glow)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              />
            );
          })}
        </div>

        {error && (
          <div style={{ color: 'var(--color-alert)', fontSize: '0.8rem', fontWeight: 700 }}>
            PIN incorrecto. Intenta nuevamente.
          </div>
        )}

        {/* Touch Numeric Keypad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          width: '100%',
          maxWidth: '280px'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(String(digit))}
              disabled={loading}
              style={{
                height: '62px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '1.5rem',
                fontWeight: 800,
                boxShadow: 'var(--shadow-card)'
              }}
            >
              {digit}
            </button>
          ))}

          <button
            onClick={handleClear}
            style={{
              height: '62px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--color-alert)',
              fontSize: '0.85rem',
              fontWeight: 800
            }}
          >
            BORRAR
          </button>

          <button
            onClick={() => handleDigit('0')}
            disabled={loading}
            style={{
              height: '62px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: 800
            }}
          >
            0
          </button>

          <button
            onClick={() => {
              if (pin.length > 0) {
                setPin(pin.slice(0, -1));
                setError(false);
              }
            }}
            style={{
              height: '62px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
