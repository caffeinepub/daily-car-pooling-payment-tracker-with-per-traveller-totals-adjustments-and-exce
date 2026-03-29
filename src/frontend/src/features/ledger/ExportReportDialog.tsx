import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { TabPermission } from "../../backend";
import { getCurrentMonthRange } from "../../utils/dateRange";
import { exportToCSV, exportToPDF } from "../../utils/exportReport";
import DateRangePicker from "./DateRangePicker";
import { useLedgerState } from "./LedgerStateContext";
import MonthYearRangeSelector from "./MonthYearRangeSelector";

interface ExportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Permissions for the shared user; undefined = admin (see all) */
  sharedPermissions?: TabPermission[];
}

export type ReportType =
  | "standard"
  | "monthly"
  | "profitLoss"
  | "income"
  | "expense";

/** Map from export section key → required tab key */
const SECTION_TAB_MAP: Record<string, string> = {
  dailyGrid: "grid",
  summary: "summary",
  payments: "paymentHistory",
  carExpenses: "car",
  overallSummary: "overall",
};

export default function ExportReportDialog({
  open,
  onOpenChange,
  sharedPermissions,
}: ExportReportDialogProps) {
  const ledgerState = useLedgerState();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("pdf");
  const [reportType, setReportType] = useState<ReportType>("standard");

  // Build permission map for shared users
  const permissionMap = new Map<string, string>();
  if (sharedPermissions) {
    for (const p of sharedPermissions) {
      permissionMap.set(p.tabKey, p.access);
    }
  }

  /** Returns true if this section is accessible to the current user */
  const isSectionAccessible = (sectionKey: string): boolean => {
    if (!sharedPermissions) return true; // admin sees all
    const tabKey = SECTION_TAB_MAP[sectionKey];
    if (!tabKey) return true;
    const access = permissionMap.get(tabKey);
    return access === "read" || access === "edit";
  };

  // Export-specific date range (independent from page tabs)
  const [exportDateRange, setExportDateRange] = useState<{
    start: Date;
    end: Date;
  }>(getCurrentMonthRange());

  // Initialize export date range when dialog opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - only reinitialize on open
  useEffect(() => {
    if (open && !exportDateRange) {
      setExportDateRange(getCurrentMonthRange());
    }
  }, [open]);

  // Section filters (only for standard report) — default to accessible sections only
  const [includeDailyGrid, setIncludeDailyGrid] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includePayments, setIncludePayments] = useState(true);
  const [includeCarExpenses, setIncludeCarExpenses] = useState(true);
  const [includeOverallSummary, setIncludeOverallSummary] = useState(true);

  // Traveller filter mode - default to 'all'
  const [travellerFilterMode, setTravellerFilterMode] = useState<
    "all" | "selected"
  >("all");
  const [selectedTravellers, setSelectedTravellers] = useState<Set<string>>(
    new Set(ledgerState.travellers.map((t) => t.id)),
  );

  // Car Expenses filters
  const [expenseCategory, setExpenseCategory] = useState<string>("all");
  const [expenseSearchQuery, setExpenseSearchQuery] = useState("");

  // Payment History filter
  const [paymentTravellerId, setPaymentTravellerId] = useState<string>("all");

  // Get unique expense categories
  const expenseCategories = Array.from(
    new Set(ledgerState.carExpenses.map((e) => e.category)),
  ).sort();

  const toggleTraveller = (id: string) => {
    const newSet = new Set(selectedTravellers);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTravellers(newSet);
  };

  const selectAllTravellers = () => {
    setSelectedTravellers(new Set(ledgerState.travellers.map((t) => t.id)));
  };

  const deselectAllTravellers = () => {
    setSelectedTravellers(new Set());
  };

  const handleExport = async () => {
    // Validate traveller selection only for standard report with selected mode
    if (
      reportType === "standard" &&
      travellerFilterMode === "selected" &&
      selectedTravellers.size === 0
    ) {
      toast.error("Please select at least one traveller to export");
      return;
    }

    setIsExporting(true);

    try {
      // For shared users, only export accessible sections
      const filters = {
        reportType,
        includeDailyGrid: includeDailyGrid && isSectionAccessible("dailyGrid"),
        includeSummary: includeSummary && isSectionAccessible("summary"),
        includePayments: includePayments && isSectionAccessible("payments"),
        includeCarExpenses:
          includeCarExpenses && isSectionAccessible("carExpenses"),
        includeOverallSummary:
          includeOverallSummary && isSectionAccessible("overallSummary"),
        travellerFilterMode,
        selectedTravellerIds: Array.from(selectedTravellers),
        expenseCategory,
        expenseSearchQuery,
        paymentTravellerId,
      };

      // Create a modified ledger state with export date range
      const exportLedgerState = {
        ...ledgerState,
        dateRange: exportDateRange,
      };

      if (exportFormat === "pdf") {
        await exportToPDF(exportLedgerState, filters);
        toast.success("Report exported successfully as PDF");
      } else {
        // CSV only supports standard report
        if (reportType !== "standard") {
          toast.error(
            "CSV export is only available for Standard Report. Please select PDF format for other report types.",
          );
          setIsExporting(false);
          return;
        }
        await exportToCSV(exportLedgerState, filters);
        toast.success("Report exported successfully as CSV");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const isStandardReport = reportType === "standard";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Choose report type, format, date range, and apply filters to
            customize your export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Date Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Date Range</Label>
            <div className="flex flex-col gap-3">
              <DateRangePicker
                value={exportDateRange}
                onChange={setExportDateRange}
              />
              <MonthYearRangeSelector
                value={exportDateRange}
                onChange={setExportDateRange}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This date range applies only to this export and does not affect
              page filters
            </p>
          </div>

          <Separator />

          {/* Report Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Report Type</Label>
            <Select
              value={reportType}
              onValueChange={(value: ReportType) => setReportType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Report</SelectItem>
                <SelectItem value="monthly">Monthly Report</SelectItem>
                <SelectItem value="profitLoss">
                  Profit & Loss Statement
                </SelectItem>
                <SelectItem value="income">Income Statement</SelectItem>
                <SelectItem value="expense">Expense Statement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            <Select
              value={exportFormat}
              onValueChange={(value: "csv" | "pdf") => setExportFormat(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF (Printable)</SelectItem>
                <SelectItem value="csv" disabled={!isStandardReport}>
                  CSV (Spreadsheet){" "}
                  {!isStandardReport && "- Standard Report only"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isStandardReport && (
            <>
              <Separator />

              {/* Section Filters */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Include Sections
                </Label>
                {sharedPermissions && (
                  <p className="text-xs text-muted-foreground">
                    Only sections from your permitted tabs are available.
                  </p>
                )}
                <div className="space-y-2">
                  {isSectionAccessible("dailyGrid") && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="section-daily"
                        checked={includeDailyGrid}
                        onCheckedChange={(checked) =>
                          setIncludeDailyGrid(checked === true)
                        }
                      />
                      <Label htmlFor="section-daily" className="cursor-pointer">
                        Daily Participation Grid
                      </Label>
                    </div>
                  )}
                  {isSectionAccessible("summary") && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="section-summary"
                        checked={includeSummary}
                        onCheckedChange={(checked) =>
                          setIncludeSummary(checked === true)
                        }
                      />
                      <Label
                        htmlFor="section-summary"
                        className="cursor-pointer"
                      >
                        Per-Traveller Summary
                      </Label>
                    </div>
                  )}
                  {isSectionAccessible("payments") && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="section-payments"
                        checked={includePayments}
                        onCheckedChange={(checked) =>
                          setIncludePayments(checked === true)
                        }
                      />
                      <Label
                        htmlFor="section-payments"
                        className="cursor-pointer"
                      >
                        Payment History
                      </Label>
                    </div>
                  )}
                  {isSectionAccessible("carExpenses") && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="section-car"
                        checked={includeCarExpenses}
                        onCheckedChange={(checked) =>
                          setIncludeCarExpenses(checked === true)
                        }
                      />
                      <Label htmlFor="section-car" className="cursor-pointer">
                        Car Expenses
                      </Label>
                    </div>
                  )}
                  {isSectionAccessible("overallSummary") && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="section-overall"
                        checked={includeOverallSummary}
                        onCheckedChange={(checked) =>
                          setIncludeOverallSummary(checked === true)
                        }
                      />
                      <Label
                        htmlFor="section-overall"
                        className="cursor-pointer"
                      >
                        Overall Summary
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Traveller Filters */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Traveller Filter
                </Label>
                <div className="space-y-3">
                  <Select
                    value={travellerFilterMode}
                    onValueChange={(value: "all" | "selected") =>
                      setTravellerFilterMode(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All travellers</SelectItem>
                      <SelectItem value="selected">
                        Selected travellers only
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {travellerFilterMode === "selected" && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">
                          Select Travellers
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={selectAllTravellers}
                          >
                            Select All
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={deselectAllTravellers}
                          >
                            Deselect All
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                        {ledgerState.travellers.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`traveller-${t.id}`}
                              checked={selectedTravellers.has(t.id)}
                              onCheckedChange={() => toggleTraveller(t.id)}
                            />
                            <Label
                              htmlFor={`traveller-${t.id}`}
                              className="cursor-pointer"
                            >
                              {t.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Applies to: Daily Grid, Summary, and Payment History sections
                </p>
              </div>

              {isSectionAccessible("payments") && (
                <>
                  <Separator />

                  {/* Payment History Filters */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Payment History Filter
                    </Label>
                    <div className="space-y-2">
                      <Label
                        htmlFor="payment-traveller-filter"
                        className="text-sm text-muted-foreground"
                      >
                        Filter by Traveller
                      </Label>
                      <Select
                        value={paymentTravellerId}
                        onValueChange={setPaymentTravellerId}
                      >
                        <SelectTrigger id="payment-traveller-filter">
                          <SelectValue placeholder="Select traveller" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All travellers</SelectItem>
                          {ledgerState.travellers.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Applies to: Payment History section only
                    </p>
                  </div>
                </>
              )}

              {isSectionAccessible("carExpenses") && (
                <>
                  <Separator />

                  {/* Car Expenses Filters */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Car Expenses Filters
                    </Label>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor="expense-category-filter"
                          className="text-sm text-muted-foreground"
                        >
                          Filter by Category
                        </Label>
                        <Select
                          value={expenseCategory}
                          onValueChange={setExpenseCategory}
                        >
                          <SelectTrigger id="expense-category-filter">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {expenseCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="expense-search"
                          className="text-sm text-muted-foreground"
                        >
                          Search Category or Note
                        </Label>
                        <Input
                          id="expense-search"
                          type="text"
                          placeholder="Search expenses..."
                          value={expenseSearchQuery}
                          onChange={(e) =>
                            setExpenseSearchQuery(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Applies to: Car Expenses section only
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                {exportFormat === "pdf" ? (
                  <FileText className="h-4 w-4 mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
