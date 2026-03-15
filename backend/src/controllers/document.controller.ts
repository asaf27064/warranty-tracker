import { Request, Response } from "express";
import prisma from "../config/db";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { r2Client, R2_BUCKET } from "../config/r2";

export const getAllDocs = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const productId = req.params.productId as string;

    const product = await prisma.product.findFirst({
      where: { id: productId, userId: req.user!.id },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const docs = await prisma.document.findMany({
      where: { productId },
    });

    return res.status(200).json(docs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch docs" });
  }
};

export const uploadDoc = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const productId = req.params.productId as string;

    // verify product belongs to user
    const product = await prisma.product.findFirst({
      where: { id: productId, userId: req.user!.id },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // upload to R2
    const ext = file.originalname.split(".").pop() || "bin";
    const fileKey = `documents/${req.user!.id}/${crypto.randomUUID()}.${ext}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const fileUrl = `${process.env.PUBLIC_FILES_URL}/${fileKey}`;

    // save to DB
    const newDoc = await prisma.document.create({
      data: {
        productId,
        fileName: file.originalname,
        fileUrl,
        fileKey,
        fileSize: file.size,
        mimeType: file.mimetype,
        docType: req.body.docType || "OTHER",
      },
    });

    return res.status(201).json(newDoc);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to upload document" });
  }
};

export const deleteDoc = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ error: "id parameter is required" });
    }

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { product: { select: { userId: true } } },
    });

    if (!doc || doc.product.userId !== req.user!.id) {
      return res.status(404).json({ error: "Document not found" });
    }

    await r2Client
      .send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: doc.fileKey }))
      .catch(() => {});
    await prisma.document.delete({ where: { id } });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete doc" });
  }
};
