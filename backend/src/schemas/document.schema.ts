import { z } from "zod";

export const uploadDocSchema = z.object({
  docType: z
    .enum(["RECEIPT", "INVOICE", "WARRANTY_CERTIFICATE", "PHOTO", "OTHER"], {
      error: () => ({ message: "Invalid document type" }),
    })
    .optional()
    .default("OTHER"),
});
