import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { useProjects, useUnreadCount } from "@/lib/queries";
import DashboardSidebar from "./dashboard/DashboardSidebar";
import { DashboardView, ProjectsView } from "./dashboard/DashboardContent";
import CreateProjectModal from "./dashboard/CreateProjectModal";
import ProfilePage from "./dashboard/ProfilePage";

const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "BookUser", label: "Контрагенты", id: "contractors", path: "/contractors" },
  { icon: "Users", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "User", label: "П��офиль", id: "profile", path: "/dashboard?tab=profile" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout, loading: authLoading } = useAuth();
  const [activeNav, setActiveNav] = useState(searchParams.get("tab") || "dashboard");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const changeNav = (id: string) => {
    setActiveNav(id);
    if (id === "dashboard") { setSearchParams({}); } else { setSearchParams({ tab: id }); }
  };

  const { data: projects = [], isLoading: loadingProjects } = useProjects(!!user);
  const { data: unreadData } = useUnreadCount();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userInitials = user
    ? `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase()
    : "?";

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  const userRole = user?.role === "designer" ? "Дизайнер интерьеров" : user?.role === "client" ? "Клиент" : "Работник";
  const isDesigner = user?.role === "designer";

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
      <DashboardSidebar
        navItems={NAV_ITEMS}
        activeNav={activeNav}
        userInitials={userInitials}
        userName={userName}
        userRole={userRole}
        unreadCount={unreadData?.total_unread || 0}
        onNavClick={(item) => {
          if (item.path && !item.path.startsWith("/dashboard")) {
            navigate(item.path);
          } else {
            changeNav(item.id);
          }
        }}
        onLogoClick={() => navigate("/")}
        onLogout={handleLogout}
      />

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
          {isDesigner && (
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
          <DashboardView
            projects={projects}
            loadingProjects={loadingProjects}
            activeCount={activeCount}
            reviewCount={reviewCount}
            completedCount={completedCount}
            isDesigner={!!isDesigner}
            onCreateProject={() => setShowCreateModal(true)}
            onOpenProject={(id) => navigate(`/project/${id}`)}
            onGoToProjects={() => changeNav("projects")}
          />
        )}

        {activeNav === "profile" && (
          <ProfilePage />
        )}

        {activeNav === "projects" && (
          <ProjectsView
            projects={projects}
            loadingProjects={loadingProjects}
            isDesigner={!!isDesigner}
            onCreateProject={() => setShowCreateModal(true)}
            onOpenProject={(id) => navigate(`/project/${id}`)}
          />
        )}
      </main>

      {showCreateModal && (
        <CreateProjectModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}