import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Copy, Link, Loader2, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ShareAccessEntry, TabPermission } from "../../backend";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

const ALL_TABS: { key: string; label: string }[] = [
  { key: "travellers", label: "Travellers" },
  { key: "grid", label: "Daily" },
  { key: "summary", label: "Participation Payment" },
  { key: "car", label: "Expense Record" },
  { key: "overall", label: "Overall" },
  { key: "tripHistory", label: "Trip History" },
  { key: "paymentSummary", label: "Trips & Payment" },
  { key: "paymentHistory", label: "Payment History" },
  { key: "expenseHistory", label: "Expense History" },
  { key: "export", label: "Export" },
  { key: "backup", label: "Backup & Restore" },
  { key: "clear", label: "Clear Data" },
];

type AccessLevel = "hidden" | "read" | "edit";

interface EmailEntry {
  email: string;
  permissions: Record<string, AccessLevel>;
}

function defaultPermissions(): Record<string, AccessLevel> {
  const perms: Record<string, AccessLevel> = {};
  for (const tab of ALL_TABS) {
    perms[tab.key] = "hidden";
  }
  return perms;
}

function entryToEmailEntry(entry: ShareAccessEntry): EmailEntry {
  const permissions = defaultPermissions();
  for (const perm of entry.permissions) {
    permissions[perm.tabKey] = perm.access as AccessLevel;
  }
  return { email: entry.email, permissions };
}

function emailEntryToShareEntry(entry: EmailEntry): ShareAccessEntry {
  const permissions: TabPermission[] = ALL_TABS.map((tab) => ({
    tabKey: tab.key,
    access: entry.permissions[tab.key] ?? "hidden",
  }));
  return { email: entry.email, permissions };
}

export default function ShareAccessPanel() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [entries, setEntries] = useState<EmailEntry[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!actor) return;
    setIsLoading(true);
    actor
      .getShareAccessConfig()
      .then((configs) => {
        setEntries(configs.map(entryToEmailEntry));
      })
      .catch(() => toast.error("Failed to load share access config"))
      .finally(() => setIsLoading(false));
  }, [actor]);

  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    if (entries.some((e) => e.email === email)) {
      toast.error("This email is already in the list");
      return;
    }
    setEntries((prev) => [
      ...prev,
      { email, permissions: defaultPermissions() },
    ]);
    setNewEmail("");
  };

  const handleRemoveEmail = (email: string) => {
    setEntries((prev) => prev.filter((e) => e.email !== email));
  };

  const handleToggleTab = (email: string, tabKey: string, checked: boolean) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.email === email
          ? {
              ...e,
              permissions: {
                ...e.permissions,
                [tabKey]: checked ? "read" : "hidden",
              },
            }
          : e,
      ),
    );
  };

  const handleAccessChange = (
    email: string,
    tabKey: string,
    access: AccessLevel,
  ) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.email === email
          ? { ...e, permissions: { ...e.permissions, [tabKey]: access } }
          : e,
      ),
    );
  };

  const handleSave = async () => {
    if (!actor) return;
    setIsSaving(true);
    try {
      await actor.saveShareAccessConfig(entries.map(emailEntryToShareEntry));
      toast.success("Share access saved successfully");
    } catch {
      toast.error("Failed to save share access config");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyShareLink = () => {
    const principal = identity?.getPrincipal().toString();
    if (!principal) {
      toast.error("Not logged in");
      return;
    }
    const link = `${window.location.origin}${window.location.pathname}?access=${principal}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(link)
        .then(() => toast.success("Share link copied to clipboard!"))
        .catch(() => {
          // Fallback
          const el = document.createElement("textarea");
          el.value = link;
          document.body.appendChild(el);
          el.select();
          document.execCommand("copy");
          document.body.removeChild(el);
          toast.success("Share link copied to clipboard!");
        });
    } else {
      // Fallback for non-secure contexts
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
        toast.success("Share link copied to clipboard!");
      } catch {
        toast.error(`Failed to copy link. URL: ${link}`);
      }
      document.body.removeChild(el);
    }
  };

  return (
    <div className="space-y-6" data-ocid="share_access.panel">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">
                Share Access
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Invite others to view or edit selected tabs. They log in with
                Internet Identity and enter their email.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Share Link */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleCopyShareLink}
              data-ocid="share_access.primary_button"
            >
              <Link className="h-4 w-4" />
              Copy Share Link
            </Button>
            <p className="text-xs text-muted-foreground self-center">
              Send this link to users you want to grant access.
            </p>
          </div>

          <Separator />

          {/* Add Email */}
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
              className="flex-1"
              data-ocid="share_access.input"
            />
            <Button
              onClick={handleAddEmail}
              className="gap-1.5"
              data-ocid="share_access.secondary_button"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {/* Email List */}
          {isLoading ? (
            <div
              className="flex items-center justify-center py-8"
              data-ocid="share_access.loading_state"
            >
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground text-sm"
              data-ocid="share_access.empty_state"
            >
              No users added yet. Add an email address above.
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, idx) => (
                <Card
                  key={entry.email}
                  className="border border-border"
                  data-ocid={`share_access.item.${idx + 1}`}
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge
                          variant="secondary"
                          className="text-xs font-mono shrink-0"
                        >
                          {entry.email}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveEmail(entry.email)}
                        data-ocid={`share_access.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ALL_TABS.map((tab) => {
                        const access = entry.permissions[tab.key] ?? "hidden";
                        const isChecked = access !== "hidden";
                        return (
                          <div
                            key={tab.key}
                            className="flex items-center justify-between gap-2 py-1"
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`${entry.email}-${tab.key}`}
                                checked={isChecked}
                                onCheckedChange={(checked) =>
                                  handleToggleTab(
                                    entry.email,
                                    tab.key,
                                    !!checked,
                                  )
                                }
                                data-ocid="share_access.checkbox"
                              />
                              <Label
                                htmlFor={`${entry.email}-${tab.key}`}
                                className="text-xs cursor-pointer"
                              >
                                {tab.label}
                              </Label>
                            </div>
                            {isChecked && (
                              <Select
                                value={access}
                                onValueChange={(val) =>
                                  handleAccessChange(
                                    entry.email,
                                    tab.key,
                                    val as AccessLevel,
                                  )
                                }
                              >
                                <SelectTrigger
                                  className="h-7 w-24 text-xs"
                                  data-ocid="share_access.select"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="read">
                                    Read Only
                                  </SelectItem>
                                  <SelectItem value="edit">Edit</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Save Button */}
          {entries.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
                data-ocid="share_access.save_button"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
