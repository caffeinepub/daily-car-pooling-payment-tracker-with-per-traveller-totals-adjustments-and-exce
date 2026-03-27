import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Principal } from "@dfinity/principal";
import { AlertCircle, Car, Loader2, LogIn, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { TabPermission } from "../backend";
import { LedgerPageContent } from "../features/ledger/LedgerPage";
import {
  LedgerStateProvider,
  useLedgerState,
} from "../features/ledger/LedgerStateContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const SHARED_ACCESS_KEY = "carpool-shared-access";

interface SharedAccessCache {
  adminPrincipal: string;
  email: string;
}

function loadCache(): SharedAccessCache | null {
  try {
    const raw = localStorage.getItem(SHARED_ACCESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveCache(cache: SharedAccessCache) {
  localStorage.setItem(SHARED_ACCESS_KEY, JSON.stringify(cache));
}

interface SharedDataLoaderProps {
  adminPrincipalStr: string;
  email: string;
  onPermissions: (permissions: TabPermission[]) => void;
  onError: (msg: string) => void;
}

function SharedDataLoader({
  adminPrincipalStr,
  email,
  onPermissions,
  onError,
}: SharedDataLoaderProps) {
  const { actor } = useActor();
  const { mergeRestoreFromBackup } = useLedgerState();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    if (!actor) return;

    let cancelled = false;
    (async () => {
      try {
        await actor.registerSharedUserEmail(email);
        const adminPrincipal = Principal.fromText(adminPrincipalStr);
        const result = await actor.getAdminSharedData(adminPrincipal);
        if (cancelled) return;
        if (!result) {
          onError("Access denied. Your email is not in the access list.");
          setStatus("error");
          return;
        }
        if (result.ledgerState) {
          try {
            mergeRestoreFromBackup(JSON.parse(result.ledgerState));
          } catch {
            // ignore parse errors
          }
        }
        saveCache({ adminPrincipal: adminPrincipalStr, email });
        onPermissions(result.permissions);
        setStatus("done");
      } catch {
        if (!cancelled) {
          onError("Failed to load shared data. Please try again.");
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    actor,
    adminPrincipalStr,
    email,
    mergeRestoreFromBackup,
    onPermissions,
    onError,
  ]);

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-ocid="shared_gate.loading_state"
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading shared carpool data…</p>
        </div>
      </div>
    );
  }

  return null;
}

interface SharedUserGateInnerProps {
  adminPrincipalStr: string;
}

function SharedUserGateInner({ adminPrincipalStr }: SharedUserGateInnerProps) {
  const { identity, login, loginStatus } = useInternetIdentity();
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [permissions, setPermissions] = useState<TabPermission[] | null>(null);
  const [accessError, setAccessError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-load from cache
  useEffect(() => {
    if (!identity) return;
    const cache = loadCache();
    if (cache && cache.adminPrincipal === adminPrincipalStr) {
      setSubmittedEmail(cache.email);
    }
  }, [identity, adminPrincipalStr]);

  const handleSubmitEmail = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    setIsSubmitting(true);
    setAccessError("");
    setSubmittedEmail(trimmed);
  };

  const handlePermissionsLoaded = (perms: TabPermission[]) => {
    setIsSubmitting(false);
    setPermissions(perms);
  };

  const handleAccessError = (msg: string) => {
    setIsSubmitting(false);
    setSubmittedEmail("");
    setAccessError(msg);
  };

  // Not logged in → show login screen
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
                You've been invited to view a shared carpool. Log in to
                continue.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={login}
              disabled={loginStatus === "logging-in"}
              className="w-full h-12 text-base"
              size="lg"
              data-ocid="shared_gate.primary_button"
            >
              <LogIn className="mr-2 h-5 w-5" />
              {loginStatus === "logging-in"
                ? "Connecting…"
                : "Login to Continue"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure authentication powered by Internet Identity
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in, have permissions → show LedgerPageContent (uses outer LedgerStateProvider)
  if (permissions) {
    return (
      <LedgerPageContent
        sharedPermissions={permissions}
        isReadOnlyUser={true}
        adminPrincipalStr={adminPrincipalStr}
        sharedUserEmail={submittedEmail}
      />
    );
  }

  // Loading shared data after email submit
  if (submittedEmail) {
    return (
      <>
        <SharedDataLoader
          adminPrincipalStr={adminPrincipalStr}
          email={submittedEmail}
          onPermissions={handlePermissionsLoaded}
          onError={handleAccessError}
        />
        {!isSubmitting && (
          <div
            className="min-h-screen flex items-center justify-center"
            data-ocid="shared_gate.loading_state"
          >
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </>
    );
  }

  // Logged in, needs email
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <Card className="w-full max-w-md shadow-lg" data-ocid="shared_gate.card">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Enter Your Email</CardTitle>
            <CardDescription className="mt-2">
              Enter the email address the admin used to grant you access to this
              carpool.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {accessError && (
            <div
              className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg"
              data-ocid="shared_gate.error_state"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {accessError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="shared-email">Email Address</Label>
            <Input
              id="shared-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitEmail()}
              data-ocid="shared_gate.input"
            />
          </div>
          <Button
            onClick={handleSubmitEmail}
            disabled={isSubmitting}
            className="w-full h-12 text-base"
            size="lg"
            data-ocid="shared_gate.submit_button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
              </>
            ) : (
              "Access Carpool"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SharedUserGate({
  adminPrincipalStr,
}: {
  adminPrincipalStr: string;
}) {
  return (
    <LedgerStateProvider>
      <SharedUserGateInner adminPrincipalStr={adminPrincipalStr} />
    </LedgerStateProvider>
  );
}
