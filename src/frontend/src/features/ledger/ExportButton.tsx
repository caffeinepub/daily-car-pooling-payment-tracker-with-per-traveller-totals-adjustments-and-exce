import { useState } from 'react';
import { useLedgerState } from './LedgerStateContext';
import { exportToExcel } from '../../utils/exportExcel';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const ledgerState = useLedgerState();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToExcel(ledgerState);
      toast.success('Report exported successfully! (CSV format - opens in Excel)');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isExporting} size="sm">
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  );
}
