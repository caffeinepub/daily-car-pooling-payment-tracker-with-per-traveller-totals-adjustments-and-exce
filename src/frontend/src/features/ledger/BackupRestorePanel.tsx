import { useState, useRef } from 'react';
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
import { Download, Upload, Database, AlertCircle } from 'lucide-react';
import { useExportBackup, useImportBackup } from '../../hooks/useQueries';
import { exportBackupToFile, importBackupFromFile, type BackupPayload } from '../../utils/backupRestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function BackupRestorePanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<BackupPayload | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const { getPersistedState, mergeRestoreFromBackup, hasDraftChanges } = useLedgerState();
  const { mutateAsync: exportBackend } = useExportBackup();
  const { mutateAsync: importBackend } = useImportBackup();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Get local ledger state
      const localState = getPersistedState();
      
      // Get backend profile data
      const backendData = await exportBackend();
      
      // Combine and export
      exportBackupToFile(localState, backendData);
      toast.success('Backup exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const backup = await importBackupFromFile(file);
      
      // Check if there are unsaved draft changes
      if (hasDraftChanges()) {
        setPendingRestore(backup);
        setConfirmRestoreOpen(true);
      } else {
        await performRestore(backup);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import backup');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const performRestore = async (backup: BackupPayload) => {
    setIsRestoring(true);
    try {
      // Merge local ledger state (non-destructive)
      mergeRestoreFromBackup(backup.localState);
      
      // Import backend profile (non-destructive)
      if (backup.backendData.userProfile) {
        try {
          await importBackend(backup.backendData);
        } catch (error: any) {
          // Don't block local restore on backend failure
          console.error('Backend profile restore error:', error);
          toast.error('Local data restored, but profile sync failed: ' + (error.message || 'Unknown error'));
        }
      }
      
      toast.success('Backup restored successfully');
    } catch (error: any) {
      console.error('Restore error:', error);
      toast.error(error.message || 'Failed to restore backup');
    } finally {
      setIsRestoring(false);
      setPendingRestore(null);
    }
  };

  const handleConfirmRestore = async () => {
    if (pendingRestore) {
      await performRestore(pendingRestore);
    }
    setConfirmRestoreOpen(false);
  };

  const handleCancelRestore = () => {
    setConfirmRestoreOpen(false);
    setPendingRestore(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Backup & Restore</CardTitle>
          </div>
          <CardDescription>
            Export your ledger data to a JSON file or restore from a previous backup. Restoring merges data without deleting existing records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Backup Section */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold mb-1">Backup</h3>
              <p className="text-sm text-muted-foreground">
                Download all your ledger data including travellers, trips, payments, expenses, settings, and your profile.
              </p>
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Download Backup'}
            </Button>
          </div>

          <div className="border-t pt-6">
            {/* Restore Section */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold mb-1">Restore</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a backup JSON file to restore your data. Existing data will be preserved and merged with the backup.
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Merge Behavior</AlertTitle>
                <AlertDescription className="text-xs space-y-1 mt-1">
                  <p><strong>Travellers, Payments, Expenses:</strong> Items with matching IDs keep local version; new items are added.</p>
                  <p><strong>Trip Data:</strong> For each date+traveller, AM/PM is true if either local or backup is true.</p>
                  <p><strong>Settings:</strong> Date range, rate, and weekend toggles are taken from the backup.</p>
                  <p><strong>Profile:</strong> Only restored if you don't already have a profile saved.</p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="restore-file">Select Backup File</Label>
                <Input
                  ref={fileInputRef}
                  id="restore-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  disabled={isRestoring}
                />
              </div>

              {isRestoring && (
                <p className="text-sm text-muted-foreground">Restoring backup...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Unsaved Changes */}
      <AlertDialog open={confirmRestoreOpen} onOpenChange={setConfirmRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes Detected</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in the Daily grid. Restoring will overwrite your draft changes with the merged data. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelRestore}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore}>
              Continue Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
