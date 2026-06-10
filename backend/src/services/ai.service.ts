import { client } from "../config/anthropic";

import { z } from "zod";
import { createProductSchema } from "../schemas/product.schema";

// Lenient schema: every field optional, so the model can legitimately leave
// out anything it cannot determine instead of inventing values.
const extractionSchema = createProductSchema.partial();

export const extractProductService = async (text: string) => {
  const inputSchema = z.toJSONSchema(extractionSchema);

  const tools = [
    {
      name: "save_product",
      description:
        "Record the product warranty details extracted from the user's text. " +
        "Fill in a field ONLY if it is explicitly stated or can be directly calculated from the text. " +
        "For purchaseDate: set it only if the text gives an actual date or a relative time such as " +
        "'last week' or '2 months ago'. If no purchase date is mentioned, OMIT purchaseDate entirely — " +
        "do NOT default to today's date. " +
        "Never guess or invent values; omit anything you cannot determine.",
      input_schema: inputSchema as any,
    },
  ];

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    tools,
    tool_choice: { type: "tool", name: "save_product" },
    messages: [
      {
        role: "user",
        content: `Today is ${new Date().toISOString().split("T")[0]}. Extract product warranty details from: '${text}'`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "tool_use");
  if (block && block.type === "tool_use") {
    // Returns whatever fields could be extracted (some may be missing).
    return extractionSchema.parse(block.input);
  }

  throw new Error("Model did not return a product");
};
