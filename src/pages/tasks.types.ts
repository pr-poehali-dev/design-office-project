export type Priority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "doing" | "review" | "done";

export interface Task {
  id: number;
  title: string;
  project: string;
  priority: Priority;
  deadline: string;
  deadlineDate: string;
  status: TaskStatus;
  assignee: string;
}

export const PROJECT_COLORS: Record<string, string> = {};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  high: { label: "Высокий", color: "text-red-600", dot: "bg-red-500" },
  medium: { label: "Средний", color: "text-amber-600", dot: "bg-amber-400" },
  low: { label: "Низкий", color: "text-green-600", dot: "bg-green-400" },
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "К выполнению",
  doing: "В работе",
  review: "На проверке",
  done: "Готово",
};

export const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "/dashboard" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "/dashboard" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "Users", label: "Клиенты", id: "clients", path: "/dashboard" },
  { icon: "Handshake", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "MessageCircle", label: "Сообщения", id: "messages", path: "/dashboard" },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard" },
];

export const INIT_TASKS: Task[] = [];
