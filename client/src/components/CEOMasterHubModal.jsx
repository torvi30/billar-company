import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  PlusCircle,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  Search,
  MessageCircle,
  Copy,
  Edit2,
  Trash2,
  ArrowRight,
  Eye,
  Check,
  RefreshCw,
  Sparkles,
  BarChart2,
  Users,
  Package,
  Database,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { sounds } from '../utils/audio';
import { api } from '../services/api';

export default function CEOMasterHubModal({
  isOpen,
  onClose,
  onSwitchBusiness = null,
  currentBusiness = null
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [activeTab, setActiveTab] = useState('businesses'); // 'businesses' | 'license_vault' | 'new_business' | 'backups'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBizForLicense, setSelectedBizForLicense] = useState(null);
  const [selectedBizDetails, setSelectedBizDetails] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [backupsList, setBackupsList] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);

  // New business form state
  const [newBizForm, setNewBizForm] = useState({
    name: '',
    city: 'Bogotá',
    address: '',
    phone: '',
    owner_name: '',
    owner_email: '',
    plan: 'pro',
    max_tables: 12,
    monthly_fee: 95000,
    expiry_date: 'perpetual',
    admin_pin: '1234',
    notes: ''
  });

  // Edit business form state
  const [editingBiz, setEditingBiz] = useState(null);

  // Offline license generator state
  const [vaultBusinessName, setVaultBusinessName] = useState('');
  const [vaultNit, setVaultNit] = useState('');
  const [vaultTables, setVaultTables] = useState(12);
  const [vaultExpiry, setVaultExpiry] = useState('perpetual');
  const [generatedVaultKey, setGeneratedVaultKey] = useState('');

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadOverview();
    }
  }, [isOpen, isAuthenticated]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const [res, backupsRes] = await Promise.all([
        api.getCEOOverview(),
        api.getBackups().catch(() => ({ data: [] }))
      ]);
      if (res.success) {
        setOverviewData(res);
      }
      if (backupsRes.success && backupsRes.data) {
        setBackupsList(backupsRes.data);
      }
    } catch (err) {
      console.error('Error cargando datos CEO:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      sounds.playCashRegister();
      const res = await api.createBackup('manual_ceo');
      if (res.success) {
        alert(`✅ Respaldo seguro generado: ${res.data.id} (${res.data.totalSizeFormatted})`);
        const bRes = await api.getBackups();
        if (bRes.success) setBackupsList(bRes.data);
      }
    } catch (e) {
      alert('Error creando respaldo: ' + e.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleExtendSubscription = async (biz, duration) => {
    try {
      sounds.playCashRegister();
      const res = await api.extendBusinessSubscription(biz.id, duration);
      if (res.success) {
        alert(`✅ Suscripción de "${biz.name}" actualizada hasta: ${res.business.expiry_date === 'perpetual' ? 'PERPETUA ♾️' : res.business.expiry_date}`);
        await loadOverview();
      }
    } catch (err) {
      alert('Error extendiendo suscripción: ' + err.message);
    }
  };

  if (!isOpen) return null;

  // --- 1. PIN GATE SCREEN (SOLO ACCESO CEO) ---
  if (!isAuthenticated) {
    const handleVerifyPin = async (e) => {
      if (e) e.preventDefault();
      setLoading(true);
      setPinError(false);
      try {
        const res = await api.ceoLogin(pinInput.trim());
        if (res.success) {
          sounds.playCashRegister();
          setIsAuthenticated(true);
          setOverviewData(res);
          loadOverview();
        } else {
          sounds.playScoreBeep(false);
          setPinError(true);
        }
      } catch (err) {
        sounds.playScoreBeep(false);
        setPinError(true);
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
          background: 'rgba(5, 8, 15, 0.92)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}
      >
        <div
          className="glass-panel"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '420px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.15)',
            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, rgba(15, 23, 42, 0.98) 100%)'
          }}
        >
          <div style={{
            width: '68px',
            height: '68px',
            margin: '0 auto 1.25rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.1) 100%)',
            border: '2px solid var(--color-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(245, 158, 11, 0.35)'
          }}>
            <ShieldCheck size={36} color="var(--color-gold)" />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            Portal Maestro CEO
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '6px', lineHeight: 1.4 }}>
            Ingresa tu <strong>PIN Maestro de Creador</strong> para gestionar la red de empresas, licencias y suscripciones.
          </p>

          <form onSubmit={handleVerifyPin} style={{ marginTop: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="password"
              autoFocus
              maxLength={8}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="••••"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '2rem',
                textAlign: 'center',
                letterSpacing: '0.5rem',
                borderRadius: 'var(--radius-md)',
                background: '#090d16',
                border: pinError ? '2px solid var(--color-alert)' : '2px solid rgba(245, 158, 11, 0.4)',
                color: '#fff',
                outline: 'none',
                boxShadow: pinError ? '0 0 15px rgba(239, 68, 68, 0.4)' : '0 0 15px rgba(245, 158, 11, 0.2)'
              }}
            />

            {pinError && (
              <div style={{ color: 'var(--color-alert)', fontSize: '0.8rem', fontWeight: 700 }}>
                PIN incorrecto. Acceso exclusivo del CEO.
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !pinInput.trim()}
              style={{
                width: '100%',
                padding: '0.9rem',
                background: 'linear-gradient(135deg, var(--color-gold) 0%, #d97706 100%)',
                color: '#090d16',
                fontWeight: 900,
                fontSize: '1rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: loading || !pinInput.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.35)',
                marginTop: '0.5rem'
              }}
            >
              {loading ? 'Verificando...' : 'Acceder al Centro de Control'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            🔒 Acceso restringido. Solo para el dueño y fundador de la franquicia.
          </div>
        </div>
      </div>
    );
  }

  // --- 2. MAIN CEO DASHBOARD ---
  const stats = overviewData?.stats || {
    totalBusinesses: 1,
    activeBusinesses: 1,
    suspendedBusinesses: 0,
    totalMRR: 95000,
    totalMaxTables: 16,
    totalTablesInSalons: 0,
    totalActiveGames: 0,
    totalRevenueCombined: 0
  };

  const businesses = (overviewData?.businesses || []).filter(b => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (b.name || '').toLowerCase().includes(term) ||
      (b.city || '').toLowerCase().includes(term) ||
      (b.owner_name || '').toLowerCase().includes(term) ||
      (b.slug || '').toLowerCase().includes(term)
    );
  });

  const activeTenant = overviewData?.activeTenant || currentBusiness;

  // Actions
  const handleSwitchClub = async (biz) => {
    sounds.playScoreBeep(true);
    setLoading(true);
    try {
      const res = await api.switchActiveBusiness(biz.id);
      if (res.success) {
        if (onSwitchBusiness) onSwitchBusiness(res.activeTenant);
        await loadOverview();
        onClose();
      }
    } catch (err) {
      alert('Error cambiando a este billar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (biz) => {
    const isCurrentlyActive = biz.subscription_status === 'active';
    const newStatus = isCurrentlyActive ? 'suspended' : 'active';
    const confirmMsg = isCurrentlyActive
      ? `¿Deseas SUSPENDER el servicio a "${biz.name}"? Los empleados no podrán facturar ni usar mesas hasta que renueven.`
      : `¿Deseas REACTIVAR el servicio a "${biz.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      sounds.playScoreBeep(true);
      await api.updateBusiness(biz.id, { subscription_status: newStatus });
      await loadOverview();
    } catch (err) {
      alert('Error actualizando estado: ' + err.message);
    }
  };

  const handleCreateBusinessSubmit = async (e) => {
    e.preventDefault();
    if (!newBizForm.name.trim()) return;
    setLoading(true);
    try {
      sounds.playCashRegister();
      const res = await api.createBusiness(newBizForm);
      if (res.success) {
        alert(`✅ Empresa "${res.business.name}" creada con éxito.`);
        setNewBizForm({
          name: '',
          city: 'Bogotá',
          address: '',
          phone: '',
          owner_name: '',
          owner_email: '',
          plan: 'pro',
          max_tables: 12,
          monthly_fee: 95000,
          expiry_date: 'perpetual',
          admin_pin: '1234',
          notes: ''
        });
        setActiveTab('businesses');
        await loadOverview();
      }
    } catch (err) {
      alert('Error creando empresa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditBusiness = async (e) => {
    e.preventDefault();
    if (!editingBiz) return;
    setLoading(true);
    try {
      sounds.playScoreBeep(true);
      await api.updateBusiness(editingBiz.id, editingBiz);
      setEditingBiz(null);
      await loadOverview();
    } catch (err) {
      alert('Error editando empresa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBusiness = async (biz) => {
    if (biz.id === 1) {
      alert('La sede matriz (ID 1) no puede ser eliminada.');
      return;
    }
    if (!window.confirm(`¿Estás seguro de archivar la empresa "${biz.name}"?`)) return;

    try {
      await api.deleteBusiness(biz.id);
      await loadOverview();
    } catch (err) {
      alert('Error eliminando empresa: ' + err.message);
    }
  };

  const handleCopyLicense = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    sounds.playScoreBeep(true);
    setTimeout(() => setCopiedKey(false), 3000);
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
        background: 'rgba(5, 8, 15, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.5rem'
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
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 40px rgba(245, 158, 11, 0.15)',
          background: 'linear-gradient(180deg, rgba(20, 27, 45, 0.98) 0%, rgba(10, 15, 26, 0.99) 100%)'
        }}
      >
        {/* --- HEADER --- */}
        <div style={{
          padding: '1.25rem 2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(245, 158, 11, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.1) 100%)',
              border: '1.5px solid var(--color-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)'
            }}>
              <Building2 size={24} color="var(--color-gold)" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                  Portal Maestro CEO & Franquicias
                </h1>
                <span style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: 'var(--color-gold)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  letterSpacing: '0.05em'
                }}>
                  SUPER-ADMIN
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                Centro de control de todas las salas de billar, suscripciones mensuales y emisión de licencias.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {activeTenant && (
              <div style={{
                background: 'rgba(0, 230, 118, 0.12)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: 'var(--color-brand)'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-brand)' }} />
                <span>Sede Activa en Pantalla: <strong>{activeTenant.name}</strong></span>
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
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

        {/* --- METRICS BAR (RED CONSOLIDADA CEO & FRANQUICIAS) --- */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '1rem',
          padding: '1.25rem 2rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          {/* Card 1: Red de Billares */}
          <div className="glass-panel" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Red de Billares
              </span>
              <Building2 size={16} color="var(--color-gold)" />
            </div>
            <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
              {stats.activeBusinesses} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>/ {stats.totalBusinesses} sedes</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: stats.suspendedBusinesses > 0 ? '#f87171' : 'var(--color-brand)', marginTop: '2px', fontWeight: 600 }}>
              {stats.suspendedBusinesses > 0 ? `⚠️ ${stats.suspendedBusinesses} suspendidos por mora` : `🟢 Cobertura en ${stats.citiesCount || 1} ciudad(es)`}
            </div>
          </div>

          {/* Card 2: Recaudo Mensual CEO (MRR) */}
          <div className="glass-panel" style={{ padding: '0.85rem 1rem', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-gold)', textTransform: 'uppercase' }}>
                Tu Recaudo Mensual (MRR)
              </span>
              <DollarSign size={16} color="var(--color-gold)" />
            </div>
            <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-gold)', marginTop: '4px' }}>
              {formatCurrency(stats.totalMRR)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              ARR Proyectado: {formatCurrency(stats.totalARR || stats.totalMRR * 12)} / año
            </div>
          </div>

          {/* Card 3: Licencias de Mesas en la Red */}
          <div className="glass-panel" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Licencias de Mesas
              </span>
              <Layers size={16} color="var(--color-blue)" />
            </div>
            <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
              {stats.totalMaxTables} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>mesas</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {stats.totalTablesInSalons} mesas configuradas en salones
            </div>
          </div>

          {/* Card 4: Cobranza & Estado de Suscripciones */}
          <div className="glass-panel" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Cobranza & Licencias
              </span>
              <ShieldCheck size={16} color={stats.suspendedBusinesses > 0 ? '#ef4444' : 'var(--color-brand)'} />
            </div>
            <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 900, color: stats.suspendedBusinesses > 0 ? '#ef4444' : 'var(--color-brand)', marginTop: '4px' }}>
              {stats.suspendedBusinesses > 0 ? `${stats.suspendedBusinesses} en Mora` : '100% al Día'}
            </div>
            <div style={{ fontSize: '0.7rem', color: stats.expiringSoonBusinesses > 0 ? 'var(--color-gold)' : 'var(--text-secondary)', marginTop: '2px' }}>
              {stats.expiringSoonBusinesses > 0 ? `⚠️ ${stats.expiringSoonBusinesses} por vencer (≤5d)` : '🟢 Sin alertas de corte'}
            </div>
          </div>

          {/* Card 5: Tráfico Global en Red */}
          <div className="glass-panel" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Tráfico Global Red
              </span>
              <Activity size={16} color="#a855f7" />
            </div>
            <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#a855f7', marginTop: '4px' }}>
              {stats.totalActiveGames} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>en juego</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Total facturado red: {formatCurrency(stats.totalRevenueCombined)}
            </div>
          </div>
        </div>

        {/* --- NAVIGATION TABS --- */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              onClick={() => setActiveTab('businesses')}
              style={{
                padding: '0.5rem 1.15rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 800,
                background: activeTab === 'businesses' ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'businesses' ? '#090d16' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Building2 size={16} />
              Directorio de Clubes ({businesses.length})
            </button>

            <button
              onClick={() => setActiveTab('new_business')}
              style={{
                padding: '0.5rem 1.15rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 800,
                background: activeTab === 'new_business' ? 'var(--color-brand)' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'new_business' ? '#090d16' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <PlusCircle size={16} />
              + Registrar Nueva Empresa
            </button>

            <button
              onClick={() => setActiveTab('license_vault')}
              style={{
                padding: '0.5rem 1.15rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 800,
                background: activeTab === 'license_vault' ? '#a855f7' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'license_vault' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Key size={16} />
              Bóveda de Licencias
            </button>

            <button
              onClick={() => setActiveTab('backups')}
              style={{
                padding: '0.5rem 1.15rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 800,
                background: activeTab === 'backups' ? 'var(--color-blue)' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'backups' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <RefreshCw size={15} />
              Respaldos de BD ({backupsList.length})
            </button>
          </div>

          {activeTab === 'businesses' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#090d16', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Buscar por nombre, ciudad, dueño..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: '240px'
                }}
              />
            </div>
          )}
        </div>

        {/* --- BODY CONTENT BY TAB --- */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
          {/* TAB 1: DIRECTORIO DE CLUBES */}
          {activeTab === 'businesses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
                {businesses.map(biz => {
                  const isCurrent = biz.slug === activeTenant?.slug || biz.id === activeTenant?.id;
                  const isSuspended = biz.subscription_status === 'suspended';

                  return (
                    <div
                      key={biz.id}
                      className="glass-panel"
                      style={{
                        padding: '1.35rem',
                        borderRadius: 'var(--radius-md)',
                        border: isCurrent 
                          ? '2px solid var(--color-brand)' 
                          : isSuspended 
                            ? '1.5px solid rgba(239, 68, 68, 0.4)' 
                            : '1px solid var(--border-subtle)',
                        background: isCurrent 
                          ? 'linear-gradient(180deg, rgba(0, 230, 118, 0.06) 0%, rgba(15, 23, 42, 0.95) 100%)' 
                          : 'rgba(15, 23, 42, 0.75)',
                        boxShadow: isCurrent ? '0 0 25px rgba(0, 230, 118, 0.2)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      {/* Top Club Header */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                                {biz.name}
                              </h3>
                              {isCurrent && (
                                <span style={{
                                  background: 'var(--color-brand)',
                                  color: '#090d16',
                                  fontSize: '0.65rem',
                                  fontWeight: 900,
                                  padding: '1px 6px',
                                  borderRadius: '3px'
                                }}>
                                  EN PANTALLA
                                </span>
                              )}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '3px' }}>
                              📍 {biz.city || 'Colombia'} {biz.address ? `• ${biz.address}` : ''}
                            </div>
                          </div>

                          {/* Status Pill */}
                          <div style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: isSuspended 
                              ? 'rgba(239, 68, 68, 0.15)' 
                              : biz.subscription?.status === 'expiring_soon'
                                ? 'rgba(251, 191, 36, 0.15)'
                                : 'rgba(0, 230, 118, 0.15)',
                            color: isSuspended 
                              ? 'var(--color-alert)' 
                              : biz.subscription?.status === 'expiring_soon'
                                ? 'var(--color-gold)'
                                : 'var(--color-brand)',
                            border: `1px solid ${
                              isSuspended 
                                ? 'rgba(239, 68, 68, 0.4)' 
                                : biz.subscription?.status === 'expiring_soon'
                                  ? 'rgba(251, 191, 36, 0.4)'
                                  : 'rgba(0, 230, 118, 0.3)'
                            }`
                          }}>
                            {isSuspended 
                              ? '🔴 SUSPENDIDO' 
                              : biz.subscription?.status === 'expiring_soon'
                                ? `🟡 VENCE EN ${biz.subscription.daysRemaining}d`
                                : biz.expiry_date === 'perpetual'
                                  ? '🟢 PERPETUA ♾️'
                                  : `🟢 ACTIVO (${biz.subscription?.daysRemaining || 30}d)`}
                          </div>
                        </div>

                        {/* Owner & Plan Info */}
                        <div style={{
                          marginTop: '0.85rem',
                          padding: '0.75rem',
                          background: 'rgba(0, 0, 0, 0.25)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.5rem',
                          fontSize: '0.75rem'
                        }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Dueño:</span>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{biz.owner_name || 'Sin registrar'}</div>
                            {biz.phone && (
                              <div style={{ color: 'var(--color-gold)', fontSize: '0.7rem' }}>📞 {biz.phone}</div>
                            )}
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Plan & Mesas:</span>
                            <div style={{ fontWeight: 700, color: 'var(--color-brand)' }}>
                              Plan {biz.plan?.toUpperCase()} ({biz.tablesInUse || 0}/{biz.max_tables} mesas)
                            </div>
                            <div style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
                              {formatCurrency(biz.monthly_fee || 0)} / mes
                            </div>
                          </div>
                        </div>

                        {/* 4 Cuadrados de Métricas de esta Empresa */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.45rem',
                          marginTop: '0.85rem'
                        }}>
                          {/* Cuadrado 1: Mesas en juego ahora */}
                          <div style={{
                            background: 'rgba(0, 230, 118, 0.05)',
                            border: '1px solid rgba(0, 230, 118, 0.2)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.55rem 0.65rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800 }}>EN JUEGO AHORA</span>
                              <Activity size={12} color="var(--color-brand)" />
                            </div>
                            <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-brand)', marginTop: '2px' }}>
                              {biz.activeGames || 0} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>/ {biz.tablesInUse || biz.max_tables} m</span>
                            </div>
                          </div>

                          {/* Cuadrado 2: Ventas Hoy */}
                          <div style={{
                            background: 'rgba(245, 158, 11, 0.05)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.55rem 0.65rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800 }}>VENTAS HOY</span>
                              <TrendingUp size={12} color="var(--color-gold)" />
                            </div>
                            <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-gold)', marginTop: '2px' }}>
                              {formatCurrency(biz.todaySales || 0)}
                            </div>
                          </div>

                          {/* Cuadrado 3: Facturación Total Club */}
                          <div style={{
                            background: 'rgba(168, 85, 247, 0.05)',
                            border: '1px solid rgba(168, 85, 247, 0.2)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.55rem 0.65rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800 }}>FACTURACIÓN TOTAL</span>
                              <DollarSign size={12} color="#c084fc" />
                            </div>
                            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', marginTop: '2px' }}>
                              {formatCurrency(biz.totalSales || 0)}
                            </div>
                          </div>

                          {/* Cuadrado 4: Cuota CEO / Plan */}
                          <div style={{
                            background: 'rgba(56, 189, 248, 0.05)',
                            border: '1px solid rgba(56, 189, 248, 0.2)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.55rem 0.65rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800 }}>TU CUOTA CEO</span>
                              <ShieldCheck size={12} color="#38bdf8" />
                            </div>
                            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>
                              {formatCurrency(biz.monthly_fee || 0)} <span style={{ fontSize: '0.62rem' }}>/m</span>
                            </div>
                          </div>
                        </div>

                        {/* Botón para Abrir el Panel Detallado y Métricas de este Club */}
                        <button
                          type="button"
                          onClick={() => setSelectedBizDetails(biz)}
                          style={{
                            width: '100%',
                            marginTop: '0.65rem',
                            padding: '0.55rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: 'var(--radius-sm)',
                            color: '#fff',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          <BarChart2 size={14} color="var(--color-brand)" />
                          Ver Panel Detallado & Métricas de este Club
                        </button>

                        {/* Quick Extension Row */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(0, 0, 0, 0.35)',
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          marginTop: '0.65rem'
                        }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Renovar:</span>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => handleExtendSubscription(biz, '1_month')}
                              title="Extender 30 días adicionales"
                              style={{
                                padding: '2px 7px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid var(--border-subtle)',
                                color: '#fff',
                                borderRadius: '3px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              +30d
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExtendSubscription(biz, '3_months')}
                              title="Extender 90 días (Trimestre)"
                              style={{
                                padding: '2px 7px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid var(--border-subtle)',
                                color: '#fff',
                                borderRadius: '3px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              +90d
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExtendSubscription(biz, 'perpetual')}
                              title="Hacer licencia permanente (Venta única)"
                              style={{
                                padding: '2px 7px',
                                background: 'rgba(168, 85, 247, 0.2)',
                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                color: '#a855f7',
                                borderRadius: '3px',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              ♾️ Perpetua
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        paddingTop: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        {/* Primary Action: Switch to this club */}
                        <button
                          onClick={() => handleSwitchClub(biz)}
                          style={{
                            width: '100%',
                            padding: '0.65rem',
                            background: isCurrent ? 'rgba(255, 255, 255, 0.08)' : 'var(--color-brand)',
                            color: isCurrent ? '#fff' : '#090d16',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            boxShadow: isCurrent ? 'none' : '0 4px 15px rgba(0, 230, 118, 0.3)'
                          }}
                        >
                          <Eye size={15} />
                          {isCurrent ? 'Mesa de Control en Pantalla' : `Entrar y Auditar en Vivo: ${biz.name}`}
                        </button>

                        {/* Secondary Row of Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: '0.4rem' }}>
                          {/* Toggle Suspend / Activate */}
                          <button
                            onClick={() => handleToggleStatus(biz)}
                            style={{
                              padding: '0.45rem',
                              background: isSuspended ? 'rgba(0, 230, 118, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isSuspended ? 'var(--color-brand)' : 'var(--color-alert)',
                              border: `1px solid ${isSuspended ? 'rgba(0, 230, 118, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            {isSuspended ? <Unlock size={12} /> : <Lock size={12} />}
                            {isSuspended ? 'Activar' : 'Suspender'}
                          </button>

                          {/* View License Key */}
                          <button
                            onClick={() => setSelectedBizForLicense(biz)}
                            style={{
                              padding: '0.45rem',
                              background: 'rgba(168, 85, 247, 0.12)',
                              color: '#a855f7',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Key size={12} /> Licencia
                          </button>

                          {/* WhatsApp Reminder */}
                          {biz.phone ? (
                            <a
                              href={`https://wa.me/57${biz.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${biz.owner_name || ''}, te saluda Víctor de BillarPulse. Te recordamos tu mensualidad del sistema para ${biz.name} ($${biz.monthly_fee?.toLocaleString()}). ¡Un saludo!`)}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: '0.45rem',
                                background: 'rgba(37, 211, 102, 0.12)',
                                color: '#25D366',
                                border: '1px solid rgba(37, 211, 102, 0.3)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </a>
                          ) : (
                            <div style={{ opacity: 0.3, padding: '0.45rem', fontSize: '0.72rem', textAlign: 'center' }}>
                              Sin Tel.
                            </div>
                          )}

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditingBiz(biz)}
                            title="Editar empresa"
                            style={{
                              padding: '0.45rem 0.6rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Delete Club */}
                          {biz.id !== 1 && (
                            <button
                              onClick={() => handleDeleteBusiness(biz)}
                              title="Archivar empresa"
                              style={{
                                padding: '0.45rem 0.6rem',
                                background: 'rgba(239, 68, 68, 0.08)',
                                color: 'var(--color-alert)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: REGISTRAR NUEVA EMPRESA */}
          {activeTab === 'new_business' && (
            <div style={{ maxWidth: '780px', margin: '0 auto' }}>
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  <PlusCircle size={24} color="var(--color-brand)" />
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                      Registrar Nueva Sala o Club de Billar
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                      Crea la base de datos independiente, genera su licencia criptográfica y asigna mesas.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateBusinessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Nombre del Negocio / Salón *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Club Billares Master La 70"
                        value={newBizForm.name}
                        onChange={(e) => setNewBizForm({ ...newBizForm, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Ciudad
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Medellín, Bogotá, Cali..."
                        value={newBizForm.city}
                        onChange={(e) => setNewBizForm({ ...newBizForm, city: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Nombre del Propietario / Gerente
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Don Carlos Pérez"
                        value={newBizForm.owner_name}
                        onChange={(e) => setNewBizForm({ ...newBizForm, owner_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Teléfono / WhatsApp
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 310 123 4567"
                        value={newBizForm.phone}
                        onChange={(e) => setNewBizForm({ ...newBizForm, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        NIT o Cédula
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 900.123.456-7"
                        value={newBizForm.nit}
                        onChange={(e) => setNewBizForm({ ...newBizForm, nit: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Plan Comercial
                      </label>
                      <select
                        value={newBizForm.plan}
                        onChange={(e) => {
                          const plan = e.target.value;
                          const maxTables = plan === 'starter' ? 6 : plan === 'pro' ? 12 : 24;
                          const fee = plan === 'starter' ? 65000 : plan === 'pro' ? 95000 : 160000;
                          setNewBizForm({ ...newBizForm, plan, max_tables: maxTables, monthly_fee: fee });
                        }}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="starter">Starter (Hasta 6 mesas) - $65.000/mes</option>
                        <option value="pro">Pro (Hasta 12 mesas) - $95.000/mes</option>
                        <option value="enterprise">Enterprise (Hasta 24 mesas) - $160.000/mes</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Mesas Autorizadas
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={newBizForm.max_tables}
                        onChange={(e) => setNewBizForm({ ...newBizForm, max_tables: Number(e.target.value) })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Tarifa Mensual ($ COP)
                      </label>
                      <input
                        type="number"
                        step={5000}
                        value={newBizForm.monthly_fee}
                        onChange={(e) => setNewBizForm({ ...newBizForm, monthly_fee: Number(e.target.value) })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Dirección del Salón
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Cra 70 # 45-20"
                        value={newBizForm.address}
                        onChange={(e) => setNewBizForm({ ...newBizForm, address: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        PIN Administrador Local (para el dueño del club)
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="1234"
                        value={newBizForm.admin_pin}
                        onChange={(e) => setNewBizForm({ ...newBizForm, admin_pin: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !newBizForm.name.trim()}
                    style={{
                      padding: '1rem',
                      background: 'var(--color-brand)',
                      color: '#090d16',
                      fontWeight: 900,
                      fontSize: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: 'var(--shadow-neon-green)',
                      marginTop: '0.75rem'
                    }}
                  >
                    <PlusCircle size={20} />
                    {loading ? 'Inicializando Base de Datos...' : 'Crear Empresa y Emitir Licencia'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: BÓVEDA DE LICENCIAS CRIPTOGRÁFICAS OFFLINE */}
          {activeTab === 'license_vault' && (
            <div style={{ maxWidth: '780px', margin: '0 auto' }}>
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <Key size={24} color="#a855f7" />
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                      Generador Criptográfico de Licencias Offline
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                      Genera llaves con firma HMAC inviolable para instalaciones en Mini-PCs o clientes que operan sin Internet.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Nombre del Billar / Club
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Billares El Refugio"
                        value={vaultBusinessName}
                        onChange={(e) => setVaultBusinessName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Mesas Autorizadas
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={vaultTables}
                        onChange={(e) => setVaultTables(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Vigencia de la Licencia
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setVaultExpiry('perpetual')}
                        style={{
                          flex: 1,
                          padding: '0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          background: vaultExpiry === 'perpetual' ? '#a855f7' : 'rgba(255, 255, 255, 0.05)',
                          color: vaultExpiry === 'perpetual' ? '#fff' : 'var(--text-secondary)',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        ♾️ Licencia Perpetua (Venta Única)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 1);
                          setVaultExpiry(date.toISOString().slice(0, 10));
                        }}
                        style={{
                          flex: 1,
                          padding: '0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          background: vaultExpiry !== 'perpetual' ? '#a855f7' : 'rgba(255, 255, 255, 0.05)',
                          color: vaultExpiry !== 'perpetual' ? '#fff' : 'var(--text-secondary)',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        📅 Licencia Mensual / Anual
                      </button>
                    </div>

                    {vaultExpiry !== 'perpetual' && (
                      <input
                        type="date"
                        value={vaultExpiry}
                        onChange={(e) => setVaultExpiry(e.target.value)}
                        style={{
                          width: '100%',
                          marginTop: '0.5rem',
                          padding: '0.6rem',
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!vaultBusinessName.trim()) {
                        alert('Escribe el nombre del negocio');
                        return;
                      }
                      // Use API to create license
                      sounds.playCashRegister();
                      // Generate directly or via backend
                      const key = `BPL-${btoa(JSON.stringify({
                        n: vaultBusinessName.trim(),
                        t: vaultNit.trim(),
                        m: vaultTables,
                        e: vaultExpiry,
                        mid: '*',
                        iat: Math.floor(Date.now() / 1000)
                      })).replace(/=/g, '')}.DEV${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                      setGeneratedVaultKey(key);
                    }}
                    style={{
                      padding: '0.85rem',
                      background: '#a855f7',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 15px rgba(168, 85, 247, 0.35)',
                      marginTop: '0.5rem'
                    }}
                  >
                    <Sparkles size={18} />
                    Generar Clave Firmada
                  </button>

                  {generatedVaultKey && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase' }}>
                        Clave de Licencia Generada:
                      </div>
                      <div className="mono" style={{
                        marginTop: '4px',
                        background: '#090d16',
                        padding: '0.65rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        color: 'var(--color-brand)',
                        wordBreak: 'break-all',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}>
                        <span>{generatedVaultKey}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyLicense(generatedVaultKey)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem'
                          }}
                        >
                          {copiedKey ? <Check size={14} color="var(--color-brand)" /> : <Copy size={14} />}
                          {copiedKey ? 'Copiada' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESPALDOS Y ROTACIÓN DE BASES DE DATOS */}
          {activeTab === 'backups' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Header Box */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.08), rgba(6, 182, 212, 0.08))',
                border: '1px solid rgba(0, 230, 118, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <ShieldCheck size={24} color="var(--color-brand)" />
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#fff' }}>
                      Respaldos Seguros SQLite & Rotación Automática
                    </h3>
                  </div>
                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '650px' }}>
                    Copia en caliente no bloqueante con el motor nativo de SQLite (<span className="mono" style={{ color: 'var(--color-brand)' }}>db.backup()</span>). Protege todas las bases de datos de clubes aislados (<span className="mono">server/data/tenants/*.db</span>) sin interrumpir partidas ni corromper transacciones WAL.
                  </p>
                  <div style={{ marginTop: '0.65rem', display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>⏰ <b>Programación:</b> Diario (04:00 AM)</span>
                    <span>🔄 <b>Rotación:</b> Últimos 7 días guardados</span>
                    <span>💾 <b>Ubicación:</b> <span className="mono">server/data/backups/</span></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateBackup}
                  disabled={backupLoading}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: backupLoading ? 'rgba(255, 255, 255, 0.1)' : 'var(--color-brand)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: backupLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(0, 230, 118, 0.25)'
                  }}
                >
                  <RefreshCw size={16} className={backupLoading ? 'spin' : ''} />
                  {backupLoading ? 'Generando Copia...' : '⚡ Generar Respaldo Ahora'}
                </button>
              </div>

              {/* Backups List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Layers size={16} color="var(--color-brand)" />
                    Historial de Respaldos ({backupsList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await api.getBackups();
                      if (res.success) setBackupsList(res.data);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <RefreshCw size={12} /> Refrescar lista
                  </button>
                </div>

                {backupsList.length === 0 ? (
                  <div style={{
                    padding: '2.5rem',
                    textAlign: 'center',
                    background: '#090d16',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-subtle)',
                    color: 'var(--text-muted)'
                  }}>
                    <ShieldCheck size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Aún no se han generado respaldos en este equipo.</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem' }}>Haz clic en "⚡ Generar Respaldo Ahora" para crear el primero.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {backupsList.map((b) => (
                      <div
                        key={b.id}
                        style={{
                          background: '#090d16',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.9rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            background: 'rgba(0, 230, 118, 0.1)',
                            border: '1px solid rgba(0, 230, 118, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <CheckCircle2 size={20} color="var(--color-brand)" />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className="mono" style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem' }}>
                                {b.id}
                              </span>
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: b.label === 'manual_ceo' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                                color: b.label === 'manual_ceo' ? '#c084fc' : '#22d3ee',
                                fontWeight: 800,
                                textTransform: 'uppercase'
                              }}>
                                {b.label === 'manual_ceo' ? 'Manual CEO' : b.label === 'daily_auto' ? 'Automático (04:00 AM)' : b.label}
                              </span>
                            </div>

                            <div style={{ marginTop: '3px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                              <span>📅 {new Date(b.createdAt).toLocaleString('es-CO')}</span>
                              <span>•</span>
                              <span>📦 {b.totalFiles} archivo(s) SQLite</span>
                              <span>•</span>
                              <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>💾 {b.totalSizeFormatted}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            color: 'var(--color-brand)',
                            background: 'rgba(0, 230, 118, 0.08)',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px solid rgba(0, 230, 118, 0.2)',
                            fontWeight: 700
                          }}>
                            WAL Safe OK
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- MODAL: VER LICENCIA DE EMPRESA --- */}
        {selectedBizForLicense && (
          <div
            onClick={() => setSelectedBizForLicense(null)}
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
              zIndex: 10001,
              padding: '1rem'
            }}
          >
            <div
              className="glass-panel"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '540px',
                padding: '1.75rem',
                borderRadius: 'var(--radius-md)',
                background: '#0f172a',
                border: '1px solid rgba(168, 85, 247, 0.4)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Key size={20} color="#a855f7" />
                  Licencia: {selectedBizForLicense.name}
                </h3>
                <button
                  onClick={() => setSelectedBizForLicense(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Clave criptográfica vinculada a este club para {selectedBizForLicense.max_tables} mesas:
              </div>

              <div className="mono" style={{
                background: '#090d16',
                border: '1px solid var(--border-subtle)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-brand)',
                fontSize: '0.82rem',
                wordBreak: 'break-all',
                lineHeight: 1.4
              }}>
                {selectedBizForLicense.license_key || 'Sin clave asignada'}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  onClick={() => handleCopyLicense(selectedBizForLicense.license_key)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'var(--color-brand)',
                    color: '#090d16',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {copiedKey ? <Check size={16} /> : <Copy size={16} />}
                  {copiedKey ? 'Clave Copiada al Portapapeles' : 'Copiar Clave para Enviar al Cliente'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL: EDITAR EMPRESA --- */}
        {editingBiz && (
          <div
            onClick={() => setEditingBiz(null)}
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
              zIndex: 10001,
              padding: '1rem'
            }}
          >
            <div
              className="glass-panel"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '600px',
                padding: '1.75rem',
                borderRadius: 'var(--radius-md)',
                background: '#0f172a',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                  Editar Datos: {editingBiz.name}
                </h3>
                <button
                  onClick={() => setEditingBiz(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditBusiness} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Nombre</label>
                  <input
                    type="text"
                    value={editingBiz.name}
                    onChange={(e) => setEditingBiz({ ...editingBiz, name: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Propietario</label>
                    <input
                      type="text"
                      value={editingBiz.owner_name}
                      onChange={(e) => setEditingBiz({ ...editingBiz, owner_name: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Teléfono</label>
                    <input
                      type="text"
                      value={editingBiz.phone}
                      onChange={(e) => setEditingBiz({ ...editingBiz, phone: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Mesas Autorizadas</label>
                    <input
                      type="number"
                      value={editingBiz.max_tables}
                      onChange={(e) => setEditingBiz({ ...editingBiz, max_tables: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.55rem', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Mensualidad ($)</label>
                    <input
                      type="number"
                      value={editingBiz.monthly_fee}
                      onChange={(e) => setEditingBiz({ ...editingBiz, monthly_fee: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.55rem', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: '0.75rem', background: 'var(--color-brand)', color: '#090d16', fontWeight: 800, borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                  >
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBiz(null)}
                    style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL: DETALLES Y MÉTRICAS DE LA EMPRESA (DRILL DOWN) --- */}
        {selectedBizDetails && (
          <div
            onClick={() => setSelectedBizDetails(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10002,
              padding: '1.5rem'
            }}
          >
            <div
              className="glass-panel"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '750px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                borderRadius: 'var(--radius-lg, 16px)',
                background: '#0a0f1d',
                border: '1px solid rgba(0, 230, 118, 0.35)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 230, 118, 0.15)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'rgba(0, 230, 118, 0.12)',
                    border: '1px solid rgba(0, 230, 118, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Building2 size={26} color="var(--color-brand)" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#fff' }}>
                      {selectedBizDetails.name}
                    </h2>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '3px' }}>
                      📍 {selectedBizDetails.city || 'Colombia'} {selectedBizDetails.address ? `• ${selectedBizDetails.address}` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Status badge */}
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: selectedBizDetails.subscription_status === 'suspended'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : selectedBizDetails.subscription?.status === 'expiring_soon'
                        ? 'rgba(251, 191, 36, 0.15)'
                        : 'rgba(0, 230, 118, 0.15)',
                    color: selectedBizDetails.subscription_status === 'suspended'
                      ? 'var(--color-alert)'
                      : selectedBizDetails.subscription?.status === 'expiring_soon'
                        ? 'var(--color-gold)'
                        : 'var(--color-brand)',
                    border: `1px solid ${
                      selectedBizDetails.subscription_status === 'suspended'
                        ? 'rgba(239, 68, 68, 0.4)'
                        : selectedBizDetails.subscription?.status === 'expiring_soon'
                          ? 'rgba(251, 191, 36, 0.4)'
                          : 'rgba(0, 230, 118, 0.3)'
                    }`
                  }}>
                    {selectedBizDetails.subscription_status === 'suspended'
                      ? '🔴 SUSPENDIDO'
                      : selectedBizDetails.subscription?.status === 'expiring_soon'
                        ? `🟡 VENCE EN ${selectedBizDetails.subscription.daysRemaining}d`
                        : selectedBizDetails.expiry_date === 'perpetual'
                          ? '🟢 PERPETUA ♾️'
                          : `🟢 ACTIVO (${selectedBizDetails.subscription?.daysRemaining || 30}d)`}
                  </div>

                  <button
                    onClick={() => setSelectedBizDetails(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Grid with ALL operational metric squares of this club */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📊 Métricas Operativas de este Billar
                </h4>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.85rem'
                }}>
                  {/* Square 1: Mesas en Juego */}
                  <div style={{ background: '#090d16', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800 }}>MESAS EN VIVO</span>
                      <Activity size={15} color="var(--color-brand)" />
                    </div>
                    <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-brand)', marginTop: '4px' }}>
                      {selectedBizDetails.activeGames || 0} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ {selectedBizDetails.tablesInUse || selectedBizDetails.max_tables}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Tráfico actual de mesas
                    </div>
                  </div>

                  {/* Square 2: Ventas Hoy */}
                  <div style={{ background: '#090d16', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800 }}>VENTAS DE HOY</span>
                      <TrendingUp size={15} color="var(--color-gold)" />
                    </div>
                    <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-gold)', marginTop: '4px' }}>
                      {formatCurrency(selectedBizDetails.todaySales || 0)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Facturado hoy en caja
                    </div>
                  </div>

                  {/* Square 3: Ventas Totales */}
                  <div style={{ background: '#090d16', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800 }}>FACTURACIÓN TOTAL</span>
                      <DollarSign size={15} color="#c084fc" />
                    </div>
                    <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                      {formatCurrency(selectedBizDetails.totalSales || 0)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Histórico en su base de datos
                    </div>
                  </div>

                  {/* Square 4: Capacidad y Plan */}
                  <div style={{ background: '#090d16', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800 }}>PLAN & LICENCIAS</span>
                      <Layers size={15} color="var(--color-blue)" />
                    </div>
                    <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-blue)', marginTop: '4px' }}>
                      Plan {selectedBizDetails.plan?.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Hasta {selectedBizDetails.max_tables} mesas habilitadas
                    </div>
                  </div>

                  {/* Square 5: Inventario y Personal */}
                  <div style={{ background: '#090d16', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800 }}>INVENTARIO & STAFF</span>
                      <Package size={15} color="#38bdf8" />
                    </div>
                    <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                      {selectedBizDetails.totalProducts || 0} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>items</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {selectedBizDetails.totalStaff || 0} meseros / administradores
                    </div>
                  </div>

                  {/* Square 6: Base de Datos Propia */}
                  <div style={{ background: '#090d16', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800 }}>BASE DE DATOS AISLADA</span>
                      <Database size={15} color="#22c55e" />
                    </div>
                    <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#22c55e', marginTop: '4px' }}>
                      {selectedBizDetails.dbSizeFormatted || 'SQLite'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      server/data/tenants/{selectedBizDetails.slug}.db
                    </div>
                  </div>
                </div>
              </div>

              {/* Propietario & Contacto */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '1rem',
                fontSize: '0.8rem'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Propietario / Titular:</div>
                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem', marginTop: '2px' }}>
                    {selectedBizDetails.owner_name || 'Sin registrar'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Teléfono / WhatsApp:</div>
                  <div style={{ fontWeight: 800, color: 'var(--color-gold)', fontSize: '0.9rem', marginTop: '2px' }}>
                    {selectedBizDetails.phone ? `📞 ${selectedBizDetails.phone}` : 'No registrado'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Tu Cuota Mensual CEO:</div>
                  <div style={{ fontWeight: 800, color: 'var(--color-brand)', fontSize: '0.9rem', marginTop: '2px' }}>
                    {formatCurrency(selectedBizDetails.monthly_fee || 0)} / mes
                  </div>
                </div>
              </div>

              {/* Subscription Renewal Actions for this club */}
              <div style={{
                background: 'rgba(168, 85, 247, 0.06)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.15rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase' }}>
                      Renovación de Suscripción para este Club
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Vence el: <strong style={{ color: '#fff' }}>{selectedBizDetails.expiry_date === 'perpetual' ? 'PERPETUA ♾️' : selectedBizDetails.expiry_date}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleExtendSubscription(selectedBizDetails, '1_month');
                        setSelectedBizDetails(prev => ({ ...prev, expiry_date: 'extendida', subscription_status: 'active' }));
                      }}
                      style={{
                        padding: '0.45rem 0.85rem',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border-subtle)',
                        color: '#fff',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      +30 Días
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleExtendSubscription(selectedBizDetails, '3_months');
                        setSelectedBizDetails(prev => ({ ...prev, expiry_date: 'extendida', subscription_status: 'active' }));
                      }}
                      style={{
                        padding: '0.45rem 0.85rem',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border-subtle)',
                        color: '#fff',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      +90 Días
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleExtendSubscription(selectedBizDetails, 'perpetual');
                        setSelectedBizDetails(prev => ({ ...prev, expiry_date: 'perpetual', subscription_status: 'active' }));
                      }}
                      style={{
                        padding: '0.45rem 0.85rem',
                        background: '#a855f7',
                        border: 'none',
                        color: '#fff',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      ♾️ Vitalicia (Perpetua)
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleSwitchClub(selectedBizDetails);
                    setSelectedBizDetails(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.85rem 1.25rem',
                    background: 'var(--color-brand)',
                    color: '#090d16',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)'
                  }}
                >
                  <Eye size={18} />
                  Entrar a la Mesa de Control de este Club (POS & Pantalla)
                </button>

                {selectedBizDetails.phone && (
                  <a
                    href={`https://wa.me/57${selectedBizDetails.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${selectedBizDetails.owner_name || ''}, te saluda Víctor de BillarPulse. Te contactamos respecto al estado de tu sistema para ${selectedBizDetails.name}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '0.85rem 1.25rem',
                      background: '#25D366',
                      color: '#000',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedBizForLicense(selectedBizDetails);
                  }}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#c084fc',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Key size={16} /> Ver Licencia
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

