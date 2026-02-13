import { useState } from 'react';
import AppHeader from '../../components/AppHeader';
import TravellerManager from './TravellerManager';
import DateRangePicker from './DateRangePicker';
import DailyParticipationGrid from './DailyParticipationGrid';
import SummaryPanel from './SummaryPanel';
import CarExpensesPanel from './CarExpensesPanel';
import OverallSummaryPanel from './OverallSummaryPanel';
import ClearDataPanel from './ClearDataPanel';
import SettingsPanel from './SettingsPanel';
import ExportButton from './ExportButton';
import RatePerTripControl from './RatePerTripControl';
import PaymentHistoryDialog from './PaymentHistoryDialog';
import ExpenseHistoryDialog from './ExpenseHistoryDialog';
import { LedgerStateProvider, useLedgerState } from './LedgerStateContext';
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
import { Calendar, Users, Receipt, Car, TrendingUp, Trash2, Settings } from 'lucide-react';

function LedgerPageContent() {
  const [activeTab, setActiveTab] = useState('travellers');
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const { hasDraftChanges, discardDraftDailyData, isLoading } = useLedgerState();

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 container py-6 px-4 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading your ledger data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

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
            <TabsTrigger value="settings" className="flex flex-col sm:flex-row items-center gap-1 py-2">
              <Settings className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Settings</span>
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
          <TabsContent value="settings" className="mt-6">
            <SettingsPanel />
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
