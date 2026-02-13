import { useState } from 'react';
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
import { useExportLedgerBackup, useRestoreLedgerBackup } from '../../hooks/useLedgerQueries';
import { useLedgerState } from './LedgerStateContext';
import { toast } from 'sonner';
import { Download, Upload, FileJson, AlertCircle } from 'lucide-react';
import type { LedgerBackup } from '../../types/ledger';

export default function SettingsPanel() {
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreError, setRestoreError] = useState<string>('');
  
  const { mutateAsync: exportBackup, isPending: isExporting } = useExportLedgerBackup();
  const { mutateAsync: restoreBackup, isPending: isRestoring } = useRestoreLedgerBackup();
  const { refreshFromCanister } = useLedgerState();

  const handleExport = async () => {
    try {
      const backup = await exportBackup();
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `carpool-ledger-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Backup exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export backup');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        setRestoreError('Please select a valid JSON backup file');
        setRestoreFile(null);
        return;
      }
      setRestoreFile(file);
      setRestoreError('');
    }
  };

  const handleRestoreClick = () => {
    if (!restoreFile) {
      setRestoreError('Please select a backup file first');
      return;
    }
    setShowRestoreConfirm(true);
  };

  const handleRestoreConfirm = async () => {
    if (!restoreFile) return;

    try {
      const fileContent = await restoreFile.text();
      const backup: LedgerBackup = JSON.parse(fileContent);
      
      // Validate backup structure
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup file format');
      }

      await restoreBackup(backup);
      
      // Refresh UI from canister
      refreshFromCanister();
      
      toast.success('Backup restored successfully');
      setRestoreFile(null);
      setShowRestoreConfirm(false);
      
      // Clear file input
      const fileInput = document.getElementById('restore-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Restore error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to restore backup');
      setShowRestoreConfirm(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>
            Export your ledger data to a JSON file or restore from a previous backup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Export Backup</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Download all your ledger data as a JSON file. This includes travellers, trips, payments, expenses, and settings.
            </p>
            <Button onClick={handleExport} disabled={isExporting} className="w-full sm:w-auto">
              <FileJson className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Backup'}
            </Button>
          </div>

          <div className="border-t pt-6">
            {/* Restore Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Restore from Backup</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a backup JSON file to restore your data. Existing records will be overwritten with backup versions.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="restore-file-input">Select Backup File</Label>
                <Input
                  id="restore-file-input"
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  disabled={isRestoring}
                />
                {restoreError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{restoreError}</span>
                  </div>
                )}
                {restoreFile && !restoreError && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {restoreFile.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleRestoreClick}
                disabled={!restoreFile || isRestoring}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isRestoring ? 'Restoring...' : 'Restore Backup'}
              </Button>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Note:</strong> Restoring a backup will merge the data with your current ledger. 
                Records with matching IDs will be overwritten with the backup version. 
                This action cannot be undone, so make sure to export a current backup first if needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore from this backup? This will merge the backup data with your current ledger, 
              overwriting any conflicting records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm}>
              Restore Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
