import type Anthropic from "@anthropic-ai/sdk";
import { client } from "../config/anthropic";

import { z } from "zod";
import { createProductSchema } from "../schemas/product.schema";

const extractionSchema = createProductSchema.partial();
const inputSchema = z.toJSONSchema(extractionSchema);

const tools = [
  {
    name: "save_product",
    description:
      "Record the product warranty details extracted from the receipt or text. " +
      "Fill in a field ONLY if it is explicitly stated or can be directly calculated. " +
      "For store: use the name of the merchant/business that issued the receipt - " +
      'usually the company name in the header (e.g. the name next to בע"מ / Ltd.). ' +
      "Do NOT use a salesperson or agent name (labelled 'סוכן' / 'agent') or a product brand. " +
      "For purchaseDate: set it only if an actual date or relative time (e.g. 'last week', " +
      "'2 months ago') is present, and ALWAYS format it as an ISO date YYYY-MM-DD " +
      "(e.g. a receipt showing 29/03/26 becomes 2026-03-29). " +
      "If no purchase date is found, OMIT purchaseDate entirely - do NOT default to today's date. " +
      "Never guess or invent values; omit anything you cannot determine. " +
      "NEVER use placeholder values such as 'unknown', '<UNKNOWN>', 'N/A', 'none', or 0 - " +
      "if a value is not present, leave the field out completely.",
    input_schema: inputSchema as any,
  },
];

const supportedMediaTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
] as const;

export type ReceiptMediaType = (typeof supportedMediaTypes)[number];

export const isSupportedMediaType = (type: string): type is ReceiptMediaType =>
  (supportedMediaTypes as readonly string[]).includes(type);

function fileBlock(
  base64: string,
  mediaType: ReceiptMediaType,
): Anthropic.ContentBlockParam {
  if (mediaType === "application/pdf") {
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64 },
    };
  }
  return {
    type: "image",
    source: { type: "base64", media_type: mediaType, data: base64 },
  };
}

const today = () => new Date().toISOString().split("T")[0];

async function runExtraction(
  content: Anthropic.ContentBlockParam[],
  model = "claude-haiku-4-5",
) {
  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    tools,
    tool_choice: { type: "tool", name: "save_product" },
    messages: [{ role: "user", content }],
  });

  const block = message.content.find((b) => b.type === "tool_use");
  if (block && block.type === "tool_use") {
    const raw = { ...(block.input as Record<string, unknown>) };

    const placeholder =
      /^\s*(<?\s*unknown\s*>?|n\/?a|none|null|undefined|-+)\s*$/i;
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string" && (v.trim() === "" || placeholder.test(v))) {
        delete raw[k];
      }
    }

    let result = extractionSchema.safeParse(raw);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") delete raw[key];
      }
      result = extractionSchema.safeParse(raw);
    }
    return result.success ? result.data : {};
  }

  throw new Error("Model did not return a product");
}

export const extractProductService = async (text: string) => {
  return runExtraction([
    {
      type: "text",
      text: `Today is ${today()}. Extract product warranty details from: '${text}'`,
    },
  ]);
};

export const extractProductFromFile = async (
  base64: string,
  mediaType: ReceiptMediaType,
) => {
  return runExtraction(
    [
      fileBlock(base64, mediaType),
      {
        type: "text",
        text: `Today is ${today()}. This is a purchase receipt or invoice. Extract the product warranty details from it.`,
      },
    ],
    "claude-sonnet-4-6",
  );
};
