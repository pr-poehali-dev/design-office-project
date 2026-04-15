import { useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { useUnreadCount } from "@/lib/queries";
import DashboardSidebar from "./dashboard/DashboardSidebar";
import PartnersTab from "./contractors/PartnersTab";
import TeamTab from "./contractors/TeamTab";
import ClientsTab from "./contractors/ClientsTab";

const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "/dashboard" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "/dashboard?tab=projects" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "BookUser", label: "Контрагенты", id: "contractors", path: "/contractors" },
  { icon: "Users", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard?tab=profile" },
];

const TABS = [
  { id: "partners", label: "Партнёры", icon: "Handshake" },
  { id: "team", label: "Команда", icon: "UsersRound" },
  { id: "clients", label: "Клиенты", icon: "UserCheck" },
] as const;

type TabId = typeof TABS[number]["id"];

function resolveInitialTab(pathname: string, tabParam: string | null): TabId {
  if (pathname === "/team") return "team";
  if (pathname === "/partners") return "partners";
  if (tabParam && TABS.some(t => t.id === tabParam)) return tabParam as TabId;
  return "partners";
}

export default function Contractors() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout, loading: authLoading } = useAuth();
  const { data: unreadData } = useUnreadCount();

  const [activeTab, setActiveTab] = useState<TabId>(
    resolveInitialTab(location.pathname, searchParams.get("tab"))
  );

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams(tab === "partners" ? {} : { tab });
  };

  const handleNavClick = (item: { path: string; id: string }) => {
    if (item.path && item.id !== "contractors") {
      navigate(item.path);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center warm-bg">
        <div className="w-10 h-10 border-2 border-terra/30 border-t-terra rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const userInitials = `${(user.first_name?.[0] || "").toUpperCase()}${(user.last_name?.[0] || "").toUpperCase()}`;
  const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email;
  const userRole = user.role === "designer" ? "Дизайнер" : "Клиент";

  return (
    <div className="flex min-h-screen warm-bg">
      <DashboardSidebar
        navItems={NAV_ITEMS}
        activeNav="contractors"
        userInitials={userInitials}
        userName={userName}
        userRole={userRole}
        unreadCount={unreadData?.count || 0}
        onNavClick={handleNavClick}
        onLogoClick={() => navigate("/dashboard")}
        onLogout={logout}
      />

      <main className="flex-1 overflow-auto pb-24 md:pb-8">
        <div className="px-4 md:px-8 py-6">
          <h1 className="font-display text-3xl md:text-4xl font-light text-stone mb-6">Контрагенты</h1>

          <div className="flex gap-1 mb-6 bg-white rounded-2xl border border-border p-1.5 inline-flex">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-terra-pale text-terra font-medium shadow-sm"
                    : "text-stone-mid hover:bg-muted hover:text-stone"
                }`}
              >
                <Icon name={tab.icon} size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "partners" && <PartnersTab />}
          {activeTab === "team" && <TeamTab user={user} />}
          {activeTab === "clients" && <ClientsTab />}
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-1 py-2 flex justify-around">
        {NAV_ITEMS.slice(0, 5).map(item => (
          <button key={item.id} onClick={() => item.id === "contractors" ? {} : navigate(item.path)} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${item.id === "contractors" ? "text-terra" : "text-stone-light"}`}>
            <Icon name={item.icon} fallback="Circle" size={19} />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}