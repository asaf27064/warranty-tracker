import { Request, Response } from "express";
import type Anthropic from "@anthropic-ai/sdk";
import { extractProductService } from "../services/ai.service";
import { runAgent } from "../services/agent.service";
import prisma from "../config/db";

export const extractProduct = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const text = req.body.text as string;

    const product = await extractProductService(text);

    return res.status(200).json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to extract product" });
  }
};

export const chat = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = req.user.id;
    const message = req.body.message as string;
    let conversationId = req.body.conversationId as string | undefined;

    // Load or create the conversation (scoped to this user)
    let history: Anthropic.MessageParam[] = [];
    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      history = conversation.messages.map((m) => ({
        role: m.role === "USER" ? "user" : "assistant",
        content: m.content,
      }));
    } else {
      const conversation = await prisma.conversation.create({
        data: { userId },
      });
      conversationId = conversation.id;
    }

    const reply = await runAgent(userId, history, message);

    // Persist both turns
    await prisma.message.createMany({
      data: [
        { conversationId, role: "USER", content: message },
        { conversationId, role: "ASSISTANT", content: reply },
      ],
    });

    return res.status(200).json({ conversationId, reply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to process chat" });
  }
};
