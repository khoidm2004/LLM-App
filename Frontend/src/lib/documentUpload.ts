export const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt"] as const;
export const MAX_FILES_PER_SESSION = 3;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const SUMMARY_LENGTHS = ["short", "medium", "detailed"] as const;
export type SummaryLength = (typeof SUMMARY_LENGTHS)[number];

const getExtension = (filename: string): string => {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? "" : filename.slice(dotIndex + 1).toLowerCase();
};

// Mirrors the server-side checks in Backend/src/lib/fileValidation.ts, so
// the user gets instant feedback instead of waiting on a round trip for
// something the server would reject anyway.
export const validateNewFiles = (
  newFiles: File[],
  alreadyAttachedCount: number,
): string | null => {
  if (alreadyAttachedCount + newFiles.length > MAX_FILES_PER_SESSION) {
    return `You can attach at most ${MAX_FILES_PER_SESSION} files per session.`;
  }

  for (const file of newFiles) {
    if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(getExtension(file.name))) {
      return `Unsupported file type: "${file.name}". Allowed types: PDF, DOC, DOCX, TXT.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `"${file.name}" is too large. Max size is 10MB per file.`;
    }
  }

  return null;
};

const apiBase = () =>
  import.meta.env.VITE_API_LINK ? `${import.meta.env.VITE_API_LINK}` : "";

export const uploadDocuments = async (
  sessionToken: string,
  files: File[],
): Promise<void> => {
  const formData = new FormData();
  formData.append("sessionToken", sessionToken);
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${apiBase()}/api/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to upload files");
  }
};

export const summarizeDocuments = async (
  sessionToken: string,
  length: SummaryLength,
): Promise<string> => {
  const response = await fetch(`${apiBase()}/api/summarize-documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionToken, length }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to generate summary");
  }
  return data.summary;
};
