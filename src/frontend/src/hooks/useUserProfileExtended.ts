import { useCallback, useEffect, useState } from "react";

export const PROFILE_EXTENDED_KEY = "carpool-profile-extended";

export interface UserProfileExtended {
  firstName?: string;
  lastName?: string;
  phone?: string;
  sex?: string;
  vehicleNumber?: string;
  profilePicture?: string;
}

export function loadProfileExtended(): UserProfileExtended | null {
  try {
    const stored = localStorage.getItem(PROFILE_EXTENDED_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export function saveProfileExtended(profile: UserProfileExtended): void {
  localStorage.setItem(PROFILE_EXTENDED_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("profile-extended-updated"));
}

export function useUserProfileExtended() {
  const [profile, setProfile] = useState<UserProfileExtended | null>(() =>
    loadProfileExtended(),
  );

  useEffect(() => {
    const handleUpdate = () => {
      setProfile(loadProfileExtended());
    };
    window.addEventListener("profile-extended-updated", handleUpdate);
    return () =>
      window.removeEventListener("profile-extended-updated", handleUpdate);
  }, []);

  const updateProfile = useCallback((newProfile: UserProfileExtended) => {
    saveProfileExtended(newProfile);
    setProfile(newProfile);
  }, []);

  return { profile, updateProfile };
}
