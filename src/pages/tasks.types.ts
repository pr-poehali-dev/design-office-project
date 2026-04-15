export type Priority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export interface Task {
  id: string;
  title: string;
  project_id: string | null;
  project_title: string | null;
  priority: Priority;
  deadline: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  assigned_first_name: string | null;
  assigned_last_name: string | null;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  high: { label: "Высокий", color: "text-red-600", dot: "bg-red-500" },
  medium: { label: "Средний", color: "text-amber-600", dot: "bg-amber-400" },
  low: { label: "Низкий", color: "text-green-600", dot: "bg-green-400" },
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "К выполнению",
  in_progress: "В работе",
  review: "На проверке",
  done: "Готово",
};

export const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "/dashboard" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "/dashboard" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "Users", label: "Клиенты", id: "clients", path: "/dashboard" },
  { icon: "Handshake", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "UsersRound", label: "Команда", id: "team", path: "/team" },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard" },
];

export interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
}

export function formatDeadline(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function getAssigneeInitials(task: Task): string {
  if (!task.assigned_first_name) return "?";
  return `${(task.assigned_first_name[0] || "").toUpperCase()}${(task.assigned_last_name?.[0] || "").toUpperCase()}`;
}