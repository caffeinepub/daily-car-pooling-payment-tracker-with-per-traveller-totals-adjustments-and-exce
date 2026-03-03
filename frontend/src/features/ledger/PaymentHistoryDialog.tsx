import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PaymentHistoryView from './PaymentHistoryView';

interface PaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PaymentHistoryDialog({ open, onOpenChange }: PaymentHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
          <DialogDescription>
            View all recorded cash payments within the selected date range
          </DialogDescription>
        </DialogHeader>
        <PaymentHistoryView />
      </DialogContent>
    </Dialog>
  );
}
