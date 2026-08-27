import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import POSHeader from "../../components/pos/POSHeader";
import CategorySidebar from "../../components/pos/CategorySidebar";
import CustomerTabs from "../../components/pos/CustomerTabs";
import ProductGrid from "../../components/pos/ProductGrid";
import CartPanel from "../../components/pos/CartPanel";

const createEmptyCustomer = (name) => ({
  id: `${Date.now()}-${Math.random()}`,
  name,
  items: [],
  laborCharges: "",
  paidAmount: "",
  invoiceNo: null,
  saleId: null,
});

const POSPage = () => {
  const navigate = useNavigate();

  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  const [customers, setCustomers] = useState([createEmptyCustomer("Customer 1")]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);
  const [saving, setSaving] = useState(false);

  const activeCart = customers[activeIndex];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingProducts(true);
        const [pagesRes, categoriesRes, productsRes] = await Promise.all([
          api.get("/pages").catch(() => ({ data: [] })),
          api.get("/categories").catch(() => ({ data: { categories: [] } })),
          api.get("/product").catch(() => api.get("/products")).catch(() => ({ data: [] })),
        ]);

        // Process Pages
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

        // Process Categories
        const fetchedCategories = Array.isArray(categoriesRes.data?.categories)
          ? categoriesRes.data.categories
          : Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : [];
        setCategories(fetchedCategories);

        // Process Products
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

  // Reset category selection whenever the page header changes
  useEffect(() => {
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

  // Filter Categories based on selected Page ID
  const filteredCategories = useMemo(() => {
    if (!selectedPageId) return categories;
    return categories.filter((cat) => {
      const catPageId = cat.page_id ?? cat.pageId ?? cat.page;
      return String(catPageId) === String(selectedPageId);
    });
  }, [categories, selectedPageId]);

  // Filter Products based on Category ID & Search Term
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

  const updateActiveCart = (updater) => {
    setCustomers((prev) =>
      prev.map((c, idx) => (idx === activeIndex ? updater(c) : c))
    );
  };

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

  const handleIncrement = (productId) => {
    updateActiveCart((cart) => ({
      ...cart,
      items: cart.items.map((i) =>
        i.product_id === productId && i.qty < i.maxStock ? { ...i, qty: i.qty + 1 } : i
      ),
    }));
  };

  const handleDecrement = (productId) => {
    updateActiveCart((cart) => ({
      ...cart,
      items: cart.items.map((i) =>
        i.product_id === productId ? { ...i, qty: Math.max(1, i.qty - 1) } : i
      ),
    }));
  };

  const handleRemoveItem = (productId) => {
    updateActiveCart((cart) => ({
      ...cart,
      items: cart.items.filter((i) => i.product_id !== productId),
    }));
  };

  const handleLaborChange = (value) => {
    updateActiveCart((cart) => ({ ...cart, laborCharges: value }));
  };

  const handlePaidChange = (value) => {
    updateActiveCart((cart) => ({ ...cart, paidAmount: value }));
  };

  const handleClear = () => {
    updateActiveCart((cart) => ({
      ...cart,
      items: [],
      laborCharges: "",
      paidAmount: "",
      invoiceNo: null,
      saleId: null,
    }));
  };

  const handleAddCustomer = () => {
    setCustomers((prev) => [...prev, createEmptyCustomer(`Customer ${prev.length + 1}`)]);
    setActiveIndex(customers.length);
  };

  const handleSaveBill = async () => {
    if (activeCart.items.length === 0) return;

    const subtotal = activeCart.items.reduce((sum, i) => sum + i.qty * i.price, 0);
    const labor = Number(activeCart.laborCharges) || 0;
    const paid = Number(activeCart.paidAmount) || 0;

    if (paid < (subtotal + labor)) {
      alert("Paid amount is less than total.");
      return;
    }

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
    if (!activeCart.invoiceNo) {
      const result = await handleSaveBill();
      if (!result) return;
    }
    window.print();
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
            {/* Scrollable Product Grid */}
            <div className="flex-1 min-w-0 max-h-[calc(100vh-140px)] overflow-y-auto pr-2">
              <ProductGrid
                products={filteredProducts}
                loading={loadingProducts}
                onAddToCart={handleAddToCart}
              />
            </div>

            {/* Cart Panel */}
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
    </div>
  );
};

export default POSPage;