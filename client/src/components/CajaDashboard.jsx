import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause,
  PlusCircle, 
  Receipt, 
  Bell, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  TrendingUp, 
  Activity, 
  Coffee, 
  AlertCircle, 
  Eye,
  ArrowRightLeft,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatDuration, formatSessionDuration, calculateSessionLiveCost, calculateLiveTimeCost } from '../utils/formatters';
import { sounds } from '../utils/audio';
import { api } from '../services/api';
import SpeedPOSModal from './SpeedPOSModal';
import CheckoutModal from './CheckoutModal';
import TransferTableModal from './TransferTableModal';
import TablePreviewModal from './TablePreviewModal';
import OpenBarTabModal from './OpenBarTabModal';

export default function CajaDashboard({ tablesOverview, stats, onStateChange, onSelectTableForKiosk, currentStaff = null }) {
  const [selectedTableForPOS, setSelectedTableForPOS] = useState(null);
  const [selectedTableForCheckout, setSelectedTableForCheckout] = useState(null);
  const [selectedTableForTransfer, setSelectedTableForTransfer] = useState(null);
  const [previewTableId, setPreviewTableId] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [activeTabSection, setActiveTabSection] = useState('mesas'); // 'mesas' | 'barra'
  const [isOpenBarTabModal, setIsOpenBarTabModal] = useState(false);

  // Collect all pending alerts across tables
  useEffect(() => {
    const alerts = [];
    tablesOverview.forEach(table => {
      if (table.alerts && table.alerts.length > 0) {
        table.alerts.forEach(a => {
          alerts.push({ ...a, table_number: table.table_number, table_name: table.name });
        });
      }
    });
    setActiveAlerts(alerts);
  }, [tablesOverview]);

  // Handle opening table
  const handleStartSession = async (tableId) => {
    try {
      sounds.playCashRegister();
      await api.startSession(tableId);
      if (onStateChange) onStateChange();
    } catch (e) {
      alert(e.message || 'Error al iniciar mesa');
    }
  };

  // Pause session
  const handlePauseSession = async (sessionId) => {
    try {
      sounds.playScoreBeep(false);
      await api.pauseSession(sessionId);
      if (onStateChange) onStateChange();
    } catch (e) {
      alert('Error pausando mesa: ' + e.message);
    }
  };

  // Resume session
  const handleResumeSession = async (sessionId) => {
    try {
      sounds.playScoreBeep(true);
      await api.resumeSession(sessionId);
      if (onStateChange) onStateChange();
    } catch (e) {
      alert('Error reanudando mesa: ' + e.message);
    }
  };

  // Handle resolving alerts from cashier
  const handleResolveAlerts = async (tableId) => {
    try {
      sounds.playScoreBeep(true);
      await api.resolveAlertsForTable(tableId);
      if (onStateChange) onStateChange();
    } catch (e) {
      console.error('Error atendiendo alerta:', e);
    }
  };

  const poolTables = tablesOverview.filter(t => t.type !== 'barra');
  const barTabs = tablesOverview.filter(t => t.type === 'barra');

  const handleDeleteBarTab = async (tableId) => {
    if (window.confirm('¿Deseas cancelar esta cuenta de barra?')) {
      try {
        await api.deleteBarTab(tableId);
        if (onStateChange) onStateChange();
      } catch (e) {
        alert(e.message || 'Error al eliminar cuenta');
      }
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* --- TOP METRICS / CASH REGISTER SUMMARY --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingresos Hoy</span>
            <DollarSign size={20} color="var(--color-brand)" />
          </div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.5rem' }}>
            {formatCurrency(stats ? stats.totalRevenue : 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-brand)', marginTop: '4px', fontWeight: 600 }}>
            {stats ? stats.closedSessions : 0} cuentas liquidadas
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mesas en Juego</span>
            <Activity size={20} color="var(--color-blue)" />
          </div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.5rem' }}>
            {tablesOverview.filter(t => t.status === 'occupied').length} / {tablesOverview.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {tablesOverview.filter(t => t.status === 'available').length} mesas libres
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Consumo Barra</span>
            <Coffee size={20} color="var(--color-gold)" />
          </div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.5rem' }}>
            {formatCurrency(stats ? stats.consumptionRevenue : 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Bebidas y snacks despachados
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tiempo Total</span>
            <Clock size={20} color="var(--color-purple)" />
          </div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.5rem' }}>
            {stats ? Math.round(stats.totalMinutesPlayed / 60) : 0}h {stats ? stats.totalMinutesPlayed % 60 : 0}m
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Horas facturadas en el turno
          </div>
        </div>
      </div>

      {/* --- LIVE SERVICE ALERTS BANNER --- */}
      {activeAlerts.length > 0 && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '2px solid var(--color-alert)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-neon-red)',
          animation: 'pulse-subtle 2s infinite ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'var(--color-alert)',
              color: '#fff',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex'
            }}>
              <Bell size={22} className="animate-bounce" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
                ¡Atención Requerida en Salón! ({activeAlerts.length} llamadas activas)
              </div>
              <div style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
                {activeAlerts.map(a => `Mesa ${a.table_number}: ${a.type === 'waiter' ? 'Llama mesero' : 'Pide la cuenta'}`).join(' • ')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {activeAlerts.map(alertItem => (
              <button
                key={alertItem.id}
                onClick={() => handleResolveAlerts(alertItem.table_id)}
                style={{
                  background: 'var(--color-alert)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 4px 12px rgba(244, 63, 94, 0.4)'
                }}
              >
                Atender Mesa {alertItem.table_number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- SUB-NAV: MESAS DE BILLAR VS BARRA & SALÓN --- */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        padding: '0.65rem 1rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTabSection('mesas')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: activeTabSection === 'mesas' ? 'rgba(0, 230, 118, 0.15)' : 'transparent',
              border: `1px solid ${activeTabSection === 'mesas' ? 'var(--color-brand)' : 'transparent'}`,
              color: activeTabSection === 'mesas' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <span>🎱 Mesas de Billar</span>
            <span style={{
              background: activeTabSection === 'mesas' ? 'var(--color-brand)' : 'rgba(255, 255, 255, 0.1)',
              color: activeTabSection === 'mesas' ? '#090d16' : '#fff',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '1px 7px',
              borderRadius: 'var(--radius-full)'
            }}>
              {poolTables.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTabSection('barra')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: activeTabSection === 'barra' ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
              border: `1px solid ${activeTabSection === 'barra' ? 'var(--color-gold)' : 'transparent'}`,
              color: activeTabSection === 'barra' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <span>🍺 Barra & Clientes Sentados</span>
            <span style={{
              background: barTabs.length > 0 ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.1)',
              color: barTabs.length > 0 ? '#090d16' : '#fff',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '1px 7px',
              borderRadius: 'var(--radius-full)'
            }}>
              {barTabs.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => setIsOpenBarTabModal(true)}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'linear-gradient(135deg, #fbbf24, #d97706)',
            color: '#090d16',
            fontWeight: 800,
            fontSize: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 4px 15px rgba(251, 191, 36, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          <PlusCircle size={16} />
          + Abrir Cuenta Barra / Salón
        </button>
      </div>

      {/* --- SECCIÓN 1: MESAS DE BILLAR --- */}
      {activeTabSection === 'mesas' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Plano de Mesas del Salón
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                Monitoreo en tiempo real, gestión de comandas y liquidación de juego.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-brand)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-brand)' }} />
                Disponible
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-blue)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-blue)' }} />
                En Partida
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-alert)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-alert)' }} />
                Llamada Activa
              </div>
            </div>
          </div>

          {/* Grid of Billiard Tables */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '1.25rem'
          }}>
            {poolTables.map(table => {
              const session = table.current_session;
            const isOccupied = table.status === 'occupied' && session;
            const alerts = table.alerts || [];
            const hasAlert = alerts.length > 0;
            const isPaused = isOccupied && Boolean(session.is_paused);
            const liveTimeCost = isOccupied ? calculateSessionLiveCost(session, table.hourly_rate) : 0;
            const barConsumption = session ? (session.total_consumption || 0) : 0;
            const totalTable = liveTimeCost + barConsumption;
            const timeElapsed = isOccupied ? formatSessionDuration(session) : '00:00:00';

            return (
              <div
                key={table.id}
                className={`glass-panel ${hasAlert ? 'animate-alert-pulse' : ''}`}
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-lg)',
                  border: hasAlert 
                    ? '2px solid var(--color-alert)' 
                    : isOccupied 
                      ? '1px solid rgba(59, 130, 246, 0.4)' 
                      : '1px solid var(--border-subtle)',
                  background: isOccupied 
                    ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)' 
                    : 'rgba(19, 28, 46, 0.65)',
                  minHeight: '260px'
                }}
              >
                {/* Header card */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        background: hasAlert 
                          ? 'var(--color-alert)' 
                          : isOccupied ? 'var(--color-blue)' : 'var(--border-subtle)',
                        color: hasAlert ? '#fff' : (isOccupied ? '#fff' : 'var(--text-secondary)'),
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        fontWeight: 900
                      }}>
                        {table.table_number}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                          {table.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Tarifa: {formatCurrency(table.hourly_rate)}/hr • {table.type.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {hasAlert ? (
                        <div style={{
                          background: 'var(--color-alert)',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <Bell size={12} />
                          {alerts[0].type === 'waiter' ? 'MESERO' : 'CUENTA'}
                        </div>
                      ) : isPaused ? (
                        <div style={{
                          background: 'rgba(251, 191, 36, 0.2)',
                          color: 'var(--color-gold)',
                          border: '1px solid rgba(251, 191, 36, 0.4)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <Pause size={12} />
                          PAUSADA
                        </div>
                      ) : isOccupied ? (
                        <div style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: 'var(--color-blue)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          OCUPADA
                        </div>
                      ) : (
                        <div style={{
                          background: 'rgba(0, 230, 118, 0.15)',
                          color: 'var(--color-brand)',
                          border: '1px solid rgba(0, 230, 118, 0.3)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          LIBRE
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  {isOccupied ? (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {/* Live timer & score */}
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.6rem 0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={16} color="var(--color-brand)" />
                          <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                            {timeElapsed}
                          </span>
                        </div>
                        {/* Live Score Preview */}
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Score: <span style={{ color: 'var(--color-blue)' }}>{table.score.score1 || 0}</span> - <span style={{ color: 'var(--color-gold)' }}>{table.score.score2 || 0}</span>
                        </div>
                      </div>

                      {/* Amounts breakdown */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                        <div style={{ background: 'var(--bg-surface)', padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>TIEMPO</div>
                          <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-brand)' }}>
                            {formatCurrency(liveTimeCost)}
                          </div>
                        </div>
                        <div style={{ background: 'var(--bg-surface)', padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>BARRA</div>
                          <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-gold)' }}>
                            {formatCurrency(barConsumption)}
                          </div>
                        </div>
                        <div style={{ background: 'var(--bg-surface)', padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL</div>
                          <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>
                            {formatCurrency(totalTable)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem'
                    }}>
                      Mesa lista para ser asignada.
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', marginTop: '1rem' }}>
                  {hasAlert && (
                    <button
                      onClick={() => handleResolveAlerts(table.id)}
                      style={{
                        width: '100%',
                        marginBottom: '0.5rem',
                        padding: '0.55rem',
                        background: 'var(--color-alert)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        gap: '0.4rem'
                      }}
                    >
                      <CheckCircle size={15} />
                      Atender Llamada de Mesa {table.table_number}
                    </button>
                  )}

                  {isOccupied ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1.1fr 1fr auto auto', gap: '0.35rem' }}>
                      {/* Button Pause/Resume */}
                      <button
                        onClick={() => isPaused ? handleResumeSession(session.id) : handlePauseSession(session.id)}
                        title={isPaused ? "Reanudar tiempo de la mesa" : "Pausar tiempo de la mesa"}
                        style={{
                          padding: '0.6rem 0.55rem',
                          background: isPaused ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                          color: isPaused ? 'var(--color-gold)' : 'var(--text-secondary)',
                          border: `1px solid ${isPaused ? 'var(--color-gold)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          gap: '0.25rem'
                        }}
                      >
                        {isPaused ? <Play size={13} color="var(--color-gold)" /> : <Pause size={13} />}
                        {isPaused ? 'Reanudar' : 'Pausa'}
                      </button>

                      {/* Button Speed-POS */}
                      <button
                        onClick={() => setSelectedTableForPOS(table)}
                        style={{
                          padding: '0.6rem 0.55rem',
                          background: 'rgba(251, 191, 36, 0.15)',
                          color: 'var(--color-gold)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          gap: '0.25rem'
                        }}
                      >
                        <PlusCircle size={13} />
                        Consumo
                      </button>

                      {/* Button Cobrar */}
                      <button
                        onClick={() => setSelectedTableForCheckout(table)}
                        style={{
                          padding: '0.6rem 0.55rem',
                          background: 'var(--color-brand)',
                          color: '#090d16',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          gap: '0.25rem'
                        }}
                      >
                        <Receipt size={13} />
                        Cobrar
                      </button>

                      {/* Button Traspasar Mesa */}
                      <button
                        onClick={() => setSelectedTableForTransfer(table)}
                        title="Traspasar partida a otra mesa libre"
                        style={{
                          padding: '0.6rem',
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: 'var(--color-blue)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer'
                        }}
                      >
                        <ArrowRightLeft size={14} />
                      </button>

                      {/* Button View Tablet Screen */}
                      <button
                        onClick={() => setPreviewTableId(table.id)}
                        title="Ver pantalla táctil de esta mesa en vivo"
                        style={{
                          padding: '0.6rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleStartSession(table.id)}
                        style={{
                          flex: 1,
                          padding: '0.7rem',
                          background: 'var(--color-brand)',
                          color: '#090d16',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          gap: '0.5rem',
                          boxShadow: 'var(--shadow-neon-green)'
                        }}
                      >
                        <Play size={16} />
                        Abrir Mesa
                      </button>

                      <button
                        onClick={() => setPreviewTableId(table.id)}
                        title="Ver pantalla táctil de esta mesa en vivo"
                        style={{
                          padding: '0.7rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      ) : (
        /* --- SECCIÓN 2: CUENTAS DE BARRA & SALÓN (CLIENTES SENTADOS) --- */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Coffee size={24} color="var(--color-gold)" />
                Cuentas de Barra & Clientes Sentados
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                Gestión de consumos para personas sentadas en barra, terraza o salas (sin cobro por tiempo de billar).
              </p>
            </div>

            <button
              onClick={() => setIsOpenBarTabModal(true)}
              style={{
                padding: '0.6rem 1.15rem',
                background: 'var(--color-gold)',
                color: '#090d16',
                fontWeight: 800,
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 4px 15px rgba(251, 191, 36, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              <PlusCircle size={16} />
              + Nueva Cuenta de Barra
            </button>
          </div>

          {barTabs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '620px', margin: '2rem auto', borderRadius: 'var(--radius-lg)' }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(251, 191, 36, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: 'var(--color-gold)'
              }}>
                <Coffee size={34} />
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                No hay cuentas de barra abiertas
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                Abre una cuenta para clientes sentados que piden cervezas, tragos, agua o snacks sin ocupar una mesa de billar.
              </p>
              <button
                onClick={() => setIsOpenBarTabModal(true)}
                style={{
                  padding: '0.8rem 1.6rem',
                  background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                  color: '#090d16',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 4px 15px rgba(251, 191, 36, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                <PlusCircle size={18} />
                Abrir Cuenta de Barra Ahora
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '1.25rem'
            }}>
              {barTabs.map(tab => {
                const session = tab.current_session;
                const barConsumption = session ? (session.total_consumption || 0) : 0;
                return (
                  <div
                    key={tab.id}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderLeft: '4px solid var(--color-gold)',
                      borderRadius: 'var(--radius-lg)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(251, 191, 36, 0.15)',
                            color: 'var(--color-gold)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Coffee size={22} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                              {tab.name}
                            </h3>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 700 }}>
                              Barra / Salón • Sin cobro por tiempo
                            </div>
                          </div>
                        </div>

                        <span style={{
                          background: 'rgba(251, 191, 36, 0.18)',
                          color: 'var(--color-gold)',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          ACTIVA
                        </span>
                      </div>

                      <div style={{
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        textAlign: 'center',
                        margin: '0.75rem 0',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                          Consumo Acumulado
                        </div>
                        <div className="mono" style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-gold)', marginTop: '2px' }}>
                          {formatCurrency(barConsumption)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                      <button
                        onClick={() => setSelectedTableForPOS(tab)}
                        style={{
                          padding: '0.65rem 0.6rem',
                          background: 'rgba(251, 191, 36, 0.15)',
                          color: 'var(--color-gold)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer'
                        }}
                      >
                        <PlusCircle size={14} />
                        Cargar Consumo
                      </button>

                      <button
                        onClick={() => setSelectedTableForCheckout(tab)}
                        style={{
                          padding: '0.65rem 0.6rem',
                          background: 'var(--color-brand)',
                          color: '#090d16',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                          border: 'none'
                        }}
                      >
                        <Receipt size={14} />
                        Cobrar
                      </button>

                      {barConsumption === 0 ? (
                        <button
                          onClick={() => handleDeleteBarTab(tab.id)}
                          title="Cancelar cuenta vacía"
                          style={{
                            padding: '0.65rem',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: 'var(--color-alert)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : <div />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}
      <SpeedPOSModal
        table={selectedTableForPOS}
        isOpen={!!selectedTableForPOS}
        onClose={() => setSelectedTableForPOS(null)}
        currentStaff={currentStaff}
        onSuccess={() => {
          if (onStateChange) onStateChange();
        }}
      />

      <CheckoutModal
        table={selectedTableForCheckout}
        isOpen={!!selectedTableForCheckout}
        onClose={() => setSelectedTableForCheckout(null)}
        onSuccess={() => {
          if (onStateChange) onStateChange();
        }}
      />

      <TransferTableModal
        sourceTable={selectedTableForTransfer}
        allTables={tablesOverview}
        isOpen={!!selectedTableForTransfer}
        onClose={() => setSelectedTableForTransfer(null)}
        onSuccess={() => {
          if (onStateChange) onStateChange();
        }}
      />

      <TablePreviewModal
        tableId={previewTableId}
        tablesOverview={tablesOverview}
        isOpen={!!previewTableId}
        onClose={() => setPreviewTableId(null)}
        onStateChange={onStateChange}
      />

      <OpenBarTabModal
        isOpen={isOpenBarTabModal}
        onClose={() => setIsOpenBarTabModal(false)}
        onSuccess={() => {
          setActiveTabSection('barra');
          if (onStateChange) onStateChange();
        }}
      />
    </div>
  );
}
