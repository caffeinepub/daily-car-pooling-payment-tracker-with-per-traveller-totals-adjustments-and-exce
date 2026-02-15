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
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '../../utils/exportReport';

interface ExportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExportReportDialog({ open, onOpenChange }: ExportReportDialogProps) {
  const ledgerState = useLedgerState();
  const [isExporting, setIsExporting] = useState(false);

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

      await exportToCSV(ledgerState, filters);
      toast.success('Report exported successfully as CSV');

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
            Choose sections and travellers to include in your CSV export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
                  Per-Traveller Summary
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
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
