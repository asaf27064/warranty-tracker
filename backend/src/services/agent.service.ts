import { z } from "zod";
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
Use the provided tools to look up real data - never invent products, dates, or warranty details.
Today's date is ${new Date().toISOString().split("T")[0]}.
Always reply in the same language the user writes in.
When replying in Hebrew, refer to a product warranty as "אחריות" (never "ערבות").
You can also add new products. When the user wants to add one, gather the product name,
purchase date, and warranty length - ask for anything missing. Then summarize the details
and ask the user to confirm. Only call create_product AFTER the user has explicitly confirmed.
Never tell the user a product was added unless you actually called create_product in this same
turn. Do not repeat or copy an earlier "Added ..." message from the conversation. Each add is
independent: when the user confirms, create the product currently being discussed, not one from
earlier. If the user confirms but no specific new product is pending, ask them what to add.

IMPORTANT - the app displays every product you look up as an interactive card below your
message (with its name, store, status, and warranty date). So do NOT repeat those details
as a list in your text. Instead reply with a short, friendly summary - at most 1-3 sentences,
e.g. counts and anything noteworthy ("You have 6 electronics - 3 still active, 3 expired.").
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
        query: {
          type: "string",
          description: "Text to match in name or store.",
        },
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

// Model-supplied tool inputs aren't trusted; validate them before they reach
// the service layer.
const toolInputSchemas: Record<string, z.ZodTypeAny> = {
  search_products: z.object({
    query: z.string().optional(),
    status: z.enum(["ACTIVE", "EXPIRING_SOON", "EXPIRED"]).optional(),
    category: z.enum(CATEGORIES as [string, ...string[]]).optional(),
  }),
  get_expiring_warranties: z.object({
    withinDays: z.number().int().min(1).max(3650),
  }),
  get_product_details: z.object({ productId: z.string().min(1) }),
  create_reminder: z.object({
    productId: z.string().min(1),
    daysBefore: z.number().int().min(1).max(365),
  }),
  create_product: z.object({}).passthrough(),
};

async function executeTool(
  name: string,
  rawInput: unknown,
  userId: string,
): Promise<unknown> {
  const schema = toolInputSchemas[name];
  if (!schema) return { error: `Unknown tool: ${name}` };
  const parsed = schema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: "Invalid tool input", details: parsed.error.message };
  }
  const input = parsed.data as Record<string, unknown> & {
    query?: string;
    status?: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
    category?: string;
    withinDays?: number;
    productId?: string;
    daysBefore?: number;
  };

  switch (name) {
    case "search_products":
      return productService.searchProducts(userId, {
        query: input.query,
        status: input.status,
        category: input.category,
      });

    case "get_expiring_warranties":
      return productService.getExpiringWarranties(userId, input.withinDays!);

    case "get_product_details": {
      const product = await productService.getProductById(
        userId,
        input.productId!,
        { include: true },
      );
      return product ?? { error: "Product not found" };
    }

    case "create_reminder": {
      const result = await reminderService.createReminder(
        userId,
        input.productId!,
        input.daysBefore!,
      );
      if (result.status === "not_found") return { error: "Product not found" };
      if (result.status === "expired")
        return { error: "This warranty has already expired" };
      return result.reminder;
    }

    case "create_product":
      try {
        // createProduct validates with its own Zod schema before persisting.
        return await productService.createProduct(
          userId,
          input as Parameters<typeof productService.createProduct>[1],
        );
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
  // Set when the agent creates a product, for the post-add UI actions.
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
