import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Receipt } from 'lucide-react';
import ExpenseHistoryView from './ExpenseHistoryView';

export default function ExpenseHistoryDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Receipt className="mr-2 h-4 w-4" />
          Expense History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Expense History</DialogTitle>
          <DialogDescription>
            View and manage car expenses within the selected date range
          </DialogDescription>
        </DialogHeader>
        <ExpenseHistoryView />
      </DialogContent>
    </Dialog>
  );
}
