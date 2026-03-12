import { Button } from "@/components/ui/button";
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
import { IndianRupee, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { getTodayIST } from "../../utils/dateRange";
import { useLedgerState } from "./LedgerStateContext";

interface ExpenseEntry {
  category: string;
  amount: string;
  date: string;
}

interface MultiCategoryExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
}

export default function MultiCategoryExpenseForm({
  open,
  onOpenChange,
  defaultDate,
}: MultiCategoryExpenseFormProps) {
  const { addCarExpense } = useLedgerState();
  const today = defaultDate || getTodayIST();

  const getInitialEntries = (): ExpenseEntry[] => [
    { category: "Toll", amount: "30", date: today },
    { category: "CNG BRD", amount: "", date: today },
    { category: "CNG AHM", amount: "", date: today },
  ];

  const [entries, setEntries] = useState<ExpenseEntry[]>(getInitialEntries());
  const [errors, setErrors] = useState<{ [key: number]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) {
      const t = defaultDate || getTodayIST();
      setEntries([
        { category: "Toll", amount: "30", date: t },
        { category: "CNG BRD", amount: "", date: t },
        { category: "CNG AHM", amount: "", date: t },
      ]);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open, defaultDate]);

  const updateEntry = (
    index: number,
    field: keyof ExpenseEntry,
    value: string,
  ) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    if (field === "amount" && errors[index]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: { [key: number]: string } = {};
    entries.forEach((entry, i) => {
      const val = Number.parseFloat(entry.amount);
      if (entry.amount.trim() === "" || Number.isNaN(val) || val <= 0) {
        newErrors[i] = "Enter a valid amount greater than 0";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Save all three expenses to local state immediately
      for (const entry of entries) {
        const numAmount = Number.parseFloat(entry.amount);
        addCarExpense({
          category: entry.category,
          amount: numAmount,
          date: entry.date,
        });
      }

      toast.success("3 expenses added successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to add expenses. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-lg mx-auto p-4 sm:p-6 rounded-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg sm:text-xl">
            Add 3 Expenses
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Quickly add Toll, CNG BRD, and CNG AHM expenses at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div
              key={entry.category}
              className="rounded-lg border p-3 space-y-3 bg-muted/20"
            >
              <div className="font-medium text-sm">{entry.category}</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Amount (₹)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <IndianRupee className="h-3.5 w-3.5" />
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={entry.amount}
                      onChange={(e) =>
                        updateEntry(index, "amount", e.target.value)
                      }
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                  {errors[index] && (
                    <p className="text-destructive text-xs">{errors[index]}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={entry.date}
                    onChange={(e) => updateEntry(index, "date", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-11 text-sm"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="w-full sm:w-auto h-11 text-sm font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add All 3 Expenses"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
