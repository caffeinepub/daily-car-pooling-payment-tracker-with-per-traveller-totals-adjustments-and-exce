import { useState } from 'react';
import { useLedgerState } from './LedgerStateContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Lock, Trash2, Calendar, Receipt, DollarSign, Car, Database } from 'lucide-react';

const CORRECT_PASSWORD = '7Days#Week';

export default function ClearDataPanel() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<{
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

  const {
    clearAllLedgerData,
    clearDailyData,
    clearCashPayments,
    clearOtherPending,
    clearCarExpenses,
  } = useLedgerState();

  const handleUnlock = () => {
    if (passwordInput === CORRECT_PASSWORD) {
      setIsUnlocked(true);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  const openConfirmDialog = (title: string, description: string, action: () => void) => {
    setActionToConfirm({ title, description, action });
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    if (actionToConfirm) {
      actionToConfirm.action();
    }
    setConfirmDialogOpen(false);
    setActionToConfirm(null);
  };

  const handleClearAll = () => {
    openConfirmDialog(
      'Clear All Ledger Data',
      'This will permanently delete all travellers, trips, payments, expenses, and reset all settings. This action cannot be undone.',
      () => {
        clearAllLedgerData();
        toast.success('All ledger data has been cleared successfully.');
      }
    );
  };

  const handleClearDailyData = () => {
    openConfirmDialog(
      'Clear Trip & Daily Participation Data',
      'This will permanently delete all trip participation records (AM/PM checkboxes) for all dates. Travellers and payments will remain.',
      () => {
        clearDailyData();
        toast.success('Trip and daily participation data has been cleared successfully.');
      }
    );
  };

  const handleClearCashPayments = () => {
    openConfirmDialog(
      'Clear Cash Payments',
      'This will permanently delete all recorded cash payments. Trip data and other pending amounts will remain.',
      () => {
        clearCashPayments();
        toast.success('Cash payments have been cleared successfully.');
      }
    );
  };

  const handleClearOtherPending = () => {
    openConfirmDialog(
      'Clear Other Pending Amounts',
      'This will permanently delete all other pending amounts. Trip data and cash payments will remain.',
      () => {
        clearOtherPending();
        toast.success('Other pending amounts have been cleared successfully.');
      }
    );
  };

  const handleClearCarExpenses = () => {
    openConfirmDialog(
      'Clear Car Expenses',
      'This will permanently delete all car expense records. Trip data and payments will remain.',
      () => {
        clearCarExpenses();
        toast.success('Car expenses have been cleared successfully.');
      }
    );
  };

  if (!isUnlocked) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Clear Data - Password Protected</CardTitle>
          </div>
          <CardDescription>
            Enter the password to access data clearing options. This area contains destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError('');
              }}
              onKeyPress={handleKeyPress}
            />
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
          </div>
          <Button onClick={handleUnlock} className="w-full">
            Unlock
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <CardTitle>Clear Data Options</CardTitle>
          </div>
          <CardDescription>
            Select which data you want to clear. Each action requires confirmation and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              variant="destructive"
              onClick={handleClearAll}
              className="w-full justify-start"
            >
              <Database className="mr-2 h-4 w-4" />
              Clear All Ledger Data
            </Button>

            <Button
              variant="outline"
              onClick={handleClearDailyData}
              className="w-full justify-start border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Clear Trip/Daily Data
            </Button>

            <Button
              variant="outline"
              onClick={handleClearCashPayments}
              className="w-full justify-start border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Clear Cash Payments
            </Button>

            <Button
              variant="outline"
              onClick={handleClearOtherPending}
              className="w-full justify-start border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Clear Other Pending
            </Button>

            <Button
              variant="outline"
              onClick={handleClearCarExpenses}
              className="w-full justify-start border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Car className="mr-2 h-4 w-4" />
              Clear Car Expenses
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Note: This tab will lock again when you refresh the page. The password is only for accessing these controls.
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionToConfirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {actionToConfirm?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
