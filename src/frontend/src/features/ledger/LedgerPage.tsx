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
import ExportButton from './ExportButton';
import RatePerTripControl from './RatePerTripControl';
import PaymentHistoryDialog from './PaymentHistoryDialog';
import ExpenseHistoryDialog from './ExpenseHistoryDialog';
import { LedgerStateProvider, useLedgerState } from './LedgerStateContext';
import { useAppDataSync } from '../../hooks/useAppDataSync';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Calendar, Users, Receipt, Car, TrendingUp, Database, Trash2 } from 'lucide-react';

function LedgerPageContent() {
  const [activeTab, setActiveTab] = useState('travellers');
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
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

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader syncStatus={syncStatus} lastSyncTime={lastSyncTime} />

      <main className="flex-1 container py-6 px-4 space-y-6">
        {/* Date Range, Rate, Payment History, Expense History & Export */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <DateRangePicker />
            <div className="flex gap-2 flex-wrap">
              <PaymentHistoryDialog />
              <ExpenseHistoryDialog />
              <ExportButton />
            </div>
          </div>
          <div className="flex justify-start">
            <RatePerTripControl />
          </div>
        </div>

        {/* Unified Tab Navigation for All Screen Sizes */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-7 h-auto">
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
