import { useEffect, useState, useMemo, useRef } from "react";
import { Search, Plus, Pencil, X, Trash2 } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const AdminPackage = () => {
    const [packages, setPackages] = useState([]);
    const [courses, setCourses] = useState([]);
    const [stationeries, setStationeries] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedPackageId, setSelectedPackageId] = useState(null);

    const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);
    const [newPackageName, setNewPackageName] = useState("");
    const [savingPackage, setSavingPackage] = useState(false);

    const [editPackageTarget, setEditPackageTarget] = useState(null);
    const [editPackageName, setEditPackageName] = useState("");

    // Searchable combobox state — one for Course, one for Stationery
    const [courseQuery, setCourseQuery] = useState("");
    const [stationeryQuery, setStationeryQuery] = useState("");
    const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
    const [stationeryDropdownOpen, setStationeryDropdownOpen] = useState(false);
    const courseInputRef = useRef(null);
    const stationeryInputRef = useRef(null);

    const [removeTarget, setRemoveTarget] = useState(null); // { type, item }

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [pkgRes, courseRes, stationeryRes] = await Promise.all([
                api.get("/packages").catch(() => ({ data: { packages: [] } })),
                api.get("/courses").catch(() => ({ data: [] })),
                api.get("/stationary/all").catch(() => ({ data: [] })),
            ]);

            const fetchedPackages = Array.isArray(pkgRes.data?.packages) ? pkgRes.data.packages : [];
            setPackages(fetchedPackages);
            if (fetchedPackages.length > 0 && !selectedPackageId) {
                setSelectedPackageId(fetchedPackages[0].package_id);
            }

            const fetchedCourses = Array.isArray(courseRes.data)
                ? courseRes.data
                : courseRes.data?.courses || [];
            setCourses(fetchedCourses);

            const fetchedStationeries = Array.isArray(stationeryRes.data)
                ? stationeryRes.data
                : stationeryRes.data?.stationeries || [];
            setStationeries(fetchedStationeries);
        } catch (err) {
            console.error("Error fetching packages page data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (courseInputRef.current && !courseInputRef.current.contains(e.target)) {
                setCourseDropdownOpen(false);
            }
            if (stationeryInputRef.current && !stationeryInputRef.current.contains(e.target)) {
                setStationeryDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const itemsInSelectedPackage = useMemo(() => {
        const courseItems = courses
            .filter((c) => String(c.package_id) === String(selectedPackageId))
            .map((c) => ({ ...c, _type: "course" }));
        const stationeryItems = stationeries
            .filter((s) => String(s.package_id) === String(selectedPackageId))
            .map((s) => ({ ...s, _type: "stationery" }));
        return [...courseItems, ...stationeryItems];
    }, [courses, stationeries, selectedPackageId]);

    // Matches for the Course combobox: unassigned courses whose title matches the query
    const courseMatches = useMemo(() => {
        if (!courseQuery.trim()) return [];
        const q = courseQuery.toLowerCase();
        return courses.filter(
            (c) =>
                (!c.package_id || String(c.package_id) !== String(selectedPackageId)) &&
                c.title?.toLowerCase().includes(q)
        );
    }, [courses, courseQuery, selectedPackageId]);

    const stationeryMatches = useMemo(() => {
        if (!stationeryQuery.trim()) return [];
        const q = stationeryQuery.toLowerCase();
        return stationeries.filter(
            (s) =>
                (!s.package_id || String(s.package_id) !== String(selectedPackageId)) &&
                s.title?.toLowerCase().includes(q)
        );
    }, [stationeries, stationeryQuery, selectedPackageId]);

    const handleCreatePackage = async () => {
        if (!newPackageName.trim()) return;
        setSavingPackage(true);
        try {
            const res = await api.post("/packages", { title: newPackageName.trim() });
            const newPkg = res.data?.package;
            if (newPkg) {
                setPackages((prev) => [...prev, newPkg]);
                setSelectedPackageId(newPkg.package_id);
            } else {
                await fetchAll();
            }
            setNewPackageName("");
            setIsAddPackageOpen(false);
        } catch (err) {
            console.error("Error creating package:", err);
            alert(err.response?.data?.message || "Failed to create package.");
        } finally {
            setSavingPackage(false);
        }
    };

    const handleUpdatePackage = async () => {
        if (!editPackageTarget || !editPackageName.trim()) return;
        setSavingPackage(true);
        try {
            await api.put(`/packages/${editPackageTarget.package_id}`, {
                title: editPackageName.trim(),
                description: editPackageTarget.description || null,
            });
            setPackages((prev) =>
                prev.map((p) =>
                    p.package_id === editPackageTarget.package_id
                        ? { ...p, title: editPackageName.trim() }
                        : p
                )
            );
            setEditPackageTarget(null);
        } catch (err) {
            console.error("Error updating package:", err);
            alert(err.response?.data?.message || "Failed to update package.");
        } finally {
            setSavingPackage(false);
        }
    };

    // Assigns an existing course to the currently selected package
    const handleAssignExistingCourse = async (course) => {
        try {
            await api.put("/packages/assign-course", {
                course_id: course.course_id,
                package_id: selectedPackageId,
            });
            setCourses((prev) =>
                prev.map((c) =>
                    c.course_id === course.course_id ? { ...c, package_id: selectedPackageId } : c
                )
            );
            setCourseQuery("");
            setCourseDropdownOpen(false);
        } catch (err) {
            console.error("Error assigning course:", err);
            alert(err.response?.data?.message || "Failed to assign course.");
        }
    };

    // Creates a brand-new course, already assigned to the selected package
    const handleCreateAndAssignCourse = async () => {
        if (!courseQuery.trim() || !selectedPackageId) return;
        try {
            const res = await api.post("/courses", {
                title: courseQuery.trim(),
                package_id: selectedPackageId,
            });
            const newCourse = res.data?.course;
            if (newCourse) {
                setCourses((prev) => [...prev, newCourse]);
            } else {
                await fetchAll();
            }
            setCourseQuery("");
            setCourseDropdownOpen(false);
        } catch (err) {
            console.error("Error creating course:", err);
            alert(err.response?.data?.message || "Failed to create course.");
        }
    };

    const handleAssignExistingStationery = async (stationery) => {
        try {
            await api.put("/packages/assign-stationary", {
                stationary_id: stationery.stationary_id,
                package_id: selectedPackageId,
            });
            setStationeries((prev) =>
                prev.map((s) =>
                    s.stationary_id === stationery.stationary_id
                        ? { ...s, package_id: selectedPackageId }
                        : s
                )
            );
            setStationeryQuery("");
            setStationeryDropdownOpen(false);
        } catch (err) {
            console.error("Error assigning stationery:", err);
            alert(err.response?.data?.message || "Failed to assign stationery.");
        }
    };

    const handleCreateAndAssignStationery = async () => {
        if (!stationeryQuery.trim() || !selectedPackageId) return;
        try {
            const res = await api.post("/stationary/create", {
                title: stationeryQuery.trim(),
                package_id: selectedPackageId,
            });
            const newStationery = res.data?.stationary;
            if (newStationery) {
                setStationeries((prev) => [...prev, newStationery]);
            } else {
                await fetchAll();
            }
            setStationeryQuery("");
            setStationeryDropdownOpen(false);
        } catch (err) {
            console.error("Error creating stationery:", err);
            alert(err.response?.data?.message || "Failed to create stationery.");
        }
    };

    // "Remove" here means unassign from the package (package_id -> null),
    // not delete the course/stationery entirely.
    const confirmRemoveFromPackage = async () => {
        if (!removeTarget) return;
        try {
            if (removeTarget.type === "course") {
                await api.put("/packages/assign-course", {
                    course_id: removeTarget.item.course_id,
                    package_id: null,
                });
                setCourses((prev) =>
                    prev.map((c) =>
                        c.course_id === removeTarget.item.course_id ? { ...c, package_id: null } : c
                    )
                );
            } else {
                await api.put("/packages/assign-stationary", {
                    stationary_id: removeTarget.item.stationary_id,
                    package_id: null,
                });
                setStationeries((prev) =>
                    prev.map((s) =>
                        s.stationary_id === removeTarget.item.stationary_id
                            ? { ...s, package_id: null }
                            : s
                    )
                );
            }
            setRemoveTarget(null);
        } catch (err) {
            console.error("Error removing item from package:", err);
            alert(err.response?.data?.message || "Failed to remove item.");
        }
    };

    const calculateDisplayPrice = (item) => Number(item.total_price ?? item.total ?? item.price ?? 0);

    return (
        <AdminLayout>
            <div className="flex flex-col h-full overflow-hidden">
                {/* Section 1: Packages */}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Packages</h2>
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full flex-1">
                        {packages.map((pkg) => {
                            const isActive = pkg.package_id === selectedPackageId;
                            return (
                                <div
                                    key={pkg.package_id}
                                    className="flex items-center rounded-lg overflow-hidden border border-slate-900 shrink-0"
                                >
                                    <button
                                        onClick={() => setSelectedPackageId(pkg.package_id)}
                                        className={`px-3 py-1.5 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                                            isActive ? "bg-[#CD051F] text-white" : "bg-white text-slate-900"
                                        }`}
                                    >
                                        {pkg.title}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditPackageTarget(pkg);
                                            setEditPackageName(pkg.title);
                                        }}
                                        className={`px-2 py-1.5 border-l transition ${
                                            isActive
                                                ? "bg-[#CD051F] border-white/30 text-white hover:bg-red-700"
                                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <Pencil size={13} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setIsAddPackageOpen(true)}
                        className="flex items-center gap-1.5 bg-[#CD051F] hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-lg transition shadow-sm shrink-0 whitespace-nowrap"
                    >
                        <Plus size={15} strokeWidth={3} />
                        Add New Package
                    </button>
                </div>

                {/* Section 2: Add Course / Stationery to selected package via searchable combobox */}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Course &amp; Stationery</h2>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    {/* Course combobox */}
                    <div className="relative flex-1" ref={courseInputRef}>
                        <div className="relative">
                            <input
                                type="text"
                                value={courseQuery}
                                onChange={(e) => {
                                    setCourseQuery(e.target.value);
                                    setCourseDropdownOpen(true);
                                }}
                                onFocus={() => setCourseDropdownOpen(true)}
                                disabled={!selectedPackageId}
                                placeholder="Search or add a Course..."
                                className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs sm:text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:border-[#CD051F] transition disabled:bg-slate-50 disabled:text-slate-400"
                            />
                            <Search size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        {courseDropdownOpen && courseQuery.trim() && selectedPackageId && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                {courseMatches.length > 0 &&
                                    courseMatches.map((c) => (
                                        <button
                                            key={c.course_id}
                                            onClick={() => handleAssignExistingCourse(c)}
                                            className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-slate-100 border-b border-slate-100 last:border-b-0 cursor-pointer"
                                        >
                                            {c.title}
                                            {c.package_id && (
                                                <span className="text-slate-400 text-[10px] ml-1.5">
                                                    (currently in another package)
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                <button
                                    onClick={handleCreateAndAssignCourse}
                                    className="w-full text-left px-3 py-2 text-xs sm:text-sm font-bold text-[#CD051F] hover:bg-red-50 cursor-pointer"
                                >
                                    + Create new course "{courseQuery.trim()}"
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Stationery combobox */}
                    <div className="relative flex-1" ref={stationeryInputRef}>
                        <div className="relative">
                            <input
                                type="text"
                                value={stationeryQuery}
                                onChange={(e) => {
                                    setStationeryQuery(e.target.value);
                                    setStationeryDropdownOpen(true);
                                }}
                                onFocus={() => setStationeryDropdownOpen(true)}
                                disabled={!selectedPackageId}
                                placeholder="Search or add Stationery..."
                                className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs sm:text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:border-[#CD051F] transition disabled:bg-slate-50 disabled:text-slate-400"
                            />
                            <Search size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        {stationeryDropdownOpen && stationeryQuery.trim() && selectedPackageId && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                {stationeryMatches.length > 0 &&
                                    stationeryMatches.map((s) => (
                                        <button
                                            key={s.stationary_id}
                                            onClick={() => handleAssignExistingStationery(s)}
                                            className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-slate-100 border-b border-slate-100 last:border-b-0 cursor-pointer"
                                        >
                                            {s.title}
                                            {s.package_id && (
                                                <span className="text-slate-400 text-[10px] ml-1.5">
                                                    (currently in another package)
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                <button
                                    onClick={handleCreateAndAssignStationery}
                                    className="w-full text-left px-3 py-2 text-xs sm:text-sm font-bold text-[#CD051F] hover:bg-red-50 cursor-pointer"
                                >
                                    + Create new stationery "{stationeryQuery.trim()}"
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 3: Items in selected package */}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 shrink-0">
                    Items in {packages.find((p) => p.package_id === selectedPackageId)?.title || "this package"}
                </h2>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full mb-2">
                    <table className="w-full text-xs sm:text-sm min-w-[500px]">
                        <thead className="sticky top-0 bg-slate-50 z-10">
                            <tr className="border-b border-slate-100">
                                <th className="text-left font-semibold text-slate-500 text-[11px] uppercase tracking-wide px-4 py-2.5">
                                    Type
                                </th>
                                <th className="text-left font-semibold text-slate-500 text-[11px] uppercase tracking-wide px-4 py-2.5">
                                    Name
                                </th>
                                <th className="text-left font-semibold text-slate-500 text-[11px] uppercase tracking-wide px-4 py-2.5">
                                    Total Price (PKR)
                                </th>
                                <th className="text-left font-semibold text-slate-500 text-[11px] uppercase tracking-wide px-4 py-2.5">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-6 text-slate-400 text-xs sm:text-sm">
                                        Loading...
                                    </td>
                                </tr>
                            ) : !selectedPackageId ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-6 text-slate-400 text-xs sm:text-sm">
                                        Create a package to get started.
                                    </td>
                                </tr>
                            ) : itemsInSelectedPackage.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-6 text-slate-400 text-xs sm:text-sm">
                                        No courses or stationery in this package yet.
                                    </td>
                                </tr>
                            ) : (
                                itemsInSelectedPackage.map((item) => {
                                    const isCourse = item._type === "course";
                                    const rowKey = isCourse
                                        ? `course-${item.course_id}`
                                        : `stationery-${item.stationary_id}`;
                                    return (
                                        <tr
                                            key={rowKey}
                                            className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition"
                                        >
                                            <td className="px-4 py-2.5">
                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                                                    {isCourse ? "Course" : "Stationery"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 font-semibold text-slate-800">
                                                {item.title}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-700">
                                                {calculateDisplayPrice(item).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <button
                                                    onClick={() =>
                                                        setRemoveTarget({ type: item._type, item })
                                                    }
                                                    className="w-7 h-7 flex items-center justify-center rounded bg-[#CD051F] hover:bg-red-700 text-white transition"
                                                    title="Remove from package"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Package Modal */}
            {isAddPackageOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h3 className="text-base font-extrabold text-slate-900">Add New Package</h3>
                            <button
                                onClick={() => setIsAddPackageOpen(false)}
                                className="text-slate-500 hover:text-slate-700 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="px-5 py-5">
                            <input
                                type="text"
                                autoFocus
                                value={newPackageName}
                                onChange={(e) => setNewPackageName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreatePackage()}
                                placeholder="e.g. Matric"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#CD051F]"
                            />
                        </div>
                        <div className="px-5 pb-5 flex justify-end gap-2">
                            <button
                                onClick={() => setIsAddPackageOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePackage}
                                disabled={savingPackage || !newPackageName.trim()}
                                className="px-4 py-2 text-xs font-bold text-white bg-[#CD051F] hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                            >
                                {savingPackage ? "Saving..." : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Package Modal */}
            {editPackageTarget && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h3 className="text-base font-extrabold text-slate-900">Edit Package</h3>
                            <button
                                onClick={() => setEditPackageTarget(null)}
                                className="text-slate-500 hover:text-slate-700 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="px-5 py-5">
                            <input
                                type="text"
                                autoFocus
                                value={editPackageName}
                                onChange={(e) => setEditPackageName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleUpdatePackage()}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#CD051F]"
                            />
                        </div>
                        <div className="px-5 pb-5 flex justify-end gap-2">
                            <button
                                onClick={() => setEditPackageTarget(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdatePackage}
                                disabled={savingPackage || !editPackageName.trim()}
                                className="px-4 py-2 text-xs font-bold text-white bg-[#CD051F] hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                            >
                                {savingPackage ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove-from-package confirmation */}
            {removeTarget && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="text-lg font-extrabold text-[#CD051F]">Remove Item</h3>
                            <button
                                onClick={() => setRemoveTarget(null)}
                                className="text-slate-500 hover:text-slate-700 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="px-6 py-8 text-center">
                            <p className="text-base font-bold text-slate-900">
                                Remove "{removeTarget.item.title}" from this package?
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                                The {removeTarget.type} itself won't be deleted, just unassigned.
                            </p>
                        </div>
                        <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                            <button
                                onClick={confirmRemoveFromPackage}
                                className="w-full bg-green-100 hover:bg-green-200 text-green-700 font-bold py-3 rounded-lg transition"
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setRemoveTarget(null)}
                                className="w-full bg-red-50 hover:bg-red-100 text-[#CD051F] font-bold py-3 rounded-lg transition"
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminPackage;