import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Menu, Plus, CreditCard, Car as CarIcon, FileText } from 'lucide-react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import TravellerManager from './TravellerManager';
import DateRangePicker from './DateRangePicker';
import DailyParticipationGrid from './DailyParticipationGrid';
import SummaryPanel from './SummaryPanel';
import TripHistoryPanel from './TripHistoryPanel';
import PaymentSummaryPanel from './PaymentSummaryPanel';
import CarExpensesPanel from './CarExpensesPanel';
import OverallSummaryPanel from './OverallSummaryPanel';
import BackupRestorePanel from './BackupRestorePanel';
import ClearDataPanel from './ClearDataPanel';
import PaymentHistoryDialog from './PaymentHistoryDialog';
import ExpenseHistoryDialog from './ExpenseHistoryDialog';
import ExportReportDialog from './ExportReportDialog';
import CoTravellerIncomeDialog from './CoTravellerIncomeDialog';
import MobileLedgerSidebarNav from './MobileLedgerSidebarNav';
import UnsavedChangesConfirmDialog from './UnsavedChangesConfirmDialog';
import { useLedgerState } from './LedgerStateContext';

export default function LedgerPage() {
  const [activeTab, setActiveTab] = useState('grid');
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [expenseHistoryOpen, setExpenseHistoryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [coTravellerIncomeOpen, setCoTravellerIncomeOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const { hasDraftChanges, discardDraftDailyData } = useLedgerState();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const getActiveTabLabel = () => {
    const labels: Record<string, string> = {
      travellers: 'Travellers',
      grid: 'Daily Participation',
      summary: 'Trips & Payment',
      'trip-history': 'Trip History',
      'payment-summary': 'Payment Summary',
      car: 'Car Expenses',
      overall: 'Overall Summary',
      backup: 'Backup & Restore',
      clear: 'Clear Data',
    };
    return labels[activeTab] || 'Carpool Menu';
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    localStorage.removeItem('carpool-ledger-state');
    setMobileMenuOpen(false);
  };

  const handleTabChange = (newTab: string) => {
    // Check if leaving Daily Participation tab with unsaved changes
    if (activeTab === 'grid' && newTab !== 'grid' && hasDraftChanges()) {
      setPendingTab(newTab);
      setUnsavedDialogOpen(true);
    } else {
      setActiveTab(newTab);
    }
  };

  const handleStay = () => {
    setUnsavedDialogOpen(false);
    setPendingTab(null);
  };

  const handleDiscard = () => {
    discardDraftDailyData();
    setUnsavedDialogOpen(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleMobileTabSelect = (newTab: string) => {
    // Check if leaving Daily Participation tab with unsaved changes
    if (activeTab === 'grid' && newTab !== 'grid' && hasDraftChanges()) {
      setPendingTab(newTab);
      setUnsavedDialogOpen(true);
    } else {
      setActiveTab(newTab);
      setMobileMenuOpen(false);
    }
  };

  const handleMobileAction = (action: () => void) => {
    // Check if leaving Daily Participation tab with unsaved changes
    if (activeTab === 'grid' && hasDraftChanges()) {
      setPendingTab('action');
      setUnsavedDialogOpen(true);
      // Store the action to execute after discard
      (window as any).__pendingAction = action;
    } else {
      setMobileMenuOpen(false);
      action();
    }
  };

  const handleDiscardWithAction = () => {
    discardDraftDailyData();
    setUnsavedDialogOpen(false);
    setMobileMenuOpen(false);
    
    if (pendingTab === 'action' && (window as any).__pendingAction) {
      const action = (window as any).__pendingAction;
      delete (window as any).__pendingAction;
      action();
    } else if (pendingTab) {
      setActiveTab(pendingTab);
    }
    
    setPendingTab(null);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Carpool Ledger</h1>
            <p className="text-sm text-muted-foreground lg:hidden">{getActiveTabLabel()}</p>
          </div>
        </div>
        <DateRangePicker />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="travellers">Travellers</TabsTrigger>
            <TabsTrigger value="grid">Daily Participation</TabsTrigger>
            <TabsTrigger value="summary">Trips & Payment</TabsTrigger>
            <TabsTrigger value="trip-history">Trip History</TabsTrigger>
            <TabsTrigger value="payment-summary">Payment Summary</TabsTrigger>
            <TabsTrigger value="car">Car Expenses</TabsTrigger>
            <TabsTrigger value="overall">Overall Summary</TabsTrigger>
            <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
            <TabsTrigger value="clear">Clear Data</TabsTrigger>
          </TabsList>

          {/* Desktop action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentHistoryOpen(true)}
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Payment History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpenseHistoryOpen(true)}
              className="gap-2"
            >
              <CarIcon className="h-4 w-4" />
              Expense History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(true)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Other Co-Traveller button (shown only on Daily tab) */}
        {activeTab === 'grid' && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCoTravellerIncomeOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Other Co-Traveller
            </Button>
          </div>
        )}

        <TabsContent value="travellers">
          <TravellerManager />
        </TabsContent>

        <TabsContent value="grid">
          <DailyParticipationGrid />
        </TabsContent>

        <TabsContent value="summary">
          <SummaryPanel />
        </TabsContent>

        <TabsContent value="trip-history">
          <TripHistoryPanel />
        </TabsContent>

        <TabsContent value="payment-summary">
          <PaymentSummaryPanel />
        </TabsContent>

        <TabsContent value="car">
          <CarExpensesPanel />
        </TabsContent>

        <TabsContent value="overall">
          <OverallSummaryPanel />
        </TabsContent>

        <TabsContent value="backup">
          <BackupRestorePanel />
        </TabsContent>

        <TabsContent value="clear">
          <ClearDataPanel />
        </TabsContent>
      </Tabs>

      {/* Mobile sidebar navigation */}
      <MobileLedgerSidebarNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTab={activeTab}
        onTabSelect={handleMobileTabSelect}
        onOpenPaymentHistory={() => handleMobileAction(() => setPaymentHistoryOpen(true))}
        onOpenExpenseHistory={() => handleMobileAction(() => setExpenseHistoryOpen(true))}
        onOpenExport={() => handleMobileAction(() => setExportOpen(true))}
        onLogout={handleLogout}
      />

      {/* Dialogs */}
      <PaymentHistoryDialog open={paymentHistoryOpen} onOpenChange={setPaymentHistoryOpen} />
      <ExpenseHistoryDialog open={expenseHistoryOpen} onOpenChange={setExpenseHistoryOpen} />
      <ExportReportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <CoTravellerIncomeDialog open={coTravellerIncomeOpen} onOpenChange={setCoTravellerIncomeOpen} />
      
      {/* Unsaved changes confirmation */}
      <UnsavedChangesConfirmDialog
        open={unsavedDialogOpen}
        onStay={handleStay}
        onDiscard={pendingTab === 'action' ? handleDiscardWithAction : handleDiscard}
      />
    </div>
  );
}
