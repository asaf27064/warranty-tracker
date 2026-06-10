import { client } from "../config/anthropic";

import { z } from "zod";
import { createProductSchema } from "../schemas/product.schema";

export const extractProductService = async (text: string) => {
  const inputSchema = z.toJSONSchema(createProductSchema);

  const tools = [
    {
      name: "save_product",
      description:
        "Call this when you have enough information to record the product warranty.",
      input_schema: inputSchema as any,
    },
    {
      name: "ask_clarification",
      description:
        "Call this when a required field (purchaseDate or warrantyMonths) cannot be determined from the input. Ask the user a short, specific question.",
      input_schema: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "A short, specific question to ask the user.",
          },
        },
        required: ["question"],
      } as any,
    },
  ];

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    tools,
    tool_choice: { type: "any" },
    messages: [
      {
        role: "user",
        content: `Today is ${new Date().toISOString().split("T")[0]}. Extract: '${text}'`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "tool_use");
  if (block && block.type === "tool_use") {
    if (block.name === "save_product") {
      return {
        status: "complete" as const,
        product: createProductSchema.parse(block.input),
      };
    }
    if (block.name === "ask_clarification") {
      return {
        status: "needs_clarification" as const,
        question: (block.input as { question: string }).question,
      };
    }
  }

  throw new Error("Model did not return a usable tool call");
};
