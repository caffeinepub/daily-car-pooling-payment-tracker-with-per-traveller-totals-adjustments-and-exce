import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useLedgerState } from './LedgerStateContext';
import type { OtherPending } from '../../hooks/useLedgerLocalState';
import { formatCurrency } from '../../utils/money';

interface DeleteOtherPendingAmountAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: OtherPending | null;
  travellerName: string;
}

export default function DeleteOtherPendingAmountAlertDialog({
  open,
  onOpenChange,
  entry,
  travellerName,
}: DeleteOtherPendingAmountAlertDialogProps) {
  const { removeOtherPending } = useLedgerState();

  const handleConfirm = () => {
    if (!entry) return;
    removeOtherPending(entry.id);
    toast.success('Pending amount deleted successfully');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Pending Amount</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the pending amount of{' '}
            <span className="font-semibold text-foreground">
              {entry ? formatCurrency(entry.amount) : ''}
            </span>{' '}
            for{' '}
            <span className="font-semibold text-foreground">{travellerName}</span>?
            This action cannot be undone and will update balances across the app.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
