const STORAGE_KEY = "meetrecap-upload-session-token";

// A stable anonymous identifier for this browser's document-upload session,
// since the app has no login. Scoped to Storage/DB rows on the backend.
export const getOrCreateSessionToken = (): string => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const token = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, token);
  return token;
};
