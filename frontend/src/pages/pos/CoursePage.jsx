import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import api from "../../services/api";
import POSHeader from "../../components/pos/POSHeader";
import PackageSidebar from "../../components/pos/PackageSidebar";
import CustomerTabs from "../../components/pos/CustomerTabs";
import CartPanel from "../../components/pos/CartPanel";
import InvoiceModal from "../../components/sales/InvoiceModal";
import { useCart } from "../../context/CartContext";

const CoursePage = () => {
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [courses, setCourses] = useState([]);
  const [stationeries, setStationeries] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [invoiceSaleId, setInvoiceSaleId] = useState(null);

  // Modal State for viewing Course/Stationery items before adding to bill
  const [viewingItem, setViewingItem] = useState(null);
  const [bundleProducts, setBundleProducts] = useState([]);
  const [bookSearch, setBookSearch] = useState("");
  const [loadingModal, setLoadingModal] = useState(false);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, stationeriesRes, packagesRes, productsRes] = await Promise.all([
        api.get("/courses").catch(() => ({ data: [] })),
        api.get("/stationary/all").catch(() => ({ data: [] })),
        api.get("/packages").catch(() => ({ data: { packages: [] } })),
        api.get("/product").catch(() => api.get("/products")).catch(() => ({ data: [] })),
      ]);

      const fetchedCourses = Array.isArray(coursesRes.data)
        ? coursesRes.data
        : coursesRes.data?.courses || [];
      setCourses(fetchedCourses);

      const fetchedStationeries = Array.isArray(stationeriesRes.data)
        ? stationeriesRes.data
        : stationeriesRes.data?.stationeries || [];
      setStationeries(fetchedStationeries);

      const fetchedPackages = Array.isArray(packagesRes.data?.packages)
        ? packagesRes.data.packages
        : Array.isArray(packagesRes.data)
          ? packagesRes.data
          : [];
      setPackages(fetchedPackages);

      const fetchedProducts = Array.isArray(productsRes.data?.products)
        ? productsRes.data.products
        : Array.isArray(productsRes.data)
          ? productsRes.data
          : [];
      setInventoryProducts(fetchedProducts);
    } catch (err) {
      console.error("Error fetching page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateBundlePrice = (bundleItem) => {
    if (bundleItem?.total_price !== undefined && bundleItem?.total_price !== null) {
      return Number(bundleItem.total_price);
    }
    if (bundleItem?.total !== undefined && bundleItem?.total !== null) {
      return Number(bundleItem.total);
    }
    if (bundleItem?.price !== undefined && bundleItem?.price !== null) {
      return Number(bundleItem.price);
    }
    if (Array.isArray(bundleItem?.products) && bundleItem.products.length > 0) {
      return bundleItem.products.reduce(
        (sum, p) => sum + Number(p.selling_price || p.price || 0),
        0
      );
    }
    return 0;
  };

  // Courses + Stationery merged into one flat list, tagged by _type.
  const packageItems = useMemo(() => {
    const merged = [
      ...courses.map((c) => ({ ...c, _type: "course" })),
      ...stationeries.map((s) => ({ ...s, _type: "stationery" })),
    ];

    if (selectedPackageId === null) return merged;

    return merged.filter(
      (item) => Number(item.package_id) === Number(selectedPackageId)
    );
  }, [courses, stationeries, selectedPackageId]);

  const filteredPackageItems = useMemo(() => {
    if (!searchTerm.trim()) return packageItems;
    const term = searchTerm.toLowerCase();
    return packageItems.filter((item) =>
      (item.title || item.name || "").toLowerCase().includes(term)
    );
  }, [packageItems, searchTerm]);

  // Open modal when clicking on a package card
  const handleOpenItemModal = async (item) => {
    const isStationery = item._type === "stationery";
    const itemId = isStationery
      ? item.stationary_id || item.id
      : item.course_id || item.id;

    setViewingItem(item);
    setLoadingModal(true);
    setBookSearch("");

    try {
      const endpoint = isStationery
        ? `/stationary/products/${itemId}`
        : `/courses/${itemId}/products`;

      const res = await api.get(endpoint);
      const rawProds = res.data?.products || res.data || [];

      const fetchedProds = rawProds.map((p) => ({
        ...p,
        product_id: p.product_id ?? p.id ?? p._id,
        quantity: Number(p.quantity ?? p.course_quantity ?? p.stationary_quantity ?? 1) || 1,
      }));

      setBundleProducts(fetchedProds);
    } catch (err) {
      console.error("Error loading bundle products:", err);
      setBundleProducts([]);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleAddProductToModal = (product) => {
    const prodId = product.product_id || product.id;
    if (bundleProducts.some((p) => (p.product_id || p.id) === prodId)) return;
    setBundleProducts((prev) => [
      ...prev,
      { ...product, product_id: prodId, quantity: 1 },
    ]);
  };

  const handleRemoveProductFromModal = (productId) => {
    setBundleProducts((prev) =>
      prev.filter((p) => (p.product_id || p.id) !== productId)
    );
  };

  const handleBundleQtyIncrement = (productId) => {
    setBundleProducts((prev) =>
      prev.map((p) => {
        const pid = p.product_id || p.id;
        if (pid !== productId) return p;
        const stock =
          p.stock_quantity !== undefined && p.stock_quantity !== null
            ? Number(p.stock_quantity)
            : Infinity;
        const currentQty = Number(p.quantity) || 1;
        if (currentQty >= stock) return p;
        return { ...p, quantity: currentQty + 1 };
      })
    );
  };

  const handleBundleQtyDecrement = (productId) => {
    setBundleProducts((prev) =>
      prev.map((p) => {
        const pid = p.product_id || p.id;
        if (pid !== productId) return p;
        const currentQty = Number(p.quantity) || 1;
        if (currentQty <= 1) return p;
        return { ...p, quantity: currentQty - 1 };
      })
    );
  };

  const modalTotal = useMemo(() => {
    return bundleProducts.reduce(
      (sum, p) =>
        sum + Number(p.selling_price || p.price || 0) * (Number(p.quantity) || 1),
      0
    );
  }, [bundleProducts]);

  // Handle adding all configured items from modal into cart
  const handleAddModalItemsToBill = () => {
    if (bundleProducts.length === 0) {
      alert("No items in bundle to add.");
      return;
    }

    updateActiveCart((cart) => {
      let updatedItems = [...cart.items];

      bundleProducts.forEach((p) => {
        const rawId = p.product_id ?? p.id ?? p._id;
        const productId =
          typeof rawId === "string"
            ? Number(rawId.replace(/\D/g, ""))
            : Number(rawId);

        if (!productId || isNaN(productId)) return;

        const bundleQty = Number(p.quantity) || 1;

        const existingIndex = updatedItems.findIndex(
          (i) => Number(i.product_id) === productId
        );

        if (existingIndex >= 0) {
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            qty: updatedItems[existingIndex].qty + bundleQty,
          };
        } else {
          updatedItems.push({
            product_id: productId,
            name: p.name,
            price: Number(p.selling_price || p.price || 0),
            qty: bundleQty,
            maxStock: p.stock_quantity ?? 999,
          });
        }
      });

      return { ...cart, items: updatedItems };
    });

    setViewingItem(null);
  };

  const handleSaveBill = async () => {
    if (activeCart.items.length === 0) return null;

    const calculatedTotal = activeCart.items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
      0
    );

    const rawPaid = Number(activeCart.paidAmount);
    const paid = rawPaid > 0 ? rawPaid : calculatedTotal;

    const sanitizedItems = activeCart.items
      .map((i) => {
        const rawId = i.product_id ?? i.id ?? i._id;
        const cleanId =
          typeof rawId === "string"
            ? Number(rawId.replace(/\D/g, ""))
            : Number(rawId);
        return {
          product_id: cleanId,
          qty: Number(i.qty) || 1,
          price: Number(i.price) || 0,
        };
      })
      .filter((i) => Boolean(i.product_id) && !isNaN(i.product_id));

    if (sanitizedItems.length === 0) {
      alert("Cart contains invalid products.");
      return null;
    }

    setSaving(true);
    try {
      const res = await api.post("/sales", {
        items: sanitizedItems,
        paid_amount: paid,
      });

      updateActiveCart((cart) => ({
        ...cart,
        invoiceNo: res.data.invoice_no,
        saleId: res.data.sale_id,
        paidAmount: paid,
      }));
      return res.data;
    } catch (error) {
      console.error("Error saving bill:", error);
      alert(error.response?.data?.message || "Failed to save bill.");
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

  const activePackageTitle = useMemo(() => {
    if (!selectedPackageId) return "";
    const pkg = packages.find(
      (p) => String(p.package_id) === String(selectedPackageId)
    );
    return pkg ? pkg.title : "";
  }, [packages, selectedPackageId]);

  return (
    <div className="h-screen w-full bg-[#F8F9FA] flex flex-col overflow-hidden">
      <POSHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuClick={() => setMobileSidebarOpen(true)}
        showDashboardLink={true}
      />

      <div className="flex flex-1 relative overflow-hidden">
        <PackageSidebar
          packages={packages}
          selectedPackageId={selectedPackageId}
          onSelectPackage={setSelectedPackageId}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
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
            <div className="flex-1 min-w-0 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 space-y-6">
              {/* Package Section */}
              <div>
                <h2 className="text-sm font-bold text-slate-700 mb-2">
                  Package
                </h2>
                {loading ? (
                  <p className="text-xs text-slate-400">Loading package items...</p>
                ) : filteredPackageItems.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No items in this package yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredPackageItems.map((item) => {
                      const isStationery = item._type === "stationery";
                      const itemKey = isStationery
                        ? `stationary-${item.stationary_id || item.id}`
                        : `course-${item.course_id || item.id}`;
                      const displayPrice = calculateBundlePrice(item);

                      return (
                        <button
                          key={itemKey}
                          onClick={() => handleOpenItemModal(item)}
                          className="bg-white border-2 border-slate-200 rounded-lg flex flex-col justify-between p-3 shadow-sm hover:border-[#CD051F] transition group text-left cursor-pointer"
                        >
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              {isStationery ? "Stationery" : "Course"}
                            </span>
                            <p className="text-xs font-extrabold text-slate-800 mt-1">
                              {item.title || item.name}
                            </p>
                            <p className="text-xs font-bold text-[#CD051F] mt-1">
                              PKR {displayPrice.toLocaleString()}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full xl:w-[360px] shrink-0 h-full max-h-[calc(100vh-140px)] flex flex-col min-h-0">
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

      {/* Package Item View/Add Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            {/* Header */}
            <div className="bg-[#CD051F] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3 flex-1 mr-4">
                <input
                  type="text"
                  readOnly
                  value={viewingItem.title || viewingItem.name || ""}
                  className="w-full px-3 py-1.5 bg-white text-slate-900 font-bold rounded-lg text-sm border border-slate-300 focus:outline-none"
                />
                <span className="bg-white text-slate-900 text-xs font-bold px-2.5 py-1 rounded-md shrink-0">
                  Items: {bundleProducts.length}
                </span>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="text-white hover:opacity-75 transition shrink-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Package</span>
                <select
                  disabled
                  value={activePackageTitle ? "active" : "none"}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-slate-50 text-slate-700 focus:outline-none"
                >
                  <option value="active">
                    {activePackageTitle || "General Package"}
                  </option>
                  <option value="none">No Package</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 shrink-0">
                  Add Items <span className="text-slate-400 font-normal">(from stock only)</span>
                </span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    placeholder="Search stock by name..."
                    className="w-full border border-slate-300 rounded-lg pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:border-[#CD051F]"
                  />
                  <Search
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  {bookSearch.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {inventoryProducts
                        .filter((p) =>
                          p.name?.toLowerCase().includes(bookSearch.toLowerCase())
                        )
                        .map((product) => {
                          const prodKey = product.product_id || product.id;
                          return (
                            <button
                              key={prodKey}
                              onClick={() => {
                                handleAddProductToModal(product);
                                setBookSearch("");
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 flex justify-between items-center border-b border-slate-100 last:border-b-0 cursor-pointer"
                            >
                              <span>{product.name}</span>
                              <span className="font-bold text-[#CD051F]">
                                Rs. {product.selling_price || product.price}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-3">
                  {viewingItem._type === "stationery"
                    ? "Stationery Includes"
                    : "Course Includes"}
                </h4>

                {loadingModal ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Loading items...</p>
                ) : (
                  <div className="space-y-2.5">
                    {bundleProducts.map((p, index) => {
                      const prodId = p.product_id || p.id;
                      const qty = Number(p.quantity) || 1;
                      const stock =
                        p.stock_quantity !== undefined && p.stock_quantity !== null
                          ? Number(p.stock_quantity)
                          : Infinity;
                      const unitPrice = Number(p.selling_price || p.price || 0);
                      const canDecrement = qty > 1;
                      const canIncrement = qty < stock;

                      return (
                        <div
                          key={prodId || `product-${index}`}
                          className="flex items-center justify-between text-xs border-b border-slate-100 pb-2"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <span className="font-semibold text-slate-800 block truncate">
                              {p.name}
                            </span>
                            {Number.isFinite(stock) && (
                              <span className="text-[10px] text-slate-400">
                                In stock: {stock}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleBundleQtyDecrement(prodId)}
                              disabled={!canDecrement}
                              className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              −
                            </button>
                            <span className="w-6 text-center font-bold text-slate-900">
                              {qty}
                            </span>
                            <button
                              onClick={() => handleBundleQtyIncrement(prodId)}
                              disabled={!canIncrement}
                              className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 ml-4">
                            <span className="font-bold text-slate-900 w-16 text-right">
                              Rs. {(unitPrice * qty).toLocaleString()}
                            </span>
                            <button
                              onClick={() => handleRemoveProductFromModal(prodId)}
                              className="text-[#CD051F] hover:text-red-700 transition cursor-pointer"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="text-sm font-extrabold text-[#CD051F]">Total</span>
                <span className="text-sm font-extrabold text-[#CD051F]">
                  Rs. {modalTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setViewingItem(null)}
                className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddModalItemsToBill}
                className="px-5 py-2 bg-[#CD051F] hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm uppercase cursor-pointer"
              >
                ADD TO BILL
              </button>
            </div>
          </div>
        </div>
      )}

      {invoiceSaleId && (
        <InvoiceModal
          saleId={invoiceSaleId}
          onClose={() => setInvoiceSaleId(null)}
        />
      )}
    </div>
  );
};

export default CoursePage;