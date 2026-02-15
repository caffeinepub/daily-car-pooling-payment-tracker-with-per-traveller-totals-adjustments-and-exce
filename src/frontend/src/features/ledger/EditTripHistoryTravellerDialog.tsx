import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { format, parseISO } from 'date-fns';

interface EditTripHistoryTravellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  travellerName: string;
  travellerId: string;
  date: string;
  currentMorning: boolean;
  currentEvening: boolean;
  onSave: (travellerId: string, date: string, morning: boolean, evening: boolean) => void;
}

export default function EditTripHistoryTravellerDialog({
  open,
  onOpenChange,
  travellerName,
  travellerId,
  date,
  currentMorning,
  currentEvening,
  onSave,
}: EditTripHistoryTravellerDialogProps) {
  const [morning, setMorning] = useState(currentMorning);
  const [evening, setEvening] = useState(currentEvening);

  useEffect(() => {
    if (open) {
      setMorning(currentMorning);
      setEvening(currentEvening);
    }
  }, [open, currentMorning, currentEvening]);

  const handleSave = () => {
    onSave(travellerId, date, morning, evening);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Trip</DialogTitle>
          <DialogDescription>
            Update participation for {travellerName} on {format(parseISO(date), 'MMM dd, yyyy (EEE)')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-morning"
              checked={morning}
              onCheckedChange={(checked) => setMorning(checked === true)}
            />
            <Label htmlFor="edit-morning" className="cursor-pointer">
              Morning
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-evening"
              checked={evening}
              onCheckedChange={(checked) => setEvening(checked === true)}
            />
            <Label htmlFor="edit-evening" className="cursor-pointer">
              Evening
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
