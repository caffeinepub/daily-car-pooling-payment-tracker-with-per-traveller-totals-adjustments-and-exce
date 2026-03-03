import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IndianRupee, Sun, Moon } from 'lucide-react';
import { useLedgerState } from './LedgerStateContext';

export interface CoTravellerIncomeEntry {
  id?: string;
  amount: number;
  date: string;
  note?: string;
  tripTime?: 'morning' | 'evening';
}

export interface CoTravellerIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional: provide to override internal ledger state submission */
  onSubmit?: (entry: Omit<CoTravellerIncomeEntry, 'id'>) => void;
  defaultDate?: string;
  mode?: 'add' | 'edit';
  existingIncome?: CoTravellerIncomeEntry | null;
}

function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function CoTravellerIncomeDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultDate,
  mode = 'add',
  existingIncome,
}: CoTravellerIncomeDialogProps) {
  const { addCoTravellerIncome, updateCoTravellerIncome } = useLedgerState();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate || getTodayStr());
  const [note, setNote] = useState('');
  const [tripTime, setTripTime] = useState<'morning' | 'evening' | ''>('');
  const [amountError, setAmountError] = useState('');
  const [tripTimeError, setTripTimeError] = useState('');

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && existingIncome) {
        setAmount(String(existingIncome.amount));
        setDate(existingIncome.date);
        setNote(existingIncome.note || '');
        setTripTime(existingIncome.tripTime || '');
      } else {
        setAmount('');
        setDate(defaultDate || getTodayStr());
        setNote('');
        setTripTime('');
      }
      setAmountError('');
      setTripTimeError('');
    }
  }, [open, mode, existingIncome, defaultDate]);

  const handleSubmit = () => {
    let valid = true;
    const val = parseFloat(amount);
    if (!amount.trim() || isNaN(val) || val <= 0) {
      setAmountError('Enter a valid amount greater than 0');
      valid = false;
    }
    if (!tripTime) {
      setTripTimeError('Please select a trip time');
      valid = false;
    }
    if (!valid) return;

    const entry: Omit<CoTravellerIncomeEntry, 'id'> = {
      amount: val,
      date,
      note: note.trim() || undefined,
      tripTime: tripTime as 'morning' | 'evening',
    };

    if (onSubmit) {
      // External handler provided (e.g. from LedgerPage)
      onSubmit(entry);
    } else if (mode === 'edit' && existingIncome?.id) {
      // Edit mode: update via ledger state
      updateCoTravellerIncome(existingIncome.id, entry);
    } else {
      // Add mode: add via ledger state
      addCoTravellerIncome(entry);
    }

    onOpenChange(false);
  };

  const isEdit = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-md mx-auto p-4 sm:p-6 rounded-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg sm:text-xl">
            {isEdit ? 'Edit Co-Traveller Income' : 'Add Co-Traveller Income'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {isEdit
              ? 'Update the co-traveller income entry.'
              : 'Record income from a co-traveller for a trip.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="cti-amount" className="text-xs sm:text-sm">Amount (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <IndianRupee className="h-3.5 w-3.5" />
              </span>
              <Input
                id="cti-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
                className="pl-8 h-11 text-sm"
              />
            </div>
            {amountError && <p className="text-destructive text-xs">{amountError}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="cti-date" className="text-xs sm:text-sm">Date</Label>
            <Input
              id="cti-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cti-triptime" className="text-xs sm:text-sm">Trip Time</Label>
            <Select
              value={tripTime}
              onValueChange={(v) => { setTripTime(v as 'morning' | 'evening'); setTripTimeError(''); }}
            >
              <SelectTrigger id="cti-triptime" className="h-11 text-sm">
                <SelectValue placeholder="Select trip time..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">
                  <span className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" /> Morning
                  </span>
                </SelectItem>
                <SelectItem value="evening">
                  <span className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-400" /> Evening
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {tripTimeError && <p className="text-destructive text-xs">{tripTimeError}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="cti-note" className="text-xs sm:text-sm">Note (optional)</Label>
            <Input
              id="cti-note"
              type="text"
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-11 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-11 text-sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="w-full sm:w-auto h-11 text-sm font-semibold">
            {isEdit ? 'Save Changes' : 'Add Income'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
