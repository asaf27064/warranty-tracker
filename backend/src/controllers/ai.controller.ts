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

// The add message the user is confirming. Only valid when the most recent
// assistant turn was a local proposal ("Here's what I understood"), so a bare
// "yes" after anything else (a created product, an agent question) doesn't
// re-create a stale product from earlier in the conversation.
const pendingProposalAddText = (
  history: Anthropic.MessageParam[],
): string | null => {
  let lastAssistant = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "assistant") {
      lastAssistant = i;
      break;
    }
  }
  if (lastAssistant === -1) return null;
  const content = history[lastAssistant].content;
  const text = typeof content === "string" ? content : "";
  if (!text.startsWith("Here's what I understood")) return null;
  for (let j = lastAssistant - 1; j >= 0; j--) {
    const u = history[j];
    if (u.role === "user" && typeof u.content === "string") return u.content;
  }
  return null;
};

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

    // Local-first, confirm-first: propose a parsed add, create it on "yes",
    // send corrections and anything else to the agent.
    const trimmed = message.trim();
    const isAffirmation =
      /^(y|ya|ye+a*h+|ye+a+|yep+|yup+|ye+s+|sure|ok|okay|kk?|fine|correct|confirm|absolutely|please\s+do|go\s+ahead|go\s+for\s+it|add\s+it|create\s+it|save\s+it|do\s+it)\b/i.test(
        trimmed,
      ) &&
      // not a correction like "yes but change the date"
      !/\b(no|not|don'?t|change|actually|wrong|instead|but|edit)\b/i.test(
        trimmed,
      );

    if (isAffirmation) {
      const prev = pendingProposalAddText(history);
      const parsed = prev ? parseProductMessage(prev) : null;
      if (parsed) {
        try {
          const product = await productService.createProduct(userId, parsed);
          const expiry = new Date(product.warrantyExpiry).toLocaleDateString(
            "en-GB",
          );
          const reply = `Added "${product.name}", warranty expires ${expiry}. Open the card to review or edit.`;
          await conversationService.saveTurn(conversationId, message, reply, [
            product.id,
          ]);
          return res.status(200).json({
            conversationId,
            reply,
            products: [product],
            createdProductId: product.id,
          });
        } catch (err) {
          console.error("Local add-product failed, falling back to agent:", err);
        }
      }
    } else {
      const parsed = parseProductMessage(message);
      if (parsed) {
        const exp = new Date(parsed.purchaseDate);
        exp.setMonth(exp.getMonth() + parsed.warrantyMonths);
        const prettyCat =
          parsed.category.charAt(0) +
          parsed.category.slice(1).toLowerCase().replace(/_/g, " ");
        const purchase = new Date(parsed.purchaseDate).toLocaleDateString(
          "en-GB",
        );
        const reply =
          "Here's what I understood:\n" +
          `- Name: ${parsed.name}\n` +
          `- Category: ${prettyCat}\n` +
          (parsed.store ? `- Store: ${parsed.store}\n` : "") +
          `- Purchased: ${purchase}\n` +
          `- Warranty: ${parsed.warrantyMonths} months (expires ${exp.toLocaleDateString("en-GB")})\n\n` +
          "Reply **yes** to add it, or tell me what to change.";
        await conversationService.saveTurn(conversationId, message, reply, []);
        return res.status(200).json({ conversationId, reply, products: [] });
      }
    }

    const { reply, products, createdProductId } = await runAgent(
      userId,
      history,
      message,
    );
    const productIds = (products as { id: string }[]).map((p) => p.id);

    // Persist both turns (assistant message keeps the ids of the cards shown).
    await conversationService.saveTurn(
      conversationId,
      message,
      reply,
      productIds,
    );

    return res
      .status(200)
      .json({ conversationId, reply, products, createdProductId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to process chat" });
  }
};
