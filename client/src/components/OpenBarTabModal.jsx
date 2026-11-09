import React, { useState, useEffect } from 'react';
import { X, Coffee, Check, PlusCircle, User, MapPin, Edit3 } from 'lucide-react';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

export default function OpenBarTabModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [location, setLocation] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(initialData && initialData.id);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setLocation(initialData.location || initialData.name || 'Barra 01');
        setCustomerName(initialData.customer_name || '');
      } else {
        setLocation('Barra 01');
        setCustomerName('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const locationSuggestions = [
    'Barra 01',
    'Barra 02',
    'Barra 03',
    'Terraza',
    'Salón Mesa 1',
    'Mostrador',
    'Mesa 1 (Personal)',
    'Mesa 2 (Personal)'
  ];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const finalLocation = location.trim() || 'Barra 01';
    const finalCustomer = customerName.trim();
    setLoading(true);
    try {
      sounds.playCashRegister();
      if (isEditing) {
        await api.updateBarTab(initialData.id, {
          location: finalLocation,
          customerName: finalCustomer
        });
      } else {
        await api.createBarTab({
          location: finalLocation,
          customerName: finalCustomer
        });
      }
      setLocation('');
      setCustomerName('');
      onSuccess();
      onClose();
    } catch (err) {
      sounds.playError();
      alert(err.message || 'Error al procesar cuenta de barra');
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
          maxWidth: '540px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          background: 'var(--bg-main)',
          cursor: 'default'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(251, 191, 36, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-gold)'
            }}>
              {isEditing ? <Edit3 size={20} /> : <Coffee size={20} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                {isEditing ? 'Editar Cuenta de Barra / Personal' : 'Nueva Cuenta de Barra & Clientes'}
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {isEditing 
                  ? 'Modifica la ubicación o la persona asignada a esta cuenta'
                  : 'Para personas en barra o jugadores con cuenta de consumo separada'}
              </div>
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
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* CAMPO 1: Ubicación / Espacio / Barra */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-gold)', marginBottom: '0.45rem' }}>
              <MapPin size={15} />
              1. Ubicación o Barra (¿Dónde está?):
            </label>
            <input
              type="text"
              autoFocus
              placeholder="Ej: Barra 01, Terraza, Barra 02, Mesa 3..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            {/* Sugerencias Rápidas de Ubicación */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
              {locationSuggestions.map((sug) => (
                <button
                  type="button"
                  key={sug}
                  onClick={() => setLocation(sug)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    background: location === sug ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${location === sug ? 'var(--color-gold)' : 'var(--border-subtle)'}`,
                    color: location === sug ? 'var(--color-gold)' : 'var(--text-secondary)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* CAMPO 2: Nombre de la Persona / Cliente */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-brand)', marginBottom: '0.45rem' }}>
              <User size={15} />
              2. Nombre del Cliente o Persona (¿A nombre de quién?):
            </label>
            <input
              type="text"
              placeholder="Ej: Don Pedro, Carlos, El Paisa, Amigo de Juan..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Opcional. Si lo dejas vacío, la cuenta se identificará solo con la ubicación (ej: Barra 01).
            </div>
          </div>

          {/* Banner explicativo */}
          <div style={{
            background: 'rgba(0, 230, 118, 0.08)',
            border: '1px solid rgba(0, 230, 118, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.45
          }}>
            🎱 <strong>Ideal para cobros por separado:</strong> Si una persona está jugando en una mesa de billar pero pide algo personal que no quiere sumar a la cuenta del grupo, asígnale aquí su ubicación y su nombre (ej: <em>Mesa 2</em> y <em>Pedro</em>).
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.85rem',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                border: '1px solid var(--border-subtle)'
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1.5,
                padding: '0.85rem',
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                color: '#090d16',
                borderRadius: 'var(--radius-md)',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                border: 'none',
                boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)'
              }}
            >
              {isEditing ? <Check size={18} /> : <PlusCircle size={18} />}
              {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Abrir Cuenta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
