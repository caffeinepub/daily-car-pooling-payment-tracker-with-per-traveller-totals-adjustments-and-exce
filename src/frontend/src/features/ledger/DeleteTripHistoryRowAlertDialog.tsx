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

interface DeleteTripHistoryRowAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowType: 'traveller' | 'coTraveller';
  travellerName: string;
  date: string;
  onConfirmDelete: () => void;
}

export default function DeleteTripHistoryRowAlertDialog({
  open,
  onOpenChange,
  rowType,
  travellerName,
  date,
  onConfirmDelete,
}: DeleteTripHistoryRowAlertDialogProps) {
  const handleConfirm = () => {
    onConfirmDelete();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Trip Entry</AlertDialogTitle>
          <AlertDialogDescription>
            {rowType === 'traveller'
              ? `Are you sure you want to delete the trip entry for ${travellerName} on ${date}? This will clear both Morning and Evening participation for this date.`
              : `Are you sure you want to delete this co-traveller income entry for ${date}?`}
            <br />
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
