import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface RuntimeErrorFallbackProps {
  error: Error | null;
  onReload: () => void;
}

/**
 * Fallback UI displayed when a runtime error occurs.
 * Shows a clear error message and reload button.
 */
export default function RuntimeErrorFallback({ error, onReload }: RuntimeErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <Card className="w-full max-w-md shadow-lg border-destructive/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
            <CardDescription className="mt-2">
              The application encountered an unexpected error. Please try reloading the page.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-muted text-sm font-mono text-muted-foreground overflow-auto max-h-32">
              {error.message}
            </div>
          )}
          <Button
            onClick={onReload}
            className="w-full h-12 text-base"
            size="lg"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Reload Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
