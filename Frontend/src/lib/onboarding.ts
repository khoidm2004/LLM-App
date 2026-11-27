const STORAGE_KEY = "meetrecap-onboarding-seen";

export const hasSeenOnboarding = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return true; // fail open: never block the UI on storage access
  }
};

export const markOnboardingSeen = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // ignore — nothing to persist to, modal will just reappear next visit
  }
};
