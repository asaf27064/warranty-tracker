import type Anthropic from "@anthropic-ai/sdk";
import { client } from "../config/anthropic";
import * as productService from "./product.service";
import * as reminderService from "./reminder.service";

const MAX_ITERATIONS = 5;

const CATEGORIES = [
  "NONE",
  "ELECTRONICS",
  "HOME_KITCHEN",
  "PHONES",
  "JEWELRY",
  "KIDS_TOYS",
  "APPLIANCES",
  "FURNITURE",
  "FASHION",
  "AUTOMOTIVE",
  "SPORTS",
  "TOOLS",
  "OTHER",
];

const SYSTEM_PROMPT = `You are a helpful warranty assistant inside a warranty-tracking app.
You help the user understand and manage their product warranties.
Use the provided tools to look up real data — never invent products, dates, or warranty details.
Today's date is ${new Date().toISOString().split("T")[0]}.
Always reply in the same language the user writes in.
When replying in Hebrew, refer to a product warranty as "אחריות" (never "ערבות").
You can also add new products. When the user wants to add one, gather the product name,
purchase date, and warranty length — ask for anything missing. Then summarize the details
and ask the user to confirm. Only call create_product AFTER the user has explicitly confirmed.

IMPORTANT — the app displays every product you look up as an interactive card below your
message (with its name, store, status, and warranty date). So do NOT repeat those details
as a list in your text. Instead reply with a short, friendly summary — at most 1-3 sentences,
e.g. counts and anything noteworthy ("You have 6 electronics — 3 still active, 3 expired.").
Keep it brief and conversational; avoid long bullet lists.`;

// --- Tool definitions exposed to the model ---
export const agentTools: Anthropic.Tool[] = [
  {
    name: "search_products",
    description:
      "Search the user's products by optional name/store text, status, and/or category.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text to match in name or store." },
        status: {
          type: "string",
          enum: ["ACTIVE", "EXPIRING_SOON", "EXPIRED"],
        },
        category: { type: "string", enum: CATEGORIES },
      },
    },
  },
  {
    name: "get_expiring_warranties",
    description:
      "List products whose warranty expires within the given number of days from today.",
    input_schema: {
      type: "object",
      properties: {
        withinDays: {
          type: "number",
          description: "Number of days from today to look ahead.",
        },
      },
      required: ["withinDays"],
    },
  },
  {
    name: "get_product_details",
    description: "Get full details of a single product by its id.",
    input_schema: {
      type: "object",
      properties: {
        productId: { type: "string" },
      },
      required: ["productId"],
    },
  },
  {
    name: "create_reminder",
    description:
      "Create a reminder for a product, a given number of days before its warranty expires.",
    input_schema: {
      type: "object",
      properties: {
        productId: { type: "string" },
        daysBefore: {
          type: "number",
          description: "Days before warranty expiry to remind.",
        },
      },
      required: ["productId", "daysBefore"],
    },
  },
  {
    name: "create_product",
    description:
      "Create a new product with warranty tracking. ONLY call this after the user has " +
      "explicitly confirmed the details. Requires name, purchaseDate (ISO YYYY-MM-DD), " +
      "and warrantyMonths.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        store: { type: "string" },
        purchaseDate: { type: "string", description: "ISO date YYYY-MM-DD" },
        warrantyMonths: { type: "number" },
        category: { type: "string", enum: CATEGORIES },
      },
      required: ["name", "purchaseDate", "warrantyMonths"],
    },
  },
];

async function executeTool(
  name: string,
  input: any,
  userId: string,
): Promise<unknown> {
  switch (name) {
    case "search_products":
      return productService.searchProducts(userId, {
        query: input.query,
        status: input.status,
        category: input.category,
      });

    case "get_expiring_warranties":
      return productService.getExpiringWarranties(userId, input.withinDays);

    case "get_product_details": {
      const product = await productService.getProductById(
        userId,
        input.productId,
        { include: true },
      );
      return product ?? { error: "Product not found" };
    }

    case "create_reminder": {
      const result = await reminderService.createReminder(
        userId,
        input.productId,
        input.daysBefore,
      );
      if (result.status === "not_found") return { error: "Product not found" };
      return result.reminder;
    }

    case "create_product":
      try {
        return await productService.createProduct(userId, input);
      } catch (err) {
        // Surface validation failures to the model instead of crashing the loop.
        return {
          error: "Could not create product",
          details: err instanceof Error ? err.message : String(err),
        };
      }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// A tool result is "product-like" if it has an id and a warrantyExpiry.
function isProduct(value: unknown): value is { id: string } {
  return (
    !!value &&
    typeof value === "object" &&
    "id" in value &&
    "warrantyExpiry" in value
  );
}

export type AgentResult = {
  reply: string;
  products: unknown[];
  createdProductId?: string;
};

// --- The agent loop ---
export async function runAgent(
  userId: string,
  history: Anthropic.MessageParam[],
  userText: string,
): Promise<AgentResult> {
  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: userText },
  ];

  // Collect any products the tools surfaced this turn, deduped by id, so the
  // frontend can render them as interactive cards alongside the reply.
  const collected = new Map<string, unknown>();
  const collect = (result: unknown) => {
    const items = Array.isArray(result) ? result : [result];
    for (const item of items) {
      if (isProduct(item)) collected.set(item.id, item);
    }
  };
  // Set when the agent actually creates a product (vs. just searching), so the
  // UI can offer the post-add photo/receipt actions.
  let createdProductId: string | undefined;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: agentTools,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await executeTool(block.name, block.input, userId);
          collect(result);
          if (block.name === "create_product" && isProduct(result)) {
            createdProductId = result.id;
          }
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
      }
      messages.push({ role: "user", content: toolResults });
      continue; // loop again so the model can use the tool results
    }

    // No tool call -> final answer
    const textBlock = response.content.find((b) => b.type === "text");
    return {
      reply: textBlock && textBlock.type === "text" ? textBlock.text : "",
      products: [...collected.values()],
      createdProductId,
    };
  }

  return {
    reply: "Sorry, I couldn't complete that request. Please try rephrasing.",
    products: [...collected.values()],
    createdProductId,
  };
}
