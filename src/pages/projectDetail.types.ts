export const fmtMoney = (n: number) => n.toLocaleString("ru-RU") + " ₽";

export const STYLE_OPTIONS = ["Modern", "Loft", "Scandinavian", "Classic", "Minimalism", "Art Deco", "Japandi", "Eclectic"];

export const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "/dashboard" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "/dashboard" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "Users", label: "Клиенты", id: "clients", path: "/dashboard" },
  { icon: "Handshake", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "UsersRound", label: "Команда", id: "team", path: "/team" },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard" },
];

export const TABS = [
  { id: "overview", label: "Обзор", icon: "LayoutDashboard" },
  { id: "execution", label: "Выполнение", icon: "ListChecks" },
  { id: "brief", label: "Бриф", icon: "ClipboardList" },
  { id: "estimate", label: "Смета", icon: "Receipt" },
  { id: "finance", label: "Финансы", icon: "TrendingUp" },
  { id: "documents", label: "Документы", icon: "FolderOpen" },
];