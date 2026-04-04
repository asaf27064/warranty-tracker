import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Plus, Package } from "lucide-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useState } from "react";
import { useProducts } from "../hooks/useProducts";
import ProductForm from "../components/ProductForm";
import { Skeleton } from "../components/ui/skeleton";
import ProductFilters from "../components/ProductFilters";
import DashboardStats from "../components/DashboardStats";
import ProductCard from "../components/ProductCard";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const { products, loading, getAllProducts } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [showAddProduct, setShowAddProduct] = useState(false);

  const stats = {
    active: products.filter((p) => p.status === "ACTIVE").length,
    expiringSoon: products.filter((p) => p.status === "EXPIRING_SOON").length,
    expired: products.filter((p) => p.status === "EXPIRED").length,
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.store?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = activeFilter === "ALL" || p.status === activeFilter;
    const matchesCategory =
      categoryFilter === "ALL" || p.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "expiring":
        return (
          new Date(a.warrantyExpiry).getTime() -
          new Date(b.warrantyExpiry).getTime()
        );
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-zinc-400">
            Track and manage your product warranties
          </p>
        </motion.div>

        {/* Stats Cards */}
        <DashboardStats
          stats={stats}
          statusFilter={activeFilter}
          setStatusFilter={setActiveFilter}
        />

        {/* Search + Filter + Add Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <ProductFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={activeFilter}
            setStatusFilter={setActiveFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
          {/* Add Product Button */}
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setShowAddProduct(true)}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </motion.div>

        {/* Product Grid */}
        <motion.div
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {loading
            ? [...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="border border-zinc-800 bg-zinc-900 p-5 rounded-lg"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-5 w-20 rounded" />
                  </div>

                  {/* Title */}
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>

                  {/* Progress */}
                  <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
                </div>
              ))
            : sortedProducts.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard
                    product={product}
                    onClick={() => navigate(`/product/${product.id}`)}
                  />
                </motion.div>
              ))}
        </motion.div>

        {/* Empty state */}
        {!loading && filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center"
          >
            <Package className="mx-auto h-12 w-12 text-zinc-600" />
            <p className="mt-4 text-lg text-zinc-400">No products found</p>
            <p className="mt-1 text-sm text-zinc-500">
              Try a different search or add a new product
            </p>
          </motion.div>
        )}
        <ProductForm
          open={showAddProduct}
          onClose={() => setShowAddProduct(false)}
          onSuccess={async () => {
            await getAllProducts();
            setShowAddProduct(false);
          }}
        />
      </main>
    </div>
  );
};

export default Dashboard;
