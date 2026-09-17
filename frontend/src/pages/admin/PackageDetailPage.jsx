import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../services/api";

const PackageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [courses, setCourses] = useState([]);
  const [stationaries, setStationaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/packages/${id}/summary`);
        setPkg(res.data?.package || null);
        setCourses(Array.isArray(res.data?.courses) ? res.data.courses : []);
        setStationaries(Array.isArray(res.data?.stationaries) ? res.data.stationaries : []);
      } catch (err) {
        console.error("Error fetching package contents:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchContents();
  }, [id]);

  const allItems = [
    ...courses.map((c) => ({ ...c, _type: "Course", _key: `course-${c.course_id}` })),
    ...stationaries.map((s) => ({ ...s, _type: "Stationery", _key: `stationary-${s.stationary_id}` })),
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#CD051F] transition mb-4 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h1 className="text-lg font-extrabold text-slate-900 mb-1">
        {pkg?.title || "Package"}
      </h1>
      {pkg?.description && (
        <p className="text-xs text-slate-500 mb-4">{pkg.description}</p>
      )}

      {loading ? (
        <p className="text-xs text-slate-400 mt-6">Loading...</p>
      ) : allItems.length === 0 ? (
        <p className="text-xs text-slate-400 mt-6">
          No courses or stationery packages are assigned to this package yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
          {allItems.map((item) => (
            <div
              key={item._key}
              className="bg-white border-2 border-slate-200 rounded-lg p-3 shadow-sm"
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {item._type}
              </span>
              <p className="text-xs font-extrabold text-slate-800 mt-1">
                {item.title}
              </p>
              <p className="text-xs font-bold text-[#CD051F] mt-1">
                PKR {Number(item.total_price || 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PackageDetailPage;