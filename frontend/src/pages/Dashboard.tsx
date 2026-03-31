import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldX,
  Search,
  Plus,
  Package,
  Calendar,
  Store,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useProducts } from "../hooks/useProducts";
import ProductForm from "../components/ProductForm";
import { Skeleton } from "../components/ui/skeleton";

const Dashboard = () => {
  const { products, loading, getAllProducts } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const navigate = useNavigate();

  const stats = {
    active: products.filter((p) => p.status === "ACTIVE").length,
    expiringSoon: products.filter((p) => p.status === "EXPIRING_SOON").length,
    expired: products.filter((p) => p.status === "EXPIRED").length,
  };

  const statusConfig = {
    ACTIVE: { color: "bg-emerald-500/10 text-emerald-500", label: "Active" },
    EXPIRING_SOON: {
      color: "bg-amber-500/10 text-amber-500",
      label: "Expiring Soon",
    },
    EXPIRED: { color: "bg-red-500/10 text-red-500", label: "Expired" },
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.store?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "ALL" || p.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const filters = [
    { key: "ALL", label: "All" },
    { key: "ACTIVE", label: "Active" },
    { key: "EXPIRING_SOON", label: "Expiring" },
    { key: "EXPIRED", label: "Expired" },
  ];

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
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              count: stats.active,
              label: "Active",
              color: "emerald",
              delay: 0.1,
            },
            {
              icon: AlertTriangle,
              count: stats.expiringSoon,
              label: "Expiring Soon",
              color: "amber",
              delay: 0.2,
            },
            {
              icon: ShieldX,
              count: stats.expired,
              label: "Expired",
              color: "red",
              delay: 0.3,
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stat.delay }}
            >
              <Card className="border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-700">
                <div className="flex items-center gap-4">
                  <div className={`rounded-xl bg-${stat.color}-500/10 p-3`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">
                      {stat.count}
                    </p>
                    <p className="text-sm text-zinc-400">{stat.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search + Filter + Add Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-zinc-800 bg-zinc-900 pl-10 text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeFilter === f.key
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-700 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Add Product Button */}
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setShowAddProduct(true)}
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </motion.div>

        {/* Product Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            : filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                >
                  <Card
                    className="group cursor-pointer border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-900/50"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {/* Status Badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                        {product.picture ? (
                          <img
                            src={product.picture}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                            <Package className="h-5 w-5 text-zinc-400" />
                          </div>
                        )}
                      </div>
                      <Badge
                        className={`${statusConfig[product.status as keyof typeof statusConfig].color} border-0`}
                      >
                        {
                          statusConfig[
                            product.status as keyof typeof statusConfig
                          ].label
                        }
                      </Badge>
                    </div>

                    {/* Product Info */}
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        {product.category}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Store className="h-3.5 w-3.5" />
                        <span>{product.store}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          Expires{" "}
                          {new Date(
                            product.warrantyExpiry,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-full rounded-full ${
                            product.status === "ACTIVE"
                              ? "bg-emerald-500"
                              : product.status === "EXPIRING_SOON"
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width:
                              product.status === "ACTIVE"
                                ? "75%"
                                : product.status === "EXPIRING_SOON"
                                  ? "90%"
                                  : "100%",
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
        </div>

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
