import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Car,
  Database,
  DollarSign,
  FileText,
  History,
  Menu,
  Receipt,
  Share2,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SiCaffeine } from "react-icons/si";
import type { TabPermission } from "../../backend";
import AppHeader from "../../components/AppHeader";
import { ReadOnlyProvider } from "../../context/ReadOnlyContext";
import { useAppDataSync } from "../../hooks/useAppDataSync";
import { useSharedDataSync } from "../../hooks/useSharedDataSync";
import {
  getCurrentMonthRange,
  getCurrentWeekMondayToFriday,
  getFullYearRange,
} from "../../utils/dateRange";
import BackupRestorePanel from "./BackupRestorePanel";
import CarExpensesPanel from "./CarExpensesPanel";
import ClearDataPanel from "./ClearDataPanel";
import CoTravellerIncomeDialog from "./CoTravellerIncomeDialog";
import DailyParticipationGrid from "./DailyParticipationGrid";
import DateRangePicker from "./DateRangePicker";
import ExpenseHistoryDialog from "./ExpenseHistoryDialog";
import ExportReportDialog from "./ExportReportDialog";
import { LedgerStateProvider, useLedgerState } from "./LedgerStateContext";
import MobileLedgerSidebarNav from "./MobileLedgerSidebarNav";
import MonthYearRangeSelector from "./MonthYearRangeSelector";
import OverallSummaryPanel from "./OverallSummaryPanel";
import PaymentHistoryDialog from "./PaymentHistoryDialog";
import PaymentSummaryPanel from "./PaymentSummaryPanel";
import RatePerTripControl from "./RatePerTripControl";
import ShareAccessPanel from "./ShareAccessPanel";
import SummaryPanel from "./SummaryPanel";
import TravellerManager from "./TravellerManager";
import TripHistoryPanel from "./TripHistoryPanel";

// Tab label mapping
const TAB_LABELS: Record<string, string> = {
  travellers: "Travellers",
  grid: "Daily",
  summary: "Participation Payment",
  car: "Expense Record",
  overall: "Overall",
  backup: "Backup",
  clear: "Clear Data",
  tripHistory: "Trip History",
  paymentSummary: "Trips & Payment",
  paymentHistory: "Payment History",
  expenseHistory: "Expense History",
  export: "Export",
  shareAccess: "Share Access",
};

// Define tab keys type
type TabKey =
  | "travellers"
  | "grid"
  | "summary"
  | "car"
  | "overall"
  | "tripHistory"
  | "paymentSummary"
  | "backup"
  | "clear"
  | "paymentHistory"
  | "expenseHistory"
  | "export"
  | "shareAccess";

export interface LedgerPageProps {
  onOpenProfile?: () => void;
  profilePicture?: string;
  userName?: string;
  sharedPermissions?: TabPermission[];
  isReadOnlyUser?: boolean;
  adminPrincipalStr?: string;
  sharedUserEmail?: string;
}

export function LedgerPageContent({
  onOpenProfile,
  profilePicture,
  userName,
  sharedPermissions,
  isReadOnlyUser,
  adminPrincipalStr,
  sharedUserEmail: _sharedUserEmail,
}: LedgerPageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("grid"); // Default to Daily Participation
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [isExpenseHistoryOpen, setIsExpenseHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCoTravellerIncomeOpen, setIsCoTravellerIncomeOpen] = useState(false);
  const {
    hasDraftChanges,
    discardDraftDailyData,
    getPersistedState,
    mergeRestoreFromBackup,
    clearAllLedgerData,
    stateRevision,
    setDateRange: contextSetDateRange,
  } = useLedgerState();

  // Build permission map for quick lookup
  const permissionMap = new Map<string, string>();
  if (sharedPermissions) {
    for (const p of sharedPermissions) {
      permissionMap.set(p.tabKey, p.access);
    }
  }

  // Determine if a tab is visible for shared users
  const isTabVisible = (tabKey: string) => {
    if (!sharedPermissions) return true; // admin sees all
    if (tabKey === "shareAccess") return false; // never show to shared users
    const access = permissionMap.get(tabKey);
    return access === "read" || access === "edit";
  };

  // Per-tab date range storage (session-scoped)
  const tabDateRanges = useRef<Map<TabKey, { start: Date; end: Date }>>(
    new Map(),
  );

  // Initialize currentDateRange with the Daily tab's week range immediately
  const [currentDateRange, setCurrentDateRange] = useState<{
    start: Date;
    end: Date;
  }>(() => {
    const weekRange = getCurrentWeekMondayToFriday();
    tabDateRanges.current.set("grid", weekRange);

    // Set other tabs to current month, except paymentSummary which defaults to full year
    const currentMonth = getCurrentMonthRange();
    const currentYear = new Date().getFullYear();
    const fullYear = getFullYearRange(currentYear);

    for (const tab of [
      "travellers",
      "summary",
      "car",
      "overall",
      "tripHistory",
      "backup",
      "clear",
    ] as TabKey[]) {
      tabDateRanges.current.set(tab, currentMonth);
    }

    // Trips & Payment defaults to full year for better payment tracking
    tabDateRanges.current.set("paymentSummary", fullYear);

    return weekRange;
  });

  // Initialize sync — use shared sync for shared users, regular sync for admin
  const adminSyncResult = useAppDataSync({
    getLocalState: getPersistedState,
    applyMergedState: mergeRestoreFromBackup,
    stateRevision,
  });
  const sharedSyncResult = useSharedDataSync({
    adminPrincipalStr: adminPrincipalStr ?? "",
    applyMergedState: mergeRestoreFromBackup,
  });
  const {
    syncStatus,
    lastSyncTime,
    error: syncError,
  } = adminPrincipalStr ? sharedSyncResult : adminSyncResult;

  // Sync context date range on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - run once on mount only
  useEffect(() => {
    contextSetDateRange(currentDateRange);
  }, []);

  // Handle tab changes - restore that tab's date range
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - contextSetDateRange is stable
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
    // Dialog-only tabs — open dialog without changing activeTab
    if (newTab === "paymentHistory") {
      setIsPaymentHistoryOpen(true);
      return;
    }
    if (newTab === "expenseHistory") {
      setIsExpenseHistoryOpen(true);
      return;
    }
    if (newTab === "export") {
      setIsExportOpen(true);
      return;
    }

    // Check for unsaved changes when leaving the Daily tab
    if (activeTab === "grid" && newTab !== "grid" && hasDraftChanges()) {
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
    setActiveTab("summary");
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
    clearAllLedgerData();
  };

  // Show Month/Year selector for non-Daily tabs
  const showMonthYearSelector = activeTab !== "grid";

  // Read-only for current tab (only relevant for shared users)
  const currentTabAccess = sharedPermissions
    ? (permissionMap.get(activeTab) ?? "read")
    : "edit";
  const isReadOnlyTab = isReadOnlyUser && currentTabAccess === "read";

  return (
    <ReadOnlyProvider isReadOnly={!!isReadOnlyTab}>
      <div className="min-h-screen flex flex-col">
        <AppHeader
          syncStatus={syncStatus}
          lastSyncTime={lastSyncTime}
          syncError={syncError}
          onLogout={handleLogout}
          onOpenProfile={isReadOnlyUser ? undefined : onOpenProfile}
          profilePicture={profilePicture}
          userName={userName}
        />

        <main className="flex-1 container py-3 sm:py-6 px-3 sm:px-4 space-y-3 sm:space-y-6">
          {/* Date Range, Rate, Month/Year Selector, and Other Co-Traveller */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center w-full sm:w-auto">
                <DateRangePicker
                  value={currentDateRange}
                  onChange={handleDateRangeChange}
                />
                {showMonthYearSelector && (
                  <MonthYearRangeSelector
                    value={currentDateRange}
                    onChange={handleDateRangeChange}
                  />
                )}
              </div>
              {activeTab === "grid" && !isReadOnlyUser && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setIsCoTravellerIncomeOpen(true)}
                  className="gap-2 w-full sm:w-auto"
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
              data-ocid="nav.open_modal_button"
            >
              <Menu className="h-5 w-5" />
              <span>{TAB_LABELS[activeTab] || "Carpool Menu"}</span>
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
            hiddenTabs={
              sharedPermissions
                ? ALL_TAB_KEYS.filter((k) => !isTabVisible(k))
                : []
            }
          />

          {/* Unified Tab Navigation for Desktop/Tablet */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="hidden sm:block">
              <div className="overflow-x-auto pb-1">
                <TabsList className="h-9 inline-flex w-max min-w-full gap-0 p-1">
                  {isTabVisible("travellers") && (
                    <TabsTrigger
                      value="travellers"
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      data-ocid="nav.travellers.tab"
                    >
                      <Users className="h-3.5 w-3.5 flex-shrink-0" />
                      Travellers
                    </TabsTrigger>
                  )}
                  {isTabVisible("grid") && (
                    <TabsTrigger
                      value="grid"
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      data-ocid="nav.daily.tab"
                    >
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      Daily
                    </TabsTrigger>
                  )}
                  {isTabVisible("summary") && (
                    <TabsTrigger
                      value="summary"
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      data-ocid="nav.summary.tab"
                    >
                      <Receipt className="h-3.5 w-3.5 flex-shrink-0" />
                      Part. Payment
                    </TabsTrigger>
                  )}
                  {isTabVisible("car") && (
                    <TabsTrigger
                      value="car"
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      data-ocid="nav.expense.tab"
                    >
                      <Car className="h-3.5 w-3.5 flex-shrink-0" />
                      Expense
                    </TabsTrigger>
                  )}
                  {isTabVisible("overall") && (
                    <TabsTrigger
                      value="overall"
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      data-ocid="nav.overall.tab"
                    >
                      <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                      Overall
                    </TabsTrigger>
                  )}
                  {isTabVisible("tripHistory") && (
                    <TabsTrigger
                      value="tripHistory"
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      data-ocid="nav.triphistory.tab"
                    >
                      <History className="h-3.5 w-3.5 flex-shrink-0" />
                      Trip History
                    </TabsTrigger>
                  )}
                  {isTabVisible("paymentSummary") && (
                    <TabsTrigger
                      value="paymentSummary"
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      data-ocid="nav.payment.tab"
                    >
                      <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
                      Trips &amp; Payment
                    </TabsTrigger>
                  )}
                  {isTabVisible("paymentHistory") && (
                    <TabsTrigger
                      value="paymentHistory"
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      data-ocid="nav.paymenthistory.tab"
                    >
                      <Receipt className="h-3.5 w-3.5 flex-shrink-0" />
                      Pay. History
                    </TabsTrigger>
                  )}
                  {isTabVisible("expenseHistory") && (
                    <TabsTrigger
                      value="expenseHistory"
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      data-ocid="nav.expensehistory.tab"
                    >
                      <Car className="h-3.5 w-3.5 flex-shrink-0" />
                      Exp. History
                    </TabsTrigger>
                  )}
                  {isTabVisible("export") && (
                    <TabsTrigger
                      value="export"
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      data-ocid="nav.export.tab"
                    >
                      <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                      Export
                    </TabsTrigger>
                  )}
                  {isTabVisible("backup") && (
                    <TabsTrigger
                      value="backup"
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      data-ocid="nav.backup.tab"
                    >
                      <Database className="h-3.5 w-3.5 flex-shrink-0" />
                      Backup
                    </TabsTrigger>
                  )}
                  {isTabVisible("clear") && (
                    <TabsTrigger
                      value="clear"
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      data-ocid="nav.cleardata.tab"
                    >
                      <Trash2 className="h-3.5 w-3.5 flex-shrink-0" />
                      Clear Data
                    </TabsTrigger>
                  )}
                  {/* Share Access tab — admin only */}
                  {!sharedPermissions && (
                    <TabsTrigger
                      value="shareAccess"
                      className="px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                      data-ocid="nav.shareaccess.tab"
                    >
                      <Share2 className="h-3.5 w-3.5 flex-shrink-0" />
                      Share Access
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
            </div>

            <TabsContent value="travellers" className="mt-4 sm:mt-6">
              <TravellerManager />
            </TabsContent>
            <TabsContent value="grid" className="mt-4 sm:mt-6">
              <DailyParticipationGrid
                dateRange={currentDateRange}
                onSaveAndNext={handleSaveAndNext}
              />
            </TabsContent>
            <TabsContent value="summary" className="mt-4 sm:mt-6">
              <SummaryPanel />
            </TabsContent>
            <TabsContent value="car" className="mt-4 sm:mt-6">
              <CarExpensesPanel />
            </TabsContent>
            <TabsContent value="overall" className="mt-4 sm:mt-6">
              <OverallSummaryPanel />
            </TabsContent>
            <TabsContent value="tripHistory" className="mt-4 sm:mt-6">
              <TripHistoryPanel />
            </TabsContent>
            <TabsContent value="paymentSummary" className="mt-4 sm:mt-6">
              <PaymentSummaryPanel />
            </TabsContent>
            <TabsContent value="backup" className="mt-4 sm:mt-6">
              <BackupRestorePanel />
            </TabsContent>
            <TabsContent value="clear" className="mt-4 sm:mt-6">
              <ClearDataPanel />
            </TabsContent>
            <TabsContent value="shareAccess" className="mt-4 sm:mt-6">
              <ShareAccessPanel />
            </TabsContent>
          </Tabs>

          {/* Dialogs */}
          <PaymentHistoryDialog
            open={isPaymentHistoryOpen}
            onOpenChange={setIsPaymentHistoryOpen}
          />
          <ExpenseHistoryDialog
            open={isExpenseHistoryOpen}
            onOpenChange={setIsExpenseHistoryOpen}
          />
          <ExportReportDialog
            open={isExportOpen}
            onOpenChange={setIsExportOpen}
            sharedPermissions={sharedPermissions}
          />
          {!isReadOnlyUser && (
            <CoTravellerIncomeDialog
              open={isCoTravellerIncomeOpen}
              onOpenChange={setIsCoTravellerIncomeOpen}
            />
          )}

          {/* Unsaved Changes Dialog */}
          <AlertDialog
            open={showUnsavedDialog}
            onOpenChange={setShowUnsavedDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                <AlertDialogDescription>
                  You have unsaved changes in the Daily Participation grid. Do
                  you want to discard them?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleStay}>Stay</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDiscardChanges}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Discard Changes
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>

        {/* Footer */}
        <footer className="border-t py-4 sm:py-6 px-3 sm:px-4 bg-muted/30">
          <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Carpool Ledger. All rights reserved.
            </p>
            <p className="flex items-center gap-1.5">
              Built with <SiCaffeine className="h-4 w-4 text-primary" /> using{" "}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  typeof window !== "undefined"
                    ? window.location.hostname
                    : "carpool-ledger",
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
    </ReadOnlyProvider>
  );
}

// All tab keys for filtering
const ALL_TAB_KEYS: TabKey[] = [
  "travellers",
  "grid",
  "summary",
  "car",
  "overall",
  "tripHistory",
  "paymentSummary",
  "paymentHistory",
  "expenseHistory",
  "export",
  "backup",
  "clear",
  "shareAccess",
];

export default function LedgerPage({
  onOpenProfile,
  profilePicture,
  userName,
  sharedPermissions,
  isReadOnlyUser,
}: LedgerPageProps = {}) {
  return (
    <LedgerStateProvider>
      <LedgerPageContent
        onOpenProfile={onOpenProfile}
        profilePicture={profilePicture}
        userName={userName}
        sharedPermissions={sharedPermissions}
        isReadOnlyUser={isReadOnlyUser}
      />
    </LedgerStateProvider>
  );
}
