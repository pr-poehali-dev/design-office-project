import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { getPartners, createPartner, updatePartner, archivePartner, getPartner } from "@/lib/api";
import { useUnreadCount } from "@/lib/queries";
import DashboardSidebar from "./dashboard/DashboardSidebar";
import { Partner } from "./partners/PartnerTypes";
import PartnerList from "./partners/PartnerList";
import PartnerCard from "./partners/PartnerCard";
import PartnerForm from "./partners/PartnerForm";
import { toast } from "sonner";

const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "/dashboard" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "/dashboard?tab=projects" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "Handshake", label: "Партнёры", id: "partners", path: "/partners" },
  { icon: "Users", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "UsersRound", label: "Команда", id: "team", path: "/team" },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard?tab=profile" },
];

type View = "list" | "detail" | "create" | "edit";

export default function Partners() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const { data: unreadData } = useUnreadCount();

  const [view, setView] = useState<View>("list");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Partner | null>(null);
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType) params.type = filterType;
      if (search.trim()) params.search = search.trim();
      const data = await getPartners(params);
      setPartners(data.partners || []);
    } catch {
      toast.error("Не удалось загрузить партнёров");
    } finally {
      setLoading(false);
    }
  }, [filterType, search]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) fetchPartners();
  }, [user, authLoading, navigate, fetchPartners]);

  const handleSelectPartner = async (p: Partner) => {
    try {
      const data = await getPartner(p.id);
      setSelected(data.partner);
      setView("detail");
    } catch {
      toast.error("Не удалось загрузить партнёра");
    }
  };

  const handleCreate = async (formData: Record<string, unknown>) => {
    setSaving(true);
    try {
      await createPartner(formData);
      toast.success("Партнёр добавлен");
      setView("list");
      fetchPartners();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка создания");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (formData: Record<string, unknown>) => {
    if (!selected) return;
    setSaving(true);
    try {
      const data = await updatePartner(selected.id, formData);
      toast.success("Партнёр обновлён");
      setSelected(data.partner);
      setView("detail");
      fetchPartners();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!selected) return;
    try {
      const data = await archivePartner(selected.id);
      setSelected(data.partner);
      toast.success(data.partner.is_archived ? "Партнёр архивирован" : "Партнёр восстановлен");
      fetchPartners();
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleNavClick = (item: { path: string; id: string }) => {
    if (item.path && item.id !== "partners") {
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

  if (!user) return null;

  const userInitials = `${(user.first_name?.[0] || "").toUpperCase()}${(user.last_name?.[0] || "").toUpperCase()}`;
  const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email;
  const userRole = user.role === "designer" ? "Дизайнер" : "Клиент";

  return (
    <div className="flex min-h-screen warm-bg">
      <DashboardSidebar
        navItems={NAV_ITEMS}
        activeNav="partners"
        userInitials={userInitials}
        userName={userName}
        userRole={userRole}
        unreadCount={unreadData?.count || 0}
        onNavClick={handleNavClick}
        onLogoClick={() => navigate("/dashboard")}
        onLogout={logout}
      />

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {view === "list" && (
            <PartnerList
              partners={partners}
              loading={loading}
              onSelect={handleSelectPartner}
              onAdd={() => setView("create")}
              filterType={filterType}
              onFilterType={setFilterType}
              search={search}
              onSearch={setSearch}
            />
          )}

          {view === "detail" && selected && (
            <PartnerCard
              partner={selected}
              onEdit={() => setView("edit")}
              onArchive={handleArchive}
              onBack={() => { setSelected(null); setView("list"); }}
            />
          )}

          {view === "create" && (
            <PartnerForm
              onSave={handleCreate}
              onCancel={() => setView("list")}
              saving={saving}
            />
          )}

          {view === "edit" && selected && (
            <PartnerForm
              partner={selected}
              onSave={handleUpdate}
              onCancel={() => setView("detail")}
              saving={saving}
            />
          )}
        </div>
      </main>
    </div>
  );
}
