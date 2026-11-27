import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import {
  ALLOWED_EXTENSIONS,
  getExtension,
  isAllowedExtension,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_SESSION,
} from "../lib/fileValidation";
import { getSupabaseClient, MEETING_DOCUMENTS_BUCKET } from "../lib/supabaseClient";
import { touchSession } from "../lib/uploadSessions";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES_PER_SESSION },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedExtension(getExtension(file.originalname))) {
      cb(
        new Error(
          `Unsupported file type: "${file.originalname}". Allowed types: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}.`,
        ),
      );
      return;
    }
    cb(null, true);
  },
});

const router: Router = Router();

router.post(
  "/api/upload",
  upload.array("files", MAX_FILES_PER_SESSION),
  async (req, res) => {
    try {
      const sessionToken =
        (req.body.sessionToken as string | undefined)?.trim() || randomUUID();
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];

      if (files.length === 0) {
        res.status(400).json({ error: "No files were provided." });
        return;
      }

      const session = await touchSession(sessionToken);
      const supabase = getSupabaseClient();

      const { count: existingCount, error: countError } = await supabase
        .from("uploaded_files")
        .select("id", { count: "exact", head: true })
        .eq("session_id", session.id);

      if (countError) {
        throw new Error(
          `Failed to count existing files for session: ${countError.message}`,
        );
      }

      const alreadyUploaded = existingCount ?? 0;
      if (alreadyUploaded + files.length > MAX_FILES_PER_SESSION) {
        res.status(400).json({
          error:
            `This session already has ${alreadyUploaded} file(s). You can ` +
            `upload at most ${MAX_FILES_PER_SESSION} files total per session.`,
        });
        return;
      }

      const uploadedFiles: {
        id: number;
        originalFilename: string;
        mimeType: string;
        sizeBytes: number;
      }[] = [];

      for (const file of files) {
        const storagePath = `${sessionToken}/${randomUUID()}-${file.originalname}`;

        const { error: storageError } = await supabase.storage
          .from(MEETING_DOCUMENTS_BUCKET)
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (storageError) {
          throw new Error(
            `Failed to upload "${file.originalname}": ${storageError.message}`,
          );
        }

        const { data: fileRow, error: insertError } = await supabase
          .from("uploaded_files")
          .insert({
            session_id: session.id,
            storage_path: storagePath,
            original_filename: file.originalname,
            mime_type: file.mimetype,
            size_bytes: file.size,
          })
          .select()
          .single();

        if (insertError || !fileRow) {
          // Best-effort cleanup so a DB failure doesn't leave an orphaned
          // file sitting in Storage with no tracking row.
          await supabase.storage
            .from(MEETING_DOCUMENTS_BUCKET)
            .remove([storagePath]);
          throw new Error(
            `Failed to record uploaded file: ${insertError?.message ?? "no row returned"}`,
          );
        }

        uploadedFiles.push({
          id: fileRow.id,
          originalFilename: fileRow.original_filename,
          mimeType: fileRow.mime_type,
          sizeBytes: fileRow.size_bytes,
        });
      }

      res.status(201).json({ sessionToken, files: uploadedFiles });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        error: "Failed to upload files",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
