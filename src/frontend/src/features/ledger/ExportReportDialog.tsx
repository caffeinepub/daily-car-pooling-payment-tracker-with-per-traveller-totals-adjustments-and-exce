import { useState } from 'react';
import { useLedgerState } from './LedgerStateContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Download, Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '../../utils/exportReport';
import { exportToExcel } from '../../utils/exportExcel';
import { exportToPDF } from '../../utils/exportPdf';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportFormat = 'csv' | 'pdf' | 'excel';

export default function ExportReportDialog({ open, onOpenChange }: ExportReportDialogProps) {
  const ledgerState = useLedgerState();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');

  // Section filters
  const [includeDailyGrid, setIncludeDailyGrid] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includePayments, setIncludePayments] = useState(true);
  const [includeCarExpenses, setIncludeCarExpenses] = useState(true);
  const [includeOverallSummary, setIncludeOverallSummary] = useState(true);

  // Traveller filters
  const [selectedTravellers, setSelectedTravellers] = useState<Set<string>>(
    new Set(ledgerState.travellers.map((t) => t.id))
  );

  const toggleTraveller = (id: string) => {
    const newSet = new Set(selectedTravellers);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTravellers(newSet);
  };

  const selectAllTravellers = () => {
    setSelectedTravellers(new Set(ledgerState.travellers.map((t) => t.id)));
  };

  const deselectAllTravellers = () => {
    setSelectedTravellers(new Set());
  };

  const handleExport = async () => {
    if (selectedTravellers.size === 0) {
      toast.error('Please select at least one traveller');
      return;
    }

    setIsExporting(true);

    try {
      const filters = {
        includeDailyGrid,
        includeSummary,
        includePayments,
        includeCarExpenses,
        includeOverallSummary,
        selectedTravellerIds: Array.from(selectedTravellers),
      };

      if (exportFormat === 'csv') {
        await exportToCSV(ledgerState, filters);
        toast.success('Report exported successfully as CSV');
      } else if (exportFormat === 'excel') {
        await exportToExcel(ledgerState);
        toast.success('Report exported successfully as Excel');
      } else if (exportFormat === 'pdf') {
        await exportToPDF(ledgerState, filters);
        toast.success('Print dialog opened for PDF export');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Choose format, sections, and travellers to include in your export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>CSV (Comma Separated Values)</span>
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Excel (XLSX)</span>
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>PDF (Print to PDF)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {exportFormat === 'pdf' && (
              <p className="text-sm text-muted-foreground">
                PDF export will open your browser's print dialog. Choose "Save as PDF" as the destination.
              </p>
            )}
          </div>

          <Separator />

          {/* Section Filters */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Include Sections</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="section-daily"
                  checked={includeDailyGrid}
                  onCheckedChange={(checked) => setIncludeDailyGrid(checked === true)}
                />
                <Label htmlFor="section-daily" className="cursor-pointer">
                  Daily Participation Grid
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="section-summary"
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(checked === true)}
                />
                <Label htmlFor="section-summary" className="cursor-pointer">
                  Trips & Payment
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="section-payments"
                  checked={includePayments}
                  onCheckedChange={(checked) => setIncludePayments(checked === true)}
                />
                <Label htmlFor="section-payments" className="cursor-pointer">
                  Payment History
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="section-car"
                  checked={includeCarExpenses}
                  onCheckedChange={(checked) => setIncludeCarExpenses(checked === true)}
                />
                <Label htmlFor="section-car" className="cursor-pointer">
                  Car Expenses
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="section-overall"
                  checked={includeOverallSummary}
                  onCheckedChange={(checked) => setIncludeOverallSummary(checked === true)}
                />
                <Label htmlFor="section-overall" className="cursor-pointer">
                  Overall Summary
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Traveller Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Select Travellers</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllTravellers}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllTravellers}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {ledgerState.travellers.map((t) => (
                <div key={t.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`traveller-${t.id}`}
                    checked={selectedTravellers.has(t.id)}
                    onCheckedChange={() => toggleTraveller(t.id)}
                  />
                  <Label htmlFor={`traveller-${t.id}`} className="cursor-pointer">
                    {t.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
