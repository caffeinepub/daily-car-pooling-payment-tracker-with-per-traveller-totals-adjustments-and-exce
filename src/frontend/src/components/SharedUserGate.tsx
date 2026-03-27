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
import { AlertCircle, Car, Loader2, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { TabPermission } from "../backend";
import { LedgerPageContent } from "../features/ledger/LedgerPage";
import {
  LedgerStateProvider,
  useLedgerState,
} from "../features/ledger/LedgerStateContext";
import { useActor } from "../hooks/useActor";

const SHARED_ACCESS_KEY = "carpool-shared-access";
const VISIT_COUNT_KEY = "carpool-visit-counts";

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

function incrementVisitCount(adminPrincipal: string, email: string) {
  try {
    const raw = localStorage.getItem(VISIT_COUNT_KEY);
    const counts: Record<string, number> = raw ? JSON.parse(raw) : {};
    const key = `${adminPrincipal}:${email}`;
    counts[key] = (counts[key] ?? 0) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, JSON.stringify(counts));
  } catch {}
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
  const attempted = useRef(false);

  useEffect(() => {
    if (!actor || attempted.current) return;
    attempted.current = true;

    (async () => {
      try {
        // Register email (no-op if already registered; works anonymously)
        try {
          await actor.registerSharedUserEmail(email);
        } catch {}

        const adminPrincipal = Principal.fromText(adminPrincipalStr);
        const result = await actor.getAdminSharedData(adminPrincipal);

        if (!result) {
          onError("Access denied. Your email is not in the access list.");
          setStatus("error");
          return;
        }

        // Verify this email is actually in the permissions list
        const hasAccess = result.permissions && result.permissions.length > 0;
        if (!hasAccess) {
          onError("Access denied. Your email is not in the access list.");
          setStatus("error");
          return;
        }

        if (result.ledgerState) {
          try {
            mergeRestoreFromBackup(JSON.parse(result.ledgerState));
          } catch {}
        }

        saveCache({ adminPrincipal: adminPrincipalStr, email });
        incrementVisitCount(adminPrincipalStr, email);
        onPermissions(result.permissions);
        setStatus("done");
      } catch {
        onError("Failed to load shared data. Please try again.");
        setStatus("error");
      }
    })();
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
  const { actor } = useActor();
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [permissions, setPermissions] = useState<TabPermission[] | null>(null);
  const [accessError, setAccessError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-load from cache on mount — no login needed
  useEffect(() => {
    const cache = loadCache();
    if (cache && cache.adminPrincipal === adminPrincipalStr) {
      setSubmittedEmail(cache.email);
    }
  }, [adminPrincipalStr]);

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
    // Clear cache so user can try a different email
    localStorage.removeItem(SHARED_ACCESS_KEY);
    setAccessError(msg);
  };

  // Have permissions → show the app
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

  // Loading shared data after email submit — wait for anonymous actor
  if (submittedEmail) {
    if (!actor) {
      // Actor still initialising
      return (
        <div
          className="min-h-screen flex items-center justify-center"
          data-ocid="shared_gate.loading_state"
        >
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return (
      <SharedDataLoader
        adminPrincipalStr={adminPrincipalStr}
        email={submittedEmail}
        onPermissions={handlePermissionsLoaded}
        onError={handleAccessError}
      />
    );
  }

  // Default: email entry form (no login required)
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <Card className="w-full max-w-md shadow-lg" data-ocid="shared_gate.card">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Car className="w-10 h-10 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Carpool Ledger</CardTitle>
            <CardDescription className="mt-2">
              You've been invited to view a shared carpool. Enter the email
              address the admin used to grant you access.
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
            disabled={isSubmitting || !actor}
            className="w-full h-12 text-base"
            size="lg"
            data-ocid="shared_gate.submit_button"
          >
            {isSubmitting || !actor ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
              </>
            ) : (
              <>
                <Mail className="mr-2 h-5 w-5" /> Access Carpool
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            No account or login required — just enter your email.
          </p>
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
