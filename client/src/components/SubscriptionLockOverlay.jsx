import React, { useState } from 'react';
import { ShieldAlert, Key, MessageCircle, Crown, Lock, RefreshCw, AlertTriangle } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function SubscriptionLockOverlay({
  business,
  onOpenCEOHub,
  onRefresh
}) {
  const [licenseInput, setLicenseInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Secret shield click counter for Victor & partner
  const [shieldClicks, setShieldClicks] = useState(0);
  const [lastShieldClick, setLastShieldClick] = useState(0);

  const handleSecretShieldClick = () => {
    const now = Date.now();
    if (now - lastShieldClick < 700) {
      const count = shieldClicks + 1;
      setShieldClicks(count);
      if (count >= 5) {
        setShieldClicks(0);
        sounds.playCashRegister();
        if (onOpenCEOHub) onOpenCEOHub();
      }
    } else {
      setShieldClicks(1);
    }
    setLastShieldClick(now);
  };

  if (!business || !business.isLocked) return null;

  const isExpired = business.subscription?.status === 'expired';
  const statusLabel = isExpired ? 'Suscripción Vencida' : 'Servicio Suspendido';

  const handleApplyLicense = async (e) => {
    e.preventDefault();
    if (!licenseInput.trim()) return;
    setVerifying(true);
    setErrorMsg('');
    try {
      sounds.playScoreBeep(true);
      // Let the user know to contact CEO or use CEO Master Hub
      setErrorMsg('Para activar esta licencia firmada, abre la consola CEO Master con tu PIN.');
      setShowKeyInput(false);
      onOpenCEOHub();
    } catch (err) {
      setErrorMsg(err.message || 'Error validando licencia');
    } finally {
      setVerifying(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hola Víctor, requiero renovar la suscripción de BillarPulse Pro para mi negocio "${business.name}" (ID: ${business.slug}). ¿Cómo podemos coordinar el pago?`
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      background: 'rgba(5, 7, 15, 0.94)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        maxWidth: '540px',
        width: '100%',
        background: '#0d1322',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(239, 68, 68, 0.15)',
        borderRadius: 'var(--radius-lg, 16px)',
        padding: '2.5rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Warning Icon Badge (Clic 5 veces aquí abre acceso secreto para Víctor y socio) */}
        <div 
          onClick={handleSecretShieldClick}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
            cursor: 'default',
            userSelect: 'none'
          }}
        >
          <ShieldAlert size={38} color="#ef4444" />
        </div>

        {/* Status Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '20px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#ef4444',
          fontSize: '0.75rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '1rem'
        }}>
          <Lock size={12} />
          {statusLabel}
        </div>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 900,
          color: '#fff',
          margin: '0 0 0.5rem 0'
        }}>
          {business.name}
        </h2>

        <p style={{
          color: 'var(--text-secondary, #94a3b8)',
          fontSize: '0.9rem',
          lineHeight: '1.5',
          margin: '0 0 1.5rem 0'
        }}>
          El periodo de suscripción de BillarPulse Pro ha finalizado el{' '}
          <strong style={{ color: '#fff' }}>{business.expiry_date}</strong>. Para mantener activas las mesas y terminales, por favor renueva la licencia de tu club.
        </p>

        {/* Business summary pill */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          borderRadius: 'var(--radius-sm, 8px)',
          padding: '0.75rem 1rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-around',
          fontSize: '0.8rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted, #64748b)' }}>Dueño: </span>
            <strong style={{ color: '#fff' }}>{business.owner_name || 'Titular'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted, #64748b)' }}>Mesas: </span>
            <strong style={{ color: 'var(--color-brand, #00e676)' }}>{business.max_tables} mesas</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted, #64748b)' }}>Plan: </span>
            <strong style={{ color: '#a855f7' }}>{business.plan?.toUpperCase()}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* WhatsApp Direct Renewal */}
          <a
            href={`https://wa.me/573000000000?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1.25rem',
              background: '#25D366',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.9rem',
              borderRadius: 'var(--radius-sm, 8px)',
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            <MessageCircle size={18} />
            Renovar por WhatsApp con Soporte
          </a>

          {/* Refresh Check Button */}
          <button
            type="button"
            onClick={onRefresh}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              marginTop: '0.5rem'
            }}
          >
            <RefreshCw size={13} />
            Verificar estado de suscripción de nuevo
          </button>
        </div>

        {errorMsg && (
          <div style={{
            marginTop: '1rem',
            padding: '0.5rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '4px',
            color: '#ef4444',
            fontSize: '0.75rem'
          }}>
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}

