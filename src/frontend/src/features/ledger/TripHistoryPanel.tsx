import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseISO } from "date-fns";
import { Clock, Edit, Filter, History, Moon, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import EmptyState from "../../components/EmptyState";
import { useReadOnly } from "../../context/ReadOnlyContext";
import type { OtherPending } from "../../hooks/useLedgerLocalState";
import {
  formatDateKey,
  formatDisplayDate,
  getDaysInRange,
} from "../../utils/dateRange";
import { formatCurrency } from "../../utils/money";
import { isDateIncludedForCalculation } from "../../utils/weekendInclusion";
import CoTravellerIncomeDialog from "./CoTravellerIncomeDialog";
import type { CoTravellerIncomeEntry } from "./CoTravellerIncomeDialog";
import DeleteOtherPendingAmountAlertDialog from "./DeleteOtherPendingAmountAlertDialog";
import DeleteTripHistoryEntryAlertDialog from "./DeleteTripHistoryEntryAlertDialog";
import EditOtherPendingAmountDialog from "./EditOtherPendingAmountDialog";
import EditTripHistoryTravellerDialog from "./EditTripHistoryTravellerDialog";
import type { TripHistoryEntry } from "./EditTripHistoryTravellerDialog";
import { useLedgerState } from "./LedgerStateContext";

interface TripEntry {
  date: string;
  displayDate: string;
  name: string;
  count: number;
  amount: number;
  type: "traveller" | "coTraveller";
  travellerId?: string;
  coTravellerIncomeId?: string;
  morning?: boolean;
  evening?: boolean;
  tripTime?: "morning" | "evening";
}

export default function TripHistoryPanel() {
  const {
    travellers,
    dateRange,
    dailyData,
    ratePerTrip,
    includeSaturday,
    includeSunday,
    coTravellerIncomes,
    otherPending,
    updateTravellerTrip,
    updateCoTravellerIncome,
    removeCoTravellerIncome,
  } = useLedgerState();

  const { isReadOnly } = useReadOnly();
  const [editTravellerDialogOpen, setEditTravellerDialogOpen] = useState(false);
  const [editCoTravellerDialogOpen, setEditCoTravellerDialogOpen] =
    useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TripEntry | null>(null);
  const [selectedTravellerId, setSelectedTravellerId] = useState<string>("all");

  // Other Pending Amount dialog state
  const [editPendingDialogOpen, setEditPendingDialogOpen] = useState(false);
  const [deletePendingDialogOpen, setDeletePendingDialogOpen] = useState(false);
  const [selectedPendingEntry, setSelectedPendingEntry] =
    useState<OtherPending | null>(null);

  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Build trip entries
  const allTripEntries: TripEntry[] = [];

  // Add traveller trips
  for (const day of days) {
    const dateKey = formatDateKey(day);
    const isIncluded = isDateIncludedForCalculation(
      day,
      includeSaturday,
      includeSunday,
      dateKey,
      dailyData,
    );
    if (!isIncluded) continue;

    for (const traveller of travellers) {
      const tripData = dailyData[dateKey]?.[traveller.id];
      if (tripData) {
        const count = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        if (count > 0) {
          allTripEntries.push({
            date: dateKey,
            displayDate: formatDisplayDate(day),
            name: traveller.name,
            count,
            amount: count * ratePerTrip,
            type: "traveller",
            travellerId: traveller.id,
            morning: tripData.morning,
            evening: tripData.evening,
          });
        }
      }
    }
  }

  // Add co-traveller income entries
  for (const income of coTravellerIncomes) {
    try {
      const incomeDate = parseISO(income.date);
      if (incomeDate >= dateRange.start && incomeDate <= dateRange.end) {
        allTripEntries.push({
          date: income.date,
          displayDate: formatDisplayDate(incomeDate),
          name: "Other Co-Traveller",
          count: 1,
          amount: income.amount,
          type: "coTraveller",
          coTravellerIncomeId: income.id,
          tripTime: income.tripTime,
        });
      }
    } catch {
      // Skip invalid dates
    }
  }

  // Sort by date
  allTripEntries.sort((a, b) => a.date.localeCompare(b.date));

  // Filter other pending amounts within the date range
  const pendingInRange = otherPending.filter((p) => {
    try {
      const pendingDate = parseISO(p.date);
      return pendingDate >= dateRange.start && pendingDate <= dateRange.end;
    } catch {
      return false;
    }
  });

  // Sort pending by date
  const allSortedPending = [...pendingInRange].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // Apply traveller filter
  const tripEntries =
    selectedTravellerId === "all"
      ? allTripEntries
      : allTripEntries.filter(
          (entry) =>
            entry.travellerId === selectedTravellerId ||
            (entry.type === "coTraveller" &&
              selectedTravellerId === "coTraveller"),
        );

  const sortedPendingInRange =
    selectedTravellerId === "all"
      ? allSortedPending
      : allSortedPending.filter((p) => p.travellerId === selectedTravellerId);

  const totalTrips = tripEntries.reduce((sum, entry) => sum + entry.count, 0);
  const totalAmount = tripEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalPendingAmount = sortedPendingInRange.reduce(
    (sum, p) => sum + p.amount,
    0,
  );

  const handleEditTraveller = (entry: TripEntry) => {
    setSelectedEntry(entry);
    setEditTravellerDialogOpen(true);
  };

  const handleEditCoTraveller = (entry: TripEntry) => {
    setSelectedEntry(entry);
    setEditCoTravellerDialogOpen(true);
  };

  const handleDeleteEntry = (entry: TripEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedEntry) return;

    if (selectedEntry.type === "traveller" && selectedEntry.travellerId) {
      updateTravellerTrip(
        selectedEntry.date,
        selectedEntry.travellerId,
        false,
        false,
      );
      toast.success("Trip entry deleted successfully");
    } else if (
      selectedEntry.type === "coTraveller" &&
      selectedEntry.coTravellerIncomeId
    ) {
      removeCoTravellerIncome(selectedEntry.coTravellerIncomeId);
      toast.success("Co-traveller income entry deleted successfully");
    }

    setDeleteDialogOpen(false);
    setSelectedEntry(null);
  };

  // Build TripHistoryEntry for the edit dialog
  const editTravellerEntry: TripHistoryEntry | null =
    selectedEntry && selectedEntry.type === "traveller"
      ? {
          displayDate: selectedEntry.displayDate,
          dateKey: selectedEntry.date,
          travellerId: selectedEntry.travellerId!,
          travellerName: selectedEntry.name,
          morning: selectedEntry.morning || false,
          evening: selectedEntry.evening || false,
        }
      : null;

  // Build CoTravellerIncomeEntry for the edit dialog
  const editCoTravellerEntry: CoTravellerIncomeEntry | null =
    selectedEntry &&
    selectedEntry.type === "coTraveller" &&
    selectedEntry.coTravellerIncomeId
      ? (() => {
          const income = coTravellerIncomes.find(
            (i) => i.id === selectedEntry.coTravellerIncomeId,
          );
          return income
            ? {
                id: income.id,
                amount: income.amount,
                date: income.date,
                note: income.note,
                tripTime: income.tripTime,
              }
            : null;
        })()
      : null;

  const handleSaveTravellerEdit = (updated: TripHistoryEntry) => {
    updateTravellerTrip(
      updated.dateKey,
      updated.travellerId,
      updated.morning,
      updated.evening,
    );
    toast.success("Trip entry updated successfully");
    setEditTravellerDialogOpen(false);
    setSelectedEntry(null);
  };

  const handleSaveCoTravellerEdit = (
    entry: Omit<CoTravellerIncomeEntry, "id">,
  ) => {
    if (editCoTravellerEntry?.id) {
      updateCoTravellerIncome(editCoTravellerEntry.id, entry);
      toast.success("Co-traveller income updated successfully");
    }
    setEditCoTravellerDialogOpen(false);
    setSelectedEntry(null);
  };

  // Handlers for Other Pending Amount
  const handleEditPending = (pending: OtherPending) => {
    setSelectedPendingEntry(pending);
    setEditPendingDialogOpen(true);
  };

  const handleDeletePending = (pending: OtherPending) => {
    setSelectedPendingEntry(pending);
    setDeletePendingDialogOpen(true);
  };

  // Get traveller name for a pending entry
  const getTravellerName = (travellerId: string): string => {
    const traveller = travellers.find((t) => t.id === travellerId);
    return traveller?.name || "Unknown";
  };

  const selectedPendingTravellerName = selectedPendingEntry
    ? getTravellerName(selectedPendingEntry.travellerId)
    : "";

  const hasTrips = tripEntries.length > 0;
  const hasPending = sortedPendingInRange.length > 0;
  const hasAnyData = allTripEntries.length > 0 || allSortedPending.length > 0;

  if (!hasAnyData) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Trip History
          </CardTitle>
          <CardDescription>
            View all trips within the selected date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={History}
            title="No trips recorded"
            description="Trip data will appear here once you mark trips in the Daily Participation grid or add Other Co-Traveller income"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Trip History
          </CardTitle>
          <CardDescription>
            All trips and pending amounts within the selected date range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Traveller Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Filter by:
            </span>
            <Select
              value={selectedTravellerId}
              onValueChange={setSelectedTravellerId}
            >
              <SelectTrigger
                className="w-52 h-9"
                data-ocid="trip_history.select"
              >
                <SelectValue placeholder="All Travellers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Travellers</SelectItem>
                {travellers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!hasTrips && !hasPending && (
            <EmptyState
              icon={History}
              title="No trips for this traveller"
              description="No trip data found for the selected traveller in this date range"
            />
          )}

          {/* Trip Entries Table */}
          {hasTrips && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Trip Entries
              </h3>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Count</TableHead>
                      <TableHead className="text-center">Trip Time</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tripEntries.map((entry, idx) => (
                      <TableRow key={`${entry.date}-${entry.name}-${idx}`}>
                        <TableCell className="font-medium">
                          {entry.displayDate}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entry.name}
                            {entry.type === "coTraveller" && (
                              <Badge variant="outline" className="text-xs">
                                Other
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{entry.count}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {entry.type === "coTraveller" && entry.tripTime ? (
                            <div className="flex items-center justify-center gap-1">
                              {entry.tripTime === "morning" ? (
                                <>
                                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                    Morning
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Moon className="h-3.5 w-3.5 text-indigo-400" />
                                  <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400">
                                    Evening
                                  </span>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isReadOnly && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  entry.type === "traveller"
                                    ? handleEditTraveller(entry)
                                    : handleEditCoTraveller(entry)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteEntry(entry)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Trip Total Summary */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Total Trips:</span>
                  <Badge variant="default" className="text-base px-3 py-1">
                    {totalTrips}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Total Amount:</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Separator between sections */}
          {hasTrips && hasPending && <Separator />}

          {/* Other Pending Amounts Section */}
          {hasPending && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Other Pending Amounts
                </h3>
              </div>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPendingInRange.map((pending) => {
                      const name = getTravellerName(pending.travellerId);
                      let displayDate = pending.date;
                      try {
                        displayDate = formatDisplayDate(parseISO(pending.date));
                      } catch {
                        // keep raw date string
                      }
                      return (
                        <TableRow key={pending.id}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell>{displayDate}</TableCell>
                          <TableCell className="text-right font-medium text-red-600 dark:text-red-400">
                            {formatCurrency(pending.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {pending.note || (
                              <span className="italic text-muted-foreground/60">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!isReadOnly && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditPending(pending)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeletePending(pending)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pending Total Summary */}
              <div className="flex justify-end items-center gap-2 p-4 bg-muted/50 rounded-lg border">
                <span className="text-sm font-medium">Total Pending:</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalPendingAmount)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Traveller Trip Dialog */}
      <EditTripHistoryTravellerDialog
        open={editTravellerDialogOpen}
        onOpenChange={setEditTravellerDialogOpen}
        entry={editTravellerEntry}
        onSave={handleSaveTravellerEdit}
      />

      {/* Edit Co-Traveller Income Dialog */}
      <CoTravellerIncomeDialog
        open={editCoTravellerDialogOpen}
        onOpenChange={setEditCoTravellerDialogOpen}
        mode="edit"
        existingIncome={editCoTravellerEntry}
        onSubmit={handleSaveCoTravellerEdit}
      />

      {/* Delete Trip/CoTraveller Confirmation */}
      <DeleteTripHistoryEntryAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entryType={selectedEntry?.type || "traveller"}
        entryName={selectedEntry?.name || ""}
        entryDate={selectedEntry?.displayDate || ""}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Edit Other Pending Amount Dialog */}
      <EditOtherPendingAmountDialog
        open={editPendingDialogOpen}
        onOpenChange={setEditPendingDialogOpen}
        entry={selectedPendingEntry}
        travellerName={selectedPendingTravellerName}
      />

      {/* Delete Other Pending Amount Dialog */}
      <DeleteOtherPendingAmountAlertDialog
        open={deletePendingDialogOpen}
        onOpenChange={setDeletePendingDialogOpen}
        entry={selectedPendingEntry}
        travellerName={selectedPendingTravellerName}
      />
    </>
  );
}
