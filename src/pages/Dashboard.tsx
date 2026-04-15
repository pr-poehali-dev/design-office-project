import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { useProjects, useCreateProject, useUnreadCount } from "@/lib/queries";
import InboxBlock from "@/components/InboxBlock";

interface Project {
  id: string;
  title: string;
  status: string;
  description?: string;
  address?: string;
  area?: number;
  rooms?: number;
  style?: string;
  budget?: number;
  start_date?: string;
  deadline?: string;
  created_at: string;
  designer_first_name?: string;
  designer_last_name?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Черновик", color: "bg-gray-50 text-gray-600 border-gray-200" },
  active: { label: "В работе", color: "bg-blue-50 text-blue-700 border-blue-200" },
  review: { label: "Согласование", color: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "Завершён", color: "bg-green-50 text-green-700 border-green-200" },
};

const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "Users", label: "Клиенты", id: "clients", path: "" },
  { icon: "Handshake", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "UsersRound", label: "Команда", id: "team", path: "/team" },
  { icon: "User", label: "Профиль", id: "profile", path: "" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // New project form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newRooms, setNewRooms] = useState("");
  const [newStyle, setNewStyle] = useState("");
  const [newBudget, setNewBudget] = useState("");

  const { data: projects = [], isLoading: loadingProjects } = useProjects(!!user);
  const createProjectMutation = useCreateProject();
  const { data: unreadData } = useUnreadCount();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createProjectMutation.mutateAsync({
        title: newTitle,
        description: newDescription || undefined,
        address: newAddress || undefined,
        area: newArea ? parseFloat(newArea) : undefined,
        rooms: newRooms ? parseInt(newRooms) : undefined,
        style: newStyle || undefined,
        budget: newBudget ? parseFloat(newBudget) : undefined,
      });
      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
      setNewAddress("");
      setNewArea("");
      setNewRooms("");
      setNewStyle("");
      setNewBudget("");
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return "-";
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(budget);
  };

  const userInitials = user
    ? `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase()
    : "?";

  const activeCount = projects.filter((p) => p.status === "active").length;
  const reviewCount = projects.filter((p) => p.status === "review").length;
  const completedCount = projects.filter((p) => p.status === "completed").length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-stone-mid">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-border h-screen sticky top-0">
        <div className="p-5 border-b border-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="Layers" size={15} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-stone">DesignOffice</span>
          </button>
        </div>

        {/* Designer info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 terra-gradient rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {userInitials}
            </div>
            <div>
              <div className="text-sm font-semibold text-stone">{user?.first_name} {user?.last_name}</div>
              <div className="text-xs text-stone-mid">
                {user?.role === "designer" ? "Дизайнер интерьеров" : user?.role === "client" ? "Клиент" : "Работник"}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => item.path ? navigate(item.path) : setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeNav === item.id
                  ? "bg-terra-pale text-terra font-medium"
                  : "text-stone-mid hover:bg-muted hover:text-stone"
              }`}
            >
              <Icon name={item.icon} fallback="Circle" size={17} />
              <span>{item.label}</span>
              {item.id === "dashboard" && unreadData?.total_unread > 0 ? (
                <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {unreadData.total_unread > 9 ? "9+" : unreadData.total_unread}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-mid hover:bg-muted hover:text-stone transition-all"
          >
            <Icon name="LogOut" size={17} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-1 py-2 flex justify-around">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => item.path ? navigate(item.path) : setActiveNav(item.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all relative ${
              activeNav === item.id ? "text-terra" : "text-stone-light"
            }`}
          >
            <div className="relative">
              <Icon name={item.icon} fallback="Circle" size={19} />
              {item.id === "dashboard" && unreadData?.total_unread > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center">{unreadData.total_unread > 9 ? "+" : unreadData.total_unread}</span>
              )}
            </div>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-light text-stone">
              {activeNav === "dashboard" && "Обзор"}
              {activeNav === "projects" && "Проекты"}
              {activeNav === "tasks" && "Задачи"}
              {activeNav === "clients" && "Клиенты"}
              {activeNav === "guild" && "Гильдия"}
              {activeNav === "team" && "Команда"}
              {activeNav === "profile" && "Профиль"}
            </h1>
            <p className="text-stone-mid text-sm mt-0.5">
              {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {user?.role === "designer" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="terra-gradient text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Icon name="Plus" size={15} className="text-white" />
              <span className="hidden sm:inline">Новый проект</span>
            </button>
          )}
        </div>

        {activeNav === "dashboard" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Всего проектов", value: String(projects.length), icon: "FolderOpen", color: "text-blue-500" },
                { label: "Активных", value: String(activeCount), icon: "Zap", color: "text-purple-500" },
                { label: "На согласовании", value: String(reviewCount), icon: "Clock", color: "text-amber-500" },
                { label: "Завершено", value: String(completedCount), icon: "CheckCircle", color: "text-green-500" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-stone-light text-xs">{s.label}</span>
                    <Icon name={s.icon} fallback="Circle" size={15} className={s.color} />
                  </div>
                  <div className="font-display text-3xl font-light text-stone">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Inbox + Recent Projects */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-1">
                <InboxBlock />
              </div>
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-body font-semibold text-stone">Текущие проекты</h2>
                  {projects.length > 0 && (
                    <button onClick={() => setActiveNav("projects")} className="text-xs text-terra hover:underline">Все проекты</button>
                  )}
                </div>
                {loadingProjects ? (
                  <div className="text-center py-12 text-stone-mid animate-pulse">Загрузка проектов...</div>
                ) : projects.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-border p-12 text-center">
                    <div className="w-16 h-16 bg-terra-pale rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon name="FolderPlus" size={28} className="text-terra" />
                    </div>
                    <h3 className="font-display text-xl text-stone mb-2">Пока нет проектов</h3>
                    <p className="text-stone-mid text-sm mb-6">Создайте свой первый проект, чтобы начать работу</p>
                    {user?.role === "designer" && (
                      <button onClick={() => setShowCreateModal(true)} className="terra-gradient text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm">
                        Создать первый проект
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {projects.slice(0, 4).map((p, i) => {
                      const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.draft;
                      return (
                        <div key={p.id} onClick={() => navigate(`/project/${p.id}`)} className="bg-white rounded-2xl border border-border overflow-hidden hover-scale cursor-pointer hover:border-terra/30 hover:shadow-md hover:shadow-terra/5 transition-all animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                          <div className="h-28 bg-gradient-to-br from-terra-pale via-terra/10 to-stone/5 flex items-center justify-center relative">
                            <Icon name="Image" size={28} className="text-terra/25" />
                            <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full border font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-stone text-sm mb-1 leading-snug">{p.title}</h3>
                            {p.address && <div className="flex items-center gap-1.5 text-stone-mid text-xs"><Icon name="MapPin" size={11} /><span>{p.address}</span></div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeNav === "profile" && (
          <div className="max-w-lg">
            <div className="bg-white rounded-2xl border border-border p-6 mb-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 terra-gradient rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                  {userInitials}
                </div>
                <div>
                  <h2 className="font-semibold text-stone text-lg">{user?.first_name} {user?.last_name}</h2>
                  <p className="text-stone-mid text-sm">{user?.email}</p>
                </div>
              </div>
              <div className="bg-muted rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-light mb-1">Ваш личный ID</p>
                    <p className="font-mono text-xl font-bold text-stone tracking-wider">{user?.personal_id || "—"}</p>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(user?.personal_id || ""); }}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border text-stone-mid hover:bg-white transition-colors"
                  >
                    <Icon name="Copy" size={13} /> Копировать
                  </button>
                </div>
                <p className="text-xs text-stone-light mt-2">Поделитесь ID, чтобы вас могли найти и пригласить в проект или команду</p>
              </div>
              <div className="space-y-3">
                {user?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Icon name="Phone" size={15} className="text-stone-light" />
                    <span className="text-stone">{user.phone}</span>
                  </div>
                )}
                {user?.city && (
                  <div className="flex items-center gap-3 text-sm">
                    <Icon name="MapPin" size={15} className="text-stone-light" />
                    <span className="text-stone">{user.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Icon name="Briefcase" size={15} className="text-stone-light" />
                  <span className="text-stone">{user?.role === "designer" ? "Дизайнер интерьеров" : user?.role === "client" ? "Клиент" : "Работник"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeNav === "projects" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-body font-semibold text-stone">Все проекты</h2>
            </div>
            {loadingProjects ? (
              <div className="text-center py-12 text-stone-mid animate-pulse">Загрузка проектов...</div>
            ) : projects.length === 0 ? (
              <div className="bg-white rounded-2xl border border-border p-12 text-center">
                <div className="w-16 h-16 bg-terra-pale rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="FolderPlus" size={28} className="text-terra" />
                </div>
                <h3 className="font-display text-xl text-stone mb-2">Пока нет проектов</h3>
                <p className="text-stone-mid text-sm mb-6">Создайте свой первый проект, чтобы начать работу</p>
                {user?.role === "designer" && (
                  <button onClick={() => setShowCreateModal(true)} className="terra-gradient text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm">
                    Создать первый проект
                  </button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((p, i) => {
                  const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.draft;
                  return (
                    <div key={p.id} onClick={() => navigate(`/project/${p.id}`)} className="bg-white rounded-2xl border border-border overflow-hidden hover-scale cursor-pointer hover:border-terra/30 hover:shadow-md hover:shadow-terra/5 transition-all animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="h-36 bg-gradient-to-br from-terra-pale via-terra/10 to-stone/5 flex items-center justify-center relative">
                        <Icon name="Image" size={32} className="text-terra/25" />
                        <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full border font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-stone text-sm mb-1 leading-snug">{p.title}</h3>
                        {p.address && (
                          <div className="flex items-center gap-1.5 text-stone-mid text-xs mb-3">
                            <Icon name="MapPin" size={11} /><span>{p.address}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                          <div className="text-center">
                            <div className="text-xs text-stone-light">Площадь</div>
                            <div className="text-xs font-medium text-stone mt-0.5">{p.area ? `${p.area} м²` : "-"}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-stone-light">Бюджет</div>
                            <div className="text-xs font-medium text-stone mt-0.5">{formatBudget(p.budget)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-stone-light">Дата</div>
                            <div className="text-xs font-medium text-stone mt-0.5">{formatDate(p.created_at)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-light text-stone">Новый проект</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                <Icon name="X" size={18} className="text-stone-mid" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone mb-1.5">Название проекта *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Квартира на Тверской"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone mb-1.5">Описание</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Краткое описание проекта..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone mb-1.5">Адрес</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="ул. Тверская, д. 15, кв. 42"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone mb-1.5">Площадь (м²)</label>
                  <input
                    type="number"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    placeholder="85"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone mb-1.5">Комнат</label>
                  <input
                    type="number"
                    value={newRooms}
                    onChange={(e) => setNewRooms(e.target.value)}
                    placeholder="3"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone mb-1.5">Стиль</label>
                  <input
                    type="text"
                    value={newStyle}
                    onChange={(e) => setNewStyle(e.target.value)}
                    placeholder="Современный"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone mb-1.5">Бюджет</label>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    placeholder="1500000"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-stone-mid text-sm font-medium hover:bg-muted transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 terra-gradient text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {creating ? "Создаём..." : "Создать проект"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}