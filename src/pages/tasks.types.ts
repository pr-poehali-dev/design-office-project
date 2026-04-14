// ─── Types ────────────────────────────────────────────────────────────────────
export type Priority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "doing" | "review" | "done";

export interface Task {
  id: number;
  title: string;
  project: string;
  priority: Priority;
  deadline: string; // DD.MM.YYYY
  deadlineDate: string; // YYYY-MM-DD for sorting
  status: TaskStatus;
  assignee: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const PROJECT_COLORS: Record<string, string> = {
  "Квартира на Тверской": "bg-terra-pale text-terra border-terra/20",
  "Загородный дом": "bg-blue-50 text-blue-700 border-blue-200",
  "Студия на Арбате": "bg-purple-50 text-purple-700 border-purple-200",
};

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
  { icon: "MessageCircle", label: "Сообщения", id: "messages", path: "/dashboard", badge: 3 },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard" },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
export const INIT_TASKS: Task[] = [
  { id: 1, title: "Согласовать планировку кухни", project: "Квартира на Тверской", priority: "high", deadline: "16.04.2025", deadlineDate: "2025-04-16", status: "doing", assignee: "ЕС" },
  { id: 2, title: "Подобрать светильники для гостиной", project: "Квартира на Тверской", priority: "medium", deadline: "17.04.2025", deadlineDate: "2025-04-17", status: "todo", assignee: "ЕС" },
  { id: 3, title: "Отправить мудборд клиенту", project: "Загородный дом", priority: "high", deadline: "15.04.2025", deadlineDate: "2025-04-15", status: "review", assignee: "ЕС" },
  { id: 4, title: "Заказать образцы ткани", project: "Квартира на Тверской", priority: "low", deadline: "20.04.2025", deadlineDate: "2025-04-20", status: "todo", assignee: "ЕС" },
  { id: 5, title: "Встреча с клиентом на объекте", project: "Загородный дом", priority: "high", deadline: "18.04.2025", deadlineDate: "2025-04-18", status: "todo", assignee: "ЕС" },
  { id: 6, title: "Подготовить 3D-визуализацию спальни", project: "Квартира на Тверской", priority: "high", deadline: "22.04.2025", deadlineDate: "2025-04-22", status: "todo", assignee: "ЕС" },
  { id: 7, title: "Согласовать смету с клиентом", project: "Загородный дом", priority: "medium", deadline: "19.04.2025", deadlineDate: "2025-04-19", status: "doing", assignee: "ЕС" },
  { id: 8, title: "Проверить поставку мебели", project: "Студия на Арбате", priority: "medium", deadline: "16.04.2025", deadlineDate: "2025-04-16", status: "doing", assignee: "ЕС" },
  { id: 9, title: "Подписать акт этапа 2", project: "Студия на Арбате", priority: "low", deadline: "21.04.2025", deadlineDate: "2025-04-21", status: "todo", assignee: "ЕС" },
  { id: 10, title: "Ревизия чертежей", project: "Квартира на Тверской", priority: "high", deadline: "23.04.2025", deadlineDate: "2025-04-23", status: "todo", assignee: "ЕС" },
  { id: 11, title: "Финальная фотосессия", project: "Студия на Арбате", priority: "medium", deadline: "25.04.2025", deadlineDate: "2025-04-25", status: "todo", assignee: "ЕС" },
  { id: 12, title: "Оплатить поставщику плитки", project: "Загородный дом", priority: "high", deadline: "17.04.2025", deadlineDate: "2025-04-17", status: "todo", assignee: "ЕС" },
];
