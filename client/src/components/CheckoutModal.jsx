import React, { useState, useEffect } from 'react';
import { X, Check, Printer, Clock, CreditCard, Banknote, QrCode, Gift, Users, User, Split, FileText, Coffee } from 'lucide-react';
import { formatCurrency, formatSessionDuration, calculateSessionLiveCost } from '../utils/formatters';
import { sounds } from '../utils/audio';
import { api } from '../services/api';

export default function CheckoutModal({ table, isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'split'
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [orderDetails, setOrderDetails] = useState([]);
  const [breakdown, setBreakdown] = useState({ byTarget: {}, targets: [], total: 0 });
  const [tableSplitMode, setTableSplitMode] = useState('50_50'); // '50_50' | 'p1_all' | 'p2_all'
  const [loading, setLoading] = useState(false);
  const [ticketPrinted, setTicketPrinted] = useState(false);
  const [applyGrace, setApplyGrace] = useState(false);
  const [businessSettings, setBusinessSettings] = useState({});

  const p1Name = (table && table.score && table.score.player1_name) || 'Jugador 1';
  const p2Name = (table && table.score && table.score.player2_name) || 'Jugador 2';

  useEffect(() => {
    if (isOpen && table && table.current_session) {
      setTicketPrinted(false);
      setApplyGrace(false);
      setActiveTab('summary');
      setTableSplitMode('50_50');

      // Fetch business settings
      api.getSettings().then(res => {
        if (res.success) setBusinessSettings(res.data);
      });

      // Fetch table details for orders
      api.getTableDetails(table.id).then(res => {
        if (res.success) {
          setOrderDetails(res.data.orders || []);
        }
      });

      // Fetch grouped breakdown
      api.getSessionBreakdown(table.current_session.id).then(res => {
        if (res.success && res.data) {
          setBreakdown(res.data);
        }
      });
    }
  }, [isOpen, table]);

  if (!isOpen || !table || !table.current_session) return null;

  const session = table.current_session;
  const timeElapsedStr = formatSessionDuration(session);
  const calculatedTimeCost = calculateSessionLiveCost(session, table.hourly_rate);
  const liveTimeCost = applyGrace ? 0 : calculatedTimeCost;
  const barConsumption = session.total_consumption || 0;
  const grandTotal = liveTimeCost + barConsumption;

  // Breakdown calculations
  const mesaGeneralItems = breakdown.byTarget['Mesa']?.items || [];
  const mesaGeneralTotal = breakdown.byTarget['Mesa']?.total || 0;
  // Shared common base = Table Time + General Mesa items
  const sharedCommonTotal = liveTimeCost + mesaGeneralTotal;

  // Player 1 consumptions
  const p1Items = breakdown.byTarget[p1Name]?.items || [];
  const p1ConsumptionTotal = breakdown.byTarget[p1Name]?.total || 0;

  // Player 2 consumptions
  const p2Items = breakdown.byTarget[p2Name]?.items || [];
  const p2ConsumptionTotal = breakdown.byTarget[p2Name]?.total || 0;

  // Other targets (if custom player name was entered)
  const otherTargets = (breakdown.targets || []).filter(
    t => t !== 'Mesa' && t !== p1Name && t !== p2Name
  );

  // Calculate table time & mesa split shares
  let p1SharedShare = 0;
  let p2SharedShare = 0;
  if (tableSplitMode === '50_50') {
    p1SharedShare = Math.round(sharedCommonTotal / 2);
    p2SharedShare = sharedCommonTotal - p1SharedShare;
  } else if (tableSplitMode === 'p1_all') {
    p1SharedShare = sharedCommonTotal;
    p2SharedShare = 0;
  } else if (tableSplitMode === 'p2_all') {
    p1SharedShare = 0;
    p2SharedShare = sharedCommonTotal;
  }

  const p1GrandTotal = p1ConsumptionTotal + p1SharedShare;
  const p2GrandTotal = p2ConsumptionTotal + p2SharedShare;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      sounds.playCashRegister();
      await api.endSession(session.id, paymentMethod, applyGrace);
      onSuccess();
      onClose();
    } catch (e) {
      alert(e.message || 'Error al liquidar la mesa');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTicket = () => {
    setTicketPrinted(true);
    window.print();
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
          maxWidth: '850px',
          height: '84vh',
          minHeight: '600px',
          maxHeight: '850px',
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Cierre de Cuenta - Mesa {table.table_number}
              </h2>
              <span style={{
                background: 'rgba(244, 63, 94, 0.15)',
                color: 'var(--color-alert)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}>
                Liquidación
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
              {table.type === 'barra' ? 'Cuenta de Barra / Salón • Sin cobro de tiempo ($0/hr)' : `${table.name} • Tarifa ${formatCurrency(table.hourly_rate)}/hr • Partida: ${p1Name} vs ${p2Name}`}
            </p>
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

        {/* View Mode Tabs: Summary vs Split Bill */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.4)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 1.5rem'
        }}>
          <button
            onClick={() => setActiveTab('summary')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'summary' ? 'var(--color-brand)' : 'transparent'}`,
              color: activeTab === 'summary' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer'
            }}
          >
            <FileText size={16} color={activeTab === 'summary' ? 'var(--color-brand)' : 'currentColor'} />
            Cuenta Total ({formatCurrency(grandTotal)})
          </button>

          <button
            onClick={() => setActiveTab('split')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'split' ? 'var(--color-brand)' : 'transparent'}`,
              color: activeTab === 'split' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer'
            }}
          >
            <Split size={16} color={activeTab === 'split' ? 'var(--color-brand)' : 'currentColor'} />
            División por Jugador (Split Bill)
          </button>
        </div>

        {/* Content: Summary & Simulated Thermal Receipt */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr',
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Left Column */}
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>
            {activeTab === 'summary' ? (
              /* TAB 1: GENERAL SUMMARY */
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.85rem', textTransform: 'uppercase' }}>
                  Resumen de Conceptos
                </h3>

                {/* Time component or Bar Tab notice */}
                {table.type === 'barra' ? (
                  <div style={{
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    marginBottom: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <Coffee size={22} color="var(--color-gold)" />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                        Cuenta de Barra / Salón
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gold)' }}>
                        Cliente sentado • Tarifa de tiempo: $0 COP
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      marginBottom: '0.65rem',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={16} color="var(--color-brand)" />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Tiempo de Juego</span>
                        </div>
                        <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                          {timeElapsedStr}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>Tarifa {formatCurrency(table.hourly_rate)}/hr</span>
                        <span className="mono" style={{ fontWeight: 700, color: applyGrace ? 'var(--color-brand)' : '#fff' }}>
                          {applyGrace ? 'GRATIS ($0)' : formatCurrency(liveTimeCost)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setApplyGrace(!applyGrace)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: applyGrace ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${applyGrace ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                        color: applyGrace ? 'var(--color-brand)' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Gift size={14} />
                        <span>Cortesía / Tiempo de Gracia ($0 mesa)</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                        {applyGrace ? '✓ APLICADO' : '+ APLICAR'}
                      </span>
                    </button>
                  </>
                )}

                {/* Bar consumption component */}
                <div style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Consumos de Barra</span>
                    <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                      {formatCurrency(barConsumption)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {orderDetails.length} producto(s) en total cargados a la cuenta
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: SPLIT BILL (DIVISIÓN POR JUGADOR) */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>
                    División Sugerida por Persona
                  </h3>
                </div>

                {/* Table split selector buttons */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 700 }}>
                    ¿CÓMO DIVIDIR EL TIEMPO Y MESA COMÚN ({formatCurrency(sharedCommonTotal)})?
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                    {[
                      { id: '50_50', label: '50% / 50% Mitad' },
                      { id: 'p1_all', label: `${p1Name} Paga Mesa` },
                      { id: 'p2_all', label: `${p2Name} Paga Mesa` }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setTableSplitMode(opt.id)}
                        style={{
                          padding: '0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: tableSplitMode === opt.id ? 'var(--color-brand)' : 'rgba(255, 255, 255, 0.05)',
                          color: tableSplitMode === opt.id ? '#090d16' : 'var(--text-secondary)',
                          border: `1px solid ${tableSplitMode === opt.id ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {/* PLAYER 1 CARD */}
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={15} color="var(--color-blue)" />
                        <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>{p1Name}</span>
                      </div>
                      <span className="mono" style={{ fontWeight: 900, color: 'var(--color-blue)', fontSize: '1.05rem' }}>
                        {formatCurrency(p1GrandTotal)}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      <div>• Consumos propios: <strong>{formatCurrency(p1ConsumptionTotal)}</strong> ({p1Items.length} items)</div>
                      <div>• Cuota de Mesa/Tiempo: <strong>{formatCurrency(p1SharedShare)}</strong></div>
                    </div>
                  </div>

                  {/* PLAYER 2 CARD */}
                  <div style={{
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={15} color="var(--color-gold)" />
                        <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>{p2Name}</span>
                      </div>
                      <span className="mono" style={{ fontWeight: 900, color: 'var(--color-gold)', fontSize: '1.05rem' }}>
                        {formatCurrency(p2GrandTotal)}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      <div>• Consumos propios: <strong>{formatCurrency(p2ConsumptionTotal)}</strong> ({p2Items.length} items)</div>
                      <div>• Cuota de Mesa/Tiempo: <strong>{formatCurrency(p2SharedShare)}</strong></div>
                    </div>
                  </div>

                  {/* OTHER CONSUMERS IF ANY */}
                  {otherTargets.map(targetName => {
                    const targetTotal = breakdown.byTarget[targetName]?.total || 0;
                    const itemsCount = breakdown.byTarget[targetName]?.items?.length || 0;
                    return (
                      <div key={targetName} style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.65rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>{targetName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{itemsCount} consumo(s) individuales</div>
                        </div>
                        <span className="mono" style={{ fontWeight: 800, color: '#fff' }}>
                          {formatCurrency(targetTotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom: Payment Method and Final Action */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', marginTop: '0.85rem' }}>
              {/* Payment Methods */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  MÉTODO DE PAGO
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  {[
                    { id: 'Efectivo', icon: Banknote },
                    { id: 'Transferencia/QR', icon: QrCode },
                    { id: 'Tarjeta', icon: CreditCard }
                  ].map(m => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        style={{
                          padding: '0.5rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'rgba(0, 230, 118, 0.15)' : 'var(--bg-surface)',
                          border: `1px solid ${isSelected ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                          color: isSelected ? 'var(--color-brand)' : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexDirection: 'column',
                          gap: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Icon size={16} />
                        {m.id}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grand total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL A PAGAR:</span>
                <span className="mono" style={{ fontSize: '1.65rem', fontWeight: 900, color: '#fff' }}>
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handlePrintTicket}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={16} />
                  Ticket
                </button>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'var(--color-brand)',
                    color: '#090d16',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    gap: '0.5rem',
                    boxShadow: 'var(--shadow-neon-green)',
                    cursor: 'pointer'
                  }}
                >
                  <Check size={18} />
                  {loading ? 'Liquidando...' : 'Confirmar Cobro y Liberar'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Thermal Receipt Preview */}
          <div style={{
            background: '#ffffff',
            color: '#111827',
            padding: '1.25rem',
            fontFamily: 'monospace',
            fontSize: '0.76rem',
            lineHeight: 1.35,
            overflowY: 'auto',
            borderLeft: '1px dashed var(--border-subtle)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '1px' }}>
                {businessSettings.business_name || 'BILLARPULSE CLUB'}
              </div>
              <div style={{ fontSize: '0.7rem' }}>NIT {businessSettings.business_nit || '901.442.118-0'}</div>
              <div style={{ fontSize: '0.7rem' }}>{businessSettings.business_address || 'Salón & Bar de Billar'}</div>
              {businessSettings.business_phone && (
                <div style={{ fontSize: '0.7rem' }}>TEL: {businessSettings.business_phone}</div>
              )}
              <div>--------------------------------</div>
              <div style={{ fontWeight: 700 }}>FACTURA DE VENTA #BP-{session.id}</div>
              <div style={{ fontSize: '0.68rem' }}>FECHA: {new Date().toLocaleDateString('es-CO')} {new Date().toLocaleTimeString('es-CO')}</div>
              <div style={{ fontWeight: 700 }}>MESA: {table.table_number} ({table.name})</div>
              <div>--------------------------------</div>
            </div>

            {/* Time Concept */}
            <div style={{ marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderBottom: '1px dashed #999', paddingBottom: '2px' }}>
                <span>CONCEPTO</span>
                <span>TOTAL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <div>
                  TIEMPO DE MESA<br />
                  <span style={{ fontSize: '0.68rem', color: '#555' }}>
                    ({timeElapsedStr} @ {formatCurrency(table.hourly_rate)}/h)
                  </span>
                </div>
                <span>{applyGrace ? '$ 0 (Cortesía)' : formatCurrency(liveTimeCost)}</span>
              </div>
            </div>

            {/* General Mesa items if any */}
            {mesaGeneralItems.length > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700, color: '#333', fontSize: '0.72rem' }}>[MESA - GENERAL]</div>
                {mesaGeneralItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <div>{item.quantity}x {item.product_name}</div>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Player 1 items if any */}
            {p1Items.length > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.72rem' }}>[{p1Name.toUpperCase()}]</div>
                {p1Items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <div>{item.quantity}x {item.product_name}</div>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Player 2 items if any */}
            {p2Items.length > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700, color: '#b45309', fontSize: '0.72rem' }}>[{p2Name.toUpperCase()}]</div>
                {p2Items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <div>{item.quantity}x {item.product_name}</div>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Other players items */}
            {otherTargets.map(t => {
              const items = breakdown.byTarget[t]?.items || [];
              if (items.length === 0) return null;
              return (
                <div key={t} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, color: '#555', fontSize: '0.72rem' }}>[{t.toUpperCase()}]</div>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <div>{item.quantity}x {item.product_name}</div>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Split breakdown summary on ticket */}
            <div>--------------------------------</div>
            <div style={{ fontSize: '0.7rem', margin: '4px 0' }}>
              <div style={{ fontWeight: 700, marginBottom: '2px' }}>SUGERENCIA DIVISIÓN:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• {p1Name}:</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(p1GrandTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• {p2Name}:</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(p2GrandTotal)}</span>
              </div>
            </div>

            <div>--------------------------------</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '0.95rem' }}>
              <span>TOTAL CUENTA:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '2px' }}>
              <span>FORMA DE PAGO:</span>
              <span>{paymentMethod.toUpperCase()}</span>
            </div>
            <div>--------------------------------</div>

            <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.7rem' }}>
              {businessSettings.ticket_footer || '¡GRACIAS POR SU VISITA! VUELVA PRONTO.'}<br />
              BillarPulse LAN POS System
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
