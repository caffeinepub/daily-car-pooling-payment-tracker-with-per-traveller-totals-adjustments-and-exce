import { useState } from 'react';
import AppHeader from '../../components/AppHeader';
import TravellerManager from './TravellerManager';
import DateRangePicker from './DateRangePicker';
import DailyParticipationGrid from './DailyParticipationGrid';
import SummaryPanel from './SummaryPanel';
import CarExpensesPanel from './CarExpensesPanel';
import OverallSummaryPanel from './OverallSummaryPanel';
import BackupRestorePanel from './BackupRestorePanel';
import ClearDataPanel from './ClearDataPanel';
import RatePerTripControl from './RatePerTripControl';
import PaymentHistoryDialog from './PaymentHistoryDialog';
import ExpenseHistoryDialog from './ExpenseHistoryDialog';
import ExportReportDialog from './ExportReportDialog';
import CoTravellerIncomeDialog from './CoTravellerIncomeDialog';
import MobileLedgerSidebarNav from './MobileLedgerSidebarNav';
import { LedgerStateProvider, useLedgerState } from './LedgerStateContext';
import { useAppDataSync } from '../../hooks/useAppDataSync';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Users, Receipt, Car, TrendingUp, Database, Trash2, Menu, UserPlus } from 'lucide-react';

function LedgerPageContent() {
  const [activeTab, setActiveTab] = useState('grid'); // Default to Daily Participation
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [isExpenseHistoryOpen, setIsExpenseHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCoTravellerIncomeOpen, setIsCoTravellerIncomeOpen] = useState(false);
  const { hasDraftChanges, discardDraftDailyData, getPersistedState, applyMergedState, stateRevision } = useLedgerState();

  // Initialize sync
  const { syncStatus, lastSyncTime } = useAppDataSync({
    getLocalState: getPersistedState,
    applyMergedState,
    stateRevision,
  });

  const handleTabChange = (newTab: string) => {
    // Check for unsaved changes when leaving the Daily tab
    if (activeTab === 'grid' && newTab !== 'grid' && hasDraftChanges()) {
      setPendingTab(newTab);
      setShowUnsavedDialog(true);
    } else {
      setActiveTab(newTab);
    }
  };

  const handleDiscardChanges = () => {
    discardDraftDailyData();
    if (pendingTab) {
      setActiveTab(pendingTab);
    }
    setShowUnsavedDialog(false);
    setPendingTab(null);
  };

  const handleStay = () => {
    setShowUnsavedDialog(false);
    setPendingTab(null);
  };

  const handleSaveAndNext = () => {
    setActiveTab('summary');
  };

  const handleOpenPaymentHistory = () => {
    setIsPaymentHistoryOpen(true);
    setIsSidebarOpen(false);
  };

  const handleOpenExpenseHistory = () => {
    setIsExpenseHistoryOpen(true);
    setIsSidebarOpen(false);
  };

  const handleOpenExport = () => {
    setIsExportOpen(true);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader syncStatus={syncStatus} lastSyncTime={lastSyncTime} />

      <main className="flex-1 container py-6 px-4 space-y-6">
        {/* Date Range, Rate, and Other Co-Traveller */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <DateRangePicker />
            {activeTab === 'grid' && (
              <Button
                variant="outline"
                size="default"
                onClick={() => setIsCoTravellerIncomeOpen(true)}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Other Co-Traveller
              </Button>
            )}
          </div>
          <div className="flex justify-start">
            <RatePerTripControl />
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="sm:hidden">
          <Button
            variant="outline"
            size="default"
            onClick={() => setIsSidebarOpen(true)}
            className="w-full justify-start gap-2"
            aria-expanded={isSidebarOpen}
            aria-label="Open Carpool Menu"
          >
            <Menu className="h-5 w-5" />
            <span>Carpool Menu</span>
          </Button>
        </div>

        {/* Mobile Sidebar Navigation */}
        <MobileLedgerSidebarNav
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onTabSelect={handleTabChange}
          onOpenPaymentHistory={handleOpenPaymentHistory}
          onOpenExpenseHistory={handleOpenExpenseHistory}
          onOpenExport={handleOpenExport}
        />

        {/* Unified Tab Navigation for Desktop/Tablet */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="hidden sm:grid w-full grid-cols-7 h-auto">
            <TabsTrigger value="travellers" className="flex flex-col sm:flex-row items-center gap-1 py-2">
              <Users className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Travellers</span>
            </TabsTrigger>
            <TabsTrigger value="grid" className="flex flex-col sm:flex-row items-center gap-1 py-2">
              <Calendar className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Daily</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex flex-col sm:flex-row items-center gap-1 py-2">
              <Receipt className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="car" className="flex flex-col sm:flex-row items-center gap-1 py-2">
              <Car className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Car Expense</span>
            </TabsTrigger>
            <TabsTrigger value="overall" className="flex flex-col sm:flex-row items-center gap-1 py-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Overall</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex flex-col sm:flex-row items-center gap-1 py-2">
              <Database className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Backup</span>
            </TabsTrigger>
            <TabsTrigger value="clear" className="flex flex-col sm:flex-row items-center gap-1 py-2">
              <Trash2 className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Clear Data</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="travellers" className="mt-6">
            <TravellerManager />
          </TabsContent>
          <TabsContent value="grid" className="mt-6">
            <DailyParticipationGrid onSaveAndNext={handleSaveAndNext} />
          </TabsContent>
          <TabsContent value="summary" className="mt-6">
            <SummaryPanel />
          </TabsContent>
          <TabsContent value="car" className="mt-6">
            <CarExpensesPanel />
          </TabsContent>
          <TabsContent value="overall" className="mt-6">
            <OverallSummaryPanel />
          </TabsContent>
          <TabsContent value="backup" className="mt-6">
            <BackupRestorePanel />
          </TabsContent>
          <TabsContent value="clear" className="mt-6">
            <ClearDataPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <PaymentHistoryDialog open={isPaymentHistoryOpen} onOpenChange={setIsPaymentHistoryOpen} />
      <ExpenseHistoryDialog open={isExpenseHistoryOpen} onOpenChange={setIsExpenseHistoryOpen} />
      <ExportReportDialog open={isExportOpen} onOpenChange={setIsExportOpen} />
      <CoTravellerIncomeDialog open={isCoTravellerIncomeOpen} onOpenChange={setIsCoTravellerIncomeOpen} />

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in the Daily grid. Do you want to discard them and continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStay}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardChanges}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function LedgerPage() {
  return (
    <LedgerStateProvider>
      <LedgerPageContent />
    </LedgerStateProvider>
  );
}
