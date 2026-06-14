import { Request, Response } from "express";
import type Anthropic from "@anthropic-ai/sdk";
import {
  extractProductService,
  extractProductFromFile,
  isSupportedMediaType,
} from "../services/ai.service";
import { runAgent } from "../services/agent.service";
import * as conversationService from "../services/conversation.service";
import * as productService from "../services/product.service";
import { parseProductMessage } from "../services/productParser";
import {
  DOCUMENT_FILE_TYPES,
  validateUploadedFile,
} from "../utils/fileValidation";

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

export const extractProductImage = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const validation = validateUploadedFile(file, DOCUMENT_FILE_TYPES);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }
    const mediaType = validation.mimeType;
    if (!isSupportedMediaType(mediaType)) {
      return res.status(400).json({
        error: "Unsupported file type. Use an image (JPEG/PNG/GIF/WebP) or PDF.",
      });
    }

    const base64 = file.buffer.toString("base64");
    const product = await extractProductFromFile(base64, mediaType);

    return res.status(200).json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to extract product" });
  }
};

export const getConversation = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const id = req.params.id as string;
    const messages = await conversationService.getConversationForClient(
      req.user.id,
      id,
    );
    if (messages === null) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    return res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch conversation" });
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
      const loaded = await conversationService.getConversationHistory(
        userId,
        conversationId,
      );
      if (loaded === null) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      history = loaded;
    } else {
      conversationId = await conversationService.createConversation(userId);
    }

    // Local-first: a clean "I bought X, N year warranty" is created directly,
    // no Claude call. Anything the parser can't confidently handle (questions,
    // searches, vague adds) falls through to the agent below.
    const parsed = parseProductMessage(message);
    if (parsed) {
      try {
        const product = await productService.createProduct(userId, parsed);
        const expiry = new Date(product.warrantyExpiry).toLocaleDateString(
          "en-GB",
        );
        const reply = `Added "${product.name}". Warranty: ${product.warrantyMonths} months, expiring ${expiry}. Open the card to review or edit.`;
        await conversationService.saveTurn(conversationId, message, reply, [
          product.id,
        ]);
        return res
          .status(200)
          .json({ conversationId, reply, products: [product] });
      } catch (err) {
        // If the local create fails for any reason, let the agent handle it.
        console.error("Local add-product failed, falling back to agent:", err);
      }
    }

    const { reply, products } = await runAgent(userId, history, message);
    const productIds = (products as { id: string }[]).map((p) => p.id);

    // Persist both turns (assistant message keeps the ids of the cards shown).
    await conversationService.saveTurn(
      conversationId,
      message,
      reply,
      productIds,
    );

    return res.status(200).json({ conversationId, reply, products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to process chat" });
  }
};
