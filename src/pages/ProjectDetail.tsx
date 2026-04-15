import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { useProject } from "@/lib/queries";
import { TABS, fmtMoney } from "./projectDetail.types";
import { OverviewTab, ExecutionTab } from "./ProjectOverviewTab";
import { BriefTab, EstimateTab, FinanceTab, DocsTab } from "./ProjectDataTabs";
import ProposalTab from "./ProposalTab";

const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "/dashboard" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "/dashboard" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "Users", label: "Клиенты", id: "clients", path: "/dashboard" },
  { icon: "Handshake", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "UsersRound", label: "Команда", id: "team", path: "/team" },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard" },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Черновик", color: "bg-gray-50 text-gray-600 border-gray-200" },
  active: { label: "В работе", color: "bg-blue-50 text-blue-700 border-blue-200" },
  review: { label: "Согласование", color: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "Завершён", color: "bg-green-50 text-green-700 border-green-200" },
};

export interface ProjectData {
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
  designer_id: string;
  designer_first_name?: string;
  designer_last_name?: string;
  designer_email?: string;
  stages?: StageData[];
  members?: MemberData[];
}

export interface StageData {
  id: string;
  title: string;
  description?: string;
  status: string;
  order_number: number;
  start_date?: string;
  end_date?: string;
}

export interface MemberData {
  id: string;
  user_id: string;
  role: string;
  accepted: boolean;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeNav, setActiveNav] = useState("projects");

  const { data: project, isLoading: loading, error: queryError, refetch } = useProject(id, !!user);
  const error = queryError ? (
    queryError.message.includes("not found") || queryError.message.includes("Not found") ? "not_found" :
    queryError.message.includes("Access denied") ? "access_denied" :
    queryError.message
  ) : "";

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const handleNavClick = (item: { id: string; path: string }) => {
    setActiveNav(item.id);
    navigate(item.path);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userInitials = user
    ? `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase()
    : "?";

  const statusInfo = project ? (STATUS_MAP[project.status] || STATUS_MAP.draft) : STATUS_MAP.draft;

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  };

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
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeNav === item.id ? "bg-terra-pale text-terra font-medium" : "text-stone-mid hover:bg-muted hover:text-stone"
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
        {/* Header with back button */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 md:px-8 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-sm text-stone-mid hover:text-stone transition-colors"
            >
              <Icon name="ArrowLeft" size={16} />
              <span className="hidden sm:inline">Назад</span>
            </button>
            <span className="text-stone-light">/</span>
            <span className="text-sm text-stone-mid hidden sm:inline">Проекты</span>
            <span className="text-stone-light hidden sm:inline">/</span>
            <span className="text-sm font-medium text-stone truncate">{project?.title || "Загрузка..."}</span>
            {project && (
              <div className="ml-auto">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-8 py-5">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-12 h-12 terra-gradient rounded-2xl flex items-center justify-center mb-4 animate-pulse">
                <Icon name="Loader2" size={22} className="text-white animate-spin" />
              </div>
              <p className="text-stone-mid text-sm">Загрузка проекта...</p>
            </div>
          )}

          {/* Error: not found */}
          {!loading && error === "not_found" && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <Icon name="SearchX" size={28} className="text-stone-light" />
              </div>
              <h2 className="font-display text-2xl text-stone mb-2">Проект не найден</h2>
              <p className="text-stone-mid text-sm mb-6">Возможно, он был удалён или вы перешли по неверной ссылке</p>
              <button
                onClick={() => navigate("/dashboard")}
                className="terra-gradient text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm"
              >
                Вернуться в дашборд
              </button>
            </div>
          )}

          {/* Error: access denied */}
          {!loading && error === "access_denied" && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <Icon name="ShieldX" size={28} className="text-red-400" />
              </div>
              <h2 className="font-display text-2xl text-stone mb-2">Нет доступа</h2>
              <p className="text-stone-mid text-sm mb-6">У вас нет прав для просмотра этого проекта</p>
              <button
                onClick={() => navigate("/dashboard")}
                className="terra-gradient text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm"
              >
                Вернуться в дашборд
              </button>
            </div>
          )}

          {/* Error: generic */}
          {!loading && error && error !== "not_found" && error !== "access_denied" && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                <Icon name="AlertTriangle" size={28} className="text-amber-500" />
              </div>
              <h2 className="font-display text-2xl text-stone mb-2">Ошибка загрузки</h2>
              <p className="text-stone-mid text-sm mb-6">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => refetch()}
                  className="terra-gradient text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm"
                >
                  Попробовать снова
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="border border-border text-stone font-medium px-6 py-3 rounded-xl hover:bg-muted transition-all text-sm"
                >
                  В дашборд
                </button>
              </div>
            </div>
          )}

          {/* Project loaded */}
          {!loading && !error && project && (
            <>
              {/* Tabs — scrollable on mobile */}
              <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 mb-6">
                <div className="flex gap-1 bg-white border border-border rounded-2xl p-1 min-w-max md:min-w-0">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? "terra-gradient text-white shadow-sm"
                          : "text-stone-mid hover:text-stone hover:bg-muted"
                      }`}
                    >
                      <Icon name={tab.icon} fallback="Circle" size={14} className={activeTab === tab.id ? "text-white" : ""} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="animate-fade-in" key={activeTab}>
                {activeTab === "overview" && <OverviewTab project={project} />}
                {activeTab === "proposal" && <ProposalTab project={project} />}
                {activeTab === "execution" && <ExecutionTab project={project} />}
                {activeTab === "brief" && <BriefTab />}
                {activeTab === "estimate" && <EstimateTab projectId={project.id} />}
                {activeTab === "finance" && <FinanceTab projectId={project.id} />}
                {activeTab === "documents" && <DocsTab projectId={project.id} />}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-1 py-2 flex justify-around">
        {NAV_ITEMS.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all relative ${
              activeNav === item.id ? "text-terra" : "text-stone-light"
            }`}
          >
            <Icon name={item.icon} fallback="Circle" size={19} />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}