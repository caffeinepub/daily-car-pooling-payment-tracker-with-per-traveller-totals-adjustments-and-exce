import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import type { SyncStatus } from '../hooks/useAppDataSync';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  lastSyncTime: Date | null;
  error?: string | null;
}

export default function SyncStatusIndicator({ status, lastSyncTime, error }: SyncStatusIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          text: 'Syncing...',
          className: 'text-muted-foreground',
        };
      case 'synced':
        return {
          icon: <Cloud className="h-4 w-4" />,
          text: 'Synced',
          className: 'text-muted-foreground',
        };
      case 'failed':
        return {
          icon: <CloudOff className="h-4 w-4" />,
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
      className={`flex items-center gap-2 text-sm ${display.className}`}
      role="status"
      aria-live="polite"
      aria-label={`Sync status: ${display.text}${error ? ` - ${error}` : ''}`}
      title={error || undefined}
    >
      {display.icon}
      <div className="hidden sm:flex flex-col items-start leading-tight">
        <span className="text-xs font-medium">{display.text}</span>
        {status === 'synced' && lastSyncTime && (
          <span className="text-[10px] text-muted-foreground/70">{getTimeAgo()}</span>
        )}
      </div>
    </div>
  );
}
