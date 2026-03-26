import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Calendar,
  Car,
  Database,
  DollarSign,
  FileText,
  History,
  Receipt,
  Share2,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";

interface MobileLedgerSidebarNavProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabSelect: (tab: string) => void;
  onOpenPaymentHistory: () => void;
  onOpenExpenseHistory: () => void;
  onOpenExport: () => void;
  hiddenTabs?: string[];
}

export default function MobileLedgerSidebarNav({
  isOpen,
  onClose,
  activeTab,
  onTabSelect,
  onOpenPaymentHistory,
  onOpenExpenseHistory,
  onOpenExport,
  hiddenTabs = [],
}: MobileLedgerSidebarNavProps) {
  const handleTabClick = (tab: string) => {
    onTabSelect(tab);
    onClose();
  };

  const menuItems = [
    { id: "travellers", label: "Travellers", icon: Users },
    { id: "grid", label: "Daily Participation", icon: Calendar },
    { id: "summary", label: "Participation Payment", icon: Receipt },
    { id: "car", label: "Expense Record", icon: Car },
    { id: "overall", label: "Overall Summary", icon: TrendingUp },
    { id: "tripHistory", label: "Trip History", icon: History },
    { id: "paymentSummary", label: "Trips & Payment", icon: DollarSign },
    { id: "backup", label: "Backup & Restore", icon: Database },
    { id: "clear", label: "Clear Data", icon: Trash2 },
    { id: "shareAccess", label: "Share Access", icon: Share2 },
  ].filter((item) => !hiddenTabs.includes(item.id));

  const actionItems = [
    {
      label: "Payment History",
      icon: Receipt,
      action: onOpenPaymentHistory,
      id: "paymentHistory",
    },
    {
      label: "Expense History",
      icon: Car,
      action: onOpenExpenseHistory,
      id: "expenseHistory",
    },
    { label: "Export", icon: FileText, action: onOpenExport, id: "export" },
  ].filter((item) => !hiddenTabs.includes(item.id));

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-[280px] sm:w-[320px] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Carpool Menu</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => handleTabClick(item.id)}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}

          {actionItems.length > 0 && (
            <>
              <Separator className="my-4" />
              {actionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full justify-start gap-3"
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
