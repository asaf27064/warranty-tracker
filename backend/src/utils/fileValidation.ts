import path from "path";

export type AllowedFileType = {
  mimeType: string;
  extension: string;
};

export const IMAGE_FILE_TYPES: AllowedFileType[] = [
  { mimeType: "image/jpeg", extension: "jpg" },
  { mimeType: "image/png", extension: "png" },
  { mimeType: "image/gif", extension: "gif" },
  { mimeType: "image/webp", extension: "webp" },
];

export const DOCUMENT_FILE_TYPES: AllowedFileType[] = [
  ...IMAGE_FILE_TYPES,
  { mimeType: "application/pdf", extension: "pdf" },
];

const SIGNATURES: Record<string, (buffer: Buffer) => boolean> = {
  "image/jpeg": (buffer) =>
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff,
  "image/png": (buffer) =>
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a,
  "image/gif": (buffer) =>
    buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
    buffer.subarray(0, 6).toString("ascii") === "GIF89a",
  "image/webp": (buffer) =>
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP",
  "application/pdf": (buffer) =>
    buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-",
};

export function validateUploadedFile(
  file: Express.Multer.File,
  allowedTypes: AllowedFileType[],
) {
  const allowed = allowedTypes.find((type) => type.mimeType === file.mimetype);
  if (!allowed) {
    return { ok: false as const, error: "Unsupported file type" };
  }

  const matchesSignature = SIGNATURES[allowed.mimeType]?.(file.buffer) ?? false;
  if (!matchesSignature) {
    return {
      ok: false as const,
      error: "File content does not match the declared file type",
    };
  }

  return { ok: true as const, mimeType: allowed.mimeType, extension: allowed.extension };
}

export function safeOriginalName(fileName: string) {
  return path.basename(fileName).replace(/[^\w.\- ()]/g, "_");
}

