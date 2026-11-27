export const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt"] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_SESSION = 3;

export const getExtension = (filename: string): string => {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? "" : filename.slice(dotIndex + 1).toLowerCase();
};

// The extension decides which parser runs, so it's the authoritative check
// here rather than the client-reported MIME type (which is inconsistent
// across browsers/OSes for .doc/.txt). A file whose content doesn't match
// its extension will simply fail text extraction with a clear error later.
export const isAllowedExtension = (
  ext: string,
): ext is AllowedExtension =>
  (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
