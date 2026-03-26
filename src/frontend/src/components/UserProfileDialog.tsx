import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, User } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { UserProfile } from "../backend";
import {
  useSaveCallerUserProfile,
  useSaveCallerUserProfileExtended,
} from "../hooks/useQueries";
import type { UserProfileExtended } from "../hooks/useUserProfileExtended";

export interface UserProfileDialogProps {
  open: boolean;
  onClose: () => void;
  userProfile?: UserProfile | null;
  userProfileExtended?: UserProfileExtended | null;
  onProfileSaved?: () => void;
}

export default function UserProfileDialog({
  open,
  onClose,
  userProfile,
  userProfileExtended,
  onProfileSaved,
}: UserProfileDialogProps) {
  const { mutate: saveProfile, isPending: isSavingProfile } =
    useSaveCallerUserProfile();
  const { mutate: saveExtended, isPending: isSavingExtended } =
    useSaveCallerUserProfileExtended();

  const isPending = isSavingProfile || isSavingExtended;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [sex, setSex] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync from props when dialog opens
  useEffect(() => {
    if (open) {
      setFirstName(userProfileExtended?.firstName ?? "");
      setLastName(userProfileExtended?.lastName ?? "");
      setPhone(userProfileExtended?.phone ?? "");
      setSex(userProfileExtended?.sex ?? "");
      setVehicleNumber(userProfileExtended?.vehicleNumber ?? "");
      setProfilePicture(userProfileExtended?.profilePicture ?? "");
    }
  }, [open, userProfileExtended]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const derivedName =
      [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") ||
      userProfile?.name ||
      "User";

    const extendedPayload: UserProfileExtended = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
      sex: sex || undefined,
      vehicleNumber: vehicleNumber.trim() || undefined,
      profilePicture: profilePicture || undefined,
    };

    let profileDone = false;
    let extendedDone = false;
    const tryClose = () => {
      if (profileDone && extendedDone) {
        onProfileSaved?.();
        onClose();
      }
    };

    saveProfile(
      { name: derivedName },
      {
        onSuccess: () => {
          profileDone = true;
          tryClose();
        },
      },
    );
    saveExtended(extendedPayload, {
      onSuccess: () => {
        extendedDone = true;
        tryClose();
      },
    });
  };

  const initials =
    [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() ||
    userProfile?.name?.[0]?.toUpperCase() ||
    "U";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="w-[calc(100vw-24px)] max-w-md mx-auto p-4 sm:p-6 rounded-xl"
        data-ocid="profile.dialog"
      >
        <DialogHeader className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg sm:text-xl">My Profile</DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            Manage your profile information. Changes sync across all devices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-20 w-20 ring-2 ring-primary/20">
              {profilePicture ? (
                <AvatarImage src={profilePicture} alt="Profile" />
              ) : null}
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => fileInputRef.current?.click()}
              data-ocid="profile.upload_button"
            >
              <Upload className="h-3.5 w-3.5" />
              {profilePicture ? "Change Photo" : "Upload Photo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              data-ocid="profile.dropzone"
            />
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label
                htmlFor="profile-first-name"
                className="text-xs sm:text-sm"
              >
                First Name
              </Label>
              <Input
                id="profile-first-name"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 text-sm"
                data-ocid="profile.input"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="profile-last-name" className="text-xs sm:text-sm">
                Last Name
              </Label>
              <Input
                id="profile-last-name"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <Label htmlFor="profile-phone" className="text-xs sm:text-sm">
              Phone Number
            </Label>
            <Input
              id="profile-phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 text-sm"
            />
          </div>

          {/* Sex */}
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Sex</Label>
            <Select value={sex} onValueChange={setSex}>
              <SelectTrigger
                className="h-10 text-sm"
                data-ocid="profile.select"
              >
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="Prefer not to say">
                  Prefer not to say
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Number */}
          <div className="space-y-1">
            <Label htmlFor="profile-vehicle" className="text-xs sm:text-sm">
              Vehicle Number
            </Label>
            <Input
              id="profile-vehicle"
              type="text"
              placeholder="GJ01AB1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
            data-ocid="profile.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="w-full sm:w-auto font-semibold"
            data-ocid="profile.save_button"
          >
            {isPending ? "Saving..." : "Save Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
