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

interface UnsavedChangesConfirmDialogProps {
  open: boolean;
  onStay: () => void;
  onDiscard: () => void;
}

export default function UnsavedChangesConfirmDialog({
  open,
  onStay,
  onDiscard,
}: UnsavedChangesConfirmDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes on the Daily Participation page. Do you want to stay and save your changes, or discard them and continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStay}>Stay</AlertDialogCancel>
          <AlertDialogAction onClick={onDiscard}>Discard changes & continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
