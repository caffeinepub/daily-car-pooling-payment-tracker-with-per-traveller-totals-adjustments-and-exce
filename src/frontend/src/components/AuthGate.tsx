import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, LogIn } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { identity, login, loginStatus } = useInternetIdentity();

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Car className="w-10 h-10 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Carpool Ledger</CardTitle>
              <CardDescription className="mt-2">
                Track daily carpooling expenses, manage traveller balances, and export reports. 
                Your data syncs across all devices.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={login}
              disabled={loginStatus === 'logging-in'}
              className="w-full h-12 text-base"
              size="lg"
            >
              <LogIn className="mr-2 h-5 w-5" />
              {loginStatus === 'logging-in' ? 'Connecting...' : 'Login to Continue'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure authentication powered by Internet Identity
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
