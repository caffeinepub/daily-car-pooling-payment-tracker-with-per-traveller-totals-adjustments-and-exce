import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Lock, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useReadOnly } from "../../context/ReadOnlyContext";
import { getTodayIST } from "../../utils/dateRange";
import { formatCurrency } from "../../utils/money";
import { useLedgerState } from "./LedgerStateContext";

export default function RatePerTripControl() {
  const {
    ratePerTrip,
    setRatePerTrip,
    rateHistory,
    addRateHistoryEntry,
    removeRateHistoryEntry,
  } = useLedgerState();
  const { isReadOnly } = useReadOnly();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(getTodayIST());
  const [showHistory, setShowHistory] = useState(false);
  const [rateError, setRateError] = useState("");

  // Reset dialog fields when opened
  useEffect(() => {
    if (isDialogOpen) {
      setNewRate(ratePerTrip.toString());
      setEffectiveFrom(getTodayIST());
      setRateError("");
    }
  }, [isDialogOpen, ratePerTrip]);

  const handleSave = () => {
    const parsed = Number.parseFloat(newRate);
    if (Number.isNaN(parsed) || parsed < 0) {
      setRateError("Please enter a valid rate (0 or more).");
      return;
    }
    if (!effectiveFrom) {
      setRateError("Please select an effective from date.");
      return;
    }
    addRateHistoryEntry({ rate: parsed, effectiveFrom });
    setRatePerTrip(parsed);
    setIsDialogOpen(false);
  };

  // Sort history descending by effectiveFrom
  const sortedHistory = [...rateHistory].sort((a, b) =>
    b.effectiveFrom.localeCompare(a.effectiveFrom),
  );

  const formatHistoryDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Current rate display row */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <Label className="text-sm font-medium whitespace-nowrap flex items-center gap-1">
          Rate per trip:
          {isReadOnly && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {formatCurrency(ratePerTrip)}
          </span>
          {!isReadOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => setIsDialogOpen(true)}
            >
              <Pencil className="h-3 w-3" />
              Change
            </Button>
          )}
          {sortedHistory.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1 text-muted-foreground"
              onClick={() => setShowHistory((v) => !v)}
            >
              {showHistory ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              History ({sortedHistory.length})
            </Button>
          )}
        </div>
      </div>

      {/* Rate history list */}
      {showHistory && sortedHistory.length > 0 && (
        <div className="ml-0 sm:ml-[6.5rem] border rounded-md bg-muted/30 p-2 space-y-1">
          {sortedHistory.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="text-foreground">
                <span className="font-medium">
                  {formatCurrency(entry.rate)}/trip
                </span>
                <span className="text-muted-foreground ml-1">
                  — from {formatHistoryDate(entry.effectiveFrom)}
                  {index === sortedHistory.length - 1 &&
                    sortedHistory.length > 1 && (
                      <span className="text-muted-foreground"> (oldest)</span>
                    )}
                </span>
              </span>
              {!isReadOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeRateHistoryEntry(entry.id)}
                  title="Remove this rate entry"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Change Rate Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Rate Per Trip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-rate">New Rate (₹)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">₹</span>
                <Input
                  id="new-rate"
                  type="number"
                  min="0"
                  step="10"
                  value={newRate}
                  onChange={(e) => {
                    setNewRate(e.target.value);
                    setRateError("");
                  }}
                  className="flex-1"
                  placeholder="e.g. 60"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="effective-from">Effective From</Label>
              <Input
                id="effective-from"
                type="date"
                value={effectiveFrom}
                onChange={(e) => {
                  setEffectiveFrom(e.target.value);
                  setRateError("");
                }}
              />
              <p className="text-xs text-muted-foreground">
                The new rate will apply to all trips on or after this date.
                Previous trips use the old rate.
              </p>
            </div>
            {rateError && (
              <p className="text-xs text-destructive">{rateError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
