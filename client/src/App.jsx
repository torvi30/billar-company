import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import CajaDashboard from './components/CajaDashboard';
import TableKiosk from './components/TableKiosk';
import PinModal from './components/PinModal';
import ShiftReportModal from './components/ShiftReportModal';
import AdminManagementModal from './components/AdminManagementModal';
import HistoryModal from './components/HistoryModal';
import AnalyticsModal from './components/AnalyticsModal';
import ConnectDevicesModal from './components/ConnectDevicesModal';
import StaffLoginModal from './components/StaffLoginModal';
import CEOMasterHubModal from './components/CEOMasterHubModal';
import SubscriptionLockOverlay from './components/SubscriptionLockOverlay';
import { network, api } from './services/api';
import { sounds } from './utils/audio';
import { setCurrencyConfig } from './utils/formatters';

export default function App() {
  // Check URL search params for table link (e.g. ?mesa=1, ?table=1, ?tableId=1)
  const urlParams = new URLSearchParams(window.location.search);
  const paramTable = urlParams.get('mesa') || urlParams.get('table') || urlParams.get('tableId') || urlParams.get('m');
  const isDirectTable = Boolean(paramTable);
  const initialView = isDirectTable ? 'kiosk' : (urlParams.get('view') || 'caja');
  const initialTableId = paramTable ? Number(paramTable) : 1;

  const [currentView, setView] = useState(initialView);
  const [selectedTableId, setSelectedTableId] = useState(initialTableId);
  const [tablesOverview, setTablesOverview] = useState([]);
  const [stats, setStats] = useState(null);
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Theme state ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('billarpulse_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('billarpulse_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    sounds.playScoreBeep(true);
  };

  // Staff / Mesero authentication state
  const [currentStaff, setCurrentStaff] = useState(() => {
    try {
      const saved = localStorage.getItem('billarpulse_user');
      return saved ? JSON.parse(saved) : { id: 1, name: 'Administrador', role: 'admin' };
    } catch {
      return { id: 1, name: 'Administrador', role: 'admin' };
    }
  });
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);

  // Security, Report, Admin, Analytics, Connect Device and CEO Hub modals
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isShiftReportOpen, setIsShiftReportOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState('inventory');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isConnectDevicesOpen, setIsConnectDevicesOpen] = useState(false);
  const [isCEOHubOpen, setIsCEOHubOpen] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [isCEOMode, setIsCEOMode] = useState(false);

  const handleOpenAdmin = (tab = 'inventory') => {
    const validTab = (typeof tab === 'string' && tab) ? tab : 'inventory';
    setAdminInitialTab(validTab);
    setIsAdminModalOpen(true);
  };

  // Initial fetch
  const refreshData = useCallback(async () => {
    try {
      const [tablesRes, statsRes, lowStockRes, settingsRes, licenseRes, bizRes] = await Promise.all([
        api.getTables(),
        api.getStats(),
        api.getLowStockProducts(),
        api.getSettings().catch(() => ({})),
        api.getLicense().catch(() => ({})),
        api.getCurrentBusiness().catch(() => ({}))
      ]);
      if (tablesRes?.success) setTablesOverview(tablesRes.data);
      if (statsRes?.success) setStats(statsRes.data);
      if (lowStockRes?.success) setLowStockCount(lowStockRes.count || (lowStockRes.data ? lowStockRes.data.length : 0));
      if (settingsRes?.success && settingsRes.data) setCurrencyConfig(settingsRes.data);
      if (licenseRes?.success) setLicenseInfo(licenseRes.data);
      if (bizRes?.success && bizRes.business) {
        setCurrentBusiness(bizRes.business);
        setIsCEOMode(bizRes.business.id !== 1);
      }
    } catch (e) {
      console.error('Error fetching initial data:', e);
    }
  }, []);

  useEffect(() => {
    refreshData();

    // Check for secret URL param for Victor & partner: ?ceo=1 or ?master=1
    if (urlParams.get('ceo') === '1' || urlParams.get('master') === '1') {
      setIsCEOHubOpen(true);
    }

    // Secret keyboard shortcut for Victor and partner: Ctrl + Shift + C or Alt + C
    const handleSecretKey = (e) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') || (e.altKey && e.key.toLowerCase() === 'c')) {
        e.preventDefault();
        sounds.playScoreBeep(true);
        setIsCEOHubOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleSecretKey);

    // Connect to LAN WebSocket
    network.connect();

    // Subscribe to WebSocket messages
    const unsubscribe = network.subscribe((msg) => {
      if (msg.type === 'CONNECTION_CHANGE') {
        setIsConnected(msg.connected);
      } else if (msg.type === 'INIT_STATE') {
        setTablesOverview(msg.tablesOverview || []);
        setStats(msg.stats || null);
        if (msg.settings) setCurrencyConfig(msg.settings);
        if (msg.license) setLicenseInfo(msg.license);
        setIsConnected(true);
      } else if (msg.type === 'LICENSE_UPDATED') {
        if (msg.license) setLicenseInfo(msg.license);
      } else if (msg.type === 'BUSINESS_SWITCHED') {
        if (msg.business) {
          setCurrentBusiness(msg.business);
          setIsCEOMode(msg.business.id !== 1);
        }
        refreshData();
      } else if (msg.type === 'TABLE_STATE_CHANGED') {
        if (msg.tablesOverview) setTablesOverview(msg.tablesOverview);
        if (msg.stats) setStats(msg.stats);

        // Check if there is a new pending alert and play bell chime
        if (msg.tableState && msg.tableState.alerts && msg.tableState.alerts.length > 0) {
          sounds.playWaiterBell();
        }
      }
    });

    return () => {
      window.removeEventListener('keydown', handleSecretKey);
      unsubscribe();
    };
  }, [refreshData]);

  const handleSwitchBusiness = (newBiz) => {
    setCurrentBusiness(newBiz);
    setIsCEOMode(newBiz.id !== 1);
    refreshData();
  };

  const handleExitCEOMode = async () => {
    try {
      sounds.playScoreBeep(true);
      const res = await api.switchActiveBusiness(1);
      if (res.success) {
        setCurrentBusiness(res.activeTenant);
        setIsCEOMode(false);
        refreshData();
      }
    } catch (e) {
      alert('Error volviendo a la sede principal: ' + e.message);
    }
  };

  const handleSelectTableForKiosk = (tableId) => {
    setSelectedTableId(tableId);
    setView('kiosk');
  };

  const handleRequestCajaAccess = () => {
    if (!paramTable || sessionStorage.getItem('caja_unlocked') === 'true') {
      setView('caja');
      return;
    }
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = () => {
    sessionStorage.setItem('caja_unlocked', 'true');
    setView('caja');
  };

  const handleStaffLoginSuccess = (staff) => {
    setCurrentStaff(staff);
    localStorage.setItem('billarpulse_user', JSON.stringify(staff));
    setIsStaffLoginOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentView={currentView}
        setView={setView}
        selectedTableId={selectedTableId}
        setSelectedTableId={setSelectedTableId}
        isConnected={isConnected}
        tables={tablesOverview}
        isDirectTable={isDirectTable}
        onOpenShiftReport={() => setIsShiftReportOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onOpenConnectDevices={() => setIsConnectDevicesOpen(true)}
        onRequestCajaAccess={handleRequestCajaAccess}
        lowStockCount={lowStockCount}
        licenseInfo={licenseInfo}
        currentStaff={currentStaff}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenStaffLogin={() => setIsStaffLoginOpen(true)}
        onOpenCEOHub={() => setIsCEOHubOpen(true)}
        currentBusiness={currentBusiness}
        isCEOMode={isCEOMode}
        onExitCEOMode={handleExitCEOMode}
      />

      <main style={{ flex: 1, padding: '1rem' }}>
        {currentView === 'caja' ? (
          <CajaDashboard
            tablesOverview={tablesOverview}
            stats={stats}
            onStateChange={refreshData}
            onSelectTableForKiosk={handleSelectTableForKiosk}
            currentStaff={currentStaff}
            onOpenAdmin={handleOpenAdmin}
          />
        ) : (
          <TableKiosk
            tableId={selectedTableId}
            tablesOverview={tablesOverview}
            onStateChange={refreshData}
            onSelectTable={setSelectedTableId}
          />
        )}
      </main>

      {/* Subscription Lock Screen when club is expired/suspended */}
      <SubscriptionLockOverlay
        business={currentBusiness}
        onOpenCEOHub={() => setIsCEOHubOpen(true)}
        onRefresh={refreshData}
      />

      {/* CEO Master Hub Modal (Control Maestro de Empresas & Licencias) */}
      <CEOMasterHubModal
        isOpen={isCEOHubOpen}
        onClose={() => setIsCEOHubOpen(false)}
        onSwitchBusiness={handleSwitchBusiness}
        currentBusiness={currentBusiness}
      />

      {/* Staff / Waiter Login Modal */}
      <StaffLoginModal
        isOpen={isStaffLoginOpen}
        onClose={() => setIsStaffLoginOpen(false)}
        onLoginSuccess={handleStaffLoginSuccess}
        currentStaff={currentStaff}
      />

      {/* Security PIN Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        onOpenCEOHub={() => setIsCEOHubOpen(true)}
      />

      {/* Shift / Arqueo Report Modal */}
      <ShiftReportModal
        isOpen={isShiftReportOpen}
        onClose={() => setIsShiftReportOpen(false)}
      />

      {/* Admin Management Modal (Catalog, Stock, Table Rates) */}
      <AdminManagementModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onRefreshData={refreshData}
        theme={theme}
        onToggleTheme={toggleTheme}
        initialTab={adminInitialTab}
      />

      {/* History and Invoices Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Business Intelligence & Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />

      {/* Connect Tablets & Phones QR Modal */}
      <ConnectDevicesModal
        isOpen={isConnectDevicesOpen}
        onClose={() => setIsConnectDevicesOpen(false)}
        tables={tablesOverview}
      />
    </div>
  );
}

