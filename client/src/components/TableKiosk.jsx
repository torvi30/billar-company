import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Receipt, 
  Plus, 
  Minus, 
  RotateCcw, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  PlayCircle,
  Trophy,
  Users,
  User,
  X,
  Edit2
} from 'lucide-react';
import { formatCurrency, formatDuration, formatSessionDuration, calculateSessionLiveCost, calculateLiveTimeCost } from '../utils/formatters';
import { sounds } from '../utils/audio';
import { api } from '../services/api';

export default function TableKiosk({ tableId, tablesOverview, onStateChange }) {
  const currentTable = tablesOverview.find(t => t.id === tableId) || null;
  const session = currentTable ? currentTable.current_session : null;
  const score = currentTable ? currentTable.score : {
    player1_name: 'Jugador 1',
    player2_name: 'Jugador 2',
    score1: 0,
    score2: 0,
    sets1: 0,
    sets2: 0
  };

  const [liveDuration, setLiveDuration] = useState('00:00:00');
  const [liveTimeCost, setLiveTimeCost] = useState(0);
  const [alertSent, setAlertSent] = useState(null); // 'waiter' | 'bill' | null
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [accountOrders, setAccountOrders] = useState([]);

  const openAccountDetails = async () => {
    sounds.playScoreBeep(true);
    setShowBillModal(true);
    if (currentTable) {
      try {
        const res = await api.getTableDetails(currentTable.id);
        if (res.success && res.data) {
          setAccountOrders(res.data.orders || []);
        }
      } catch (e) {
        console.error('Error fetching table orders:', e);
      }
    }
  };

  const handleEditPlayerName = async (playerNum) => {
    const currentName = playerNum === 1 ? (score.player1_name || 'Jugador 1') : (score.player2_name || 'Jugador 2');
    const newName = prompt(`Ingresa el nombre para el ${playerNum === 1 ? 'Jugador 1' : 'Jugador 2'}:`, currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
      sounds.playScoreBeep(true);
      await api.updateScore(currentTable.id, {
        player1_name: playerNum === 1 ? newName.trim() : score.player1_name,
        player2_name: playerNum === 2 ? newName.trim() : score.player2_name,
        score1: score.score1,
        score2: score.score2,
        sets1: score.sets1,
        sets2: score.sets2
      });
      if (onStateChange) onStateChange();
    }
  };

  // Check if there is an active alert for this table
  const pendingAlerts = currentTable ? currentTable.alerts : [];
  const hasPendingWaiter = pendingAlerts.some(a => a.type === 'waiter');
  const hasPendingBill = pendingAlerts.some(a => a.type === 'bill');

  // Live timer tick
  useEffect(() => {
    const updateTimer = () => {
      if (session && session.status === 'active') {
        setLiveDuration(formatSessionDuration(session));
        setLiveTimeCost(calculateSessionLiveCost(session, currentTable.hourly_rate));
      } else {
        setLiveDuration('00:00:00');
        setLiveTimeCost(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session, currentTable]);

  // Handle Score Updates
  const updateScoreValue = async (field, delta) => {
    if (!currentTable) return;
    const currentVal = score[field] || 0;
    const newVal = Math.max(0, currentVal + delta);
    if (newVal === currentVal) return;

    sounds.playScoreBeep(delta > 0);
    const updatedScore = { ...score, [field]: newVal };
    try {
      await api.updateScore(tableId, updatedScore);
      if (onStateChange) onStateChange();
    } catch (e) {
      console.error('Error actualizando marcador:', e);
    }
  };

  const resetScoreboard = async () => {
    sounds.playScoreBeep(false);
    const reset = {
      ...score,
      score1: 0,
      score2: 0,
      sets1: 0,
      sets2: 0
    };
    try {
      await api.updateScore(tableId, reset);
      setConfirmResetOpen(false);
      if (onStateChange) onStateChange();
    } catch (e) {
      console.error('Error reseteando marcador:', e);
    }
  };

  // Call waiter or request bill
  const handleCallService = async (type) => {
    try {
      sounds.playWaiterBell();
      setAlertSent(type);
      await api.triggerAlert(tableId, type);
      if (onStateChange) onStateChange();

      // Clear local flash after 5 seconds
      setTimeout(() => {
        setAlertSent(null);
      }, 5000);
    } catch (e) {
      console.error('Error enviando alerta:', e);
    }
  };

  // Start session directly from table if available
  const handleStartSession = async () => {
    try {
      sounds.playCashRegister();
      await api.startSession(tableId);
      if (onStateChange) onStateChange();
    } catch (e) {
      alert(e.message || 'Error al iniciar mesa');
    }
  };

  if (!currentTable) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Cargando estado de la mesa...
      </div>
    );
  }

  const isOccupied = currentTable.status === 'occupied' && session;
  const barConsumption = session ? (session.total_consumption || 0) : 0;
  const totalAccumulated = liveTimeCost + barConsumption;

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      minHeight: 'calc(100vh - 75px)',
      justifyContent: 'space-between'
    }}>
      {/* --- TOP HEADER: TABLE ID, TIMER, TOTAL VISOR --- */}
      <div className="glass-panel" style={{
        padding: '1.25rem 2rem',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        gap: '2rem'
      }}>
        {/* Table Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: isOccupied ? 'var(--color-brand)' : 'var(--border-subtle)',
            color: '#090d16',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isOccupied ? 'var(--shadow-neon-green)' : 'none'
          }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>MESA</span>
            <span style={{ fontSize: '1.7rem', fontWeight: 900, lineHeight: 1 }}>{currentTable.table_number}</span>
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {currentTable.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: isOccupied ? 'var(--color-brand)' : 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {isOccupied ? '• Partida en curso' : '• Mesa Libre'}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>|</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Tarifa: {formatCurrency(currentTable.hourly_rate)}/hr
              </span>
            </div>
          </div>
        </div>

        {/* Live Timer Display */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isOccupied ? (
            <div style={{
              background: session.is_paused ? 'rgba(251, 191, 36, 0.1)' : 'rgba(0, 0, 0, 0.4)',
              border: `1px solid ${session.is_paused ? 'var(--color-gold)' : 'rgba(0, 230, 118, 0.3)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: session.is_paused ? '0 0 15px rgba(251, 191, 36, 0.2)' : 'inset 0 0 12px rgba(0, 230, 118, 0.1)'
            }}>
              <Clock size={24} color={session.is_paused ? 'var(--color-gold)' : 'var(--color-brand)'} className={session.is_paused ? '' : 'animate-pulse'} />
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  color: session.is_paused ? 'var(--color-gold)' : '#fff',
                  letterSpacing: '0.04em',
                  lineHeight: 1.1
                }}>
                  {liveDuration}
                </div>
                <div style={{ fontSize: '0.75rem', color: session.is_paused ? 'var(--color-gold)' : 'var(--color-brand)', fontWeight: 700 }}>
                  {session.is_paused ? '⏸ PAUSADO (Cronómetro detenido)' : `Tiempo de juego: ${formatCurrency(liveTimeCost)}`}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1.5rem',
              color: 'var(--text-muted)',
              fontSize: '1rem',
              fontWeight: 600
            }}>
              Cronómetro pausado (Mesa disponible)
            </div>
          )}
        </div>

        {/* Visor de Cuenta Actual (Total acumulado cargado desde caja) */}
        <div 
          onClick={openAccountDetails}
          title="Toca para ver el detalle de consumos de la mesa"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.04))',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1.25rem',
            textAlign: 'right',
            minWidth: '210px',
            cursor: 'pointer',
            transition: 'transform 0.1s, border-color 0.15s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gold)', textTransform: 'uppercase' }}>
            <span>Cuenta Acumulada</span>
            <span style={{ fontSize: '0.7rem' }}>📋</span>
          </div>
          <div className="mono" style={{
            fontSize: '1.9rem',
            fontWeight: 800,
            color: '#fff',
            marginTop: '2px',
            lineHeight: 1.1
          }}>
            {formatCurrency(totalAccumulated)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Barra: {formatCurrency(barConsumption)} • <span style={{ color: 'var(--color-gold)' }}>Ver Detalle ➜</span>
          </div>
        </div>
      </div>

      {/* --- CENTER AREA: MARCADOR DE PUNTOS TÁCTIL O PANTALLA DE APERTURA --- */}
      {isOccupied ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}>
          {/* PLAYER 1 CARD */}
          <div className="glass-panel" style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, rgba(19, 28, 46, 0.9) 100%)'
          }}>
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div 
                onClick={() => handleEditPlayerName(1)}
                title="Toca para cambiar nombre del jugador"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px dashed rgba(59, 130, 246, 0.3)'
                }}
              >
                <Users size={18} color="var(--color-blue)" />
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-blue)', textTransform: 'uppercase' }}>
                  {score.player1_name || 'Jugador 1'}
                </span>
                <Edit2 size={13} color="var(--color-blue)" style={{ opacity: 0.7 }} />
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(59, 130, 246, 0.15)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--color-blue)'
              }}>
                <Trophy size={14} />
                <span>Chicos/Sets: {score.sets1 || 0}</span>
                <button
                  onClick={() => updateScoreValue('sets1', 1)}
                  style={{
                    background: 'var(--color-blue)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    marginLeft: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 900
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Giant Score Display */}
            <div className="mono" style={{
              fontSize: '6.5rem',
              fontWeight: 900,
              color: '#ffffff',
              textShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
              lineHeight: 1,
              margin: '1rem 0'
            }}>
              {score.score1 || 0}
            </div>

            {/* Score Touch Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', width: '100%' }}>
              <button
                onClick={() => updateScoreValue('score1', -1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  height: '75px',
                  fontSize: '1.75rem',
                  fontWeight: 700
                }}
              >
                <Minus size={28} />
              </button>
              <button
                onClick={() => updateScoreValue('score1', 1)}
                style={{
                  background: 'var(--color-blue)',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  height: '75px',
                  fontSize: '2rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
                }}
              >
                <Plus size={36} />
              </button>
            </div>
          </div>

          {/* VS / RESET CONTROL COLUMN */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1rem',
              color: 'var(--text-muted)'
            }}>
              VS
            </div>

            {/* Reset Scoreboard Button */}
            {confirmResetOpen ? (
              <div className="glass-panel" style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                border: '1px solid var(--color-alert)'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 700, textAlign: 'center' }}>
                  ¿Reiniciar marcador a 0?
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={resetScoreboard}
                    style={{
                      background: 'var(--color-alert)',
                      color: '#fff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    Sí, limpiar
                  </button>
                  <button
                    onClick={() => setConfirmResetOpen(false)}
                    style={{
                      background: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    No
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmResetOpen(true)}
                title="Reiniciar tanteador"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  width: '52px',
                  height: '52px',
                  color: 'var(--text-muted)'
                }}
              >
                <RotateCcw size={22} />
              </button>
            )}
          </div>

          {/* PLAYER 2 CARD */}
          <div className="glass-panel" style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(19, 28, 46, 0.9) 100%)'
          }}>
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div 
                onClick={() => handleEditPlayerName(2)}
                title="Toca para cambiar nombre del jugador"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px dashed rgba(245, 158, 11, 0.3)'
                }}
              >
                <Users size={18} color="var(--color-gold)" />
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-gold)', textTransform: 'uppercase' }}>
                  {score.player2_name || 'Jugador 2'}
                </span>
                <Edit2 size={13} color="var(--color-gold)" style={{ opacity: 0.7 }} />
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(245, 158, 11, 0.15)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--color-gold)'
              }}>
                <Trophy size={14} />
                <span>Chicos/Sets: {score.sets2 || 0}</span>
                <button
                  onClick={() => updateScoreValue('sets2', 1)}
                  style={{
                    background: 'var(--color-gold)',
                    color: '#090d16',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    marginLeft: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 900
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Giant Score Display */}
            <div className="mono" style={{
              fontSize: '6.5rem',
              fontWeight: 900,
              color: '#ffffff',
              textShadow: '0 0 30px rgba(245, 158, 11, 0.4)',
              lineHeight: 1,
              margin: '1rem 0'
            }}>
              {score.score2 || 0}
            </div>

            {/* Score Touch Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', width: '100%' }}>
              <button
                onClick={() => updateScoreValue('score2', -1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  height: '75px',
                  fontSize: '1.75rem',
                  fontWeight: 700
                }}
              >
                <Minus size={28} />
              </button>
              <button
                onClick={() => updateScoreValue('score2', 1)}
                style={{
                  background: 'var(--color-gold)',
                  color: '#090d16',
                  borderRadius: 'var(--radius-md)',
                  height: '75px',
                  fontSize: '2rem',
                  fontWeight: 900,
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)'
                }}
              >
                <Plus size={36} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* TABLE AVAILABLE WELCOME SCREEN */
        <div className="glass-panel" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          border: '2px dashed var(--border-subtle)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(0, 230, 118, 0.1)',
            border: '2px solid var(--color-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-neon-green)'
          }}>
            <PlayCircle size={44} color="var(--color-brand)" />
          </div>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem' }}>
              Mesa {currentTable.table_number} Disponible
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', fontSize: '1.1rem' }}>
              Toca el botón a continuación para dar inicio a tu partida y activar el cronómetro y marcador táctil.
            </p>
          </div>
          <button
            onClick={handleStartSession}
            style={{
              background: 'var(--color-brand)',
              color: '#090d16',
              fontWeight: 900,
              fontSize: '1.35rem',
              padding: '1.25rem 3rem',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 30px var(--color-brand-glow)',
              gap: '0.75rem',
              marginTop: '1rem'
            }}
          >
            <PlayCircle size={26} />
            Iniciar Partida Ahora
          </button>
        </div>
      )}

      {/* --- BOTTOM ACTION BAR: SERVICE BUTTONS (WAIT/BILL) --- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem'
      }}>
        {/* BOTÓN 1: LLAMAR MESERO */}
        <button
          onClick={() => handleCallService('waiter')}
          disabled={hasPendingWaiter}
          style={{
            height: '85px',
            borderRadius: 'var(--radius-lg)',
            background: hasPendingWaiter 
              ? 'rgba(251, 191, 36, 0.2)' 
              : 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: hasPendingWaiter 
              ? '2px solid var(--color-gold)' 
              : '2px solid var(--border-subtle)',
            color: hasPendingWaiter ? 'var(--color-gold)' : '#ffffff',
            gap: '1rem',
            fontSize: '1.25rem',
            fontWeight: 800,
            boxShadow: hasPendingWaiter ? 'var(--shadow-neon-gold)' : 'var(--shadow-card)',
            cursor: hasPendingWaiter ? 'default' : 'pointer'
          }}
        >
          {hasPendingWaiter ? (
            <>
              <CheckCircle2 size={32} color="var(--color-gold)" />
              <div style={{ textAlign: 'left' }}>
                <div>Mesero Notificado</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  En camino a tu mesa...
                </div>
              </div>
            </>
          ) : (
            <>
              <Bell size={32} color="var(--color-brand)" />
              <div style={{ textAlign: 'left' }}>
                <div>Llamar Mesero</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Bebidas, botanas o asistencia
                </div>
              </div>
            </>
          )}
        </button>

        {/* BOTÓN 2: PEDIR LA CUENTA */}
        <button
          onClick={() => handleCallService('bill')}
          disabled={hasPendingBill || !isOccupied}
          style={{
            height: '85px',
            borderRadius: 'var(--radius-lg)',
            background: hasPendingBill 
              ? 'rgba(244, 63, 94, 0.2)' 
              : isOccupied ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'rgba(255,255,255,0.02)',
            border: hasPendingBill 
              ? '2px solid var(--color-alert)' 
              : '2px solid var(--border-subtle)',
            color: hasPendingBill ? 'var(--color-alert)' : (isOccupied ? '#ffffff' : 'var(--text-muted)'),
            gap: '1rem',
            fontSize: '1.25rem',
            fontWeight: 800,
            boxShadow: hasPendingBill ? 'var(--shadow-neon-red)' : 'var(--shadow-card)',
            cursor: (!isOccupied || hasPendingBill) ? 'default' : 'pointer',
            opacity: isOccupied ? 1 : 0.5
          }}
        >
          {hasPendingBill ? (
            <>
              <CheckCircle2 size={32} color="var(--color-alert)" />
              <div style={{ textAlign: 'left' }}>
                <div>Cuenta Solicitada</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Caja preparando liquidación...
                </div>
              </div>
            </>
          ) : (
            <>
              <Receipt size={32} color="var(--color-gold)" />
              <div style={{ textAlign: 'left' }}>
                <div>Pedir la Cuenta</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Finalizar juego y pagar en caja
                </div>
              </div>
            </>
          )}
        </button>
      </div>

      {/* --- MODAL DETALLE DE CUENTA DE LA MESA --- */}
      {showBillModal && (
        <div
          onClick={() => setShowBillModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 8, 14, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.25rem',
            cursor: 'pointer'
          }}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '85vh',
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
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Detalle de Cuenta - Mesa {currentTable.table_number}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                  {score.player1_name} vs {score.player2_name}
                </p>
              </div>
              <button
                onClick={() => setShowBillModal(false)}
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

            {/* Body */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Time Row */}
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="var(--color-brand)" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Tiempo de Mesa</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {liveDuration} @ {formatCurrency(currentTable.hourly_rate)}/h
                    </div>
                  </div>
                </div>
                <span className="mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-brand)' }}>
                  {formatCurrency(liveTimeCost)}
                </span>
              </div>

              {/* Items List */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Consumos Cargados a la Mesa ({accountOrders.length})
                </div>

                {accountOrders.length === 0 ? (
                  <div style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    No hay consumos de bebidas o snacks registrados todavía.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '250px', overflowY: 'auto' }}>
                    {accountOrders.map((item, idx) => {
                      const isMesa = item.assigned_to === 'Mesa';
                      const isP1 = item.assigned_to === score.player1_name;
                      const badgeColor = isMesa 
                        ? 'var(--color-brand)' 
                        : isP1 ? 'var(--color-blue)' : 'var(--color-gold)';

                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            background: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.6rem 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                                {item.quantity}x {item.product_name}
                              </span>
                              <span style={{
                                background: `${badgeColor}20`,
                                color: badgeColor,
                                border: `1px solid ${badgeColor}40`,
                                borderRadius: 'var(--radius-full)',
                                padding: '1px 6px',
                                fontSize: '0.65rem',
                                fontWeight: 800
                              }}>
                                {item.assigned_to === 'Mesa' ? '🎱 Mesa' : `👤 ${item.assigned_to}`}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {formatCurrency(item.unit_price)} c/u
                            </div>
                          </div>
                          <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-gold)' }}>
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Total */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              background: 'rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ACUMULADO</div>
                <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
                  {formatCurrency(totalAccumulated)}
                </div>
              </div>

              <button
                onClick={() => setShowBillModal(false)}
                style={{
                  padding: '0.65rem 1.5rem',
                  background: 'var(--color-brand)',
                  color: '#090d16',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-md)',
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
