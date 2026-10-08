import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, Delete, Lock, User, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

export default function StaffLoginModal({ isOpen, onClose, onLoginSuccess, currentStaff = null }) {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      loadStaff();
    }
  }, [isOpen]);

  const loadStaff = async () => {
    try {
      const res = await api.getStaff();
      if (res.success && res.data) {
        setStaffList(res.data);
        if (currentStaff) {
          const match = res.data.find(s => s.id === currentStaff.id);
          if (match) setSelectedStaff(match);
        } else if (res.data.length > 0) {
          // Pre-select first or wait for click
          setSelectedStaff(null);
        }
      }
    } catch (e) {
      console.error('Error cargando personal:', e);
    }
  };

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      sounds.playScoreBeep(true);
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg('');
      if (newPin.length === 4) {
        submitLogin(newPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      sounds.playScoreBeep(false);
      setPin(pin.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const submitLogin = async (pinToTest) => {
    setLoading(true);
    try {
      const res = await api.staffLogin(pinToTest, selectedStaff?.id);
      if (res.success && res.data) {
        sounds.playCashRegister();
        localStorage.setItem('billarpulse_user', JSON.stringify(res.data));
        onLoginSuccess(res.data);
        onClose();
      } else {
        throw new Error(res.error || 'PIN incorrecto');
      }
    } catch (err) {
      sounds.playScoreBeep(false);
      setErrorMsg(err.message || 'PIN incorrecto');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '1rem',
        cursor: 'pointer'
      }}
    >
      <div 
        className="glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
          cursor: 'default',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(0, 230, 118, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-brand)'
            }}>
              <UserCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Identificación de Turno
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Selecciona tu nombre y digita tu PIN de 4 dígitos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-muted)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Step 1: Select Staff Member */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              1. ¿Quién está atendiendo?
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: staffList.length > 2 ? 'repeat(auto-fit, minmax(120px, 1fr))' : 'repeat(2, 1fr)',
              gap: '0.5rem'
            }}>
              {staffList.map((s) => {
                const isSelected = selectedStaff?.id === s.id;
                const isAdmin = s.role === 'admin' || s.role === 'cajero';
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      sounds.playScoreBeep(true);
                      setSelectedStaff(s);
                      setPin('');
                      setErrorMsg('');
                    }}
                    style={{
                      padding: '0.75rem 0.6rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(0, 230, 118, 0.15)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isSelected ? 'var(--color-brand)' : 'rgba(255, 255, 255, 0.06)',
                      color: isSelected ? '#090d16' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem'
                    }}>
                      {isAdmin ? '👑' : s.name.charAt(0)}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                      {s.name}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: isAdmin ? 'rgba(251, 191, 36, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: isAdmin ? 'var(--color-gold)' : 'var(--color-blue)'
                    }}>
                      {s.role === 'admin' ? 'Admin' : s.role === 'cajero' ? 'Caja' : 'Mesera'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: PIN Pad */}
          {selectedStaff && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Ingresa el PIN de 4 dígitos de <strong style={{ color: '#fff' }}>{selectedStaff.name}</strong>:
                </span>
                
                {/* Masked PIN display */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  marginTop: '0.6rem'
                }}>
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = pin.length > idx;
                    return (
                      <div
                        key={idx}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: isFilled ? 'var(--color-brand)' : 'rgba(255, 255, 255, 0.1)',
                          border: `2px solid ${isFilled ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                          boxShadow: isFilled ? '0 0 10px var(--color-brand-glow)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      />
                    );
                  })}
                </div>

                {errorMsg && (
                  <div style={{ color: 'var(--color-alert)', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.5rem' }}>
                    ⚠️ {errorMsg}
                  </div>
                )}
              </div>

              {/* Touch Numeric Keypad */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                maxWidth: '280px',
                margin: '0 auto'
              }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(String(num))}
                    disabled={loading}
                    style={{
                      height: '56px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {num}
                  </button>
                ))}
                
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    height: '56px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Borrar
                </button>

                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  disabled={loading}
                  style={{
                    height: '56px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    height: '56px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(244, 63, 94, 0.1)',
                    color: 'var(--color-alert)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  <Delete size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
