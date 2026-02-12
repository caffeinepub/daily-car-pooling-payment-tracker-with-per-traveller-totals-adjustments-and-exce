import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Car } from 'lucide-react';

interface InitLoadingScreenProps {
  message?: string;
}

/**
 * Loading screen displayed during app initialization phases.
 * Shows a branded loading state with skeleton elements.
 */
export default function InitLoadingScreen({ message = 'Loading...' }: InitLoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Car className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-2xl">Carpool Ledger</CardTitle>
            <CardDescription className="mt-2">
              {message}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </CardContent>
      </Card>
    </div>
  );
}
