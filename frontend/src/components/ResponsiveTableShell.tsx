import { ReactNode } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface ResponsiveTableShellProps {
  children: ReactNode;
  className?: string;
}

export default function ResponsiveTableShell({ children, className = '' }: ResponsiveTableShellProps) {
  return (
    <ScrollArea className={`w-full rounded-lg border ${className}`}>
      <div className="min-w-full">{children}</div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
