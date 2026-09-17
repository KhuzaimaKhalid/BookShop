import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Edit3, Trash2, Search, X, Plus } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const NEW_PACKAGE_VALUE = "__new_package__";
const NO_PACKAGE_VALUE = "";
const UNASSIGNED_KEY = "__unassigned__";

const AdminCourse = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [stationeries, setStationeries] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Package selector (inside the add/edit modal)
  const [selectedPackageOption, setSelectedPackageOption] = useState(NO_PACKAGE_VALUE);
  const [newPackageName, setNewPackageName] = useState("");

  // Modal state (Course/Stationery bundle editor)
  const [editingItem, setEditingItem] = useState(null);
  const [bundleProducts, setBundleProducts] = useState([]);
  const [initialProductsMap, setInitialProductsMap] = useState({});
  const [bookSearch, setBookSearch] = useState("");
  const [isNewBundle, setIsNewBundle] = useState(false);
  const [bundleNameInput, setBundleNameInput] = useState("");
  const [isStationeryType, setIsStationeryType] = useState(false);
  const [isSavingModal, setIsSavingModal] = useState(false);

  const fetchPackages = async () => {
    try {
      const res = await api.get("/packages");
      const fetchedPackages = Array.isArray(res.data?.packages) ? res.data.packages : [];
      setPackages(fetchedPackages);
    } catch (err) {
      console.error("Error fetching packages:", err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, stationeriesRes, productsRes] = await Promise.all([
        api.get("/courses").catch(() => ({ data: [] })),
        api.get("/stationary/all").catch(() => ({ data: [] })),
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
    fetchPackages();
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
    return 0;
  };

  // Group every course + stationary item under its package's name.
  // Anything without a package_id falls into "Unassigned".
  const groupedByPackage = useMemo(() => {
    const groupMap = new Map();

    packages.forEach((pkg) => {
      groupMap.set(pkg.package_id, {
        key: String(pkg.package_id),
        title: pkg.title,
        items: [],
      });
    });

    const unassigned = { key: UNASSIGNED_KEY, title: "Unassigned", items: [] };

    courses.forEach((c) => {
      const bucket = c.package_id && groupMap.has(c.package_id)
        ? groupMap.get(c.package_id)
        : unassigned;
      bucket.items.push({ ...c, _type: "course" });
    });

    stationeries.forEach((s) => {
      const bucket = s.package_id && groupMap.has(s.package_id)
        ? groupMap.get(s.package_id)
        : unassigned;
      bucket.items.push({ ...s, _type: "stationery" });
    });

    const groups = Array.from(groupMap.values());
    if (unassigned.items.length > 0) groups.push(unassigned);
    return groups;
  }, [packages, courses, stationeries]);

  const handleOpenEditModal = async (item, isStationery = false) => {
    setIsStationeryType(isStationery);
    if (item) {
      setIsNewBundle(false);
      setEditingItem(item);
      setBundleNameInput(item.title || item.name || "");
      setSelectedPackageOption(
        item.package_id !== undefined && item.package_id !== null
          ? String(item.package_id)
          : NO_PACKAGE_VALUE
      );
      setNewPackageName("");

      const targetId = isStationery
        ? item.stationary_id || item.id
        : item.course_id || item.id;

      try {
        const endpoint = isStationery
          ? `/stationary/products/${targetId}`
          : `/courses/${targetId}/products`;
        const res = await api.get(endpoint);
        const rawProds = res.data.products || res.data || [];

        const map = {};
        const fetchedProds = rawProds.map((p) => {
          const pId = p.product_id || p.id;
          const q = Number(p.quantity ?? p.course_quantity ?? p.stationary_quantity ?? 1) || 1;
          map[pId] = q;
          return { ...p, product_id: pId, quantity: q };
        });

        setInitialProductsMap(map);
        setBundleProducts(fetchedProds);
      } catch (err) {
        console.error("Error loading bundle products:", err);
        setBundleProducts([]);
        setInitialProductsMap({});
      }
    } else {
      setIsNewBundle(true);
      setEditingItem({ title: "" });
      setBundleNameInput("");
      setBundleProducts([]);
      setInitialProductsMap({});
      setSelectedPackageOption(NO_PACKAGE_VALUE);
      setNewPackageName("");
      fetchPackages();
    }
  };

  // Pre-fills the package + opens the "add new item" modal from a
  // specific package group's "+ Add" link.
  const handleAddToPackageGroup = (groupKey, isStationery) => {
    setIsStationeryType(isStationery);
    setIsNewBundle(true);
    setEditingItem({ title: "" });
    setBundleNameInput("");
    setBundleProducts([]);
    setInitialProductsMap({});
    setSelectedPackageOption(groupKey === UNASSIGNED_KEY ? NO_PACKAGE_VALUE : groupKey);
    setNewPackageName("");
  };

  const handleAddProductToBundleModal = (product) => {
    const prodId = product.product_id || product.id;
    if (bundleProducts.some((p) => (p.product_id || p.id) === prodId)) return;
    setBundleProducts((prev) => [...prev, { ...product, product_id: prodId, quantity: 1 }]);
  };

  const handleRemoveProductFromBundleModal = (productId) => {
    setBundleProducts((prev) => prev.filter((p) => (p.product_id || p.id) !== productId));
  };

  const handleBundleQtyIncrement = (productId) => {
    setBundleProducts((prev) =>
      prev.map((p) => {
        const pid = p.product_id || p.id;
        if (pid !== productId) return p;
        const stock = p.stock_quantity !== undefined && p.stock_quantity !== null
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
      (sum, p) => sum + Number(p.selling_price || p.price || 0) * (Number(p.quantity) || 1),
      0
    );
  }, [bundleProducts]);

  const resolvePackageId = async () => {
    if (selectedPackageOption === NEW_PACKAGE_VALUE) {
      if (!newPackageName.trim()) {
        throw new Error("Please enter a name for the new package.");
      }
      const createRes = await api.post("/packages", { title: newPackageName.trim() });
      const newPkgId = createRes.data?.package?.package_id || createRes.data?.package_id;
      if (!newPkgId) throw new Error("Failed to create package.");
      await fetchPackages();
      return Number(newPkgId);
    }
    if (selectedPackageOption === NO_PACKAGE_VALUE) return null;
    return Number(selectedPackageOption);
  };

  const handleSaveChangesToBackend = async () => {
    if (!bundleNameInput.trim()) {
      alert(`Please enter a ${isStationeryType ? "stationary" : "course"} name`);
      return;
    }
    if (bundleProducts.length === 0) {
      alert("Please add at least one item to the bundle.");
      return;
    }

    setIsSavingModal(true);
    try {
      const packageId = await resolvePackageId();

      if (isStationeryType) {
        let stationaryId = editingItem?.stationary_id || editingItem?.id;

        if (isNewBundle || !stationaryId) {
          const createRes = await api.post("/stationary/create", {
            title: bundleNameInput,
            package_id: packageId,
          });
          stationaryId = createRes.data?.stationary?.stationary_id || createRes.data?.stationary_id;
        } else {
          await api.put("/packages/assign-stationary", {
            stationary_id: Number(stationaryId),
            package_id: packageId,
          });
        }

        if (!stationaryId) throw new Error("Failed to resolve stationary ID.");

        const currentMap = {};
        bundleProducts.forEach((p) => {
          currentMap[Number(p.product_id || p.id)] = Number(p.quantity) || 1;
        });

        for (const pid of Object.keys(initialProductsMap)) {
          const numericPid = Number(pid);
          if (!currentMap[numericPid]) {
            await api.post("/stationary/update-product", {
              stationary_id: Number(stationaryId),
              product_id: numericPid,
              action: "remove",
            });
          }
        }

        for (const [pid, newQty] of Object.entries(currentMap)) {
          await api.post("/stationary/update-product", {
            stationary_id: Number(stationaryId),
            product_id: Number(pid),
            action: "set",
            quantity: Number(newQty),
          });
        }
      } else {
        let courseId = editingItem?.course_id || editingItem?.id;

        if (isNewBundle || !courseId) {
          const createRes = await api.post("/courses", {
            title: bundleNameInput,
            package_id: packageId,
          });
          courseId = createRes.data?.course?.course_id || createRes.data?.course_id;
        } else {
          await api.put("/packages/assign-course", {
            course_id: Number(courseId),
            package_id: packageId,
          });
        }

        if (!courseId) throw new Error("Failed to resolve course ID.");

        const currentMap = {};
        bundleProducts.forEach((p) => {
          currentMap[Number(p.product_id || p.id)] = Number(p.quantity) || 1;
        });

        for (const pid of Object.keys(initialProductsMap)) {
          const numericPid = Number(pid);
          if (!currentMap[numericPid]) {
            await api.put("/courses/products", {
              course_id: Number(courseId),
              product_id: numericPid,
              action: "remove",
              quantity: 0,
            });
          }
        }

        for (const [pid, newQty] of Object.entries(currentMap)) {
          await api.put("/courses/products", {
            course_id: Number(courseId),
            product_id: Number(pid),
            action: "set",
            quantity: Number(newQty),
          });
        }
      }

      await fetchData();
      setEditingItem(null);
    } catch (err) {
      console.error("Error saving bundle to backend:", err);
      alert(err.response?.data?.message || err.message || "Failed to save changes.");
    } finally {
      setIsSavingModal(false);
    }
  };

  return (
    <AdminLayout>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-extrabold text-slate-900">Packages</h1>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400">Loading...</p>
        ) : groupedByPackage.length === 0 ? (
          <p className="text-xs text-slate-400">
            No courses or stationery packages yet. Create your first package below.
          </p>
        ) : (
          <div className="space-y-8">
            {groupedByPackage.map((group) => (
              <div key={group.key}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-slate-700">{group.title}</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleAddToPackageGroup(group.key, false)}
                      className="text-[11px] font-bold text-[#CD051F] hover:underline cursor-pointer"
                    >
                      +Add Course
                    </button>
                    <button
                      onClick={() => handleAddToPackageGroup(group.key, true)}
                      className="text-[11px] font-bold text-[#CD051F] hover:underline cursor-pointer"
                    >
                      +Add Stationery
                    </button>
                  </div>
                </div>

                {group.items.length === 0 ? (
                  <p className="text-[11px] text-slate-400">No items in this package yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {group.items.map((item) => {
                      const isStationery = item._type === "stationery";
                      const itemKey = isStationery
                        ? `stationary-${item.stationary_id || item.id}`
                        : `course-${item.course_id || item.id}`;
                      const displayPrice = calculateBundlePrice(item);

                      return (
                        <div
                          key={itemKey}
                          className="bg-white border-2 border-slate-200 rounded-lg flex items-center justify-between p-2.5 shadow-sm hover:border-[#CD051F] transition"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              {isStationery ? "Stationery" : "Course"}
                            </span>
                            <p className="text-xs font-extrabold text-slate-800 truncate">
                              {item.title || item.name}
                            </p>
                            <p className="text-xs font-bold text-[#CD051F]">
                              PKR {displayPrice.toLocaleString()}
                            </p>
                          </div>

                          <button
                            onClick={() => handleOpenEditModal(item, isStationery)}
                            className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-md hover:bg-slate-800 transition shrink-0 ml-2 cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={() => handleOpenEditModal(null, false)}
            className="flex items-center gap-2 text-xs font-bold text-white bg-[#CD051F] hover:bg-red-700 transition px-4 py-2 rounded-lg cursor-pointer"
          >
            <Plus size={14} />
            New Course / Stationery
          </button>
        </div>

      {/* Bundle Editor Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            <div className="bg-[#CD051F] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3 flex-1 mr-4">
                <input
                  type="text"
                  value={bundleNameInput}
                  onChange={(e) => setBundleNameInput(e.target.value)}
                  placeholder={isStationeryType ? "Enter Stationary Name" : "Enter Course/Class Name"}
                  className="w-full px-3 py-1.5 bg-white text-slate-900 font-bold rounded-lg text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-black placeholder-slate-400"
                />
                <span className="bg-white text-slate-900 text-xs font-bold px-2.5 py-1 rounded-md shrink-0">
                  Items: {bundleProducts.length}
                </span>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-white hover:opacity-75 transition shrink-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {isNewBundle && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">Type</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsStationeryType(false)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        !isStationeryType
                          ? "bg-[#CD051F] text-white border-[#CD051F]"
                          : "bg-white text-slate-600 border-slate-300"
                      }`}
                    >
                      Course
                    </button>
                    <button
                      onClick={() => setIsStationeryType(true)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        isStationeryType
                          ? "bg-[#CD051F] text-white border-[#CD051F]"
                          : "bg-white text-slate-600 border-slate-300"
                      }`}
                    >
                      Stationery
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Package</span>
                <select
                  value={selectedPackageOption}
                  onChange={(e) => setSelectedPackageOption(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#CD051F]"
                >
                  <option value={NO_PACKAGE_VALUE}>No Package</option>
                  {packages.map((pkg) => (
                    <option key={pkg.package_id} value={String(pkg.package_id)}>
                      {pkg.title}
                    </option>
                  ))}
                  <option value={NEW_PACKAGE_VALUE}>+ Create New Package</option>
                </select>

                {selectedPackageOption === NEW_PACKAGE_VALUE && (
                  <input
                    type="text"
                    value={newPackageName}
                    onChange={(e) => setNewPackageName(e.target.value)}
                    placeholder="Enter new package name (e.g. Matric)"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#CD051F]"
                  />
                )}
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
                  <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />

                  {bookSearch.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {inventoryProducts
                        .filter((p) => p.name?.toLowerCase().includes(bookSearch.toLowerCase()))
                        .map((product) => {
                          const prodKey = product.product_id || product.id;
                          return (
                            <button
                              key={prodKey}
                              onClick={() => {
                                handleAddProductToBundleModal(product);
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
                  {isStationeryType ? "Stationery Includes" : "Course Includes"}
                </h4>
                <div className="space-y-2.5">
                  {bundleProducts.map((p, index) => {
                    const prodId = p.product_id || p.id;
                    const qty = Number(p.quantity) || 1;
                    const stock = p.stock_quantity !== undefined && p.stock_quantity !== null
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
                          <span className="font-semibold text-slate-800 block truncate">{p.name}</span>
                          {Number.isFinite(stock) && (
                            <span className="text-[10px] text-slate-400">In stock: {stock}</span>
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
                          <span className="w-6 text-center font-bold text-slate-900">{qty}</span>
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
                            onClick={() => handleRemoveProductFromBundleModal(prodId)}
                            className="text-[#CD051F] hover:text-red-700 transition cursor-pointer"
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
                className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChangesToBackend}
                disabled={isSavingModal}
                className="px-5 py-2 bg-[#CD051F] hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSavingModal ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCourse;