import type Anthropic from "@anthropic-ai/sdk";
import prisma from "../config/db";

// Persistence for the chat agent's conversations, kept out of the controller.

// Text-only history, used by the agent to replay context (it doesn't need
// the product objects, only the conversation text).
export async function getConversationHistory(
  userId: string,
  conversationId: string,
): Promise<Anthropic.MessageParam[] | null> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return null;

  return conversation.messages.map((m) => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
  }));
}

// Rich history for the frontend: each message carries the product cards that
// were shown with it, re-fetched fresh (so status is current) and scoped to
// the user. Deleted products are simply omitted.
export async function getConversationForClient(
  userId: string,
  conversationId: string,
) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return null;

  const allIds = [
    ...new Set(conversation.messages.flatMap((m) => m.productIds)),
  ];
  const products = allIds.length
    ? await prisma.product.findMany({ where: { userId, id: { in: allIds } } })
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));

  return conversation.messages.map((m) => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
    products: m.productIds
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p)),
  }));
}

export async function createConversation(userId: string) {
  const conversation = await prisma.conversation.create({ data: { userId } });
  return conversation.id;
}

export async function saveTurn(
  conversationId: string,
  userMessage: string,
  assistantReply: string,
  productIds: string[] = [],
) {
  await prisma.message.createMany({
    data: [
      { conversationId, role: "USER", content: userMessage },
      {
        conversationId,
        role: "ASSISTANT",
        content: assistantReply,
        productIds,
      },
    ],
  });
}
