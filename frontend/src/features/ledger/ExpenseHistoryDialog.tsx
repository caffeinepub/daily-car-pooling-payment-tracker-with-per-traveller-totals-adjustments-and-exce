import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ExpenseHistoryView from './ExpenseHistoryView';

interface ExpenseHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExpenseHistoryDialog({ open, onOpenChange }: ExpenseHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Expense History</DialogTitle>
          <DialogDescription>
            View and manage expense records within the selected date range
          </DialogDescription>
        </DialogHeader>
        <ExpenseHistoryView />
      </DialogContent>
    </Dialog>
  );
}
