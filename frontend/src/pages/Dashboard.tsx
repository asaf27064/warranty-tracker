import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Plus, Package, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useInfiniteProducts,
  useProductStats,
} from "../hooks/useProductsQuery";
import ProductForm from "../components/ProductForm";
import { Skeleton } from "../components/ui/skeleton";
import ProductFilters from "../components/ProductFilters";
import DashboardStats from "../components/DashboardStats";
import ProductCard from "../components/ProductCard";
import Sidebar from "../components/Sidebar";
import ChatWidget from "../components/ChatWidget";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("wtSidebarCollapsed") === "1",
  );

  const toggleSidebar = () =>
    setSidebarCollapsed((c) => {
      localStorage.setItem("wtSidebarCollapsed", c ? "0" : "1");
      return !c;
    });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filters = {
    search: debouncedSearch,
    status: activeFilter,
    category: categoryFilter,
    sort: sortBy,
  };

  const hasActiveFilters =
    debouncedSearch !== "" ||
    activeFilter !== "ALL" ||
    categoryFilter !== "ALL";

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteProducts(filters);
  const { data: statsData } = useProductStats();
  const stats = statsData ?? { active: 0, expiringSoon: 0, expired: 0 };

  const products = data?.pages.flatMap((p) => p.items) ?? [];

  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refreshAfterMutation = async () => {
    await queryClient.invalidateQueries({ queryKey: ["products"] });
    await queryClient.invalidateQueries({ queryKey: ["product-stats"] });
  };

  const openChat = () => window.dispatchEvent(new CustomEvent("wt-open-chat"));

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar
        onToggleSidebar={toggleSidebar}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onAdd={() => setShowAddProduct(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          stats={stats}
          statusFilter={activeFilter}
          setStatusFilter={setActiveFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          onOpenChat={openChat}
        />

        <main className="nice-scroll flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-6">
            <DashboardStats
              stats={stats}
              statusFilter={activeFilter}
              setStatusFilter={setActiveFilter}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex items-center justify-end"
            >
              <ProductFilters sortBy={sortBy} setSortBy={setSortBy} />
            </motion.div>

            <motion.div
              className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {isLoading
                ? [...Array(6)].map((_, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-border bg-card p-5"
                    >
                      <div className="flex items-start justify-between">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-5 w-20 rounded" />
                      </div>
                      <div className="mt-4 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="mt-4 space-y-2">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                      <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
                    </div>
                  ))
                : products.map((product) => (
                    <motion.div key={product.id} variants={itemVariants}>
                      <ProductCard
                        product={product}
                        onClick={() => navigate(`/product/${product.id}`)}
                      />
                    </motion.div>
                  ))}
            </motion.div>

            {!isLoading && products.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-16 flex flex-col items-center text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                {hasActiveFilters ? (
                  <>
                    <p className="mt-4 text-lg font-medium text-foreground">
                      No products match your filters
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try adjusting your search, status, or category.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveFilter("ALL");
                        setCategoryFilter("ALL");
                      }}
                    >
                      Clear filters
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-lg font-medium text-foreground">
                      No products yet
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add your first product to start tracking warranties.
                    </p>
                    <Button
                      className="mt-4 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => setShowAddProduct(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add your first product
                    </Button>
                  </>
                )}
              </motion.div>
            )}

            <div ref={loadMoreRef} className="mt-6 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
            </div>

            <ProductForm
              open={showAddProduct}
              onClose={() => setShowAddProduct(false)}
              onSuccess={async () => {
                await refreshAfterMutation();
                setShowAddProduct(false);
              }}
            />
          </div>
        </main>
      </div>

      <ChatWidget />
    </div>
  );
};

export default Dashboard;
