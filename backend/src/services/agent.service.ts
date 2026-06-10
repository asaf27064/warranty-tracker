import type Anthropic from "@anthropic-ai/sdk";
import { client } from "../config/anthropic";
import prisma from "../config/db";

const MAX_ITERATIONS = 5;

const SYSTEM_PROMPT = `You are a helpful warranty assistant inside a warranty-tracking app.
You help the user understand and manage their product warranties.
Use the provided tools to look up real data — never invent products, dates, or warranty details.
Today's date is ${new Date().toISOString().split("T")[0]}.
Always reply in the same language the user writes in.
When replying in Hebrew, refer to a product warranty as "אחריות" (never "ערבות").
Be concise and friendly. When you mention a product, include its warranty expiry date.`;

// --- Tool definitions exposed to the model ---
export const agentTools: Anthropic.Tool[] = [
  {
    name: "search_products",
    description:
      "Search the user's products by optional name/store text, status, or category.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text to match in name or store." },
        status: {
          type: "string",
          enum: ["ACTIVE", "EXPIRING_SOON", "EXPIRED"],
        },
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
];

async function executeTool(
  name: string,
  input: any,
  userId: string,
): Promise<unknown> {
  switch (name) {
    case "search_products": {
      const query = input.query?.trim();
      return prisma.product.findMany({
        where: {
          userId,
          ...(input.status ? { status: input.status } : {}),
          ...(query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { store: { contains: query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
      });
    }

    case "get_expiring_warranties": {
      const days = Number(input.withinDays) || 30;
      const until = new Date();
      until.setDate(until.getDate() + days);
      return prisma.product.findMany({
        where: { userId, warrantyExpiry: { gte: new Date(), lte: until } },
        orderBy: { warrantyExpiry: "asc" },
      });
    }

    case "get_product_details": {
      const product = await prisma.product.findFirst({
        where: { id: input.productId, userId },
        include: { documents: true, reminders: true },
      });
      return product ?? { error: "Product not found" };
    }

    case "create_reminder": {
      // verify ownership before creating
      const product = await prisma.product.findFirst({
        where: { id: input.productId, userId },
      });
      if (!product) return { error: "Product not found" };

      const remindAt = new Date(product.warrantyExpiry);
      remindAt.setDate(remindAt.getDate() - Number(input.daysBefore));
      remindAt.setHours(8, 0, 0, 0);

      const reminder = await prisma.reminder.create({
        data: { remindAt, productId: product.id },
      });
      return reminder;
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// --- The agent loop ---
export async function runAgent(
  userId: string,
  history: Anthropic.MessageParam[],
  userText: string,
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: userText },
  ];

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
    return textBlock && textBlock.type === "text" ? textBlock.text : "";
  }

  return "Sorry, I couldn't complete that request. Please try rephrasing.";
}
