import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TravellerManager from './TravellerManager';
import DateRangePicker from './DateRangePicker';
import DailyParticipationGrid from './DailyParticipationGrid';
import SummaryPanel from './SummaryPanel';
import RatePerTripControl from './RatePerTripControl';
import CarExpensesPanel from './CarExpensesPanel';
import OverallSummaryPanel from './OverallSummaryPanel';
import PaymentHistoryDialog from './PaymentHistoryDialog';
import ExpenseHistoryDialog from './ExpenseHistoryDialog';
import ExportButton from './ExportButton';
import { useLedgerState } from './LedgerStateContext';
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

export default function LedgerPage() {
  const [activeTab, setActiveTab] = useState('travellers');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const { hasDraftChanges } = useLedgerState();

  const handleTabChange = (newTab: string) => {
    // Check if leaving Daily tab with unsaved changes
    if (activeTab === 'daily' && hasDraftChanges()) {
      setPendingTab(newTab);
      setShowUnsavedDialog(true);
    } else {
      setActiveTab(newTab);
    }
  };

  const confirmTabChange = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
    setShowUnsavedDialog(false);
  };

  const cancelTabChange = () => {
    setPendingTab(null);
    setShowUnsavedDialog(false);
  };

  const handleSaveAndNext = () => {
    // Navigate to Summary tab after saving
    setActiveTab('summary');
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Carpool Ledger</h1>
          <p className="text-muted-foreground mt-1">Track trips, payments, and expenses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PaymentHistoryDialog />
          <ExpenseHistoryDialog />
          <ExportButton />
        </div>
      </div>

      {/* Date Range and Rate Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DateRangePicker />
        <RatePerTripControl />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="travellers">Travellers</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="car">Car Expense</TabsTrigger>
          <TabsTrigger value="overall">Overall</TabsTrigger>
        </TabsList>

        <TabsContent value="travellers" className="space-y-4">
          <TravellerManager />
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <DailyParticipationGrid onSaveAndNext={handleSaveAndNext} />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <SummaryPanel />
        </TabsContent>

        <TabsContent value="car" className="space-y-4">
          <CarExpensesPanel />
        </TabsContent>

        <TabsContent value="overall" className="space-y-4">
          <OverallSummaryPanel />
        </TabsContent>
      </Tabs>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in the Daily Participation grid. If you leave now, your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelTabChange}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTabChange}>Leave Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
