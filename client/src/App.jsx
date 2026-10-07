import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import CajaDashboard from './components/CajaDashboard';
import TableKiosk from './components/TableKiosk';
import PinModal from './components/PinModal';
import ShiftReportModal from './components/ShiftReportModal';
import AdminManagementModal from './components/AdminManagementModal';
import HistoryModal from './components/HistoryModal';
import AnalyticsModal from './components/AnalyticsModal';
import { network, api } from './services/api';
import { sounds } from './utils/audio';

export default function App() {
  // Check URL search params for kiosk tablet direct deployment (e.g. ?table=1 or ?view=kiosk&table=1)
  const urlParams = new URLSearchParams(window.location.search);
  const paramTable = urlParams.get('table') || urlParams.get('tableId');
  const initialView = paramTable ? 'kiosk' : (urlParams.get('view') || 'caja');
  const initialTableId = paramTable ? Number(paramTable) : 1;

  const [currentView, setView] = useState(initialView);
  const [selectedTableId, setSelectedTableId] = useState(initialTableId);
  const [tablesOverview, setTablesOverview] = useState([]);
  const [stats, setStats] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Security, Report, Admin and Analytics modals
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isShiftReportOpen, setIsShiftReportOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  // Initial fetch
  const refreshData = useCallback(async () => {
    try {
      const [tablesRes, statsRes] = await Promise.all([
        api.getTables(),
        api.getStats()
      ]);
      if (tablesRes.success) setTablesOverview(tablesRes.data);
      if (statsRes.success) setStats(statsRes.data);
    } catch (e) {
      console.error('Error fetching initial data:', e);
    }
  }, []);

  useEffect(() => {
    refreshData();

    // Connect to LAN WebSocket
    network.connect();

    // Subscribe to WebSocket messages
    const unsubscribe = network.subscribe((msg) => {
      if (msg.type === 'CONNECTION_CHANGE') {
        setIsConnected(msg.connected);
      } else if (msg.type === 'INIT_STATE') {
        setTablesOverview(msg.tablesOverview || []);
        setStats(msg.stats || null);
        setIsConnected(true);
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
      unsubscribe();
    };
  }, [refreshData]);

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentView={currentView}
        setView={setView}
        selectedTableId={selectedTableId}
        setSelectedTableId={setSelectedTableId}
        isConnected={isConnected}
        tables={tablesOverview}
        onOpenShiftReport={() => setIsShiftReportOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onRequestCajaAccess={handleRequestCajaAccess}
      />

      <main style={{ flex: 1, padding: '1rem' }}>
        {currentView === 'caja' ? (
          <CajaDashboard
            tablesOverview={tablesOverview}
            stats={stats}
            onStateChange={refreshData}
            onSelectTableForKiosk={handleSelectTableForKiosk}
          />
        ) : (
          <TableKiosk
            tableId={selectedTableId}
            tablesOverview={tablesOverview}
            onStateChange={refreshData}
          />
        )}
      </main>

      {/* Security PIN Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
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
    </div>
  );
}

