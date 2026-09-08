import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import POSHeader from "../../components/pos/POSHeader";
import CategorySidebar from "../../components/pos/CategorySidebar";
import CustomerTabs from "../../components/pos/CustomerTabs";
import ProductGrid from "../../components/pos/ProductGrid";
import CartPanel from "../../components/pos/CartPanel";
import InvoiceModal from "../../components/sales/InvoiceModal";
import { useCart } from "../../context/CartContext";

const POSPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  const [invoiceSaleId, setInvoiceSaleId] = useState(null);

  const initializedRef = useRef(false);

  const {
    customers,
    activeIndex,
    setActiveIndex,
    activeCart,
    updateActiveCart,
    handleIncrement,
    handleDecrement,
    handleRemoveItem,
    handleLaborChange,
    handlePaidChange,
    handleClear,
    handleAddCustomer,
    scrollStart,
    setScrollStart,
    saving,
    setSaving,
  } = useCart();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingProducts(true);
        const [pagesRes, categoriesRes, productsRes] = await Promise.all([
          api.get("/pages").catch(() => ({ data: [] })),
          api.get("/categories").catch(() => ({ data: { categories: [] } })),
          api.get("/product").catch(() => api.get("/products")).catch(() => ({ data: [] })),
        ]);

        const fetchedPages = Array.isArray(pagesRes.data?.pages)
          ? pagesRes.data.pages
          : Array.isArray(pagesRes.data)
          ? pagesRes.data
          : [];
        setPages(fetchedPages);
        if (fetchedPages.length > 0) {
          const firstId = fetchedPages[0].id ?? fetchedPages[0]._id ?? fetchedPages[0].page_id;
          setSelectedPageId(firstId);
        }

        const fetchedCategories = Array.isArray(categoriesRes.data?.categories)
          ? categoriesRes.data.categories
          : Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : [];
          const activeCategories = fetchedCategories.filter(
            (cat) => Number(cat.is_delete) !== 1 && cat.status?.toLowerCase() !== "inactive"
          );
          setCategories(activeCategories);

        // If we arrived here from a category click on another page (Course/Expense/Returns),
        // switch to that category's page and select it directly.
        const incomingCategoryId = location.state?.categoryId;
        if (incomingCategoryId !== undefined && incomingCategoryId !== null) {
          const matchedCategory = activeCategories.find(
            (cat) => String(cat.id) === String(incomingCategoryId)
          );
          if (matchedCategory) {
            const catPageId = matchedCategory.page_id ?? matchedCategory.pageId ?? matchedCategory.page;
            if (catPageId !== undefined && catPageId !== null) {
              setSelectedPageId(catPageId);
            }
          }
          setSelectedCategoryId(incomingCategoryId);
        }

        const rawProducts = Array.isArray(productsRes.data?.products)
          ? productsRes.data.products
          : Array.isArray(productsRes.data)
          ? productsRes.data
          : [];
        setProducts(rawProducts);
      } catch (error) {
        console.error("Error fetching POS data:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      // Skip the reset on the very first render/page selection so an incoming
      // category (from Course/Expense/Returns) isn't wiped out immediately.
      initializedRef.current = true;
      return;
    }
    setSelectedCategoryId(null);
  }, [selectedPageId]);

  const refreshProducts = async () => {
    try {
      const res = await api.get("/product");
      const rawProducts = Array.isArray(res.data?.products)
        ? res.data.products
        : Array.isArray(res.data)
        ? res.data
        : [];
      setProducts(rawProducts);
    } catch (error) {
      console.error("Error refreshing products:", error);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!selectedPageId) return categories;
    return categories.filter((cat) => {
      const catPageId = cat.page_id ?? cat.pageId ?? cat.page;
      return String(catPageId) === String(selectedPageId);
    });
  }, [categories, selectedPageId]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const isActive = p.status ? p.status.toLowerCase() !== "inactive" : true;

      let matchesCategory = true;
      if (selectedCategoryId) {
        matchesCategory = String(p.category_id) === String(selectedCategoryId);
      }

      const matchesSearch = p.name ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;

      return isActive && matchesCategory && matchesSearch;
    });
  }, [products, selectedCategoryId, searchTerm]);

  const handleAddToCart = (product) => {
    updateActiveCart((cart) => {
      const existing = cart.items.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.qty >= product.stock_quantity) return cart;
        return {
          ...cart,
          items: cart.items.map((i) =>
            i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return {
        ...cart,
        items: [
          ...cart.items,
          {
            product_id: product.id,
            name: product.name,
            price: product.selling_price,
            qty: 1,
            maxStock: product.stock_quantity,
          },
        ],
      };
    });
  };

  // POSPage.jsx - Inside POSPage component

const handleSaveBill = async () => {
  if (activeCart.items.length === 0) return null;

  const subtotal = activeCart.items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const labor = Number(activeCart.laborCharges) || 0;
  
  // Default paid amount to total if paid_amount was removed or left blank
  const paid = Number(activeCart.paidAmount) || (subtotal + labor);

  setSaving(true);
  try {
    const res = await api.post("/sales", {
      items: activeCart.items.map((i) => ({
        product_id: i.product_id,
        qty: i.qty,
        price: i.price,
      })),
      labor_charges: labor,
      paid_amount: paid,
    });
    updateActiveCart((cart) => ({
      ...cart,
      invoiceNo: res.data.invoice_no,
      saleId: res.data.sale_id,
    }));

    await refreshProducts();
    return res.data;
  } catch (error) {
    console.error("Error saving bill:", error);
    alert(error?.response?.data?.message || "Failed to save bill.");
    return null;
  } finally {
    setSaving(false);
  }
};

  const handlePrint = async () => {
    if (activeCart.items.length === 0) return;

    let saleId = activeCart.saleId;
    if (!saleId) {
      const result = await handleSaveBill();
      if (!result) return;
      saleId = result.sale_id;
    }

    setInvoiceSaleId(saleId);
  };

  const handleReturn = () => {
    navigate("/pos/returns");
  };

  return (
    <div className="h-screen w-full bg-[#F8F9FA] flex flex-col overflow-hidden">
      <POSHeader
        pages={pages}
        selectedPageId={selectedPageId}
        onSelectPage={setSelectedPageId}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuClick={() => setMobileCategoryOpen(true)}
      />

      <div className="flex flex-1 relative overflow-hidden">
        <CategorySidebar
          categories={filteredCategories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          mobileOpen={mobileCategoryOpen}
          onClose={() => setMobileCategoryOpen(false)}
        />

        <main className="flex-1 p-3 sm:p-4 flex flex-col gap-3 overflow-hidden">
          <CustomerTabs
            customers={customers}
            activeIndex={activeIndex}
            onSelectTab={setActiveIndex}
            onAddCustomer={handleAddCustomer}
            scrollStart={scrollStart}
            onScrollPrev={() => setScrollStart((s) => Math.max(0, s - 1))}
            onScrollNext={() =>
              setScrollStart((s) => Math.min(customers.length - 3, s + 1))
            }
          />

          <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0 items-stretch overflow-hidden">
            <div className="flex-1 min-w-0 max-h-[calc(100vh-140px)] overflow-y-auto pr-2">
              <ProductGrid
                products={filteredProducts}
                loading={loadingProducts}
                onAddToCart={handleAddToCart}
              />
            </div>

            <div className="w-full xl:w-[360px] shrink-0 max-h-[calc(100vh-140px)] flex flex-col">
              <CartPanel
                cart={activeCart}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onRemoveItem={handleRemoveItem}
                onLaborChange={handleLaborChange}
                onPaidChange={handlePaidChange}
                onSaveBill={handleSaveBill}
                onPrint={handlePrint}
                onClear={handleClear}
                onReturn={handleReturn}
                saving={saving}
              />
            </div>
          </div>
        </main>
      </div>

      {invoiceSaleId && (
        <InvoiceModal
          saleId={invoiceSaleId}
          onClose={() => setInvoiceSaleId(null)}
        />
      )}
    </div>
  );
};

export default POSPage;