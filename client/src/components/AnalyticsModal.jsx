import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Clock, 
  ShoppingBag, 
  Users, 
  Flame, 
  CreditCard, 
  Award, 
  Printer, 
  RefreshCw,
  Layers,
  Percent
} from 'lucide-react';
import { formatCurrency, formatDuration } from '../utils/formatters';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

export default function AnalyticsModal({ isOpen, onClose }) {
  const [range, setRange] = useState('today'); // 'today' | 'week' | 'month' | 'all'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadData = async (selectedRange) => {
    setLoading(true);
    try {
      const res = await api.getAnalytics(selectedRange);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error cargando analíticas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData(range);
    }
  }, [isOpen, range]);

  if (!isOpen) return null;

  const kpis = data?.kpis || {
    total_sessions: 0,
    total_revenue: 0,
    time_revenue: 0,
    consumption_revenue: 0,
    avg_ticket: 0,
    avg_minutes: 0
  };

  const topProducts = data?.topProducts || [];
  const paymentMethods = data?.paymentMethods || [];
  const peakHours = data?.peakHours || [];
  const byTable = data?.byTable || [];

  // Find max sessions for peak hours chart scale
  const maxPeakCount = Math.max(1, ...peakHours.map(p => p.count));

  // Find highest product qty for top products bar scale
  const maxProductQty = Math.max(1, ...topProducts.map(p => p.total_qty));

  // Calculate percentages
  const timeRevenuePercent = kpis.total_revenue > 0 
    ? Math.round((kpis.time_revenue / kpis.total_revenue) * 100) 
    : 0;
  const consumptionRevenuePercent = kpis.total_revenue > 0 
    ? Math.round((kpis.consumption_revenue / kpis.total_revenue) * 100) 
    : 0;

  // Peak hour highlight
  const busiestHourObj = peakHours.length > 0 
    ? [...peakHours].sort((a, b) => b.count - a.count)[0] 
    : null;

  const formatHourLabel = (hr) => {
    const h = Number(hr);
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
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
          maxWidth: '1280px',
          height: '92vh',
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
          background: 'rgba(255, 255, 255, 0.02)',
          flexWrap: 'wrap',
          gap: '1rem'
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
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                  Estadísticas & Horas Pico
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
                  Inteligencia de Negocio
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Análisis de horas pico, productos más vendidos y rendimiento por mesa
              </div>
            </div>
          </div>

          {/* Time range selector pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              gap: '4px'
            }}>
              {[
                { id: 'today', label: 'Hoy' },
                { id: 'week', label: 'Últimos 7 Días' },
                { id: 'month', label: 'Este Mes' },
                { id: 'all', label: 'Histórico' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    sounds.playScoreBeep(true);
                    setRange(item.id);
                  }}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: 'var(--radius-sm)',
                    background: range === item.id ? 'var(--color-brand)' : 'transparent',
                    color: range === item.id ? '#090d16' : 'var(--text-secondary)',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => loadData(range)}
              title="Actualizar datos"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={() => window.print()}
              title="Imprimir informe estadístico"
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <Printer size={15} />
              Imprimir
            </button>

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
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* --- TOP 4 KPI CARDS --- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Total Revenue */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-brand)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Ingresos del Periodo
                </span>
                <DollarSign size={20} color="var(--color-brand)" />
              </div>
              <div className="mono" style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', marginTop: '0.4rem' }}>
                {formatCurrency(kpis.total_revenue)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                <span>🎱 Billar: <strong style={{ color: 'var(--color-brand)' }}>{timeRevenuePercent}%</strong></span>
                <span>🍺 Barra: <strong style={{ color: 'var(--color-gold)' }}>{consumptionRevenuePercent}%</strong></span>
              </div>
            </div>

            {/* Total Sessions / Cuentas Liquidadas */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-blue)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Cuentas Cobradas
                </span>
                <Users size={20} color="var(--color-blue)" />
              </div>
              <div className="mono" style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', marginTop: '0.4rem' }}>
                {kpis.total_sessions}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-blue)', marginTop: '0.5rem', fontWeight: 600 }}>
                Mesas y consumos liquidados
              </div>
            </div>

            {/* Average Ticket */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Ticket Promedio
                </span>
                <Award size={20} color="var(--color-gold)" />
              </div>
              <div className="mono" style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', marginTop: '0.4rem' }}>
                {formatCurrency(Math.round(kpis.avg_ticket))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Gasto promedio por grupo/mesa
              </div>
            </div>

            {/* Average Playing Time */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-purple)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Tiempo Promedio Partida
                </span>
                <Clock size={20} color="var(--color-purple)" />
              </div>
              <div className="mono" style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', marginTop: '0.4rem' }}>
                {Math.round(kpis.avg_minutes)} min
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {(kpis.avg_minutes / 60).toFixed(1)} horas promedio por mesa
              </div>
            </div>
          </div>

          {/* --- ROW 2: PEAK HOURS & TOP PRODUCTS --- */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '1.5rem' }}>
            
            {/* 1. HORAS PICO DEL SALÓN (PEAK HOURS CHART) */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: 'var(--color-alert)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Flame size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      Horas Pico del Salón
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Frecuencia de partidas según la hora de apertura
                    </div>
                  </div>
                </div>

                {busiestHourObj && (
                  <span style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    🔥 Pico: {formatHourLabel(busiestHourObj.hour)} ({busiestHourObj.count} mesas)
                  </span>
                )}
              </div>

              {peakHours.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Aún no hay suficientes partidas cerradas en este periodo para calcular horas pico.
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingTop: '1rem' }}>
                  {/* Visual Bar Chart */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '0.6rem',
                    height: '180px',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '0.5rem'
                  }}>
                    {Array.from({ length: 24 }).map((_, h) => {
                      const found = peakHours.find(p => p.hour === h);
                      const count = found ? found.count : 0;
                      const heightPercent = maxPeakCount > 0 ? Math.round((count / maxPeakCount) * 100) : 0;
                      const isHot = count === maxPeakCount && count > 0;

                      // Only show business hours typically 10am to 2am or hours with data
                      if (h < 9 && count === 0) return null;

                      return (
                        <div 
                          key={h}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                            justifyContent: 'flex-end',
                            position: 'relative'
                          }}
                        >
                          {/* Value on top of bar */}
                          {count > 0 && (
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              color: isHot ? 'var(--color-alert)' : 'var(--color-brand)',
                              marginBottom: '4px'
                            }}>
                              {count}
                            </span>
                          )}

                          {/* Bar */}
                          <div style={{
                            width: '100%',
                            minHeight: count > 0 ? '6px' : '2px',
                            height: `${Math.max(2, heightPercent)}%`,
                            borderRadius: '4px 4px 0 0',
                            background: isHot 
                              ? 'linear-gradient(180deg, #ef4444, #b91c1c)' 
                              : count > 0 
                                ? 'linear-gradient(180deg, #00e676, #008744)' 
                                : 'rgba(255, 255, 255, 0.05)',
                            boxShadow: isHot ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none',
                            transition: 'height 0.3s ease'
                          }} />
                          
                          {/* Hour Label */}
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: isHot ? '#fff' : 'var(--text-muted)',
                            marginTop: '6px',
                            whiteSpace: 'nowrap'
                          }}>
                            {h % 2 === 0 ? formatHourLabel(h) : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>🌅 Mañana / Tarde</span>
                    <span>🌆 Noche Pico</span>
                    <span>🌙 Madrugada</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. TOP PRODUCTOS MÁS VENDIDOS */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(251, 191, 36, 0.15)',
                    color: 'var(--color-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      Top Productos Más Vendidos
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Ranking de bebidas, licores y snacks más despachados
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 800 }}>
                  {topProducts.length} productos
                </span>
              </div>

              {topProducts.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No se registraron ventas de barra en este periodo.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
                  {topProducts.map((prod, idx) => {
                    const percent = Math.round((prod.total_qty / maxProductQty) * 100);
                    return (
                      <div key={prod.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: idx === 0 ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.08)',
                              color: idx === 0 ? '#090d16' : 'var(--text-muted)',
                              fontSize: '0.7rem',
                              fontWeight: 900,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {idx + 1}
                            </span>
                            <span style={{ color: '#fff', fontWeight: 700 }}>{prod.name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '1px 6px', borderRadius: '3px' }}>
                              {prod.category}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--color-brand)', fontSize: '0.85rem' }}>
                              {prod.total_qty} und
                            </span>
                            <span className="mono" style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                              {formatCurrency(prod.total_revenue)}
                            </span>
                          </div>
                        </div>

                        {/* Visual progress bar */}
                        <div style={{
                          height: '6px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${percent}%`,
                            background: idx === 0 
                              ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' 
                              : 'linear-gradient(90deg, #00e676, #00b0ff)',
                            borderRadius: 'var(--radius-full)'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* --- ROW 3: REVENUE BY TABLE & PAYMENT METHODS --- */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
            
            {/* Revenue by Table Table */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <Layers size={18} color="var(--color-blue)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Rendimiento por Mesa & Barra
                </h3>
              </div>

              {byTable.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Sin partidas finalizadas en el rango seleccionado.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Mesa / Espacio</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Tipo</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Partidas</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Tiempo</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Consumo</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Total Recaudado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byTable.map(tb => (
                        <tr key={tb.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 800, color: '#fff' }}>
                            {tb.name}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              background: tb.type === 'barra' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 230, 118, 0.15)',
                              color: tb.type === 'barra' ? 'var(--color-gold)' : 'var(--color-brand)',
                              fontWeight: 700
                            }}>
                              {tb.type.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                            {tb.sessions_count}
                          </td>
                          <td className="mono" style={{ padding: '0.75rem', color: 'var(--color-brand)' }}>
                            {formatCurrency(tb.time_revenue)}
                          </td>
                          <td className="mono" style={{ padding: '0.75rem', color: 'var(--color-gold)' }}>
                            {formatCurrency(tb.consumption_revenue)}
                          </td>
                          <td className="mono" style={{ padding: '0.75rem', fontWeight: 900, color: '#fff' }}>
                            {formatCurrency(tb.total_revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment Methods Breakdown */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <CreditCard size={18} color="var(--color-gold)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Métodos de Pago
                </h3>
              </div>

              {paymentMethods.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Sin pagos registrados.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
                  {paymentMethods.map(pm => {
                    const percent = kpis.total_revenue > 0 ? Math.round((pm.total / kpis.total_revenue) * 100) : 0;
                    return (
                      <div key={pm.method} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 800, color: '#fff' }}>
                            {pm.method} ({pm.count} transacciones)
                          </span>
                          <span className="mono" style={{ fontWeight: 800, color: 'var(--color-brand)' }}>
                            {formatCurrency(pm.total)} ({percent}%)
                          </span>
                        </div>
                        <div style={{
                          height: '8px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${percent}%`,
                            background: pm.method === 'Efectivo' 
                              ? 'var(--color-brand)' 
                              : pm.method === 'Nequi' 
                                ? '#ec4899' 
                                : pm.method === 'Daviplata' 
                                  ? '#ef4444' 
                                  : 'var(--color-blue)',
                            borderRadius: 'var(--radius-full)'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
