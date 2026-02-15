import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import type { SyncStatus } from '../hooks/useAppDataSync';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  lastSyncTime: Date | null;
}

export default function SyncStatusIndicator({ status, lastSyncTime }: SyncStatusIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: <RefreshCw className="h-3.5 w-3.5 animate-spin" />,
          text: 'Syncing...',
          className: 'text-muted-foreground',
        };
      case 'synced':
        return {
          icon: <Cloud className="h-3.5 w-3.5" />,
          text: 'Synced',
          className: 'text-muted-foreground',
        };
      case 'failed':
        return {
          icon: <CloudOff className="h-3.5 w-3.5" />,
          text: 'Sync failed',
          className: 'text-destructive',
        };
      default:
        return null;
    }
  };

  const display = getStatusDisplay();
  if (!display) return null;

  const getTimeAgo = () => {
    if (!lastSyncTime) return '';
    const seconds = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return 'over 1h ago';
  };

  return (
    <div
      className={`flex items-center gap-1.5 text-xs ${display.className}`}
      role="status"
      aria-live="polite"
      aria-label={`Sync status: ${display.text}`}
    >
      {display.icon}
      <span className="hidden sm:inline">{display.text}</span>
      {status === 'synced' && lastSyncTime && (
        <span className="hidden md:inline text-muted-foreground/70">· {getTimeAgo()}</span>
      )}
    </div>
  );
}
