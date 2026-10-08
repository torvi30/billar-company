import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Banknote, 
  QrCode, 
  CreditCard, 
  Clock, 
  Coffee, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  PlusCircle, 
  MinusCircle, 
  History, 
  Lock, 
  TrendingDown, 
  TrendingUp,
  DollarSign,
  Calendar,
  UserCheck
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

export default function ShiftReportModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'history'
  const [report, setReport] = useState(null);
  const [historyShifts, setHistoryShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showZReceiptPreview, setShowZReceiptPreview] = useState(false);

  // Cash reconciliation state
  const [actualCashInput, setActualCashInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Initial cash edit modal
  const [showEditInitialCash, setShowEditInitialCash] = useState(false);
  const [newInitialCash, setNewInitialCash] = useState('');

  // Cash movement modal
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState('out'); // 'in' | 'out'
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  // Close shift confirmation
  const [confirmCloseModal, setConfirmCloseModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentReport();
      loadShiftHistory();
    }
  }, [isOpen]);

  const loadCurrentReport = async () => {
    setLoading(true);
    try {
      const res = await api.getShiftReport();
      if (res.success && res.data) {
        setReport(res.data);
        if (res.data.shift && res.data.shift.actual_cash != null) {
          setActualCashInput(String(res.data.shift.actual_cash));
        }
      }
    } catch (e) {
      console.error('Error cargando reporte de turno:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadShiftHistory = async () => {
    try {
      const res = await api.getClosedShifts(15);
      if (res.success) {
        setHistoryShifts(res.data || []);
      }
    } catch (e) {
      console.error('Error cargando historial de turnos:', e);
    }
  };

  const handleUpdateInitialCash = async (e) => {
    e.preventDefault();
    if (!report || !report.shift) return;
    try {
      sounds.playScoreBeep(true);
      await api.updateShiftInitialCash(report.shift.id, Number(newInitialCash));
      setShowEditInitialCash(false);
      loadCurrentReport();
    } catch (err) {
      alert('Error actualizando base de caja: ' + err.message);
    }
  };

  const handleAddMovement = async (e) => {
    e.preventDefault();
    if (!movementAmount || !movementReason) return alert('Por favor llena el monto y motivo del movimiento');

    try {
      sounds.playCashRegister();
      await api.addCashMovement({
        shift_id: report?.shift?.id,
        type: movementType,
        amount: Number(movementAmount),
        reason: movementReason
      });
      setShowMovementModal(false);
      setMovementAmount('');
      setMovementReason('');
      loadCurrentReport();
    } catch (err) {
      alert('Error registrando movimiento: ' + err.message);
    }
  };

  const handleCloseShift = async () => {
    if (!report || !report.shift) return;
    const actualCash = Number(actualCashInput || 0);

    try {
      sounds.playCashRegister();
      await api.closeShift({
        shift_id: report.shift.id,
        actual_cash: actualCash,
        notes: notesInput
      });
      setConfirmCloseModal(false);
      alert('✅ Turno cerrado exitosamente. El reporte Z ha sido archivado y se inició un nuevo turno.');
      loadCurrentReport();
      loadShiftHistory();
    } catch (err) {
      alert('Error cerrando turno: ' + err.message);
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

  // Real-time cash reconciliation calculations
  const expectedCash = report ? report.expectedCash : 0;
  const countedCash = actualCashInput !== '' ? Number(actualCashInput) : null;
  const cashDifference = countedCash !== null ? countedCash - expectedCash : 0;

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
          maxWidth: '1120px',
          height: '88vh',
          minHeight: '660px',
          maxHeight: '900px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Cierre de Caja & Cuadre de Turno (Z-Report)
                </h2>
                <span style={{
                  background: 'rgba(0, 230, 118, 0.15)',
                  color: 'var(--color-brand)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(0, 230, 118, 0.3)'
                }}>
                  Turno Activo #{report?.shift ? report.shift.id : '1'}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '3px' }}>
                Iniciado: {report?.shift ? new Date(report.shift.opened_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '--'} • Conciliación de Efectivo, Nequi y Gastos Menores
              </p>
            </div>

            {/* Tabs */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              gap: '4px'
            }}>
              <button
                onClick={() => setActiveTab('current')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeTab === 'current' ? 'var(--color-brand)' : 'transparent',
                  color: activeTab === 'current' ? '#090d16' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <FileText size={15} />
                Turno Actual
              </button>

              <button
                onClick={() => setActiveTab('history')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeTab === 'history' ? 'var(--color-brand)' : 'transparent',
                  color: activeTab === 'history' ? '#090d16' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <History size={15} />
                Historial de Cortes ({historyShifts.length})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {activeTab === 'current' && (
              <button
                onClick={() => setShowZReceiptPreview(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
                title="Generar e imprimir el ticket formal de arqueo para entregar al dueño o archivar"
              >
                <Printer size={15} />
                Imprimir Reporte Z
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-muted)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'current' ? (
          <div style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {/* Top Grid: Total Recaudado, Base Inicial, Gastos Menores, Efectivo Esperado */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {/* Grand Total Sales */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.15), rgba(19, 28, 46, 0.8))',
                border: '1px solid var(--color-brand)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand)', textTransform: 'uppercase' }}>
                  VENTAS TOTALES DEL TURNO
                </div>
                <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                  {formatCurrency(report ? report.grandTotal : 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {report ? report.sessionCount : 0} cuentas liquidadas
                </div>
              </div>

              {/* Initial Base Cash */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }}>
                    <DollarSign size={15} color="var(--color-gold)" />
                    BASE INICIAL DE CAJA
                  </div>
                  <button
                    onClick={() => {
                      setNewInitialCash(String(report?.initialCash || 100000));
                      setShowEditInitialCash(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-gold)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Editar
                  </button>
                </div>
                <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                  {formatCurrency(report ? report.initialCash : 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Efectivo para dar vueltos
                </div>
              </div>

              {/* Cash Movements (Egresos / Gastos de caja menor) */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-alert)', fontSize: '0.75rem', fontWeight: 700 }}>
                    <TrendingDown size={15} />
                    GASTOS / SALIDAS MENORES
                  </div>
                  <button
                    onClick={() => setShowMovementModal(true)}
                    style={{
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      color: 'var(--color-alert)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    + Registrar Gasto
                  </button>
                </div>
                <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 900, color: report?.sumMovementsOut > 0 ? 'var(--color-alert)' : '#fff', marginTop: '4px' }}>
                  -{formatCurrency(report ? report.sumMovementsOut : 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {report?.movements ? report.movements.length : 0} salidas registradas (Hielo, etc.)
                </div>
              </div>

              {/* Theoretical Expected Cash */}
              <div style={{
                background: 'rgba(0, 230, 118, 0.05)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-brand)', fontSize: '0.75rem', fontWeight: 700 }}>
                  <Banknote size={15} />
                  EFECTIVO ESPERADO EN CAJÓN
                </div>
                <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-brand)', marginTop: '4px' }}>
                  {formatCurrency(expectedCash)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Base + Ventas Efectivo - Gastos
                </div>
              </div>
            </div>

            {/* LIVE CASH RECONCILIATION CARD (ARQUEO FÍSICO) */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(20, 26, 38, 0.9), rgba(12, 17, 26, 0.95))',
              border: countedCash !== null && cashDifference === 0 
                ? '2px solid var(--color-brand)' 
                : cashDifference < 0 
                ? '2px solid var(--color-alert)' 
                : cashDifference > 0 
                ? '2px solid var(--color-blue)' 
                : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.2fr 1.6fr',
              gap: '1.5rem',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-gold)', textTransform: 'uppercase' }}>
                  💰 ARQUEO FÍSICO DE CAJA
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Cuenta los billetes y monedas físicos en el cajón y digita el total aquí:
                </div>
              </div>

              {/* Cash Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  EFECTIVO FÍSICO CONTADO ($)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    placeholder="0"
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>
              </div>

              {/* Live Reconciliation Feedback */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: countedCash === null 
                  ? 'rgba(255, 255, 255, 0.03)'
                  : cashDifference === 0 
                  ? 'rgba(0, 230, 118, 0.15)' 
                  : cashDifference < 0 
                  ? 'rgba(244, 63, 94, 0.15)' 
                  : 'rgba(56, 189, 248, 0.15)',
                border: countedCash === null
                  ? '1px dashed var(--border-subtle)'
                  : cashDifference === 0
                  ? '1px solid var(--color-brand)'
                  : cashDifference < 0
                  ? '1px solid var(--color-alert)'
                  : '1px solid var(--color-blue)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                {countedCash === null ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                    Digita el efectivo para ver si la caja cuadra exactamente.
                  </div>
                ) : cashDifference === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle size={28} color="var(--color-brand)" />
                    <div>
                      <div style={{ color: 'var(--color-brand)', fontWeight: 900, fontSize: '1rem' }}>
                        ¡CUADRE PERFECTO!
                      </div>
                      <div style={{ color: '#fff', fontSize: '0.8rem' }}>
                        Diferencia: $ 0 (Todo el dinero coincide al centavo)
                      </div>
                    </div>
                  </div>
                ) : cashDifference < 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertTriangle size={28} color="var(--color-alert)" />
                    <div>
                      <div style={{ color: 'var(--color-alert)', fontWeight: 900, fontSize: '1rem' }}>
                        FALTANTE EN CAJA: {formatCurrency(Math.abs(cashDifference))}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        Hay menos dinero físico en el cajón del que debería haber.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <TrendingUp size={28} color="var(--color-blue)" />
                    <div>
                      <div style={{ color: 'var(--color-blue)', fontWeight: 900, fontSize: '1rem' }}>
                        SOBRANTE EN CAJA: +{formatCurrency(cashDifference)}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        Hay más dinero físico en el cajón de lo registrado.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods & Revenue Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {/* Cash Sales */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-gold)', fontSize: '0.75rem', fontWeight: 700 }}>
                  <Banknote size={15} />
                  VENTAS EN EFECTIVO
                </div>
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                  {formatCurrency(report ? report.totalCash : 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Pagado directamente en mano
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
                  NEQUI / DAVIPLATA / QR
                </div>
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                  {formatCurrency(report ? report.totalTransfer : 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Verificar en comprobante bancario
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
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                  {formatCurrency(report ? report.totalCard : 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Vouchers de datáfono físico
                </div>
              </div>
            </div>

            {/* Subtotals: Time vs Products */}
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>INGRESOS POR TIEMPO DE MESAS</div>
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
                    Cervezas, licores y botellas facturadas
                  </div>
                </div>
              </div>
            </div>

            {/* List of Cash Movements for the shift */}
            {report?.movements && report.movements.length > 0 && (
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                  Movimientos de Caja Menor Registrados ({report.movements.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {report.movements.map((m) => (
                    <div key={m.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {m.type === 'out' ? (
                          <span style={{ color: 'var(--color-alert)', fontWeight: 800 }}>[GASTO]</span>
                        ) : (
                          <span style={{ color: 'var(--color-brand)', fontWeight: 800 }}>[INGRESO]</span>
                        )}
                        <span style={{ color: '#fff' }}>{m.reason}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          • {new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="mono" style={{
                        fontWeight: 800,
                        color: m.type === 'out' ? 'var(--color-alert)' : 'var(--color-brand)'
                      }}>
                        {m.type === 'out' ? '-' : '+'}{formatCurrency(m.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Table of Invoices */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
                Historial de Cuentas Cobradas en este Turno ({report?.sessions ? report.sessions.length : 0})
              </h3>

              {!report || report.sessions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Aún no hay cuentas cobradas en este turno.
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
                            {s.table_name || `Mesa ${s.table_number}`}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                            {new Date(s.end_time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                            {s.total_time_minutes} min
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
                              fontWeight: 700,
                              color: '#fff'
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
                                padding: '0.35rem 0.75rem',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Ver Factura
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Official Shift Closure Button */}
            <div style={{
              marginTop: '1rem',
              padding: '1.25rem',
              background: 'rgba(244, 63, 94, 0.06)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                  ¿Finalizar Jornada / Entregar Turno a la Siguiente Cajera?
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Al cerrar turno se congelará el cuadre con el efectivo contado, se generará el Corte Z definitivo y se iniciará un nuevo turno limpio.
                </div>
              </div>

              <button
                onClick={() => setConfirmCloseModal(true)}
                style={{
                  background: 'var(--color-alert)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(244, 63, 94, 0.3)'
                }}
              >
                <Lock size={16} />
                Cerrar Turno Oficialmente
              </button>
            </div>
          </div>
        ) : (
          /* Shift History Tab */
          <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
              Historial de Cortes de Caja (Reportes Z Anteriores)
            </h3>

            {historyShifts.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No hay turnos cerrados registrados todavía.
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
                      <th style={{ padding: '0.75rem 1rem' }}>Turno #</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Apertura</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Cierre</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Ventas Totales</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Efectivo Esperado</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Efectivo Real</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Diferencia Cuadre</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyShifts.map((s) => (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          background: 'rgba(10, 14, 22, 0.3)'
                        }}
                      >
                        <td className="mono" style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-brand)' }}>
                          Turno #{s.id}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          {new Date(s.opened_at).toLocaleString('es-CO')}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          {s.closed_at ? new Date(s.closed_at).toLocaleString('es-CO') : '--'}
                        </td>
                        <td className="mono" style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#fff' }}>
                          {formatCurrency(s.total_sales)}
                        </td>
                        <td className="mono" style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          {formatCurrency(s.expected_cash)}
                        </td>
                        <td className="mono" style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--color-gold)' }}>
                          {formatCurrency(s.actual_cash)}
                        </td>
                        <td className="mono" style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            background: s.difference === 0 
                              ? 'rgba(0, 230, 118, 0.15)' 
                              : s.difference < 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: s.difference === 0 
                              ? 'var(--color-brand)' 
                              : s.difference < 0 ? 'var(--color-alert)' : 'var(--color-blue)'
                          }}>
                            {s.difference === 0 ? 'Cuadrado ($0)' : formatCurrency(s.difference)}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--text-muted)'
                          }}>
                            Cerrado
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODAL: REGISTRAR GASTO / SALIDA DE CAJA MENOR */}
        {showMovementModal && (
          <div 
            onClick={() => setShowMovementModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2200,
              padding: '1rem',
              cursor: 'pointer'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '440px',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                cursor: 'default'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Registrar Movimiento de Caja Menor
                </h3>
                <button
                  onClick={() => setShowMovementModal(false)}
                  style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddMovement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    TIPO DE MOVIMIENTO
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setMovementType('out')}
                      style={{
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        background: movementType === 'out' ? 'rgba(244, 63, 94, 0.2)' : 'var(--bg-surface)',
                        color: movementType === 'out' ? 'var(--color-alert)' : 'var(--text-secondary)',
                        border: `1px solid ${movementType === 'out' ? 'var(--color-alert)' : 'var(--border-subtle)'}`,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Salida / Gasto (Egreso)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementType('in')}
                      style={{
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        background: movementType === 'in' ? 'rgba(0, 230, 118, 0.2)' : 'var(--bg-surface)',
                        color: movementType === 'in' ? 'var(--color-brand)' : 'var(--text-secondary)',
                        border: `1px solid ${movementType === 'in' ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Ingreso Extra
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    MONTO EN EFECTIVO ($)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 8000"
                    value={movementAmount}
                    onChange={(e) => setMovementAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    CONCEPTO / MOTIVO DEL GASTO
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 2 Bolsas de hielo para el bar"
                    value={movementReason}
                    onChange={(e) => setMovementReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowMovementModal(false)}
                    style={{
                      flex: 1,
                      padding: '0.7rem',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '0.7rem',
                      background: movementType === 'out' ? 'var(--color-alert)' : 'var(--color-brand)',
                      color: movementType === 'out' ? '#fff' : '#090d16',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Guardar Movimiento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDITAR BASE INICIAL DE CAJA */}
        {showEditInitialCash && (
          <div 
            onClick={() => setShowEditInitialCash(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2200,
              padding: '1rem',
              cursor: 'pointer'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                cursor: 'default'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 1rem 0' }}>
                Ajustar Base Inicial de Turno
              </h3>

              <form onSubmit={handleUpdateInitialCash} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    VALOR EN EFECTIVO CON EL QUE SE INICIÓ ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={newInitialCash}
                    onChange={(e) => setNewInitialCash(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '1.2rem',
                      fontWeight: 800
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowEditInitialCash(false)}
                    style={{
                      flex: 1,
                      padding: '0.7rem',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '0.7rem',
                      background: 'var(--color-brand)',
                      color: '#090d16',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Guardar Base
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CONFIRMAR CIERRE OFICIAL DE TURNO */}
        {confirmCloseModal && (
          <div 
            onClick={() => setConfirmCloseModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2200,
              padding: '1rem',
              cursor: 'pointer'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '480px',
                padding: '1.75rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                cursor: 'default'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Lock size={24} color="var(--color-alert)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                  Confirmar Cierre de Turno
                </h3>
              </div>

              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Estás a punto de congelar el arqueo de caja con los siguientes datos:
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                margin: '1rem 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Efectivo Teórico Esperado:</span>
                  <strong className="mono" style={{ color: '#fff' }}>{formatCurrency(expectedCash)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Efectivo Físico Contado:</span>
                  <strong className="mono" style={{ color: 'var(--color-gold)' }}>{formatCurrency(countedCash || 0)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
                  <span>Diferencia de Caja:</span>
                  <strong className="mono" style={{
                    color: cashDifference === 0 ? 'var(--color-brand)' : cashDifference < 0 ? 'var(--color-alert)' : 'var(--color-blue)'
                  }}>
                    {cashDifference === 0 ? 'Cuadre Exacto ($0)' : formatCurrency(cashDifference)}
                  </strong>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  OBSERVACIONES O NOTAS DE ENTREGA (OPCIONAL)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Se entregó turno a Andrea. Quedan 2 cajas de cerveza Poker en bodega."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setConfirmCloseModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCloseShift}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'var(--color-alert)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  Sí, Cerrar Turno
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRINTABLE THERMAL Z-RECEIPT PREVIEW (TICKET DE ARQUEO POS 58MM/80MM) */}
        {showZReceiptPreview && (
          <div 
            onClick={() => setShowZReceiptPreview(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2500,
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
                padding: '1.75rem 1.5rem',
                borderRadius: 'var(--radius-sm)',
                width: '100%',
                maxWidth: '380px',
                fontSize: '0.8rem',
                position: 'relative',
                maxHeight: '92vh',
                overflowY: 'auto',
                cursor: 'default',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
              }}
            >
              <button
                onClick={() => setShowZReceiptPreview(false)}
                style={{
                  position: 'absolute',
                  top: '0.6rem',
                  right: '0.6rem',
                  background: '#eee',
                  color: '#333',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={15} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '1px' }}>BILLARPULSE CLUB</div>
                <div style={{ fontWeight: 700 }}>CORTE DE CAJA - REPORTE Z</div>
                <div>TURNO #{report?.shift ? report.shift.id : '1'}</div>
                <div>--------------------------------</div>
                <div>FECHA: {new Date().toLocaleDateString('es-CO')}</div>
                <div>HORA CORTE: {new Date().toLocaleTimeString('es-CO')}</div>
                <div>RESPONSABLE: Administrador</div>
                <div>--------------------------------</div>
              </div>

              {/* Sales Summary */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '4px' }}>RESUMEN DE VENTAS:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cuentas Liquidadas:</span>
                  <span>{report ? report.sessionCount : 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ingresos Mesas (Tiempo):</span>
                  <span>{formatCurrency(report ? report.totalTimeRevenue : 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ingresos Barra (Consumo):</span>
                  <span>{formatCurrency(report ? report.totalConsumptionRevenue : 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, marginTop: '2px' }}>
                  <span>TOTAL FACTURADO:</span>
                  <span>{formatCurrency(report ? report.grandTotal : 0)}</span>
                </div>
              </div>

              <div>--------------------------------</div>

              {/* Payment Methods */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '4px' }}>MEDIOS DE PAGO:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Efectivo Cobrado:</span>
                  <span>{formatCurrency(report ? report.totalCash : 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Nequi / Transferencias:</span>
                  <span>{formatCurrency(report ? report.totalTransfer : 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tarjetas / POS:</span>
                  <span>{formatCurrency(report ? report.totalCard : 0)}</span>
                </div>
              </div>

              <div>--------------------------------</div>

              {/* Cash Reconciliation */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '4px' }}>ARQUEO DE CAJA MENOR:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>(+) Base Inicial:</span>
                  <span>{formatCurrency(report ? report.initialCash : 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>(+) Ventas Efectivo:</span>
                  <span>{formatCurrency(report ? report.totalCash : 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>(-) Gastos / Salidas:</span>
                  <span>-{formatCurrency(report ? report.sumMovementsOut : 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, borderTop: '1px dashed #000', paddingTop: '3px', marginTop: '3px' }}>
                  <span>(=) EFECTIVO ESPERADO:</span>
                  <span>{formatCurrency(expectedCash)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, marginTop: '3px' }}>
                  <span>(=) EFECTIVO CONTADO:</span>
                  <span>{formatCurrency(countedCash || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, marginTop: '3px' }}>
                  <span>DIFERENCIA (CUADRE):</span>
                  <span>{cashDifference === 0 ? 'EXACTO ($0)' : formatCurrency(cashDifference)}</span>
                </div>
              </div>

              <div>--------------------------------</div>

              {/* Signatures */}
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto 4px auto' }}></div>
                <div style={{ fontSize: '0.72rem' }}>ENTREGA TURNO (CAJERO)</div>

                <div style={{ borderTop: '1px solid #000', width: '80%', margin: '2rem auto 4px auto' }}></div>
                <div style={{ fontSize: '0.72rem' }}>RECIBE CONFORME (ADMINISTRADOR)</div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.7rem' }}>
                *** BILLARPULSE LAN OFFLINE-FIRST ***
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    flex: 1,
                    background: '#090d16',
                    color: '#fff',
                    padding: '0.6rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={15} />
                  Imprimir Ticket Z
                </button>
                <button
                  onClick={() => setShowZReceiptPreview(false)}
                  style={{
                    background: '#ddd',
                    color: '#333',
                    padding: '0.6rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

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
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2200,
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
                  height: '26px',
                  border: 'none',
                  cursor: 'pointer'
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
                    gap: '0.35rem',
                    cursor: 'pointer'
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
                    borderRadius: '4px',
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
    </div>
  );
}
