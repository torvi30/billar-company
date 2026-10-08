import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Wifi, 
  Smartphone, 
  Tablet, 
  Copy, 
  Check, 
  ExternalLink, 
  HelpCircle,
  Laptop,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

export default function ConnectDevicesModal({ isOpen, onClose, tables = [] }) {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState('table_1'); // 'table_X' | 'kiosk' | 'caja'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load network info on open
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getNetworkInfo()
        .then(res => {
          if (res.success) {
            setNetworkInfo(res.data);
          }
        })
        .catch(err => console.error('Error cargando red:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Determine current target URL
  const currentUrl = (() => {
    const host = networkInfo?.localIp || window.location.hostname || 'localhost';
    const port = networkInfo?.port || window.location.port || '3001';
    const base = `http://${host}:${port}`;

    if (selectedTarget.startsWith('table_')) {
      const tId = selectedTarget.replace('table_', '');
      return `${base}/?table=${tId}&view=kiosk`;
    }
    if (selectedTarget === 'kiosk') {
      return `${base}/?view=kiosk`;
    }
    return `${base}/?view=caja`;
  })();

  // Generate QR code whenever URL changes
  useEffect(() => {
    if (!currentUrl) return;
    QRCode.toDataURL(currentUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#090d16',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generando QR:', err));
  }, [currentUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    sounds.playScoreBeep(true);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const poolTables = tables.filter(t => t.type !== 'barra');

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
          maxWidth: '920px',
          maxHeight: '92vh',
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
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'radial-gradient(circle at 30% 30%, #00e676, #008744)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#090d16',
              boxShadow: 'var(--shadow-neon-green)'
            }}>
              <QrCode size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                  Conectar Tablets & Celulares
                </h2>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(0, 230, 118, 0.15)',
                  color: 'var(--color-brand)',
                  border: '1px solid rgba(0, 230, 118, 0.3)'
                }}>
                  Wi-Fi Local Offline
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Escanea el código QR con cualquier dispositivo conectado al mismo Wi-Fi del salón
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Cerrar (Esc)"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Target Selector */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Selecciona qué pantalla deseas abrir en el dispositivo:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {poolTables.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    sounds.playScoreBeep(true);
                    setSelectedTarget(`table_${t.id}`);
                  }}
                  style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedTarget === `table_${t.id}` ? 'var(--color-brand)' : 'rgba(255, 255, 255, 0.05)',
                    color: selectedTarget === `table_${t.id}` ? '#090d16' : '#fff',
                    border: `1px solid ${selectedTarget === `table_${t.id}` ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Tablet size={15} />
                  Mesa {t.table_number}
                </button>
              ))}

              <button
                onClick={() => {
                  sounds.playScoreBeep(true);
                  setSelectedTarget('kiosk');
                }}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedTarget === 'kiosk' ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.05)',
                  color: selectedTarget === 'kiosk' ? '#090d16' : '#fff',
                  border: `1px solid ${selectedTarget === 'kiosk' ? 'var(--color-gold)' : 'var(--border-subtle)'}`,
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <Smartphone size={15} />
                Comandero Móvil (Mesero)
              </button>

              <button
                onClick={() => {
                  sounds.playScoreBeep(true);
                  setSelectedTarget('caja');
                }}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedTarget === 'caja' ? 'var(--color-blue)' : 'rgba(255, 255, 255, 0.05)',
                  color: selectedTarget === 'caja' ? '#fff' : '#fff',
                  border: `1px solid ${selectedTarget === 'caja' ? 'var(--color-blue)' : 'var(--border-subtle)'}`,
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <Laptop size={15} />
                Caja Secundaria
              </button>
            </div>
          </div>

          {/* Main 2-Column Display: QR Code + Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '1.5rem', alignItems: 'center' }}>
            
            {/* QR Card */}
            <div className="glass-panel" style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)'
            }}>
              {qrDataUrl ? (
                <div style={{
                  padding: '12px',
                  background: '#fff',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  display: 'inline-block'
                }}>
                  <img 
                    src={qrDataUrl} 
                    alt="Código QR de Conexión" 
                    style={{ width: '220px', height: '220px', display: 'block' }}
                  />
                </div>
              ) : (
                <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Generando QR...
                </div>
              )}

              <div style={{ marginTop: '1rem', width: '100%' }}>
                <div style={{
                  background: 'var(--bg-surface)',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <span className="mono" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff', fontWeight: 600 }}>
                    {currentUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    style={{
                      background: copied ? 'var(--color-brand)' : 'rgba(255, 255, 255, 0.1)',
                      color: copied ? '#090d16' : '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick 3-Step Guide */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                background: 'rgba(0, 230, 118, 0.08)',
                border: '1px solid rgba(0, 230, 118, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-brand)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <Wifi size={18} />
                  <span>1. Conecta al Wi-Fi del Local</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Asegúrate de que la tablet o celular esté conectado a la misma red Wi-Fi donde está este computador. No se necesita internet.
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <Smartphone size={18} />
                  <span>2. Escanea con la Cámara</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Abre la cámara nativa del celular o tablet Android / iPad y apunta al código QR. Toca la notificación emergente para abrir el navegador.
                </div>
              </div>

              <div style={{
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-gold)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <Tablet size={18} />
                  <span>3. Modo Pantalla Completa (App)</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  En Chrome o Safari del dispositivo, toca los tres puntos y selecciona <strong>"Agregar a la pantalla principal"</strong> para que quede como una App fija sin barras de navegación.
                </div>
              </div>

              {/* Network diagnostic bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.03)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-brand)' }} />
                  <span>IP Local Servidor: <strong style={{ color: '#fff' }}>{networkInfo?.localIp || 'Detectando...'}</strong></span>
                </div>
                <div>
                  <span>Puerto: <strong style={{ color: '#fff' }}>{networkInfo?.port || 3001}</strong></span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
