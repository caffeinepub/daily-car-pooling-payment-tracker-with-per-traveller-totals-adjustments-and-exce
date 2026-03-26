import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { useState } from "react";
import {
  useSaveCallerUserProfile,
  useSaveCallerUserProfileExtended,
} from "../hooks/useQueries";

export interface ProfileSetupModalProps {
  open: boolean;
  onSave: (name: string) => void;
  isLoading?: boolean;
}

export default function ProfileSetupModal({
  open,
  onSave,
  isLoading,
}: ProfileSetupModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const { mutate: saveExtended } = useSaveCallerUserProfileExtended();

  const handleSave = () => {
    if (!firstName.trim()) {
      setFirstNameError("Please enter your first name");
      return;
    }
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");

    // Save extended profile fields alongside the base name
    saveExtended({
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: undefined,
      sex: undefined,
      vehicleNumber: undefined,
      profilePicture: undefined,
    });

    onSave(name);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="w-[calc(100vw-24px)] max-w-sm mx-auto p-4 sm:p-6 rounded-xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg sm:text-xl">Welcome!</DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            Please enter your name to get started with Carpool Ledger.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="setup-first-name" className="text-xs sm:text-sm">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="setup-first-name"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setFirstNameError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="h-11 text-sm"
                autoFocus
                data-ocid="profile.input"
              />
              {firstNameError && (
                <p
                  className="text-destructive text-xs"
                  data-ocid="profile.error_state"
                >
                  {firstNameError}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="setup-last-name" className="text-xs sm:text-sm">
                Last Name
              </Label>
              <Input
                id="setup-last-name"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="h-11 text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full h-11 text-sm font-semibold"
            data-ocid="profile.submit_button"
          >
            {isLoading ? "Saving..." : "Get Started"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
