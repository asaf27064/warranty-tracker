import { z } from "zod";

// Validation for document routes.
//

// POST /product/:productId  (multipart upload, file handled by multer)
//   body: { docType?: enum DocumentType }
//   DocumentType = RECEIPT | INVOICE | WARRANTY_CERTIFICATE | PHOTO | OTHER
//   note: the file itself is validated separately (multer), not by Zod.

//
// TODO (you write this):
//   - uploadDocSchema  (body: { docType? }, default OTHER)
//   (params :productId and :id are covered by common.schema.ts)

// body only — :productId is validated separately via productIdParamSchema
export const uploadDocSchema = z.object({
  docType: z
    .enum(["RECEIPT", "INVOICE", "WARRANTY_CERTIFICATE", "PHOTO", "OTHER"], {
      error: () => ({ message: "Invalid document type" }),
    })
    .optional()
    .default("OTHER"),
});
