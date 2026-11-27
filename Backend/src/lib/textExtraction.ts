import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";
import WordExtractor from "word-extractor";
import { getExtension, type AllowedExtension } from "./fileValidation";

class TextExtractionError extends Error {}

const extractFromPdf = async (buffer: Buffer): Promise<string> => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
};

const extractFromDocx = async (buffer: Buffer): Promise<string> => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};

// Legacy .doc extraction is best-effort: word-extractor handles the common
// OLE-based .doc format, but doesn't guarantee every .doc variant parses
// cleanly (unlike .docx/.pdf/.txt, which are more consistently structured).
const extractFromDoc = async (buffer: Buffer): Promise<string> => {
  const extractor = new WordExtractor();
  const document = await extractor.extract(buffer);
  return document.getBody();
};

const extractFromTxt = (buffer: Buffer): string => buffer.toString("utf-8");

const extractors: Record<
  AllowedExtension,
  (buffer: Buffer) => Promise<string> | string
> = {
  pdf: extractFromPdf,
  docx: extractFromDocx,
  doc: extractFromDoc,
  txt: extractFromTxt,
};

// Extracts plain text from an uploaded file's buffer based on its extension.
// Throws TextExtractionError with a message safe to show the user if the
// file can't be parsed (corrupt, password-protected, unsupported variant).
export const extractText = async (
  filename: string,
  buffer: Buffer,
): Promise<string> => {
  const ext = getExtension(filename);
  const extractor = extractors[ext as AllowedExtension];

  if (!extractor) {
    throw new TextExtractionError(
      `Unsupported file type: "${filename}". Allowed types: PDF, DOC, DOCX, TXT.`,
    );
  }

  try {
    const text = await extractor(buffer);
    if (!text.trim()) {
      throw new TextExtractionError(
        `No readable text found in "${filename}". It may be empty, image-only, or password-protected.`,
      );
    }
    return text;
  } catch (error) {
    if (error instanceof TextExtractionError) throw error;
    throw new TextExtractionError(
      `Could not extract text from "${filename}". The file may be corrupt or in an unsupported format variant.`,
    );
  }
};

export { TextExtractionError };
