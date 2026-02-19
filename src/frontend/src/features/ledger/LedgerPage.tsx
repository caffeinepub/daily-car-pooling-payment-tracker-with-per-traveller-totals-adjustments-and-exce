import { useState, useEffect, useRef } from 'react';
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
import TripHistoryPanel from './TripHistoryPanel';
import PaymentSummaryPanel from './PaymentSummaryPanel';
import MonthYearRangeSelector from './MonthYearRangeSelector';
import { LedgerStateProvider, useLedgerState } from './LedgerStateContext';
import { useAppDataSync } from '../../hooks/useAppDataSync';
import { getCurrentMonthRange, getCurrentWeekMondayToFriday } from '../../utils/dateRange';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Calendar, Users, Receipt, Car, TrendingUp, Database, Trash2, Menu, UserPlus, History, DollarSign, FileText, MoreVertical } from 'lucide-react';
import { SiCaffeine } from 'react-icons/si';

// Tab label mapping
const TAB_LABELS: Record<string, string> = {
  travellers: 'Travellers',
  grid: 'Daily',
  summary: 'Summary',
  car: 'Expense Record',
  overall: 'Overall',
  backup: 'Backup',
  clear: 'Clear Data',
  tripHistory: 'Trip History',
  paymentSummary: 'Trips & Payment',
};

// Define tab keys type
type TabKey = 'travellers' | 'grid' | 'summary' | 'car' | 'overall' | 'tripHistory' | 'paymentSummary' | 'backup' | 'clear';

function LedgerPageContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('grid'); // Default to Daily Participation
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [isExpenseHistoryOpen, setIsExpenseHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCoTravellerIncomeOpen, setIsCoTravellerIncomeOpen] = useState(false);
  const { hasDraftChanges, discardDraftDailyData, getPersistedState, applyMergedState, stateRevision, setDateRange: contextSetDateRange } = useLedgerState();

  // Per-tab date range storage (session-scoped)
  const tabDateRanges = useRef<Map<TabKey, { start: Date; end: Date }>>(new Map());
  
  // Initialize currentDateRange with the Daily tab's week range immediately
  const [currentDateRange, setCurrentDateRange] = useState<{ start: Date; end: Date }>(() => {
    const weekRange = getCurrentWeekMondayToFriday();
    tabDateRanges.current.set('grid', weekRange);
    
    // Set other tabs to current month
    const currentMonth = getCurrentMonthRange();
    (['travellers', 'summary', 'car', 'overall', 'tripHistory', 'paymentSummary', 'backup', 'clear'] as TabKey[]).forEach(tab => {
      if (tab !== 'grid') {
        tabDateRanges.current.set(tab, currentMonth);
      }
    });
    
    return weekRange;
  });

  // Initialize sync
  const { syncStatus, lastSyncTime, error: syncError } = useAppDataSync({
    getLocalState: getPersistedState,
    applyMergedState,
    stateRevision,
  });

  // Sync context date range on mount
  useEffect(() => {
    contextSetDateRange(currentDateRange);
  }, []);

  // Handle tab changes - restore that tab's date range
  useEffect(() => {
    const savedRange = tabDateRanges.current.get(activeTab);
    if (savedRange) {
      setCurrentDateRange(savedRange);
      contextSetDateRange(savedRange);
    }
  }, [activeTab]);

  // Handle date range changes - save to active tab
  const handleDateRangeChange = (newRange: { start: Date; end: Date }) => {
    tabDateRanges.current.set(activeTab, newRange);
    setCurrentDateRange(newRange);
    contextSetDateRange(newRange);
  };

  const handleTabChange = (newTab: string) => {
    // Check for unsaved changes when leaving the Daily tab
    if (activeTab === 'grid' && newTab !== 'grid' && hasDraftChanges()) {
      setPendingTab(newTab);
      setShowUnsavedDialog(true);
    } else {
      setActiveTab(newTab as TabKey);
    }
  };

  const handleDiscardChanges = () => {
    discardDraftDailyData();
    if (pendingTab) {
      setActiveTab(pendingTab as TabKey);
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

  const handleLogout = () => {
    // Reset local ledger state on logout
    applyMergedState({
      travellers: [],
      dailyData: {},
      dateRange: { start: new Date().toISOString(), end: new Date().toISOString() },
      ratePerTrip: 50,
      cashPayments: [],
      otherPending: [],
      carExpenses: [],
      includeSaturday: false,
      includeSunday: false,
      coTravellerIncomes: [],
    });
  };

  // Show Month/Year selector for non-Daily tabs
  const showMonthYearSelector = activeTab !== 'grid';

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader syncStatus={syncStatus} lastSyncTime={lastSyncTime} syncError={syncError} onLogout={handleLogout} />

      <main className="flex-1 container py-6 px-4 space-y-6">
        {/* Date Range, Rate, Month/Year Selector, and Other Co-Traveller */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <DateRangePicker value={currentDateRange} onChange={handleDateRangeChange} />
              {showMonthYearSelector && (
                <MonthYearRangeSelector value={currentDateRange} onChange={handleDateRangeChange} />
              )}
            </div>
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

        {/* Mobile Hamburger Button with active tab label */}
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
            <span>{TAB_LABELS[activeTab] || 'Carpool Menu'}</span>
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
          <div className="hidden sm:flex items-center gap-4">
            <TabsList className="grid grid-cols-7 h-auto flex-1">
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
                <span className="text-xs sm:text-sm">Expense</span>
              </TabsTrigger>
              <TabsTrigger value="overall" className="flex flex-col sm:flex-row items-center gap-1 py-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Overall</span>
              </TabsTrigger>
              <TabsTrigger value="tripHistory" className="flex flex-col sm:flex-row items-center gap-1 py-2">
                <History className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Trip History</span>
              </TabsTrigger>
              <TabsTrigger value="paymentSummary" className="flex flex-col sm:flex-row items-center gap-1 py-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Payment</span>
              </TabsTrigger>
            </TabsList>

            {/* Desktop Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenPaymentHistory}>
                  <Receipt className="mr-2 h-4 w-4" />
                  Payment History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenExpenseHistory}>
                  <Car className="mr-2 h-4 w-4" />
                  Expense History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenExport}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTabChange('backup')}>
                  <Database className="mr-2 h-4 w-4" />
                  Backup
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTabChange('clear')}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <TabsContent value="travellers" className="mt-6">
            <TravellerManager />
          </TabsContent>
          <TabsContent value="grid" className="mt-6">
            <DailyParticipationGrid dateRange={currentDateRange} onSaveAndNext={handleSaveAndNext} />
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
          <TabsContent value="tripHistory" className="mt-6">
            <TripHistoryPanel />
          </TabsContent>
          <TabsContent value="paymentSummary" className="mt-6">
            <PaymentSummaryPanel />
          </TabsContent>
          <TabsContent value="backup" className="mt-6">
            <BackupRestorePanel />
          </TabsContent>
          <TabsContent value="clear" className="mt-6">
            <ClearDataPanel />
          </TabsContent>
        </Tabs>

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
                You have unsaved changes in the Daily Participation grid. Do you want to discard them?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleStay}>Stay</AlertDialogCancel>
              <AlertDialogAction onClick={handleDiscardChanges} className="bg-destructive hover:bg-destructive/90">
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4 bg-muted/30">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Carpool Ledger. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Built with <SiCaffeine className="h-4 w-4 text-primary" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'carpool-ledger'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
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
