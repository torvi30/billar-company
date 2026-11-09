import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Layers, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  Check, 
  Search, 
  DollarSign, 
  AlertCircle,
  Store,
  Download,
  HardDrive,
  ShieldCheck,
  Users,
  UserPlus,
  KeyRound,
  Award,
  TrendingUp,
  Phone,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Key,
  Copy,
  Globe,
  Coins,
  Sparkles,
  AlertTriangle,
  Send,
  Bell,
  MessageSquare,
  MessageCircle,
  Sun,
  Moon,
  Share2
} from 'lucide-react';
import { formatCurrency, setCurrencyConfig } from '../utils/formatters';
import { sounds } from '../utils/audio';
import { api } from '../services/api';

const CURRENCY_PRESETS = [
  { label: '🇨🇴 Colombia (COP - $)', symbol: '$', code: 'COP', locale: 'es-CO', decimals: 0 },
  { label: '🇲🇽 México (MXN - $)', symbol: '$', code: 'MXN', locale: 'es-MX', decimals: 2 },
  { label: '🇵🇪 Perú (PEN - S/.)', symbol: 'S/.', code: 'PEN', locale: 'es-PE', decimals: 2 },
  { label: '🇺🇸 Estados Unidos / Dólar (USD - $)', symbol: '$', code: 'USD', locale: 'en-US', decimals: 2 },
  { label: '🇨🇱 Chile (CLP - $)', symbol: '$', code: 'CLP', locale: 'es-CL', decimals: 0 },
  { label: '🇪🇸 España / Euro (EUR - €)', symbol: '€', code: 'EUR', locale: 'es-ES', decimals: 2 },
  { label: '🇦🇷 Argentina (ARS - $)', symbol: '$', code: 'ARS', locale: 'es-AR', decimals: 2 },
  { label: '🇪🇨 Ecuador (USD - $)', symbol: '$', code: 'USD', locale: 'es-EC', decimals: 2 },
  { label: '🇧🇴 Bolivia (BOB - Bs)', symbol: 'Bs', code: 'BOB', locale: 'es-BO', decimals: 2 },
  { label: '🌐 Otra moneda personalizada', symbol: '$', code: 'CUSTOM', locale: 'es-CO', decimals: 0 }
];

export default function AdminManagementModal({ isOpen, onClose, onRefreshData, theme = 'dark', onToggleTheme = () => {}, initialTab = 'inventory' }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof initialTab === 'string') {
      if (initialTab === 'inventory-low-stock' || initialTab === 'low-stock') return 'inventory';
      return initialTab;
    }
    return 'inventory';
  });

  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (typeof initialTab === 'string') {
        if (initialTab === 'inventory-low-stock' || initialTab === 'low-stock') {
          setActiveTab('inventory');
          setFilterLowStockOnly(true);
          setSelectedCategory('Todas');
          setSearchQuery('');
        } else {
          setActiveTab(initialTab);
          setFilterLowStockOnly(false);
        }
      } else {
        setActiveTab('inventory');
        setFilterLowStockOnly(false);
      }
    }
  }, [isOpen, initialTab]);

  // License state
  const [licenseData, setLicenseData] = useState(null);
  const [licenseInput, setLicenseInput] = useState('');
  const [activatingLicense, setActivatingLicense] = useState(false);
  const [licenseMsg, setLicenseMsg] = useState(null);
  const [copiedMid, setCopiedMid] = useState(false);

  // Staff & Waiters state
  const [staffList, setStaffList] = useState([]);
  const [waiterSales, setWaiterSales] = useState([]);
  const [staffPeriod, setStaffPeriod] = useState('today');
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    pin: '',
    role: 'mesero',
    phone: '',
    is_active: 1
  });
  const [staffSaving, setStaffSaving] = useState(false);
  const [revealedPins, setRevealedPins] = useState({});

  // Business settings state
  const [businessForm, setBusinessForm] = useState({
    business_name: '',
    business_nit: '',
    business_phone: '',
    business_address: '',
    ticket_footer: '',
    grace_period_minutes: '3',
    rounding_mode: 'exact',
    currency_symbol: '$',
    currency_code: 'COP',
    currency_locale: 'es-CO',
    currency_decimals: '0',
    owner_whatsapp: '',
    notify_whatsapp_on_close: '1',
    app_theme: 'dark'
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  
  // Product creation/editing form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Cervezas');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('10');

  // Table editing
  const [editingTableId, setEditingTableId] = useState(null);
  const [editTableName, setEditTableName] = useState('');
  const [editTableRate, setEditTableRate] = useState('');
  const [editTableType, setEditTableType] = useState('pool');
  const [editTableStatus, setEditTableStatus] = useState('available');

  // New table form
  const [showNewTableForm, setShowNewTableForm] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableRate, setNewTableRate] = useState('8000');
  const [newTableType, setNewTableType] = useState('pool');
  const [newTableStatus, setNewTableStatus] = useState('available');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [prodRes, tablesRes, settingsRes, staffRes, waiterSalesRes, licenseRes] = await Promise.all([
        api.getAdminProducts(),
        api.getTables(),
        api.getSettings(),
        api.getAdminStaff().catch(() => ({ success: false })),
        api.getWaiterSales(staffPeriod).catch(() => ({ success: false })),
        api.getLicense().catch(() => ({ success: false }))
      ]);
      if (prodRes?.success) setProducts(prodRes.data);
      if (tablesRes?.success) setTables(tablesRes.data);
      if (settingsRes?.success && settingsRes.data) {
        setBusinessForm(prev => ({ ...prev, ...settingsRes.data }));
        setCurrencyConfig(settingsRes.data);
      }
      if (staffRes?.success) setStaffList(staffRes.data);
      if (waiterSalesRes?.success) setWaiterSales(waiterSalesRes.data);
      if (licenseRes?.success) setLicenseData(licenseRes.data);
    } catch (e) {
      console.error('Error cargando datos de administración:', e);
    }
  };

  const handleSaveBusinessSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      sounds.playScoreBeep(true);
      for (const [key, val] of Object.entries(businessForm)) {
        await api.updateSetting(key, val);
      }
      setCurrencyConfig(businessForm);
      sounds.playCashRegister();
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error guardando configuración: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCurrencyPresetChange = (presetLabel) => {
    const found = CURRENCY_PRESETS.find(p => p.label === presetLabel);
    if (found) {
      setBusinessForm(prev => ({
        ...prev,
        currency_symbol: found.symbol,
        currency_code: found.code,
        currency_locale: found.locale,
        currency_decimals: String(found.decimals)
      }));
    }
  };

  const handleCopyMachineId = () => {
    if (licenseData?.machineId) {
      navigator.clipboard.writeText(licenseData.machineId);
      setCopiedMid(true);
      sounds.playScoreBeep(true);
      setTimeout(() => setCopiedMid(false), 2500);
    }
  };

  const handleActivateLicense = async (e) => {
    e.preventDefault();
    if (!licenseInput.trim()) return;
    setActivatingLicense(true);
    setLicenseMsg(null);
    try {
      const res = await api.activateLicense(licenseInput.trim());
      if (res.success) {
        sounds.playCashRegister();
        setLicenseData(res.data);
        setLicenseMsg({ type: 'success', text: res.message || '¡Licencia activada con éxito!' });
        setLicenseInput('');
        if (onRefreshData) onRefreshData();
      } else {
        sounds.playError();
        setLicenseMsg({ type: 'error', text: res.error || 'Clave de licencia inválida o no corresponde a este equipo.' });
      }
    } catch (err) {
      sounds.playError();
      setLicenseMsg({ type: 'error', text: err.message || 'Error de conexión' });
    } finally {
      setActivatingLicense(false);
    }
  };

  const handleTestWhatsApp = () => {
    if (!businessForm.owner_whatsapp || !businessForm.owner_whatsapp.trim()) {
      sounds.playError();
      alert('Por favor escribe el número de WhatsApp del dueño antes de probar.');
      return;
    }
    sounds.playScoreBeep(true);
    const clubName = businessForm.business_name || 'BILLARPULSE';
    const now = new Date().toLocaleTimeString(businessForm.currency_locale || 'es-CO');
    const msg = [
      `🎱 *¡HOLA DESDE BILLARPULSE!*`,
      `🏢 *Club:* ${clubName}`,
      `🕒 *Hora:* ${now}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `✅ Las alertas automáticas por WhatsApp están vinculadas correctamente a este número.`,
      `📲 Cada vez que un cajero realice el *Cierre de Turno (Corte Z)* recibirás el resumen financiero completo aquí.`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `_BillarPulse POS - Control Total en la Palma de tu Mano_`
    ].join('\n');

    let cleanPhone = businessForm.owner_whatsapp.replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+') && cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
      cleanPhone = '57' + cleanPhone;
    }
    cleanPhone = cleanPhone.replace('+', '');

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleLoadWaiterSales = async (period) => {
    setStaffPeriod(period);
    try {
      const res = await api.getWaiterSales(period);
      if (res?.success) setWaiterSales(res.data);
    } catch (e) {
      console.error('Error cargando ventas de meseros:', e);
    }
  };

  const openStaffForm = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setStaffForm({
        name: staff.name,
        pin: staff.pin || '',
        role: staff.role || 'mesero',
        phone: staff.phone || '',
        is_active: staff.is_active != null ? staff.is_active : 1
      });
    } else {
      setEditingStaff(null);
      setStaffForm({
        name: '',
        pin: '',
        role: 'mesero',
        phone: '',
        is_active: 1
      });
    }
    setShowStaffForm(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.name.trim()) return alert('El nombre del colaborador es obligatorio');
    if (!staffForm.pin || !/^\d{4}$/.test(staffForm.pin)) {
      return alert('El PIN debe tener exactamente 4 dígitos numéricos para acceso rápido');
    }

    setStaffSaving(true);
    try {
      sounds.playScoreBeep(true);
      if (editingStaff) {
        await api.updateStaff(editingStaff.id, staffForm);
      } else {
        await api.createStaff(staffForm);
      }
      sounds.playCashRegister();
      setShowStaffForm(false);
      const res = await api.getAdminStaff();
      if (res?.success) setStaffList(res.data);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error guardando personal: ' + err.message);
    } finally {
      setStaffSaving(false);
    }
  };

  const handleToggleStaffActive = async (staff) => {
    try {
      sounds.playScoreBeep(true);
      const newStatus = staff.is_active ? 0 : 1;
      await api.updateStaff(staff.id, { is_active: newStatus });
      const res = await api.getAdminStaff();
      if (res?.success) setStaffList(res.data);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error cambiando estado: ' + err.message);
    }
  };

  const handleDeleteStaff = async (staff) => {
    if (!confirm(`¿Eliminar al colaborador "${staff.name}"? Sus ventas históricas se mantendrán registradas.`)) return;
    try {
      sounds.playScoreBeep(false);
      await api.deleteStaff(staff.id);
      const res = await api.getAdminStaff();
      if (res?.success) setStaffList(res.data);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error eliminando colaborador: ' + err.message);
    }
  };

  const togglePinReveal = (id) => {
    setRevealedPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen) return null;

  // Categories list
  const categories = ['Todas', ...new Set(products.map(p => p.category))];
  const lowStockCount = products.filter(p => p.stock <= (p.min_stock != null ? p.min_stock : 10)).length;
  
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = !filterLowStockOnly || (p.stock <= (p.min_stock != null ? p.min_stock : 10));
    return matchesCategory && matchesSearch && matchesLowStock;
  });

  // Open product form for create or edit
  const openProductForm = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setFormName(prod.name);
      setFormCategory(prod.category);
      setFormPrice(String(prod.price));
      setFormStock(String(prod.stock));
      setFormMinStock(String(prod.min_stock != null ? prod.min_stock : 10));
    } else {
      setEditingProduct(null);
      setFormName('');
      setFormCategory('Cervezas');
      setFormPrice('');
      setFormStock('50');
      setFormMinStock('10');
    }
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formName || !formPrice) return alert('Por favor ingresa nombre y precio');

    try {
      sounds.playScoreBeep(true);
      const payload = {
        name: formName,
        category: formCategory,
        price: Number(formPrice),
        stock: Number(formStock),
        min_stock: Number(formMinStock || 10)
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setShowProductForm(false);
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error guardando producto: ' + err.message);
    }
  };

  const handleAdjustStock = async (prodId, delta) => {
    try {
      sounds.playScoreBeep(true);
      await api.adjustStock(prodId, delta);
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Error ajustando stock:', err);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!confirm('¿Seguro de desactivar este producto?')) return;
    try {
      sounds.playScoreBeep(false);
      await api.deleteProduct(prodId);
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Start editing table
  const startEditTable = (table) => {
    setEditingTableId(table.id);
    setEditTableName(table.name);
    setEditTableRate(String(table.hourly_rate));
    setEditTableType(table.type);
    setEditTableStatus(table.status || 'available');
  };

  const saveEditTable = async (tableId) => {
    try {
      sounds.playScoreBeep(true);
      await api.updateTable(tableId, {
        name: editTableName,
        hourly_rate: Number(editTableRate),
        type: editTableType,
        status: editTableStatus
      });
      setEditingTableId(null);
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error actualizando mesa: ' + err.message);
    }
  };

  const handleToggleTableMaintenance = async (table) => {
    try {
      sounds.playScoreBeep(true);
      const nextStatus = table.status === 'maintenance' ? 'available' : 'maintenance';
      await api.updateTable(table.id, { status: nextStatus });
      sounds.playCashRegister();
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      sounds.playError();
      alert('Error cambiando estado de mantenimiento: ' + err.message);
    }
  };

  const handleDeleteTable = async (table) => {
    if (table.status === 'occupied') {
      sounds.playError();
      alert('No puedes eliminar una mesa con partida en curso. Debes finalizar o cobrar la partida primero.');
      return;
    }
    if (!confirm(`¿Estás seguro de archivar/eliminar la Mesa ${table.table_number} (${table.name})?`)) return;
    try {
      sounds.playScoreBeep(false);
      await api.deleteTable(table.id);
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      sounds.playError();
      alert('Error eliminando mesa: ' + err.message);
    }
  };

  // Add new table
  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTableNum || !newTableName) return alert('Ingresa número y nombre de mesa');

    try {
      sounds.playCashRegister();
      await api.createTable({
        table_number: newTableNum.trim(),
        name: newTableName.trim(),
        type: newTableType,
        hourly_rate: Number(newTableRate),
        status: newTableStatus
      });
      setShowNewTableForm(false);
      setNewTableNum('');
      setNewTableName('');
      setNewTableRate('8000');
      setNewTableStatus('available');
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      sounds.playError();
      alert('Error creando mesa: ' + err.message);
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
          maxWidth: '1100px',
          height: '84vh',
          minHeight: '640px',
          maxHeight: '880px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          cursor: 'default'
        }}
      >
        {/* Header with Tabs */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Administración
            </h2>

            {/* Navigation Tabs */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              gap: '4px'
            }}>
              <button
                onClick={() => setActiveTab('inventory')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeTab === 'inventory' ? 'var(--color-brand)' : 'transparent',
                  color: activeTab === 'inventory' ? '#090d16' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  gap: '0.5rem'
                }}
              >
                <Package size={16} />
                Inventario & Barra ({products.length})
              </button>

              <button
                onClick={() => setActiveTab('tables')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeTab === 'tables' ? 'var(--color-brand)' : 'transparent',
                  color: activeTab === 'tables' ? '#090d16' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  gap: '0.5rem'
                }}
              >
                <Layers size={16} />
                Mesas & Tarifas ({tables.length})
              </button>

              <button
                onClick={() => setActiveTab('business')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeTab === 'business' ? 'var(--color-brand)' : 'transparent',
                  color: activeTab === 'business' ? '#090d16' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  gap: '0.5rem'
                }}
              >
                <Store size={16} />
                Club & Backup
              </button>

              <button
                onClick={() => {
                  setActiveTab('staff');
                  handleLoadWaiterSales(staffPeriod);
                }}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeTab === 'staff' ? 'var(--color-brand)' : 'transparent',
                  color: activeTab === 'staff' ? '#090d16' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  gap: '0.5rem'
                }}
              >
                <Users size={16} />
                Personal & Meseros ({staffList.length})
              </button>

              <button
                onClick={() => setActiveTab('license')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeTab === 'license' ? 'var(--color-brand)' : 'transparent',
                  color: activeTab === 'license' ? '#090d16' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Key size={16} />
                Licencia & Activación
                {licenseData?.status === 'trial' && (
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: 'rgba(234, 179, 8, 0.25)',
                    color: '#facc15',
                    fontWeight: 800
                  }}>
                    DEMO
                  </span>
                )}
              </button>
            </div>
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

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* ================= TAB 1: INVENTARIO & PRODUCTOS ================= */}
          {activeTab === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Search, Filter & New Product Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
                  {/* Search box */}
                  <div style={{
                    position: 'relative',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                    <input
                      type="text"
                      placeholder="Buscar producto por nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 1rem 0.55rem 2.25rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Category select */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      padding: '0.55rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Low Stock Quick Filter */}
                  <button
                    onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                    style={{
                      background: filterLowStockOnly ? 'var(--color-gold)' : 'rgba(251, 191, 36, 0.1)',
                      color: filterLowStockOnly ? '#090d16' : 'var(--color-gold)',
                      border: `1px solid ${filterLowStockOnly ? 'var(--color-gold)' : 'rgba(251, 191, 36, 0.3)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.9rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer'
                    }}
                    title="Filtrar productos con stock en alerta o agotados"
                  >
                    <AlertCircle size={15} />
                    Bajo Stock ({lowStockCount})
                  </button>
                </div>

                <button
                  onClick={() => openProductForm(null)}
                  style={{
                    background: 'var(--color-brand)',
                    color: '#090d16',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    gap: '0.4rem',
                    boxShadow: 'var(--shadow-neon-green)'
                  }}
                >
                  <Plus size={16} />
                  Nuevo Producto
                </button>
              </div>

              {/* Low stock active banner */}
              {filterLowStockOnly && (
                <div style={{
                  padding: '0.65rem 1rem',
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  fontSize: '0.82rem',
                  color: 'var(--color-gold)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} />
                    <span><b>Filtro de Stock Bajo:</b> Mostrando {filteredProducts.length} producto(s) en alerta o agotados.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterLowStockOnly(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      padding: '3px 9px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Ver todos ({products.length})
                  </button>
                </div>
              )}

              {/* Products Table */}
              <div style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Producto</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Categoría</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Precio de Venta</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Stock Actual</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Alerta Mínima</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Reponer Stock</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          <Package size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                            {filterLowStockOnly ? 'No hay productos con stock bajo en este momento' : 'No se encontraron productos'}
                          </div>
                          {filterLowStockOnly && (
                            <button
                              type="button"
                              onClick={() => setFilterLowStockOnly(false)}
                              style={{
                                marginTop: '0.75rem',
                                padding: '0.4rem 0.85rem',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--color-brand)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Ver inventario completo
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : filteredProducts.map(p => {
                      const threshold = p.min_stock != null ? p.min_stock : 10;
                      const isOutStock = p.stock <= 0;
                      const isLowStock = p.stock <= threshold && !isOutStock;
                      return (
                        <tr
                          key={p.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            background: isOutStock 
                              ? 'rgba(244, 63, 94, 0.05)' 
                              : isLowStock ? 'rgba(251, 191, 36, 0.05)' : 'rgba(10, 14, 22, 0.3)',
                            opacity: p.is_active ? 1 : 0.5
                          }}
                        >
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {isOutStock && <span style={{ color: 'var(--color-alert)', fontSize: '0.75rem' }}>⛔</span>}
                              {isLowStock && <span style={{ color: 'var(--color-gold)', fontSize: '0.75rem' }}>⚠️</span>}
                              <span>{p.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              {p.category}
                            </span>
                          </td>
                          <td className="mono" style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--color-gold)' }}>
                            {formatCurrency(p.price)}
                          </td>
                          <td className="mono" style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              padding: '2px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              background: isOutStock 
                                ? 'rgba(244, 63, 94, 0.2)' 
                                : isLowStock ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0, 230, 118, 0.15)',
                              color: isOutStock 
                                ? 'var(--color-alert)' 
                                : isLowStock ? 'var(--color-gold)' : 'var(--color-brand)'
                            }}>
                              {isOutStock ? '0 unid. (Agotado)' : isLowStock ? `¡Solo ${p.stock}! (Bajo)` : `${p.stock} unid.`}
                            </span>
                          </td>
                          <td className="mono" style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Avisar si ≤ {threshold}
                          </td>

                          {/* Quick Stock Replenishment Buttons */}
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              {[6, 12, 24].map(qty => (
                                <button
                                  key={qty}
                                  onClick={() => handleAdjustStock(p.id, qty)}
                                  title={`Añadir +${qty} unidades`}
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    color: 'var(--color-brand)',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    border: '1px solid var(--border-subtle)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  +{qty}
                                </button>
                              ))}
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => openProductForm(p)}
                                title="Editar producto"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  color: 'var(--text-secondary)',
                                  border: '1px solid var(--border-subtle)',
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  gap: '0.25rem'
                                }}
                              >
                                <Edit2 size={13} />
                                Editar
                              </button>

                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                title="Desactivar producto"
                                style={{
                                  background: 'rgba(244, 63, 94, 0.1)',
                                  color: 'var(--color-alert)',
                                  border: '1px solid rgba(244, 63, 94, 0.2)',
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 2: MESAS & TARIFAS ================= */}
          {activeTab === 'tables' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Mesas del Salón y Tarifas por Hora
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                    Puedes ajustar el precio por hora de cada mesa o agregar nuevas mesas al local.
                  </p>
                </div>

                <button
                  onClick={() => setShowNewTableForm(!showNewTableForm)}
                  style={{
                    background: 'var(--color-brand)',
                    color: '#090d16',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    gap: '0.4rem',
                    boxShadow: 'var(--shadow-neon-green)'
                  }}
                >
                  <Plus size={16} />
                  {showNewTableForm ? 'Cerrar Formulario' : 'Agregar Mesa'}
                </button>
              </div>

              {/* Form to add new table */}
              {showNewTableForm && (
                <form
                  onSubmit={handleCreateTable}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr) auto',
                    gap: '1rem',
                    alignItems: 'end'
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      NÚMERO (EJ. 07)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="07"
                      value={newTableNum}
                      onChange={(e) => setNewTableNum(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontWeight: 700
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      NOMBRE DE LA MESA
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Mesa 7 - Diamond Pro"
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      TIPO DE JUEGO
                    </label>
                    <select
                      value={newTableType}
                      onChange={(e) => setNewTableType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontWeight: 600
                      }}
                    >
                      <option value="pool">Pool / Bola 8</option>
                      <option value="tres_bandas">Tres Bandas</option>
                      <option value="snooker">Snooker VIP</option>
                      <option value="carambola">Carambola Libre</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      TARIFA POR HORA ($)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="8000"
                      value={newTableRate}
                      onChange={(e) => setNewTableRate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontWeight: 700
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      ESTADO INICIAL
                    </label>
                    <select
                      value={newTableStatus}
                      onChange={(e) => setNewTableStatus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontWeight: 700
                      }}
                    >
                      <option value="available">🟢 Disponible para juego</option>
                      <option value="maintenance">🛠️ En mantenimiento / Reparación</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: 'var(--color-brand)',
                      color: '#090d16',
                      fontWeight: 800,
                      padding: '0.6rem 1.25rem',
                      borderRadius: 'var(--radius-sm)',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: 'var(--shadow-neon-green)'
                    }}
                  >
                    <Check size={16} />
                    Guardar Mesa
                  </button>
                </form>
              )}

              {/* Tables List */}
              <div style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Mesa</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Nombre</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Tipo</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Tarifa Actual / Hora</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map(t => {
                      const isEditing = editingTableId === t.id;
                      return (
                        <tr
                          key={t.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            background: 'rgba(10, 14, 22, 0.3)'
                          }}
                        >
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{
                              background: 'var(--border-subtle)',
                              color: '#fff',
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900
                            }}>
                              {t.table_number}
                            </div>
                          </td>

                          <td style={{ padding: '0.75rem 1rem' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editTableName}
                                onChange={(e) => setEditTableName(e.target.value)}
                                style={{
                                  background: 'var(--bg-surface)',
                                  border: '1px solid var(--color-brand)',
                                  borderRadius: '4px',
                                  color: '#fff',
                                  padding: '4px 8px',
                                  fontSize: '0.85rem'
                                }}
                              />
                            ) : (
                              <span style={{ fontWeight: 700, color: '#fff' }}>{t.name}</span>
                            )}
                          </td>

                          <td style={{ padding: '0.75rem 1rem' }}>
                            {isEditing ? (
                              <select
                                value={editTableType}
                                onChange={(e) => setEditTableType(e.target.value)}
                                style={{
                                  background: 'var(--bg-surface)',
                                  border: '1px solid var(--color-brand)',
                                  borderRadius: '4px',
                                  color: '#fff',
                                  padding: '4px 8px',
                                  fontSize: '0.85rem'
                                }}
                              >
                                <option value="pool">Pool</option>
                                <option value="tres_bandas">Tres Bandas</option>
                                <option value="snooker">Snooker</option>
                              </select>
                            ) : (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase'
                              }}>
                                {t.type}
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '0.75rem 1rem' }}>
                            {isEditing ? (
                              <input
                                type="number"
                                value={editTableRate}
                                onChange={(e) => setEditTableRate(e.target.value)}
                                style={{
                                  background: 'var(--bg-surface)',
                                  border: '1px solid var(--color-brand)',
                                  borderRadius: '4px',
                                  color: '#fff',
                                  padding: '4px 8px',
                                  fontSize: '0.85rem',
                                  width: '120px'
                                }}
                              />
                            ) : (
                              <span className="mono" style={{ fontWeight: 800, color: 'var(--color-brand)', fontSize: '0.95rem' }}>
                                {formatCurrency(t.hourly_rate)} / hr
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '0.75rem 1rem' }}>
                            {isEditing ? (
                              <select
                                value={editTableStatus}
                                onChange={(e) => setEditTableStatus(e.target.value)}
                                disabled={t.status === 'occupied'}
                                style={{
                                  background: 'var(--bg-surface)',
                                  border: '1px solid var(--color-brand)',
                                  borderRadius: '4px',
                                  color: '#fff',
                                  padding: '4px 8px',
                                  fontSize: '0.85rem'
                                }}
                              >
                                <option value="available">🟢 Disponible</option>
                                <option value="maintenance">🛠️ En Mantenimiento</option>
                                {t.status === 'occupied' && <option value="occupied">🔵 En Partida</option>}
                              </select>
                            ) : (
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: t.status === 'occupied' 
                                  ? 'rgba(59, 130, 246, 0.15)' 
                                  : t.status === 'maintenance'
                                    ? 'rgba(251, 191, 36, 0.15)'
                                    : 'rgba(0, 230, 118, 0.15)',
                                color: t.status === 'occupied' 
                                  ? 'var(--color-blue)' 
                                  : t.status === 'maintenance'
                                    ? 'var(--color-gold)'
                                    : 'var(--color-brand)',
                                border: `1px solid ${t.status === 'occupied' ? 'rgba(59,130,246,0.3)' : t.status === 'maintenance' ? 'rgba(251,191,36,0.4)' : 'rgba(0,230,118,0.3)'}`
                              }}>
                                {t.status === 'occupied' ? '🔵 EN PARTIDA' : t.status === 'maintenance' ? '🛠️ MANTENIMIENTO' : '🟢 DISPONIBLE'}
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => saveEditTable(t.id)}
                                    style={{
                                      background: 'var(--color-brand)',
                                      color: '#090d16',
                                      padding: '0.35rem 0.75rem',
                                      borderRadius: '4px',
                                      fontWeight: 800,
                                      fontSize: '0.75rem',
                                      gap: '0.25rem',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Save size={13} />
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => setEditingTableId(null)}
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.08)',
                                      color: 'var(--text-secondary)',
                                      border: '1px solid var(--border-subtle)',
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditTable(t)}
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.06)',
                                      color: 'var(--text-secondary)',
                                      border: '1px solid var(--border-subtle)',
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      gap: '0.25rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Edit2 size={13} />
                                    Editar
                                  </button>

                                  {t.status !== 'occupied' && (
                                    <button
                                      onClick={() => handleToggleTableMaintenance(t)}
                                      title={t.status === 'maintenance' ? 'Habilitar mesa para juego' : 'Poner mesa en mantenimiento (cambio de paño / reparación)'}
                                      style={{
                                        background: t.status === 'maintenance' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                                        color: t.status === 'maintenance' ? 'var(--color-brand)' : 'var(--color-gold)',
                                        border: `1px solid ${t.status === 'maintenance' ? 'rgba(0,230,118,0.35)' : 'rgba(251,191,36,0.35)'}`,
                                        padding: '0.35rem 0.65rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        gap: '0.25rem',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {t.status === 'maintenance' ? '✅ Habilitar' : '🛠️ Mantenimiento'}
                                    </button>
                                  )}

                                  {t.status !== 'occupied' && (
                                    <button
                                      onClick={() => handleDeleteTable(t)}
                                      title="Archivar / Eliminar mesa"
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        color: 'var(--color-alert)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        padding: '0.35rem 0.55rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 3: CONFIGURACIÓN DE NEGOCIO & COPIAS DE SEGURIDAD ================= */}
          {activeTab === 'business' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
              {/* Left Column: Business & Receipt Information Form */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <Store size={20} color="var(--color-brand)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Identidad del Club & Datos de Ticket
                  </h3>
                </div>

                <form onSubmit={handleSaveBusinessSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      NOMBRE DEL ESTABLECIMIENTO / CLUB
                    </label>
                    <input
                      type="text"
                      required
                      value={businessForm.business_name || ''}
                      onChange={(e) => setBusinessForm({ ...businessForm, business_name: e.target.value })}
                      placeholder="Ej: CLUB DE BILLARES MEDELLÍN"
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: 700
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        NIT / IDENTIFICACIÓN TRIBUTARIA
                      </label>
                      <input
                        type="text"
                        value={businessForm.business_nit || ''}
                        onChange={(e) => setBusinessForm({ ...businessForm, business_nit: e.target.value })}
                        placeholder="Ej: 901.442.118-0"
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        TELÉFONO / WHATSAPP
                      </label>
                      <input
                        type="text"
                        value={businessForm.business_phone || ''}
                        onChange={(e) => setBusinessForm({ ...businessForm, business_phone: e.target.value })}
                        placeholder="Ej: 300 123 4567"
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      DIRECCIÓN DEL ESTABLECIMIENTO
                    </label>
                    <input
                      type="text"
                      value={businessForm.business_address || ''}
                      onChange={(e) => setBusinessForm({ ...businessForm, business_address: e.target.value })}
                      placeholder="Ej: Calle 50 # 70-20, Laureles, Medellín"
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      MENSAJE AL PIE DEL TICKET DE VENTA
                    </label>
                    <input
                      type="text"
                      value={businessForm.ticket_footer || ''}
                      onChange={(e) => setBusinessForm({ ...businessForm, ticket_footer: e.target.value })}
                      placeholder="Ej: ¡GRACIAS POR SU VISITA! VUELVA PRONTO."
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        MINUTOS DE CORTESÍA / GRACIA
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={businessForm.grace_period_minutes || '3'}
                        onChange={(e) => setBusinessForm({ ...businessForm, grace_period_minutes: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        MODO DE REDONDEO DE TIEMPO
                      </label>
                      <select
                        value={businessForm.rounding_mode || 'exact'}
                        onChange={(e) => setBusinessForm({ ...businessForm, rounding_mode: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="exact">Exacto por minuto</option>
                        <option value="15_min">Fracción de 15 minutos</option>
                        <option value="minimum_30">Mínimo 30 minutos</option>
                      </select>
                    </div>
                  </div>

                  {/* Currency & Regional Settings */}
                  <div style={{
                    marginTop: '0.25rem',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Globe size={18} color="var(--color-brand)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                        Moneda & Formato Regional
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        PAÍS / PREAJUSTE RÁPIDO
                      </label>
                      <select
                        onChange={(e) => handleCurrencyPresetChange(e.target.value)}
                        defaultValue=""
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="" disabled>Seleccionar país o moneda...</option>
                        {CURRENCY_PRESETS.map((p) => (
                          <option key={p.label} value={p.label}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          SÍMBOLO
                        </label>
                        <input
                          type="text"
                          value={businessForm.currency_symbol || '$'}
                          onChange={(e) => setBusinessForm({ ...businessForm, currency_symbol: e.target.value })}
                          placeholder="$"
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.65rem',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            color: '#fff',
                            fontSize: '0.85rem',
                            fontWeight: 700
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          CÓDIGO ISO
                        </label>
                        <input
                          type="text"
                          value={businessForm.currency_code || 'COP'}
                          onChange={(e) => setBusinessForm({ ...businessForm, currency_code: e.target.value.toUpperCase() })}
                          placeholder="COP"
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.65rem',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            color: '#fff',
                            fontSize: '0.85rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          DECIMALES
                        </label>
                        <select
                          value={businessForm.currency_decimals || '0'}
                          onChange={(e) => setBusinessForm({ ...businessForm, currency_decimals: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.65rem',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            color: '#fff',
                            fontSize: '0.85rem'
                          }}
                        >
                          <option value="0">0 (ej. $ 8.000)</option>
                          <option value="2">2 (ej. $ 8.00)</option>
                        </select>
                      </div>
                    </div>

                    {/* Live Preview Pill */}
                    <div style={{
                      background: 'rgba(0, 230, 153, 0.08)',
                      border: '1px dashed rgba(0, 230, 153, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem'
                    }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Vista previa en precios:</span>
                      <span style={{ color: 'var(--color-brand)', fontWeight: 800 }}>
                        Hora: {formatCurrency(10000, businessForm)} | Producto: {formatCurrency(4500, businessForm)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    {settingsSuccess && (
                      <span style={{ color: 'var(--color-brand)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Check size={16} /> ¡Configuración guardada exitosamente!
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={savingSettings}
                      style={{
                        marginLeft: 'auto',
                        padding: '0.75rem 1.75rem',
                        background: 'var(--color-brand)',
                        color: '#090d16',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-neon-green)'
                      }}
                    >
                      <Save size={16} />
                      {savingSettings ? 'Guardando...' : 'Guardar Cambios del Club'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Database Backup & Local LAN Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* WhatsApp Notifications Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.12), rgba(18, 140, 126, 0.05))',
                  border: '1px solid rgba(37, 211, 102, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(37, 211, 102, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#25D366'
                    }}>
                      <MessageCircle size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Alertas al WhatsApp del Dueño
                      </h4>
                      <div style={{ fontSize: '0.72rem', color: '#25D366', fontWeight: 700 }}>
                        Cierre de Turno & Arqueo Z en 1 Clic
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    Al realizar el <strong>Cierre de Turno (Corte Z)</strong>, el cajero tendrá un botón directo de 1 clic para enviar el informe consolidado a tu WhatsApp personal con el total facturado, efectivo vs transferencias y descuadres.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                        NÚMERO DE WHATSAPP DEL DUEÑO
                      </label>
                      <input
                        type="text"
                        value={businessForm.owner_whatsapp || ''}
                        onChange={(e) => setBusinessForm({ ...businessForm, owner_whatsapp: e.target.value })}
                        placeholder="Ej: +57 300 123 4567 (con código de país)"
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          background: 'rgba(0, 0, 0, 0.45)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(0,0,0,0.25)',
                      padding: '0.5rem 0.65rem',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <input
                        type="checkbox"
                        id="notify_close_check"
                        checked={businessForm.notify_whatsapp_on_close !== '0'}
                        onChange={(e) => setBusinessForm({ ...businessForm, notify_whatsapp_on_close: e.target.checked ? '1' : '0' })}
                        style={{ width: '16px', height: '16px', accentColor: '#25D366', cursor: 'pointer' }}
                      />
                      <label htmlFor="notify_close_check" style={{ fontSize: '0.78rem', color: '#fff', cursor: 'pointer', userSelect: 'none' }}>
                        Habilitar botón de WhatsApp en Cierres de Turno
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={handleTestWhatsApp}
                        style={{
                          flex: 1,
                          padding: '0.65rem',
                          background: 'rgba(37, 211, 102, 0.2)',
                          color: '#25D366',
                          border: '1px solid rgba(37, 211, 102, 0.5)',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer',
                          boxShadow: '0 0 12px rgba(37, 211, 102, 0.2)'
                        }}
                      >
                        <MessageCircle size={15} />
                        Probar Envío a mi WhatsApp
                      </button>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                      💡 <strong>Cero costo y cero configuraciones complejas:</strong> No necesitas crear bots ni pagar APIs. El sistema abre la conversación con el reporte listo para enviar.
                    </div>
                  </div>
                </div>

                {/* Theme Selector Card */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Sun size={18} color="var(--color-gold)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                      Tema Visual del Sistema
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.85rem 0' }}>
                    Elige la apariencia visual para las pantallas de este establecimiento:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={() => { if (theme !== 'dark') onToggleTheme(); }}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: theme === 'dark' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(0, 0, 0, 0.2)',
                        border: `1px solid ${theme === 'dark' ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                        color: theme === 'dark' ? 'var(--color-brand)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Moon size={15} />
                      Modo Oscuro (OLED)
                    </button>

                    <button
                      type="button"
                      onClick={() => { if (theme !== 'light') onToggleTheme(); }}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: theme === 'light' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(0, 0, 0, 0.2)',
                        border: `1px solid ${theme === 'light' ? 'var(--color-blue)' : 'var(--border-subtle)'}`,
                        color: theme === 'light' ? 'var(--color-blue)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Sun size={15} color={theme === 'light' ? 'var(--color-blue)' : 'currentColor'} />
                      Modo Claro (Día)
                    </button>
                  </div>
                </div>

                {/* Backup Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(30, 58, 138, 0.05))',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                    <HardDrive size={22} color="var(--color-blue)" />
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      Copia de Seguridad (Backup)
                    </h4>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 1.25rem 0' }}>
                    Descarga un respaldo completo en 1 clic de tu base de datos SQLite con todos tus productos, mesas, tarifas, facturas y arqueos de caja.
                  </p>

                  <a
                    href={api.getBackupDownloadUrl()}
                    download
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.85rem',
                      background: 'var(--color-blue)',
                      color: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={18} />
                    Descargar Copia de Seguridad (.db)
                  </a>
                </div>

                {/* Local Engine Card */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <ShieldCheck size={18} color="var(--color-brand)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                      Modo SQLite WAL (Offline Local)
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    El sistema corre 100% en la red de área local (LAN) de tu establecimiento. Las partidas y consumos se guardan al instante en disco sólido para proteger los cobros ante cualquier apagón eléctrico.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERSONAL & MESEROS */}
          {activeTab === 'staff' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Top Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60a5fa'
                  }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Equipo Total
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff' }}>
                      {staffList.length} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-brand)' }}>({staffList.filter(s => s.is_active).length} activos)</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-brand)'
                  }}>
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Meseros de Turno
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff' }}>
                      {staffList.filter(s => s.role === 'mesero' && s.is_active).length}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(251, 191, 36, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-gold)'
                  }}>
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Ventas por Mesero ({staffPeriod === 'today' ? 'Hoy' : staffPeriod === 'week' ? 'Semana' : 'Mes'})
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-gold)' }}>
                      {formatCurrency(waiterSales.reduce((acc, curr) => acc + (Number(curr.total_sales) || 0), 0))}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(236, 72, 153, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f472b6'
                  }}>
                    <Award size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Top Mesero
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                      {waiterSales.length > 0 ? waiterSales[0].waiter_name : 'Sin pedidos'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions & Filters Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '0.75rem 1rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                    Gestión de Personal & Roles
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Crea y asigna PINs de 4 dígitos para cambio veloz de mesero en pantallas y tablets
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Period pills */}
                  <div style={{
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '3px',
                    borderRadius: 'var(--radius-sm)',
                    gap: '3px'
                  }}>
                    {[
                      { id: 'today', label: 'Hoy' },
                      { id: 'week', label: '7 Días' },
                      { id: 'month', label: 'Este Mes' }
                    ].map(period => (
                      <button
                        key={period.id}
                        onClick={() => handleLoadWaiterSales(period.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: staffPeriod === period.id ? 'var(--color-brand)' : 'transparent',
                          color: staffPeriod === period.id ? '#090d16' : 'var(--text-secondary)'
                        }}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => openStaffForm()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: 'var(--color-brand)',
                      color: '#090d16',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 800,
                      fontSize: '0.85rem'
                    }}
                  >
                    <UserPlus size={16} />
                    Nuevo Colaborador
                  </button>
                </div>
              </div>

              {/* Grid 2 Columns: Staff list + Waiter Sales ranking */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 1.1fr',
                gap: '1.25rem',
                alignItems: 'start'
              }}>
                {/* Column 1: Staff Table */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '0.85rem 1.1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                      Lista de Empleados ({staffList.length})
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      PINs de 4 dígitos para cambio en pantalla
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)' }}>
                          <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>COLABORADOR</th>
                          <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>ROL</th>
                          <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>PIN RÁPIDO</th>
                          <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>ESTADO</th>
                          <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffList.map((member) => {
                          const isRevealed = revealedPins[member.id];
                          const roleBadgeStyle = member.role === 'admin' 
                            ? { bg: 'rgba(251, 191, 36, 0.15)', color: 'var(--color-gold)', text: '👑 Admin' }
                            : member.role === 'cajero'
                            ? { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', text: '💼 Cajero' }
                            : { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-brand)', text: '🍸 Mesero' };

                          return (
                            <tr 
                              key={member.id}
                              style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                opacity: member.is_active ? 1 : 0.6,
                                transition: 'background 0.2s'
                              }}
                            >
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                  <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    color: '#fff'
                                  }}>
                                    {member.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                                      {member.name}
                                    </div>
                                    {member.phone && (
                                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <Phone size={10} /> {member.phone}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '0.85rem 1rem' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  background: roleBadgeStyle.bg,
                                  color: roleBadgeStyle.color
                                }}>
                                  {roleBadgeStyle.text}
                                </span>
                              </td>

                              <td style={{ padding: '0.85rem 1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <code style={{
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.85rem',
                                    letterSpacing: isRevealed ? '2px' : '3px',
                                    fontWeight: 700,
                                    color: isRevealed ? 'var(--color-brand)' : 'var(--text-muted)'
                                  }}>
                                    {isRevealed ? member.pin : '••••'}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => togglePinReveal(member.id)}
                                    title={isRevealed ? "Ocultar PIN" : "Ver PIN"}
                                    style={{
                                      background: 'transparent',
                                      color: 'var(--text-muted)',
                                      padding: '2px'
                                    }}
                                  >
                                    {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                </div>
                              </td>

                              <td style={{ padding: '0.85rem 1rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStaffActive(member)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '999px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    background: member.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: member.is_active ? 'var(--color-brand)' : '#f87171',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {member.is_active ? <Check size={12} /> : <X size={12} />}
                                  {member.is_active ? 'Activo' : 'Inactivo'}
                                </button>
                              </td>

                              <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                                  <button
                                    onClick={() => openStaffForm(member)}
                                    title="Editar datos y PIN"
                                    style={{
                                      padding: '0.35rem',
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      color: 'var(--text-secondary)',
                                      borderRadius: 'var(--radius-sm)'
                                    }}
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStaff(member)}
                                    title="Eliminar colaborador"
                                    style={{
                                      padding: '0.35rem',
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      color: '#f87171',
                                      borderRadius: 'var(--radius-sm)'
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {staffList.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No hay colaboradores registrados. Haz clic en "Nuevo Colaborador" para agregar uno.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Column 2: Waiter Sales Leaderboard */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={18} color="var(--color-gold)" />
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
                        Ranking de Ventas
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                      {staffPeriod === 'today' ? 'Hoy' : staffPeriod === 'week' ? 'Últimos 7 días' : 'Mes actual'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Consumos despachados y asignados a cada mesero en barra o mesas.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {waiterSales.map((item, index) => {
                      const maxSale = Math.max(...waiterSales.map(s => Number(s.total_sales) || 1), 1);
                      const pct = Math.min(100, Math.round(((Number(item.total_sales) || 0) / maxSale) * 100));

                      const rankMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

                      return (
                        <div
                          key={item.waiter_name + index}
                          style={{
                            background: index === 0 ? 'rgba(251, 191, 36, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                            border: index === 0 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.75rem 0.85rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: index < 3 ? '1.1rem' : '0.85rem', fontWeight: 800 }}>
                                {rankMedal}
                              </span>
                              <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                                  {item.waiter_name}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {item.order_count} comandas registradas
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: index === 0 ? 'var(--color-gold)' : 'var(--color-brand)' }}>
                                {formatCurrency(item.total_sales)}
                              </div>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div style={{
                            width: '100%',
                            height: '5px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '999px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: index === 0 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'var(--color-brand)',
                              borderRadius: '999px'
                            }} />
                          </div>
                        </div>
                      );
                    })}

                    {waiterSales.length === 0 && (
                      <div style={{
                        padding: '1.5rem',
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem'
                      }}>
                        Aún no hay comandas registradas en este período. Al despachar un consumo desde la barra o comandas, el sistema sumará automáticamente las ventas al mesero activo.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: LICENCIA & ACTIVACIÓN COMERCIAL ================= */}
          {activeTab === 'license' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Machine ID Box */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(10, 15, 26, 0.95) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.25rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <ShieldCheck size={20} color="var(--color-brand)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-brand)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Identificador de Hardware de este Equipo
                    </span>
                  </div>
                  <div style={{
                    fontSize: '1.45rem',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    color: '#fff',
                    textShadow: '0 0 10px rgba(0, 230, 153, 0.35)'
                  }}>
                    {licenseData?.machineId || 'Cargando...'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Proporciona este código a tu proveedor de <strong>BillarPulse</strong> para activar o renovar tu licencia comercial.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyMachineId}
                  style={{
                    padding: '0.75rem 1.4rem',
                    background: copiedMid ? 'var(--color-brand)' : 'rgba(255, 255, 255, 0.08)',
                    color: copiedMid ? '#090d16' : '#fff',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                >
                  {copiedMid ? <Check size={18} /> : <Copy size={18} />}
                  {copiedMid ? '¡Copiado al Portapapeles!' : 'Copiar Machine ID'}
                </button>
              </div>

              {/* Status Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem'
              }}>
                {/* Card 1: Estado y Plan */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Estado de Licencia
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    {licenseData?.status === 'active' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--color-brand)',
                        fontWeight: 800,
                        fontSize: '0.85rem'
                      }}>
                        <ShieldCheck size={16} /> ACTIVA & AUTORIZADA
                      </span>
                    ) : licenseData?.status === 'trial' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        background: 'rgba(234, 179, 8, 0.15)',
                        color: '#facc15',
                        fontWeight: 800,
                        fontSize: '0.85rem'
                      }}>
                        <AlertTriangle size={16} /> MODO DE EVALUACIÓN
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        fontWeight: 800,
                        fontSize: '0.85rem'
                      }}>
                        <AlertCircle size={16} /> LICENCIA VENCIDA
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <div><strong>Club Registrado:</strong> {licenseData?.businessName || 'Billar Demo'}</div>
                    <div style={{ marginTop: '0.2rem' }}><strong>NIT / ID:</strong> {licenseData?.nit || 'Sin registrar'}</div>
                  </div>
                </div>

                {/* Card 2: Mesas Autorizadas */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Capacidad de Mesas
                  </div>

                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem' }}>
                    {licenseData?.tablesInUse || 0} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>de {licenseData?.maxTables || 0} mesas en uso</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '0.6rem'
                  }}>
                    <div style={{
                      width: `${Math.min(100, Math.round(((licenseData?.tablesInUse || 0) / Math.max(1, (licenseData?.maxTables || 1))) * 100))}%`,
                      height: '100%',
                      background: (licenseData?.tablesInUse || 0) >= (licenseData?.maxTables || 1) ? '#ef4444' : 'var(--color-brand)',
                      transition: 'width 0.3s'
                    }} />
                  </div>

                  <div style={{ fontSize: '0.8rem', color: (licenseData?.tablesRemaining || 0) <= 0 ? '#f87171' : 'var(--text-secondary)', fontWeight: 600 }}>
                    {(licenseData?.tablesRemaining || 0) <= 0 
                      ? 'Límite de mesas alcanzado para este plan.' 
                      : `${licenseData?.tablesRemaining} mesas disponibles para agregar.`}
                  </div>
                </div>

                {/* Card 3: Vigencia / Caducidad */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Vigencia del Plan
                  </div>

                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', marginBottom: '0.35rem' }}>
                    {licenseData?.isPerpetual 
                      ? 'Vitalicia / Permanente' 
                      : (licenseData?.expiryDate || 'N/A')}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--color-brand)', fontWeight: 700 }}>
                    {licenseData?.isPerpetual 
                      ? '🎉 Sin fecha de caducidad' 
                      : (licenseData?.daysRemaining != null ? `⏳ ${licenseData.daysRemaining} días de servicio restantes` : '')}
                  </div>
                </div>
              </div>

              {/* License Key Activation Form */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <Key size={20} color="var(--color-brand)" />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Activar o Renovar Licencia Comercial
                  </h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0' }}>
                  Pega aquí la clave de activación provista por el administrador del sistema (ej: <code>BPL-eyJuIjoi...</code>) para desbloquear mesas adicionales o extender tu periodo de servicio.
                </p>

                <form onSubmit={handleActivateLicense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      CLAVE DE LICENCIA (LICENSE KEY)
                    </label>
                    <input
                      type="text"
                      required
                      value={licenseInput}
                      onChange={(e) => setLicenseInput(e.target.value)}
                      placeholder="BPL-eyJuIjoiQ2x1Yi... (Pega tu clave completa aquí)"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  {licenseMsg && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: licenseMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${licenseMsg.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                      color: licenseMsg.type === 'success' ? 'var(--color-brand)' : '#f87171',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {licenseMsg.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                      {licenseMsg.text}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={activatingLicense || !licenseInput.trim()}
                      style={{
                        padding: '0.8rem 2rem',
                        background: 'var(--color-brand)',
                        color: '#090d16',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: activatingLicense || !licenseInput.trim() ? 'not-allowed' : 'pointer',
                        opacity: activatingLicense || !licenseInput.trim() ? 0.6 : 1,
                        boxShadow: 'var(--shadow-neon-green)'
                      }}
                    >
                      <Key size={18} />
                      {activatingLicense ? 'Validando Clave...' : 'Validar & Activar Licencia'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Modal Inline for Product Create/Edit */}
        {showProductForm && (
          <div 
            onClick={() => setShowProductForm(false)}
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
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSaveProduct}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '450px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                cursor: 'default'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  style={{ background: 'transparent', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  NOMBRE DEL ARTÍCULO
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cerveza Corona 330ml"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    CATEGORÍA
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="Cervezas">Cervezas</option>
                    <option value="Licores">Licores</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    PRECIO DE VENTA ($)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="8000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    STOCK ACTUAL
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gold)', marginBottom: '4px' }}>
                    ⚠️ ALERTA STOCK MÍNIMO
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-gold)',
                      fontSize: '0.9rem',
                      fontWeight: 700
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Avisar cuando queden esta cantidad o menos
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600
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
                    fontWeight: 800
                  }}
                >
                  Guardar Artículo
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal for Staff Member Create/Edit */}
        {showStaffForm && (
          <div
            onClick={() => setShowStaffForm(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '1rem',
              cursor: 'pointer'
            }}
          >
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSaveStaff}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '460px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.1rem',
                cursor: 'default',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={20} color="var(--color-brand)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    {editingStaff ? `Editar Colaborador` : 'Nuevo Colaborador'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStaffForm(false)}
                  style={{ background: 'transparent', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  NOMBRE COMPLETO *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Ruiz"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    ROL / ACCESO
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="mesero">🍸 Mesero (Comandas)</option>
                    <option value="cajero">💼 Cajero (Caja y POS)</option>
                    <option value="admin">👑 Administrador</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-brand)', marginBottom: '4px' }}>
                    PIN RÁPIDO (4 DÍGITOS) *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={staffForm.pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setStaffForm(prev => ({ ...prev, pin: val }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--color-brand)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-brand)',
                      fontSize: '1rem',
                      letterSpacing: '4px',
                      fontWeight: 800,
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  TELÉFONO / WHATSAPP (OPCIONAL)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 310 123 4567"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}>
                <input
                  type="checkbox"
                  id="staff_active_checkbox"
                  checked={Boolean(staffForm.is_active)}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-brand)' }}
                />
                <label htmlFor="staff_active_checkbox" style={{ fontSize: '0.82rem', color: '#fff', cursor: 'pointer', userSelect: 'none' }}>
                  Usuario activo (Permitir inicio de sesión y registro de pedidos)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowStaffForm(false)}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={staffSaving}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    background: 'var(--color-brand)',
                    color: '#090d16',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 800
                  }}
                >
                  {staffSaving ? 'Guardando...' : (editingStaff ? 'Actualizar' : 'Crear Colaborador')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
