import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import {
  Plus,
  Package,
  Loader2,
  LayoutGrid,
  List,
  CheckSquare,
  Trash2,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { FaFileCsv } from "react-icons/fa";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useInfiniteProducts,
  useProductStats,
} from "../hooks/useProductsQuery";
import { useProducts } from "../hooks/useProducts";
import { toCsv, downloadCsv } from "../lib/csv";
import { toast } from "sonner";
import ProductForm from "../components/ProductForm";
import ConfirmDialog from "../components/ConfirmDialog";
import { Skeleton } from "../components/ui/skeleton";
import ProductFilters from "../components/ProductFilters";
import DashboardStats from "../components/DashboardStats";
import ProductCard from "../components/ProductCard";
import ProductList from "../components/ProductList";
import Sidebar from "../components/Sidebar";
import ActiveFilters from "../components/ActiveFilters";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { bulkDeleteProducts, fetchForExport } = useProducts();
  const { updatePreferences } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("wtSidebarCollapsed");
    // On phones the sidebar is an overlay drawer, so start it closed.
    if (stored === null) return window.innerWidth < 768;
    return stored === "1";
  });

  const toggleSidebar = () =>
    setSidebarCollapsed((c) => {
      localStorage.setItem("wtSidebarCollapsed", c ? "0" : "1");
      return !c;
    });

  const closeSidebar = () => {
    localStorage.setItem("wtSidebarCollapsed", "1");
    setSidebarCollapsed(true);
  };

  // On mobile the sidebar overlays the page, so close it after a choice.
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) closeSidebar();
  };

  const [view, setView] = useState<"cards" | "list">(() =>
    localStorage.getItem("wtView") === "list" ? "list" : "cards",
  );
  const changeView = (v: "cards" | "list") => {
    setView(v);
    localStorage.setItem("wtView", v);
    updatePreferences({ defaultView: v }).catch(() => {});
  };

  const [statsHidden, setStatsHidden] = useState(
    () => localStorage.getItem("wtStatsHidden") === "1",
  );
  const toggleStats = () =>
    setStatsHidden((h) => {
      localStorage.setItem("wtStatsHidden", h ? "0" : "1");
      return !h;
    });

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

  // Same filter params the list query sends, for the export endpoint.
  const exportParams = () => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (activeFilter !== "ALL") params.status = activeFilter;
    if (categoryFilter !== "ALL") params.category = categoryFilter;
    params.sort = sortField;
    params.dir = sortDir;
    return params;
  };

  const exportAll = async () => {
    setExporting(true);
    try {
      const all = await fetchForExport(exportParams());
      if (all.length === 0) {
        toast.info("No products to export");
        return;
      }
      downloadCsv("warranties.csv", toCsv(all));
      toast.success(`Exported ${all.length} product${all.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const exportSelected = () => {
    const rows = products.filter((p) => selectedIds.has(p.id));
    if (rows.length === 0) return;
    downloadCsv("warranties-selected.csv", toCsv(rows));
    toast.success(`Exported ${rows.length} product${rows.length === 1 ? "" : "s"}`);
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allLoadedSelected =
    products.length > 0 && products.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = () =>
    setSelectedIds(
      allLoadedSelected ? new Set() : new Set(products.map((p) => p.id)),
    );

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    try {
      const deleted = await bulkDeleteProducts(ids);
      toast.success(`Deleted ${deleted} product${deleted === 1 ? "" : "s"}`);
      exitSelectMode();
      await refreshAfterMutation();
    } catch (e) {
      toast.error("Failed to delete products");
      throw e;
    }
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

      <div className="relative flex flex-1 overflow-hidden">
        {!sidebarCollapsed && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
        <Sidebar
          collapsed={sidebarCollapsed}
          stats={stats}
          statusFilter={activeFilter}
          setStatusFilter={(v) => {
            setActiveFilter(v);
            closeSidebarOnMobile();
          }}
          categoryFilter={categoryFilter}
          setCategoryFilter={(v) => {
            setCategoryFilter(v);
            closeSidebarOnMobile();
          }}
          onOpenChat={() => {
            openChat();
            closeSidebarOnMobile();
          }}
        />

        <main className="nice-scroll flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-6">
            <div className="flex justify-end">
              <button
                onClick={toggleStats}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {statsHidden ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Show summary
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Hide summary
                  </>
                )}
              </button>
            </div>
            {!statsHidden && <DashboardStats stats={stats} />}

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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={exportAll}
                  disabled={exporting}
                >
                  <FaFileCsv className="h-4 w-4 text-emerald-600" />
                  {exporting ? "Exporting..." : "Export all"}
                </Button>
                <Button
                  variant={selectMode ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    selectMode ? exitSelectMode() : setSelectMode(true)
                  }
                >
                  <CheckSquare className="h-4 w-4" />
                  Select
                </Button>
                <ProductFilters
                  value={`${sortField}:${sortDir}`}
                  onChange={(v) => {
                    const [f, d] = v.split(":");
                    setSortField(f);
                    setSortDir(d);
                  }}
                />
              </div>
            </motion.div>

            <ActiveFilters
              search={debouncedSearch}
              status={activeFilter}
              category={categoryFilter}
              onClearSearch={() => setSearchQuery("")}
              onClearStatus={() => setActiveFilter("ALL")}
              onClearCategory={() => setCategoryFilter("ALL")}
              onClearAll={() => {
                setSearchQuery("");
                setActiveFilter("ALL");
                setCategoryFilter("ALL");
              }}
            />

            {selectMode && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {allLoadedSelected ? "Deselect all" : "Select all"}
                </button>
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={selectedIds.size === 0}
                    onClick={exportSelected}
                  >
                    <FaFileCsv className="h-4 w-4 text-emerald-600" />
                    Export selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                    disabled={selectedIds.size === 0}
                    onClick={() => setBulkDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={exitSelectMode}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {view === "cards" && (
            <motion.div
              className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {isLoading
                ? [...Array(6)].map((_, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-lg border border-border bg-card"
                    >
                      <Skeleton className="h-44 w-full rounded-none" />
                      <div className="space-y-2 p-4">
                        <Skeleton className="h-4 w-28" />
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
                        selectable={selectMode}
                        selected={selectedIds.has(product.id)}
                        onClick={() =>
                          selectMode
                            ? toggleSelect(product.id)
                            : navigate(`/product/${product.id}`)
                        }
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
                  selectable={selectMode}
                  selectedIds={selectedIds}
                  allSelected={allLoadedSelected}
                  onToggleSelectAll={toggleSelectAll}
                  onRowClick={(p) =>
                    selectMode
                      ? toggleSelect(p.id)
                      : navigate(`/product/${p.id}`)
                  }
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

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete selected products?"
        description={
          <>
            This permanently deletes {selectedIds.size} product
            {selectedIds.size === 1 ? "" : "s"} and their documents and
            reminders. This can't be undone.
          </>
        }
        confirmLabel={`Delete ${selectedIds.size}`}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
};

export default Dashboard;
