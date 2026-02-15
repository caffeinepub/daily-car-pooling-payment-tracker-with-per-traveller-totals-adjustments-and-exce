import { X, Users, Calendar, Receipt, Car, TrendingUp, Database, Trash2, History, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useEffect } from 'react';

interface MobileLedgerSidebarNavProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabSelect: (tab: string) => void;
  onOpenPaymentHistory: () => void;
  onOpenExpenseHistory: () => void;
  onOpenExport: () => void;
}

const menuItems = [
  { value: 'travellers', label: 'Travellers', icon: Users },
  { value: 'grid', label: 'Daily', icon: Calendar },
  { value: 'summary', label: 'Summary', icon: Receipt },
  { value: 'car', label: 'Car Expense', icon: Car },
  { value: 'overall', label: 'Overall', icon: TrendingUp },
  { value: 'backup', label: 'Backup', icon: Database },
  { value: 'clear', label: 'Clear Data', icon: Trash2 },
];

const actionItems = [
  { action: 'payment-history', label: 'Payment History', icon: History },
  { action: 'expense-history', label: 'Expense History', icon: FileText },
  { action: 'export', label: 'Export', icon: Download },
];

export default function MobileLedgerSidebarNav({
  isOpen,
  onClose,
  activeTab,
  onTabSelect,
  onOpenPaymentHistory,
  onOpenExpenseHistory,
  onOpenExport,
}: MobileLedgerSidebarNavProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleItemClick = (value: string) => {
    onTabSelect(value);
    onClose();
  };

  const handleActionClick = (action: string) => {
    if (action === 'payment-history') {
      onOpenPaymentHistory();
    } else if (action === 'expense-history') {
      onOpenExpenseHistory();
    } else if (action === 'export') {
      onOpenExport();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className="fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-50 sm:hidden shadow-lg overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Carpool Menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Carpool Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => handleItemClick(item.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}

          <Separator className="my-3" />

          {/* Action Items */}
          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.action}
                onClick={() => handleActionClick(item.action)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
