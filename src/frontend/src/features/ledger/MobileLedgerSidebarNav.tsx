import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, Receipt, Car, TrendingUp, Database, Trash2, FileText, CreditCard, History } from 'lucide-react';

interface MobileLedgerSidebarNavProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabSelect: (tab: string) => void;
  onOpenPaymentHistory: () => void;
  onOpenExpenseHistory: () => void;
  onOpenExport: () => void;
}

export default function MobileLedgerSidebarNav({
  isOpen,
  onClose,
  activeTab,
  onTabSelect,
  onOpenPaymentHistory,
  onOpenExpenseHistory,
  onOpenExport,
}: MobileLedgerSidebarNavProps) {
  const handleTabClick = (tab: string) => {
    onTabSelect(tab);
    onClose();
  };

  const navItems = [
    { id: 'travellers', label: 'Travellers', icon: Users },
    { id: 'grid', label: 'Daily Participation', icon: Calendar },
    { id: 'summary', label: 'Summary', icon: Receipt },
    { id: 'trip-history', label: 'Trip History', icon: History },
    { id: 'car', label: 'Car Expenses', icon: Car },
    { id: 'overall', label: 'Overall Summary', icon: TrendingUp },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
    { id: 'clear', label: 'Clear Data', icon: Trash2 },
  ];

  const actionItems = [
    { label: 'Payment History', icon: CreditCard, onClick: onOpenPaymentHistory },
    { label: 'Expense History', icon: Car, onClick: onOpenExpenseHistory },
    { label: 'Export Report', icon: FileText, onClick: onOpenExport },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Carpool Menu</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
                onClick={() => handleTabClick(item.id)}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}

          <Separator className="my-4" />

          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={item.onClick}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
