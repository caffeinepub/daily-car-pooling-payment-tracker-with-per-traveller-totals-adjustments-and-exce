import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLedgerState } from './LedgerStateContext';

interface EditTripHistoryTravellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: {
    dateKey: string;
    displayDate: string;
    travellerId: string;
    travellerName: string;
    morning: boolean;
    evening: boolean;
  } | null;
}

export default function EditTripHistoryTravellerDialog({ open, onOpenChange, entry }: EditTripHistoryTravellerDialogProps) {
  const { updateTravellerTrip } = useLedgerState();
  const [morning, setMorning] = useState(false);
  const [evening, setEvening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && entry) {
      setMorning(entry.morning);
      setEvening(entry.evening);
    }
  }, [open, entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entry) return;

    setIsSubmitting(true);

    try {
      updateTravellerTrip(entry.dateKey, entry.travellerId, morning, evening);
      toast.success('Trip updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update trip:', error);
      toast.error('Failed to update trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Trip</DialogTitle>
          <DialogDescription>
            Update trip participation for {entry.travellerName} on {entry.displayDate}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="morning"
                  checked={morning}
                  onCheckedChange={(checked) => setMorning(checked === true)}
                />
                <Label htmlFor="morning" className="cursor-pointer">
                  Morning Trip
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="evening"
                  checked={evening}
                  onCheckedChange={(checked) => setEvening(checked === true)}
                />
                <Label htmlFor="evening" className="cursor-pointer">
                  Evening Trip
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Trip'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
