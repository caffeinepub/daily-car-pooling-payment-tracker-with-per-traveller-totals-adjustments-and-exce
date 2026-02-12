import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt } from 'lucide-react';
import PaymentHistoryView from './PaymentHistoryView';

export default function PaymentHistoryDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          <Receipt className="h-4 w-4 mr-2" />
          Payment History
        </Button>
      </DialogTrigger>
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
