import React, { useState, useEffect } from 'react';
import { X, Printer, Banknote, QrCode, CreditCard, Clock, Coffee, FileText, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDuration } from '../utils/formatters';
import { api } from '../services/api';

export default function ShiftReportModal({ isOpen, onClose }) {
  const [report, setReport] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadReport();
    }
  }, [isOpen]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.getShiftReport();
      if (res.success) setReport(res.data);
    } catch (e) {
      console.error('Error cargando reporte de turno:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (sessionId) => {
    try {
      const res = await api.getInvoiceDetails(sessionId);
      if (res.success) {
        setSelectedInvoice(res.data);
      }
    } catch (e) {
      alert('Error cargando factura: ' + e.message);
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
        background: 'rgba(5, 8, 14, 0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1500,
        padding: '1.25rem',
        cursor: 'pointer'
      }}
    >
      <div 
        className="glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Cuadre de Caja & Arqueo de Turno
              </h2>
              <span style={{
                background: 'rgba(0, 230, 118, 0.15)',
                color: 'var(--color-brand)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}>
                Corte de Turno
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
              Fecha: {report ? report.date : new Date().toLocaleDateString('es-CO')} • Cierre y conciliación de dinero
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-muted)',
              borderRadius: '50%',
              width: '36px',
              height: '36px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* Top Payment Method Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {/* Grand Total */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.15), rgba(19, 28, 46, 0.8))',
              border: '1px solid var(--color-brand)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand)', textTransform: 'uppercase' }}>
                TOTAL RECAUDADO
              </div>
              <div className="mono" style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                {formatCurrency(report ? report.grandTotal : 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {report ? report.sessionCount : 0} cuentas cobradas
              </div>
            </div>

            {/* Cash in Drawer */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-gold)', fontSize: '0.75rem', fontWeight: 700 }}>
                <Banknote size={15} />
                EFECTIVO EN CAJÓN
              </div>
              <div className="mono" style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                {formatCurrency(report ? report.totalCash : 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Contar billetes y monedas
              </div>
            </div>

            {/* Transfers & QR */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-blue)', fontSize: '0.75rem', fontWeight: 700 }}>
                <QrCode size={15} />
                TRANSFERENCIAS / QR
              </div>
              <div className="mono" style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                {formatCurrency(report ? report.totalTransfer : 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Nequi, Daviplata, Bancolombia
              </div>
            </div>

            {/* Cards / POS */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-purple)', fontSize: '0.75rem', fontWeight: 700 }}>
                <CreditCard size={15} />
                TARJETAS / DATÁFONO
              </div>
              <div className="mono" style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                {formatCurrency(report ? report.totalCard : 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Comprobantes de terminal
              </div>
            </div>
          </div>

          {/* Subtotals breakdown: Time vs Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Clock size={20} color="var(--color-brand)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>INGRESOS POR MESAS (TIEMPO)</div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                  {formatCurrency(report ? report.totalTimeRevenue : 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {report ? Math.round(report.totalMinutes / 60) : 0}h {report ? report.totalMinutes % 60 : 0}m jugados
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Coffee size={20} color="var(--color-gold)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>INGRESOS POR BARRA & SNACKS</div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                  {formatCurrency(report ? report.totalConsumptionRevenue : 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Bebidas y productos facturados
                </div>
              </div>
            </div>
          </div>

          {/* Table of Invoices */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Historial de Cuentas Liquidadas Hoy
              </h3>
              <button
                onClick={() => window.print()}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  gap: '0.4rem'
                }}
              >
                <Printer size={15} />
                Imprimir Resumen de Turno
              </button>
            </div>

            {!report || report.sessions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Aún no hay cuentas liquidadas en este turno.
              </div>
            ) : (
              <div style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}># Factura</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Mesa</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Hora Cierre</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Tiempo</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Consumo Barra</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Método</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Total</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.sessions.map((s) => (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          background: 'rgba(10, 14, 22, 0.3)'
                        }}
                      >
                        <td className="mono" style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-brand)' }}>
                          #BP-{s.id}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#fff' }}>
                          Mesa {s.table_number}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          {s.end_time ? new Date(s.end_time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="mono" style={{ padding: '0.75rem 1rem' }}>
                          {s.total_time_minutes} min ({formatCurrency(s.time_cost)})
                        </td>
                        <td className="mono" style={{ padding: '0.75rem 1rem', color: 'var(--color-gold)' }}>
                          {formatCurrency(s.consumption_cost)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {s.payment_method || 'Efectivo'}
                          </span>
                        </td>
                        <td className="mono" style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#fff' }}>
                          {formatCurrency(s.total_amount)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handleViewInvoice(s.id)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-subtle)',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              gap: '0.3rem'
                            }}
                          >
                            <FileText size={13} />
                            Ver Ticket
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Selected Invoice Preview Modal */}
        {selectedInvoice && (
          <div 
            onClick={() => setSelectedInvoice(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '1rem',
              cursor: 'pointer'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                color: '#000',
                fontFamily: 'monospace',
                padding: '1.5rem',
                borderRadius: 'var(--radius-sm)',
                width: '100%',
                maxWidth: '360px',
                fontSize: '0.8rem',
                position: 'relative',
                cursor: 'default'
              }}
            >
              <button
                onClick={() => setSelectedInvoice(null)}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  background: '#eee',
                  color: '#333',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px'
                }}
              >
                <X size={14} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 900, fontSize: '1rem' }}>BILLARPULSE CLUB</div>
                <div>REIMPRESIÓN DE FACTURA</div>
                <div>#BP-{selectedInvoice.session.id}</div>
                <div>--------------------------------</div>
                <div>MESA: {selectedInvoice.session.table_number} ({selectedInvoice.session.table_name})</div>
                <div>HORA: {new Date(selectedInvoice.session.end_time).toLocaleTimeString('es-CO')}</div>
                <div>--------------------------------</div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>TIEMPO ({selectedInvoice.session.total_time_minutes} min)</span>
                  <span>{formatCurrency(selectedInvoice.session.time_cost)}</span>
                </div>
                {selectedInvoice.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{it.quantity}x {it.product_name}</span>
                    <span>{formatCurrency(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div>--------------------------------</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
                <span>TOTAL PAGADO:</span>
                <span>{formatCurrency(selectedInvoice.session.total_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>MÉTODO:</span>
                <span>{selectedInvoice.session.payment_method}</span>
              </div>
              <div>--------------------------------</div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    flex: 1,
                    background: '#090d16',
                    color: '#fff',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    gap: '0.35rem'
                  }}
                >
                  <Printer size={14} />
                  Imprimir
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  style={{
                    background: '#ddd',
                    color: '#333',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
