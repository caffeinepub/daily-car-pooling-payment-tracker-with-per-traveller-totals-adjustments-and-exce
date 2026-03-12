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
import React, { useState, useEffect } from "react";

export interface TripHistoryEntry {
  /** The date string used for display (e.g. "Mon, Feb 27") */
  displayDate: string;
  /** The date key used for data lookup (e.g. "2026-02-27") */
  dateKey: string;
  travellerId: string;
  travellerName: string;
  morning: boolean;
  evening: boolean;
}

interface EditTripHistoryTravellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: TripHistoryEntry | null;
  onSave: (updated: TripHistoryEntry) => void;
}

export default function EditTripHistoryTravellerDialog({
  open,
  onOpenChange,
  entry,
  onSave,
}: EditTripHistoryTravellerDialogProps) {
  const [dateKey, setDateKey] = useState("");
  const [morning, setMorning] = useState(false);
  const [evening, setEvening] = useState(false);

  useEffect(() => {
    if (entry && open) {
      setDateKey(entry.dateKey);
      setMorning(entry.morning);
      setEvening(entry.evening);
    }
  }, [entry, open]);

  const handleSave = () => {
    if (!entry) return;
    onSave({ ...entry, dateKey, morning, evening });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-sm mx-auto p-4 sm:p-6 rounded-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg sm:text-xl">
            Edit Trip Entry
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Update trip details for{" "}
            <span className="font-medium">{entry?.travellerName}</span>
            {entry?.displayDate ? ` on ${entry.displayDate}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="eth-date" className="text-xs sm:text-sm">
              Date
            </Label>
            <Input
              id="eth-date"
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              className="h-11 text-sm"
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs sm:text-sm font-medium">
              Trip Sessions
            </span>
            <div className="flex flex-col gap-3">
              <label
                htmlFor="eth-morning"
                className="flex items-center gap-3 cursor-pointer min-h-[44px]"
              >
                <Checkbox
                  id="eth-morning"
                  checked={morning}
                  onCheckedChange={(v) => setMorning(!!v)}
                  className="h-5 w-5"
                />
                <span className="text-sm">Morning trip</span>
              </label>
              <label
                htmlFor="eth-evening"
                className="flex items-center gap-3 cursor-pointer min-h-[44px]"
              >
                <Checkbox
                  id="eth-evening"
                  checked={evening}
                  onCheckedChange={(v) => setEvening(!!v)}
                  className="h-5 w-5"
                />
                <span className="text-sm">Evening trip</span>
              </label>
            </div>
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
