import { useProducts } from "../hooks/useProducts";
import { useDocuments } from "../hooks/useDocuments";
import { useReminders } from "../hooks/useReminders";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Product } from "../types";

const ProductDetails = () => {
  const { getProductById, updateProduct, deleteProduct } = useProducts();
  //const { documents, getAllDocs, uploadDoc, deleteDoc } = useDocuments();
  //const { reminders, getAllReminders, createReminder, deleteReminder } =
    useReminders();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch {
        console.error("Product not found");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return null;
  if (!product) return <div>Product not found</div>;

  return (
    <main>hi</main>
  )
};

export default ProductDetails;
