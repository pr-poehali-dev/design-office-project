import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { getDesigners } from "@/lib/api";

interface Designer {
  id: string;
  first_name: string;
  last_name: string;
  city?: string;
  specialization?: string;
  rating: number;
  projects_count: number;
  avatar_url?: string;
  bio?: string;
}

const SPEC_FILTERS = [
  { label: "Все", value: "" },
  { label: "Жилые интерьеры", value: "residential" },
  { label: "Коммерческие", value: "commercial" },
  { label: "Ландшафт", value: "landscape" },
];

const CITY_FILTERS = ["Все города", "Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Новосибирск", "Сочи"];

const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "/dashboard" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "/dashboard" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "Users", label: "Клиенты", id: "clients", path: "/dashboard" },
  { icon: "Handshake", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "MessageCircle", label: "Сообщения", id: "messages", path: "/dashboard", badge: 0 },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard" },
];

const SPEC_LABELS: Record<string, string> = {
  residential: "Жилые интерьеры",
  commercial: "Коммерческие",
  landscape: "Ландшафт",
};

const specColors: Record<string, string> = {
  residential: "bg-terra-pale text-terra border-terra/20",
  commercial: "bg-blue-50 text-blue-700 border-blue-200",
  landscape: "bg-green-50 text-green-700 border-green-200",
};

const AVATAR_COLORS = [
  "from-rose-400 to-orange-400",
  "from-blue-400 to-indigo-500",
  "from-purple-400 to-pink-400",
  "from-green-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-blue-500",
  "from-fuchsia-400 to-purple-500",
  "from-terra to-rose-500",
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(first?: string, last?: string) {
  return `${(first || "")[0] || ""}${(last || "")[0] || ""}`.toUpperCase() || "?";
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-xs ${i <= Math.floor(rating) ? "text-amber-400" : "text-stone-light"}`}>★</span>
      ))}
      <span className="text-xs font-semibold text-stone ml-0.5">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

export default function Guild() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("Все города");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDesigners();
  }, [specFilter, cityFilter, search]);

  const loadDesigners = async () => {
    setLoading(true);
    try {
      const data = await getDesigners({
        specialization: specFilter || undefined,
        city: cityFilter === "Все города" ? undefined : cityFilter,
        search: search || undefined,
      });
      setDesigners(data.designers || []);
    } catch (err) {
      console.error("Failed to load designers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userInitials = user
    ? getInitials(user.first_name, user.last_name)
    : "?";

  return (
    <div className="min-h-screen bg-background font-body flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-border h-screen sticky top-0">
        <div className="p-5 border-b border-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="Layers" size={15} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-stone">DesignOffice</span>
          </button>
        </div>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 terra-gradient rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {userInitials}
            </div>
            <div>
              <div className="text-sm font-semibold text-stone">{user?.first_name} {user?.last_name}</div>
              <div className="text-xs text-stone-mid">
                {user?.role === "designer" ? "Дизайнер интерьеров" : user?.role === "client" ? "Клиент" : "Участник"}
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                item.id === "guild" ? "bg-terra-pale text-terra font-medium" : "text-stone-mid hover:bg-muted hover:text-stone"
              }`}
            >
              <Icon name={item.icon} fallback="Circle" size={17} />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="ml-auto w-5 h-5 terra-gradient rounded-full text-white text-xs flex items-center justify-center">{item.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-mid hover:bg-muted hover:text-stone transition-all">
            <Icon name="LogOut" size={17} /><span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto pb-24 md:pb-8">
        <div className="px-4 md:px-8 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-3xl md:text-4xl font-light text-stone">Гильдия дизайнеров</h1>
            <p className="text-stone-mid text-sm mt-1">Сообщество профессионалов — находите коллег и партнёров</p>
          </div>

          {/* Search + filters */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-light" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Найти дизайнера..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Spec filter */}
              <div className="flex gap-1 bg-white border border-border rounded-xl p-1">
                {SPEC_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setSpecFilter(f.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${specFilter === f.value ? "terra-gradient text-white" : "text-stone-mid hover:text-stone"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {/* City select */}
              <select
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20"
              >
                {CITY_FILTERS.map(c => <option key={c}>{c}</option>)}
              </select>
              {/* View toggle */}
              <div className="ml-auto flex gap-1 bg-white border border-border rounded-xl p-1">
                <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "terra-gradient" : "hover:bg-muted"}`}>
                  <Icon name="LayoutGrid" size={15} className={viewMode === "grid" ? "text-white" : "text-stone-mid"} />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "terra-gradient" : "hover:bg-muted"}`}>
                  <Icon name="List" size={15} className={viewMode === "list" ? "text-white" : "text-stone-mid"} />
                </button>
              </div>
            </div>
          </div>

          {/* Count */}
          <p className="text-xs text-stone-light mb-4">Найдено: {designers.length} дизайнеров</p>

          {loading ? (
            <div className="text-center py-12 text-stone-mid animate-pulse">
              Загрузка дизайнеров...
            </div>
          ) : designers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <div className="w-16 h-16 bg-terra-pale rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Users" size={28} className="text-terra" />
              </div>
              <h3 className="font-display text-xl text-stone mb-2">Дизайнеры не найдены</h3>
              <p className="text-stone-mid text-sm">Попробуйте изменить фильтры поиска</p>
            </div>
          ) : (
            <>
              {/* Grid view */}
              {viewMode === "grid" && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {designers.map((d, i) => {
                    const color = getAvatarColor(d.id);
                    const initials = getInitials(d.first_name, d.last_name);
                    const specLabel = d.specialization ? (SPEC_LABELS[d.specialization] || d.specialization) : "";
                    const specColor = d.specialization ? (specColors[d.specialization] || "bg-muted text-stone-mid border-border") : "";
                    return (
                      <div
                        key={d.id}
                        className="bg-white rounded-2xl border border-border overflow-hidden hover:border-terra/30 hover:shadow-md hover:shadow-terra/5 transition-all animate-fade-in"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {/* Portfolio previews */}
                        <div className="h-24 grid grid-cols-3 gap-0.5 bg-muted">
                          {[0, 1, 2].map(j => (
                            <div key={j} className={`bg-gradient-to-br ${color} ${j === 0 ? "opacity-100" : j === 1 ? "opacity-70" : "opacity-50"} flex items-center justify-center`}>
                              <Icon name="Image" size={14} className="text-white/40" />
                            </div>
                          ))}
                        </div>
                        <div className="p-4">
                          {/* Avatar + name */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-stone text-sm truncate">{d.first_name} {d.last_name}</div>
                              <div className="flex items-center gap-1 text-xs text-stone-light">
                                <Icon name="MapPin" size={10} />
                                {d.city || "Не указан"}
                              </div>
                            </div>
                          </div>
                          {specLabel && (
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium mb-2.5 ${specColor}`}>
                              {specLabel}
                            </span>
                          )}
                          <div className="flex items-center justify-between mb-3">
                            <StarRating rating={d.rating} />
                            <span className="text-xs text-stone-light">{d.projects_count} проектов</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/guild/designer/${d.id}`)}
                              className="flex-1 text-xs py-2 rounded-xl border border-border text-stone hover:border-terra/40 hover:text-terra transition-all font-medium"
                            >
                              Профиль
                            </button>
                            <button className="flex-1 text-xs py-2 rounded-xl terra-gradient text-white hover:opacity-90 transition-all font-medium">
                              Написать
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* List view */}
              {viewMode === "list" && (
                <div className="bg-white rounded-2xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {["Дизайнер", "Специализация", "Город", "Рейтинг", "Проектов", ""].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs text-stone-light font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {designers.map(d => {
                          const color = getAvatarColor(d.id);
                          const initials = getInitials(d.first_name, d.last_name);
                          const specLabel = d.specialization ? (SPEC_LABELS[d.specialization] || d.specialization) : "-";
                          const specColor = d.specialization ? (specColors[d.specialization] || "bg-muted text-stone-mid border-border") : "bg-muted text-stone-mid border-border";
                          return (
                            <tr key={d.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-semibold`}>{initials}</div>
                                  <span className="text-sm font-medium text-stone">{d.first_name} {d.last_name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${specColor}`}>{specLabel}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-stone-mid">{d.city || "-"}</td>
                              <td className="px-4 py-3"><StarRating rating={d.rating} /></td>
                              <td className="px-4 py-3 text-sm text-stone-mid">{d.projects_count}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button onClick={() => navigate(`/guild/designer/${d.id}`)} className="text-xs px-3 py-1.5 rounded-xl border border-border text-stone hover:border-terra/40 transition-all">Профиль</button>
                                  <button className="text-xs px-3 py-1.5 rounded-xl terra-gradient text-white hover:opacity-90 transition-all">Написать</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-1 py-2 flex justify-around">
        {NAV_ITEMS.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all relative ${item.id === "guild" ? "text-terra" : "text-stone-light"}`}
          >
            <Icon name={item.icon} fallback="Circle" size={19} />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}