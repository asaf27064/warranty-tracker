import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Plus, Package, Loader2, LayoutGrid, List } from "lucide-react";
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
import ProductList from "../components/ProductList";
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
  const [sortField, setSortField] = useState("created");
  const [sortDir, setSortDir] = useState("desc");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("wtSidebarCollapsed") === "1",
  );

  const toggleSidebar = () =>
    setSidebarCollapsed((c) => {
      localStorage.setItem("wtSidebarCollapsed", c ? "0" : "1");
      return !c;
    });

  const [view, setView] = useState<"cards" | "list">(() =>
    localStorage.getItem("wtView") === "list" ? "list" : "cards",
  );
  const changeView = (v: "cards" | "list") => {
    setView(v);
    localStorage.setItem("wtView", v);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filters = {
    search: debouncedSearch,
    status: activeFilter,
    category: categoryFilter,
    sort: sortField,
    dir: sortDir,
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const hasActiveFilters =
    debouncedSearch !== "" ||
    activeFilter !== "ALL" ||
    categoryFilter !== "ALL";

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts(filters);
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
              className="mt-8 flex items-center justify-between gap-3"
            >
              <div className="flex overflow-hidden rounded-md border border-border">
                <button
                  onClick={() => changeView("cards")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${
                    view === "cards"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Cards
                </button>
                <button
                  onClick={() => changeView("list")}
                  className={`flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-sm ${
                    view === "list"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <List className="h-4 w-4" />
                  List
                </button>
              </div>
              {view === "cards" && (
                <ProductFilters
                  value={`${sortField}:${sortDir}`}
                  onChange={(v) => {
                    const [f, d] = v.split(":");
                    setSortField(f);
                    setSortDir(d);
                  }}
                />
              )}
            </motion.div>

            {view === "cards" && (
            <motion.div
              className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {isLoading
                ? [...Array(6)].map((_, index) => (
                    <div
                      key={index}
                      className="flex overflow-hidden rounded-lg border border-border bg-card"
                    >
                      <Skeleton className="h-[116px] w-24 shrink-0 rounded-none" />
                      <div className="flex-1 space-y-2 p-4">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-24" />
                        <div className="flex items-center justify-between pt-2">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
                      </div>
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
            )}

            {view === "list" && isLoading && (
              <div className="mt-6 flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {view === "list" && !isLoading && products.length > 0 && (
              <div className="mt-6">
                <ProductList
                  products={products}
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  onRowClick={(p) => navigate(`/product/${p.id}`)}
                />
              </div>
            )}

            {!isLoading && isError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-16 flex flex-col items-center text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mt-4 text-lg font-medium text-foreground">
                  Could not load products
                </p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {error instanceof Error
                    ? error.message
                    : "Please check that the backend is running and try again."}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => refetch()}
                >
                  Retry
                </Button>
              </motion.div>
            )}

            {!isLoading && !isError && products.length === 0 && (
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
