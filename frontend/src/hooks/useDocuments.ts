import { useState } from "react";
import api from "../api/axios";
import type { Document } from "../types";

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const getAllDocs = async (productId: string) => {
    const res = await api.get(`/api/documents/product/${productId}`);
    setDocuments(res.data);
  };

  const uploadDoc = async (productId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    await api.post(`/api/documents/product/${productId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    await getAllDocs(productId);
  };

  const deleteDoc = async (docId: string, productId: string) => {
    await api.delete(`/api/documents/${docId}`);
    await getAllDocs(productId);
  };

  return { documents, getAllDocs, uploadDoc, deleteDoc };
};
