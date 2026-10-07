import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Printer, 
  Clock, 
  Coffee, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Receipt, 
  FileText, 
  CheckCircle, 
  Calendar, 
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, formatDuration } from '../utils/formatters';
import { sounds } from '../utils/audio';
import { api } from '../services/api';

export default function HistoryModal({ isOpen, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [businessSettings, setBusinessSettings] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      api.getSettings().then(res => {
        if (res.success) setBusinessSettings(res.data);
      });
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getClosedSessions(100);
      if (res.success) {
        setSessions(res.data || []);
      }
    } catch (e) {
      console.error('Error loading session history:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInvoice = async (sessionId) => {
    sounds.playScoreBeep(true);
    setLoadingInvoice(true);
    try {
      const res = await api.getInvoiceDetails(sessionId);
      if (res.success && res.data) {
        setSelectedInvoice(res.data);
      }
    } catch (e) {
      alert('Error cargando factura: ' + e.message);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Filter sessions
  const filteredSessions = sessions.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchTable = (s.table_name || '').toLowerCase().includes(q) || String(s.table_number).includes(q);
    const matchMethod = (s.payment_method || '').toLowerCase().includes(q);
    const matchId = String(s.id).includes(q);
    return matchTable || matchMethod || matchId;
  });

  // Calculate totals from filtered list
  const totalBilled = filteredSessions.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const totalTimeBilled = filteredSessions.reduce((acc, s) => acc + (s.time_cost || 0), 0);
  const totalBarBilled = filteredSessions.reduce((acc, s) => acc + (s.consumption_cost || 0), 0);

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
          maxWidth: '1050px',
          height: '84vh',
          minHeight: '620px',
          maxHeight: '880px',
          display: 'flex',
          flexDirection: 'column',
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
              background: 'rgba(0, 230, 118, 0.15)',
              color: 'var(--color-brand)',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <Receipt size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Historial de Cuentas y Facturas
                </h2>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {filteredSessions.length} facturas
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                Auditoría completa de partidas liquidadas y reimpresión de tickets térmicos.
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

        {/* Filter and Metrics Bar */}
        <div style={{
          padding: '1rem 1.75rem',
          background: 'rgba(0, 0, 0, 0.35)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por mesa (ej. Mesa 1), método de pago o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Tiempo Total</div>
              <div className="mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-brand)' }}>
                {formatCurrency(totalTimeBilled)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Consumo Barra</div>
              <div className="mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-gold)' }}>
                {formatCurrency(totalBarBilled)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Facturado</div>
              <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
                {formatCurrency(totalBilled)}
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Table List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.75rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Cargando historial de facturación...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No se encontraron registros de facturas cerradas con el criterio de búsqueda.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredSessions.map(session => {
                const method = (session.payment_method || 'Efectivo').toLowerCase();
                const isCash = method.includes('efectivo');
                const isQR = method.includes('transferencia') || method.includes('qr') || method.includes('nequi');
                const methodColor = isCash ? 'var(--color-brand)' : isQR ? 'var(--color-purple)' : 'var(--color-blue)';

                const endDate = new Date(session.end_time || session.start_time);
                const dateStr = endDate.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
                const timeStr = endDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={session.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      transition: 'border-color 0.15s, transform 0.1s'
                    }}
                  >
                    {/* Invoice ID & Table */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '180px' }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.4rem 0.65rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>FACTURA</div>
                        <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                          #{session.id}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                          Mesa {session.table_number}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {session.table_name}
                        </div>
                      </div>
                    </div>

                    {/* Date and Time */}
                    <div style={{ minWidth: '150px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        <span>{dateStr}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {timeStr}
                      </div>
                    </div>

                    {/* Breakdown Time vs Consumption */}
                    <div style={{ display: 'flex', gap: '1.25rem', minWidth: '220px' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tiempo ({session.total_time_minutes}m)</div>
                        <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand)' }}>
                          {formatCurrency(session.time_cost)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Barra</div>
                        <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                          {formatCurrency(session.consumption_cost)}
                        </div>
                      </div>
                    </div>

                    {/* Payment Method Badge */}
                    <div style={{ minWidth: '130px' }}>
                      <span style={{
                        background: `${methodColor}15`,
                        color: methodColor,
                        border: `1px solid ${methodColor}40`,
                        borderRadius: 'var(--radius-full)',
                        padding: '3px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        {isCash ? <Banknote size={12} /> : isQR ? <QrCode size={12} /> : <CreditCard size={12} />}
                        {session.payment_method || 'Efectivo'}
                      </span>
                    </div>

                    {/* Total and Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', textAlign: 'right', minWidth: '100px' }}>
                        {formatCurrency(session.total_amount)}
                      </div>

                      <button
                        onClick={() => handleOpenInvoice(session.id)}
                        title="Ver y reimprimir factura"
                        style={{
                          padding: '0.55rem 0.85rem',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Printer size={14} />
                        Ticket
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- INVOICE REPRINT MODAL PREVIEW --- */}
      {selectedInvoice && (
        <div
          onClick={() => setSelectedInvoice(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              color: '#111827',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '380px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              lineHeight: 1.4,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
              cursor: 'default'
            }}
          >
            {/* Thermal Receipt Content */}
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '1px' }}>
                {businessSettings.business_name || 'BILLARPULSE CLUB'}
              </div>
              <div style={{ fontSize: '0.72rem' }}>NIT {businessSettings.business_nit || '901.442.118-0'}</div>
              <div style={{ fontSize: '0.72rem' }}>{businessSettings.business_address || 'Salón & Bar de Billar'}</div>
              <div style={{ fontSize: '0.72rem' }}>TEL: {businessSettings.business_phone || '300 123 4567'}</div>
              <div>--------------------------------</div>
              <div style={{ fontWeight: 800 }}>COPIA DE FACTURA #{selectedInvoice.session.id}</div>
              <div style={{ fontSize: '0.72rem' }}>
                FECHA: {new Date(selectedInvoice.session.end_time || selectedInvoice.session.start_time).toLocaleString('es-CO')}
              </div>
              <div style={{ fontWeight: 700 }}>
                MESA: {selectedInvoice.session.table_number} ({selectedInvoice.session.table_name})
              </div>
              <div>--------------------------------</div>
            </div>

            {/* Time Concept */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderBottom: '1px dashed #999', paddingBottom: '2px' }}>
                <span>CONCEPTO</span>
                <span>TOTAL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <div>
                  TIEMPO DE JUEGO<br />
                  <span style={{ fontSize: '0.72rem', color: '#555' }}>
                    ({selectedInvoice.session.total_time_minutes} min @ {formatCurrency(selectedInvoice.session.rate_applied)}/h)
                  </span>
                </div>
                <span>{formatCurrency(selectedInvoice.session.time_cost)}</span>
              </div>
            </div>

            {/* Products list */}
            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 700, color: '#333', fontSize: '0.75rem' }}>CONSUMOS:</div>
                {selectedInvoice.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                    <div>
                      {item.quantity}x {item.product_name}<br />
                      <span style={{ fontSize: '0.7rem', color: '#666' }}>
                        @ {formatCurrency(item.unit_price)} {item.assigned_to && item.assigned_to !== 'Mesa' ? `[${item.assigned_to}]` : ''}
                      </span>
                    </div>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}

            <div>--------------------------------</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.05rem' }}>
              <span>TOTAL FACTURA:</span>
              <span>{formatCurrency(selectedInvoice.session.total_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '2px' }}>
              <span>FORMA DE PAGO:</span>
              <span>{(selectedInvoice.session.payment_method || 'EFECTIVO').toUpperCase()}</span>
            </div>
            <div>--------------------------------</div>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.72rem' }}>
              {businessSettings.ticket_footer || '¡GRACIAS POR SU VISITA! VUELVA PRONTO.'}<br />
              BillarPulse LAN POS System
            </div>

            {/* Actions: Print and Close */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button
                onClick={handlePrint}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#090d16',
                  color: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <Printer size={16} />
                Reimprimir
              </button>

              <button
                onClick={() => setSelectedInvoice(null)}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#e5e7eb',
                  color: '#1f2937',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
