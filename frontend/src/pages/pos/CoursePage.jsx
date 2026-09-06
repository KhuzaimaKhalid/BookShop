import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Edit3, Trash2, Search, X } from "lucide-react";
import api from "../../services/api";
import POSHeader from "../../components/pos/POSHeader";
import CategorySidebar from "../../components/pos/CategorySidebar";
import CustomerTabs from "../../components/pos/CustomerTabs";
import CartPanel from "../../components/pos/CartPanel";
import InvoiceModal from "../../components/sales/InvoiceModal";
import { useCart } from "../../context/CartContext";

const CoursePage = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  const [courses, setCourses] = useState([]);
  const [stationeries, setStationeries] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [invoiceSaleId, setInvoiceSaleId] = useState(null);

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

  // Modal state (Course/Stationery bundle editor)
  const [editingItem, setEditingItem] = useState(null);
  const [bundleProducts, setBundleProducts] = useState([]);
  const [bookSearch, setBookSearch] = useState("");
  const [isNewBundle, setIsNewBundle] = useState(false);
  const [bundleNameInput, setBundleNameInput] = useState("");
  const [isStationeryType, setIsStationeryType] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, stationeriesRes, productsRes, categoriesRes] = await Promise.all([
        api.get("/courses").catch(() => ({ data: [] })),
        api.get("/stationary/all").catch(() => ({ data: [] })),
        api.get("/product").catch(() => api.get("/products")).catch(() => ({ data: [] })),
        api.get("/categories").catch(() => ({ data: { categories: [] } })),
      ]);

      const fetchedCourses = Array.isArray(coursesRes.data)
        ? coursesRes.data
        : coursesRes.data?.courses || [];
      setCourses(fetchedCourses);

      const fetchedStationeries = Array.isArray(stationeriesRes.data)
        ? stationeriesRes.data
        : stationeriesRes.data?.stationeries || [];
      setStationeries(fetchedStationeries);

      const fetchedProducts = Array.isArray(productsRes.data?.products)
        ? productsRes.data.products
        : Array.isArray(productsRes.data)
          ? productsRes.data
          : [];
      setInventoryProducts(fetchedProducts);

      const fetchedCategories = Array.isArray(categoriesRes.data?.categories)
        ? categoriesRes.data.categories
        : Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : [];
      setCategories(fetchedCategories);
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

  const handleAddToCart = async (item, isStationery = false) => {
    const itemId = isStationery
      ? item.stationary_id || item.id
      : item.course_id || item.id;

    try {
      const endpoint = isStationery
        ? `/stationary/products/${itemId}`
        : `/courses/${itemId}/products`;

      const res = await api.get(endpoint);
      const bundleItems = res.data?.products || [];

      if (bundleItems.length === 0) {
        alert(
          `This ${isStationery ? "stationery package" : "course"} has no products added yet.`
        );
        return;
      }

      updateActiveCart((cart) => {
        let updatedItems = [...cart.items];

        bundleItems.forEach((p) => {
          const productId = p.id;
          const bundleQty = isStationery
            ? p.stationary_quantity || 1
            : p.course_quantity || 1;

          const existingIndex = updatedItems.findIndex(
            (i) => i.product_id === productId
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
              price: p.selling_price,
              qty: bundleQty,
              maxStock: p.stock_quantity ?? 999,
            });
          }
        });

        return { ...cart, items: updatedItems };
      });
    } catch (err) {
      console.error("Error adding bundle to cart:", err);
      alert("Failed to add items to cart.");
    }
  };

  const handleSaveBill = async () => {
    if (activeCart.items.length === 0) return null;
    const subtotal = activeCart.items.reduce((sum, i) => sum + i.qty * i.price, 0);
    const paid = Number(activeCart.paidAmount) || 0;

    if (paid < subtotal) {
      alert("Paid amount is less than total.");
      return null;
    }

    setSaving(true);
    try {
      const res = await api.post("/sales", {
        items: activeCart.items.map((i) => ({
          product_id: i.product_id,
          qty: i.qty,
          price: i.price,
        })),
        paid_amount: paid,
      });
      updateActiveCart((cart) => ({
        ...cart,
        invoiceNo: res.data.invoice_no,
        saleId: res.data.sale_id,
      }));
      return res.data;
    } catch (error) {
      console.error("Error saving bill:", error);
      alert("Failed to save bill.");
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

  const handleOpenEditModal = async (item, isStationery = false) => {
    setIsStationeryType(isStationery);
    if (item) {
      setIsNewBundle(false);
      setEditingItem(item);
      setBundleNameInput(item.title || item.name || "");

      const targetId = isStationery
        ? item.stationary_id || item.id
        : item.course_id || item.id;

      try {
        const endpoint = isStationery
          ? `/stationary/products/${targetId}`
          : `/courses/${targetId}/products`;
        const res = await api.get(endpoint);
        const fetchedProds = res.data.products || res.data || [];
        setBundleProducts(fetchedProds);
      } catch (err) {
        console.error("Error loading bundle products:", err);
        setBundleProducts([]);
      }
    } else {
      setIsNewBundle(true);
      setEditingItem({ title: "" });
      setBundleNameInput("");
      setBundleProducts([]);
    }
  };

  const handleAddProductToBundleModal = (product) => {
    const prodId = product.product_id || product.id;
    if (bundleProducts.some((p) => (p.product_id || p.id) === prodId)) return;

    setBundleProducts((prev) => [...prev, product]);
  };

  const handleRemoveProductFromBundleModal = (productId) => {
    setBundleProducts((prev) =>
      prev.filter((p) => (p.product_id || p.id) !== productId)
    );
  };

  const modalTotal = useMemo(() => {
    return bundleProducts.reduce(
      (sum, p) => sum + Number(p.selling_price || p.price || 0),
      0
    );
  }, [bundleProducts]);

  const handleSaveBundleModal = async () => {
    if (!bundleNameInput.trim()) {
      alert(`Please enter a ${isStationeryType ? "stationary" : "course"} name`);
      return;
    }

    try {
      if (isStationeryType) {
        let targetStationaryId = editingItem?.stationary_id || editingItem?.id;

        if (isNewBundle) {
          const createRes = await api.post("/stationary/create", {
            title: bundleNameInput.trim(),
          });
          targetStationaryId =
            createRes.data?.stationary?.stationary_id || createRes.data?.stationary_id;
        }

        if (targetStationaryId && bundleProducts.length > 0) {
          await Promise.all(
            bundleProducts.map((p) =>
              api.post("/stationary/update-product", {
                stationary_id: targetStationaryId,
                product_id: p.product_id || p.id,
                action: "set",
                quantity: 1,
              })
            )
          );
        }
      } else {
        let targetCourseId = editingItem?.course_id || editingItem?.id;

        if (isNewBundle) {
          const createRes = await api.post("/courses", {
            title: bundleNameInput.trim(),
          });
          targetCourseId =
            createRes.data?.course?.course_id || createRes.data?.course_id;
        }

        if (targetCourseId && bundleProducts.length > 0) {
          await Promise.all(
            bundleProducts.map((p) =>
              api.put("/courses/products", {
                course_id: targetCourseId,
                product_id: p.product_id || p.id,
                action: "set",
                quantity: 1,
              })
            )
          );
        }
      }

      await fetchData();
      setEditingItem(null);
    } catch (err) {
      console.error("Error saving item:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to save changes.");
    }
  };

  return (
    <div className="h-screen w-full bg-[#F8F9FA] flex flex-col overflow-hidden">
      <POSHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuClick={() => setMobileCategoryOpen(true)}
        showDashboardLink={true}
      />

      <div className="flex flex-1 relative overflow-hidden">
        <CategorySidebar
          categories={categories}
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
            <div className="flex-1 min-w-0 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 space-y-6">
              {/* Course Section */}
              <div>
                <h2 className="text-sm font-bold text-slate-700 mb-2">Course</h2>
                {loading ? (
                  <p className="text-xs text-slate-400">Loading courses...</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {courses.map((item) => {
                      const itemKey = item.course_id || item.id;
                      const displayPrice = calculateBundlePrice(item);

                      return (
                        <div
                          key={`course-${itemKey}`}
                          className="bg-white border-2 border-slate-200 rounded-lg flex items-center justify-between p-2.5 shadow-sm hover:border-[#CD051F] transition group"
                        >
                          <button
                            onClick={() => handleAddToCart(item, false)}
                            className="flex-1 text-left"
                          >
                            <p className="text-xs font-extrabold text-slate-800">
                              {item.title || item.name}
                            </p>
                            <p className="text-xs font-bold text-[#CD051F]">
                              PKR {displayPrice.toLocaleString()}
                            </p>
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(item, false)}
                            className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-md hover:bg-slate-800 transition shrink-0 ml-2"
                            title="Edit Course"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="text-right mt-2">
                  <button
                    onClick={() => handleOpenEditModal(null, false)}
                    className="text-xs font-bold text-[#CD051F] hover:underline"
                  >
                    +Add Class
                  </button>
                </div>
              </div>

              {/* Stationery Section */}
              <div>
                <h2 className="text-sm font-bold text-slate-700 mb-2">Stationery</h2>
                {loading ? (
                  <p className="text-xs text-slate-400">Loading stationery...</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {stationeries.map((item) => {
                      const itemKey = item.stationary_id || item.id;
                      const displayPrice = calculateBundlePrice(item);

                      return (
                        <div
                          key={`stationary-${itemKey}`}
                          className="bg-white border-2 border-slate-200 rounded-lg flex items-center justify-between p-2.5 shadow-sm hover:border-[#CD051F] transition group"
                        >
                          <button
                            onClick={() => handleAddToCart(item, true)}
                            className="flex-1 text-left"
                          >
                            <p className="text-xs font-extrabold text-slate-800">
                              {item.title || item.name}
                            </p>
                            <p className="text-xs font-bold text-[#CD051F]">
                              PKR {displayPrice.toLocaleString()}
                            </p>
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(item, true)}
                            className="w-8 h-8 flex items-center justify-center bg-black text-[#CD051F] border border-[#CD051F] rounded-md hover:bg-red-50 transition shrink-0 ml-2"
                            title="Edit Stationery"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="text-right mt-2">
                  <button
                    onClick={() => handleOpenEditModal(null, true)}
                    className="text-xs font-bold text-[#CD051F] hover:underline"
                  >
                    +Add Class
                  </button>
                </div>
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

      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            <div className="bg-[#CD051F] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3 flex-1 mr-4">
                <input
                  type="text"
                  value={bundleNameInput}
                  onChange={(e) => setBundleNameInput(e.target.value)}
                  placeholder={
                    isStationeryType
                      ? "Enter Stationary Name"
                      : "Enter Course/Class Name"
                  }
                  className="w-full px-3 py-1.5 bg-white text-slate-900 font-bold rounded-lg text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-black placeholder-slate-400"
                />
                <span className="bg-white text-slate-900 text-xs font-bold px-2.5 py-1 rounded-md shrink-0">
                  Items: {bundleProducts.length}
                </span>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-white hover:opacity-75 transition shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
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
                                handleAddProductToBundleModal(product);
                                setBookSearch("");
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 flex justify-between items-center border-b border-slate-100 last:border-b-0"
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
                  {isStationeryType ? "Stationery Includes" : "Course Includes"}
                </h4>
                <div className="space-y-2.5">
                  {bundleProducts.map((p, index) => {
                    const prodId = p.product_id || p.id;
                    return (
                      <div
                        key={prodId || `product-${index}`}
                        className="flex items-center justify-between text-xs border-b border-slate-100 pb-2"
                      >
                        <span className="font-semibold text-slate-800">{p.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-slate-900">
                            Rs. {p.selling_price || p.price}
                          </span>
                          <button
                            onClick={() => handleRemoveProductFromBundleModal(prodId)}
                            className="text-[#CD051F] hover:text-red-700 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="text-sm font-extrabold text-[#CD051F]">Total</span>
                <span className="text-sm font-extrabold text-[#CD051F]">
                  Rs. {modalTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingItem(null)}
                className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBundleModal}
                className="px-5 py-2 bg-[#CD051F] hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                Save Changes
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