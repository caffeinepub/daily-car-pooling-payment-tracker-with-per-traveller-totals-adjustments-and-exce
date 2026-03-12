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
import { IndianRupee } from "lucide-react";
import React, { useState, useEffect } from "react";

export interface CarExpense {
  id: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
}

export interface EditCarExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: CarExpense | null;
  onUpdateExpense: (id: string, updates: Partial<CarExpense>) => void;
}

export default function EditCarExpenseDialog({
  open,
  onOpenChange,
  expense,
  onUpdateExpense,
}: EditCarExpenseDialogProps) {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState("");

  useEffect(() => {
    if (expense && open) {
      setCategory(expense.category);
      setAmount(String(expense.amount));
      setDate(expense.date);
      setNote(expense.note || "");
      setAmountError("");
    }
  }, [expense, open]);

  const handleSave = () => {
    const val = Number.parseFloat(amount);
    if (!amount.trim() || Number.isNaN(val) || val <= 0) {
      setAmountError("Enter a valid amount greater than 0");
      return;
    }
    if (!expense) return;
    onUpdateExpense(expense.id, {
      category,
      amount: val,
      date,
      note: note.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-md mx-auto p-4 sm:p-6 rounded-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg sm:text-xl">Edit Expense</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Update the details for this expense record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="ece-category" className="text-xs sm:text-sm">
              Category
            </Label>
            <Input
              id="ece-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ece-amount" className="text-xs sm:text-sm">
              Amount (₹)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <IndianRupee className="h-3.5 w-3.5" />
              </span>
              <Input
                id="ece-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAmountError("");
                }}
                className="pl-8 h-11 text-sm"
              />
            </div>
            {amountError && (
              <p className="text-destructive text-xs">{amountError}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="ece-date" className="text-xs sm:text-sm">
              Date
            </Label>
            <Input
              id="ece-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ece-note" className="text-xs sm:text-sm">
              Note (optional)
            </Label>
            <Input
              id="ece-note"
              type="text"
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-11 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-11 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto h-11 text-sm font-semibold"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
