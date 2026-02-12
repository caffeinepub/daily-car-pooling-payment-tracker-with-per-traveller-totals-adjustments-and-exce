import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import ExportReportDialog from './ExportReportDialog';

export default function ExportButton() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <ExportReportDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}
