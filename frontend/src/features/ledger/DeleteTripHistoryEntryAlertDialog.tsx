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

interface DeleteTripHistoryEntryAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryType: 'traveller' | 'coTraveller';
  entryName: string;
  entryDate: string;
  onConfirmDelete: () => void;
}

export default function DeleteTripHistoryEntryAlertDialog({
  open,
  onOpenChange,
  entryType,
  entryName,
  entryDate,
  onConfirmDelete,
}: DeleteTripHistoryEntryAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Trip Entry</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the trip entry for <strong>{entryName}</strong> on <strong>{entryDate}</strong>?
            {entryType === 'traveller' && ' This will clear all trip participation (morning and evening) for this date.'}
            {' '}This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
