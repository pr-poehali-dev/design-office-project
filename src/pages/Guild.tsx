import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { useDesigners, useSendDm } from "@/lib/queries";

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
  personal_id?: string;
  experience_years?: number;
  work_styles?: string;
  work_objects?: string;
  accepting_orders?: boolean;
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
  { icon: "UsersRound", label: "Команда", id: "team", path: "/team" },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard?tab=profile" },
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

const GUILD_TABS = [
  { id: "members", label: "Участники", icon: "Users" },
  { id: "forum", label: "Форум", icon: "MessageSquare" },
  { id: "events", label: "Мероприятия", icon: "Calendar" },
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
  const [guildTab, setGuildTab] = useState("members");
  const [dmTarget, setDmTarget] = useState<{id: string, name: string} | null>(null);
  const [dmInput, setDmInput] = useState("");
  const [dmSending, setDmSending] = useState(false);

  const sendDmMutation = useSendDm(user ? { id: user.id, first_name: user.first_name, last_name: user.last_name } : undefined);

  const params = {
    specialization: specFilter || undefined,
    city: cityFilter === "Все города" ? undefined : cityFilter,
    search: search || undefined,
  };
  const { data: designers = [], isLoading: loading } = useDesigners(params);

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

          {/* Guild Tabs */}
          <div className="flex gap-1 bg-white border border-border rounded-2xl p-1 mb-6 w-fit">
            {GUILD_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setGuildTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  guildTab === tab.id
                    ? "terra-gradient text-white shadow-sm"
                    : "text-stone-mid hover:text-stone hover:bg-muted"
                }`}
              >
                <Icon name={tab.icon} fallback="Circle" size={15} className={guildTab === tab.id ? "text-white" : ""} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Members Tab */}
          {guildTab === "members" && (
            <>
              {/* Search + filters */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="relative">
                  <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-light" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Найти по имени или ID..."
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
              <p className="text-xs text-stone-light mb-4">Участников: {designers.length}</p>

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
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {designers.map((d: Designer, i: number) => {
                        const color = getAvatarColor(d.id);
                        const initials = getInitials(d.first_name, d.last_name);
                        const specLabel = d.specialization ? (SPEC_LABELS[d.specialization] || d.specialization) : "";
                        const workStyles = (d.work_styles || "").split(",").map(s => s.trim()).filter(Boolean);
                        return (
                          <div
                            key={d.id}
                            className="bg-white rounded-2xl border border-border p-5 hover:border-terra/30 hover:shadow-md transition-all animate-fade-in"
                            style={{ animationDelay: `${i * 0.05}s` }}
                          >
                            {/* Top: avatar + name + city */}
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex-shrink-0">
                                {d.avatar_url ? (
                                  <img src={d.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                                ) : (
                                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-semibold`}>{initials}</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-stone text-sm">{d.first_name} {d.last_name}</h3>
                                <p className="text-xs text-stone-mid">{specLabel || "Дизайнер интерьеров"}</p>
                                {d.city && (
                                  <p className="flex items-center gap-1 text-xs text-stone-light mt-0.5">
                                    <Icon name="MapPin" size={10} />{d.city}
                                  </p>
                                )}
                              </div>
                              {d.accepting_orders !== false && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium flex-shrink-0">Берёт заказы</span>
                              )}
                            </div>

                            {/* Specialization badges */}
                            {workStyles.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {workStyles.slice(0, 3).map(s => (
                                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-terra-pale text-terra border border-terra/20 font-medium">{s}</span>
                                ))}
                              </div>
                            )}

                            {/* Stats row */}
                            <div className="flex items-center gap-4 mb-3 text-xs text-stone-mid">
                              {(d.experience_years ?? 0) > 0 && <span>Опыт {d.experience_years} лет</span>}
                              <span>{d.projects_count || 0} проектов</span>
                            </div>

                            {/* Bio */}
                            {d.bio && <p className="text-xs text-stone-mid leading-relaxed mb-4 line-clamp-2">{d.bio}</p>}

                            {/* Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/guild/designer/${d.id}`)}
                                className="flex-1 text-xs py-2 rounded-xl border border-border text-stone hover:border-terra/40 hover:text-terra transition-all font-medium"
                              >
                                Портфолио
                              </button>
                              {d.id !== user?.id && (
                                <>
                                  <button
                                    onClick={() => setDmTarget({ id: d.id, name: `${d.first_name} ${d.last_name}` })}
                                    className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-xl terra-gradient text-white hover:opacity-90 font-medium"
                                  >
                                    <Icon name="MessageCircle" size={12} /> Написать
                                  </button>
                                  <button
                                    onClick={() => setDmTarget({ id: d.id, name: `${d.first_name} ${d.last_name}` })}
                                    className="text-xs py-2 px-3 rounded-xl border border-border text-stone-mid hover:bg-muted transition-all"
                                  >
                                    <Icon name="UserPlus" size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* List view */}
                  {viewMode === "list" && (
                    <div className="space-y-3">
                      {designers.map((d: Designer) => {
                        const color = getAvatarColor(d.id);
                        const initials = getInitials(d.first_name, d.last_name);
                        const specLabel = d.specialization ? (SPEC_LABELS[d.specialization] || d.specialization) : "";
                        const workStyles = (d.work_styles || "").split(",").map(s => s.trim()).filter(Boolean);
                        return (
                          <div
                            key={d.id}
                            className="bg-white rounded-2xl border border-border p-4 hover:border-terra/30 hover:shadow-md transition-all flex items-center gap-4"
                          >
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              {d.avatar_url ? (
                                <img src={d.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                              ) : (
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-semibold text-sm`}>{initials}</div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-semibold text-stone text-sm">{d.first_name} {d.last_name}</h3>
                                {d.accepting_orders !== false && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">Берёт заказы</span>
                                )}
                              </div>
                              <p className="text-xs text-stone-mid">{specLabel || "Дизайнер интерьеров"}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-stone-light">
                                {d.city && (
                                  <span className="flex items-center gap-1"><Icon name="MapPin" size={10} />{d.city}</span>
                                )}
                                {(d.experience_years ?? 0) > 0 && <span>Опыт {d.experience_years} лет</span>}
                                <span>{d.projects_count || 0} проектов</span>
                              </div>
                              {workStyles.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {workStyles.slice(0, 3).map(s => (
                                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-terra-pale text-terra border border-terra/20 font-medium">{s}</span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => navigate(`/guild/designer/${d.id}`)}
                                className="text-xs px-3 py-2 rounded-xl border border-border text-stone hover:border-terra/40 hover:text-terra transition-all font-medium"
                              >
                                Портфолио
                              </button>
                              {d.id !== user?.id && (
                                <>
                                  <button
                                    onClick={() => setDmTarget({ id: d.id, name: `${d.first_name} ${d.last_name}` })}
                                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl terra-gradient text-white hover:opacity-90 font-medium"
                                  >
                                    <Icon name="MessageCircle" size={12} /> Написать
                                  </button>
                                  <button
                                    onClick={() => setDmTarget({ id: d.id, name: `${d.first_name} ${d.last_name}` })}
                                    className="text-xs py-2 px-3 rounded-xl border border-border text-stone-mid hover:bg-muted transition-all"
                                  >
                                    <Icon name="UserPlus" size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Forum Tab */}
          {guildTab === "forum" && (
            <div className="bg-white rounded-2xl border border-border p-16 text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="MessageSquare" size={36} className="text-stone-light" />
              </div>
              <h3 className="font-display text-2xl text-stone mb-2">Форум — скоро!</h3>
              <p className="text-stone-mid text-sm mb-6">Здесь вы сможете обсуждать проекты, делиться опытом и задавать вопросы коллегам.</p>
              <button onClick={() => alert("Мы сообщим вам о запуске форума!")} className="terra-gradient text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90">Узнать о запуске первым</button>
            </div>
          )}

          {/* Events Tab */}
          {guildTab === "events" && (
            <div className="bg-white rounded-2xl border border-border p-16 text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Calendar" size={36} className="text-stone-light" />
              </div>
              <h3 className="font-display text-2xl text-stone mb-2">Мероприятия — скоро!</h3>
              <p className="text-stone-mid text-sm mb-6">Вебинары, мастер-классы и встречи сообщества дизайнеров интерьеров.</p>
              <button onClick={() => alert("Мы сообщим вам о запуске мероприятий!")} className="terra-gradient text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90">Узнать о запуске первым</button>
            </div>
          )}
        </div>
      </main>

      {/* DM Modal */}
      {dmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-stone">Написать {dmTarget.name}</h3>
              <button onClick={() => { setDmTarget(null); setDmInput(""); }} className="p-1.5 hover:bg-muted rounded-lg"><Icon name="X" size={16} className="text-stone-mid" /></button>
            </div>
            <textarea value={dmInput} onChange={e => setDmInput(e.target.value)} placeholder="Ваше сообщение..." rows={4} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 resize-none mb-3" autoFocus />
            <button
              onClick={async () => {
                if (!dmInput.trim()) return;
                setDmSending(true);
                try {
                  await sendDmMutation.mutateAsync({ receiver_id: dmTarget.id, content: dmInput.trim() });
                  setDmTarget(null);
                  setDmInput("");
                } catch { /* empty */ }
                setDmSending(false);
              }}
              disabled={!dmInput.trim() || dmSending}
              className="w-full terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {dmSending ? "Отправка..." : "Отправить"}
            </button>
          </div>
        </div>
      )}

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
