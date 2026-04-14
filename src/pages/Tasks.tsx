import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

// ─── Types & Data ─────────────────────────────────────────────────────────────
type Priority = "high" | "medium" | "low";
type TaskStatus = "todo" | "doing" | "review" | "done";

interface Task {
  id: number;
  title: string;
  project: string;
  priority: Priority;
  deadline: string; // DD.MM.YYYY
  deadlineDate: string; // YYYY-MM-DD for sorting
  status: TaskStatus;
  assignee: string;
}

const PROJECT_COLORS: Record<string, string> = {
  "Квартира на Тверской": "bg-terra-pale text-terra border-terra/20",
  "Загородный дом": "bg-blue-50 text-blue-700 border-blue-200",
  "Студия на Арбате": "bg-purple-50 text-purple-700 border-purple-200",
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  high: { label: "Высокий", color: "text-red-600", dot: "bg-red-500" },
  medium: { label: "Средний", color: "text-amber-600", dot: "bg-amber-400" },
  low: { label: "Низкий", color: "text-green-600", dot: "bg-green-400" },
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "К выполнению",
  doing: "В работе",
  review: "На проверке",
  done: "Готово",
};

const INIT_TASKS: Task[] = [
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

const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "/dashboard" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "/dashboard" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "Users", label: "Клиенты", id: "clients", path: "/dashboard" },
  { icon: "Handshake", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "MessageCircle", label: "Сообщения", id: "messages", path: "/dashboard", badge: 3 },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard" },
];

// ─── Calendar View ────────────────────────────────────────────────────────────
function CalendarView({ tasks }: { tasks: Task[] }) {
  const today = new Date(2025, 3, 14); // April 14, 2025
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 3, 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(14);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const getTasksForDay = (day: number) => {
    const dateStr = `${String(day).padStart(2, "0")}.${String(month + 1).padStart(2, "0")}.${year}`;
    return tasks.filter(t => t.deadline === dateStr);
  };

  const todayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Mini Calendar — compact 1/3 */}
      <div className="lg:w-72 flex-shrink-0 bg-white rounded-2xl border border-border p-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Icon name="ChevronLeft" size={14} className="text-stone" />
          </button>
          <span className="text-sm font-semibold text-stone">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Icon name="ChevronRight" size={14} className="text-stone" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs text-stone-light font-medium py-0.5">{d}</div>
          ))}
        </div>

        {/* Days grid — compact */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayTasks = getTasksForDay(day);
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = day === selectedDay;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`relative flex flex-col items-center py-1 rounded-lg transition-all ${
                  isSelected ? "terra-gradient text-white" :
                  isToday ? "border border-terra text-terra" :
                  "hover:bg-muted text-stone"
                }`}
              >
                <span className="text-xs font-medium leading-tight">{day}</span>
                {dayTasks.length > 0 && (
                  <div className="flex gap-px mt-0.5">
                    {dayTasks.slice(0, 3).map((t, j) => (
                      <span
                        key={j}
                        className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/70" : PRIORITY_CONFIG[t.priority].dot}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2">
          {[
            { dot: "bg-red-500", label: "Высокий" },
            { dot: "bg-amber-400", label: "Средний" },
            { dot: "bg-green-400", label: "Низкий" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${l.dot}`} />
              <span className="text-xs text-stone-light">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day tasks panel — large 2/3 */}
      <div className="flex-1 bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-stone">
              {selectedDay
                ? `${selectedDay} ${MONTHS[month]}, ${year}`
                : "Выберите день в календаре"}
            </h3>
            {todayTasks.length > 0 && (
              <p className="text-xs text-stone-light mt-0.5">{todayTasks.length} задач{todayTasks.length === 1 ? "а" : todayTasks.length < 5 ? "и" : ""}</p>
            )}
          </div>
          {selectedDay && (
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
              selectedDay === today.getDate() && month === today.getMonth()
                ? "bg-terra-pale text-terra border-terra/20"
                : "bg-muted text-stone-mid border-border"
            }`}>
              {selectedDay === today.getDate() && month === today.getMonth() ? "Сегодня" : DAYS[(new Date(year, month, selectedDay).getDay() + 6) % 7]}
            </span>
          )}
        </div>

        {todayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-3">
              <Icon name="CalendarCheck" size={26} className="text-stone-light" />
            </div>
            <p className="text-stone font-medium text-sm mb-1">Задач нет</p>
            <p className="text-xs text-stone-light">На этот день задачи не запланированы</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map(t => (
              <div
                key={t.id}
                className="border border-border rounded-2xl p-4 hover:border-terra/30 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-base font-semibold text-stone leading-snug group-hover:text-terra transition-colors">{t.title}</span>
                  <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                    t.priority === "high" ? "bg-red-50 text-red-600 border-red-200" :
                    t.priority === "medium" ? "bg-amber-50 text-amber-600 border-amber-200" :
                    "bg-green-50 text-green-600 border-green-200"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[t.priority].dot}`} />
                    {PRIORITY_CONFIG[t.priority].label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${PROJECT_COLORS[t.project] || "bg-muted text-stone-mid border-border"}`}>
                    {t.project}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                    t.status === "done" ? "bg-green-50 text-green-700 border-green-200" :
                    t.status === "doing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    t.status === "review" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-muted text-stone-mid border-border"
                  }`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-stone-light">
                    <Icon name="Calendar" size={12} />
                    <span>Дедлайн: {t.deadline}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-light">Исполнитель</span>
                    <div className="w-7 h-7 terra-gradient rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {t.assignee}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Kanban View ──────────────────────────────────────────────────────────────
function KanbanView({ tasks, setTasks }: { tasks: Task[]; setTasks: (t: Task[]) => void }) {
  const dragId = useRef<number | null>(null);
  const dragOverCol = useRef<TaskStatus | null>(null);

  const cols: { key: TaskStatus; label: string; color: string }[] = [
    { key: "todo", label: "К выполнению", color: "bg-stone/5" },
    { key: "doing", label: "В работе", color: "bg-blue-50" },
    { key: "review", label: "На проверке", color: "bg-amber-50" },
    { key: "done", label: "Готово", color: "bg-green-50" },
  ];

  const onDrop = () => {
    if (dragId.current === null || dragOverCol.current === null) return;
    setTasks(tasks.map(t => t.id === dragId.current ? { ...t, status: dragOverCol.current! } : t));
    dragId.current = null; dragOverCol.current = null;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {cols.map(col => (
        <div
          key={col.key}
          onDragOver={e => { e.preventDefault(); dragOverCol.current = col.key; }}
          onDrop={onDrop}
          className="flex-shrink-0 w-72"
        >
          <div className={`rounded-2xl border border-border ${col.color} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-stone text-sm">{col.label}</span>
              <span className="text-xs bg-white border border-border text-stone-mid px-2 py-0.5 rounded-full">
                {tasks.filter(t => t.status === col.key).length}
              </span>
            </div>
            <div className="space-y-2.5 min-h-[100px]">
              {tasks.filter(t => t.status === col.key).map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => { dragId.current = task.id; }}
                  className="bg-white rounded-xl border border-border p-3 cursor-grab active:cursor-grabbing hover:border-terra/30 hover:shadow-sm transition-all select-none"
                >
                  <p className="text-sm font-medium text-stone mb-2 leading-snug">{task.title}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PROJECT_COLORS[task.project] || "bg-muted text-stone-mid border-border"}`}>
                      {task.project.split(" ")[0]}
                    </span>
                    <span className={`text-xs font-medium ${PRIORITY_CONFIG[task.priority].color}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[task.priority].dot} mr-1`} />
                      {PRIORITY_CONFIG[task.priority].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-stone-light">
                      <Icon name="Calendar" size={11} />
                      {task.deadline}
                    </div>
                    <div className="w-6 h-6 terra-gradient rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {task.assignee}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────
type SortKey = "title" | "project" | "priority" | "deadline" | "status";

function ListView({ tasks }: { tasks: Task[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("deadline");
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setAsc(!sortAsc);
    else { setSortKey(key); setAsc(true); }
  };
  const [, setAsc] = useState(true);

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const statusOrder = { todo: 0, doing: 1, review: 2, done: 3 };

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "title") cmp = a.title.localeCompare(b.title);
    else if (sortKey === "project") cmp = a.project.localeCompare(b.project);
    else if (sortKey === "priority") cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
    else if (sortKey === "deadline") cmp = a.deadlineDate.localeCompare(b.deadlineDate);
    else if (sortKey === "status") cmp = statusOrder[a.status] - statusOrder[b.status];
    return sortAsc ? cmp : -cmp;
  });

  const SortTh = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      className="text-left px-4 py-3 text-xs text-stone-light font-medium whitespace-nowrap cursor-pointer hover:text-stone transition-colors select-none"
      onClick={() => toggleSort(k)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === k && <Icon name={sortAsc ? "ChevronUp" : "ChevronDown"} size={12} />}
      </span>
    </th>
  );

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <SortTh k="title" label="Задача" />
              <SortTh k="project" label="Проект" />
              <SortTh k="priority" label="Приоритет" />
              <SortTh k="deadline" label="Дедлайн" />
              <SortTh k="status" label="Статус" />
              <th className="text-left px-4 py-3 text-xs text-stone-light font-medium">Исполнитель</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(task => (
              <tr key={task.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-stone">{task.title}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PROJECT_COLORS[task.project] || "bg-muted text-stone-mid border-border"}`}>
                    {task.project}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${PRIORITY_CONFIG[task.priority].color}`}>
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[task.priority].dot}`} />
                    {PRIORITY_CONFIG[task.priority].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-stone-mid whitespace-nowrap">{task.deadline}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                    task.status === "done" ? "bg-green-50 text-green-700 border-green-200" :
                    task.status === "doing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    task.status === "review" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-muted text-stone-mid border-border"
                  }`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="w-7 h-7 terra-gradient rounded-full flex items-center justify-center text-white text-xs font-semibold">{task.assignee}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── New Task Modal ───────────────────────────────────────────────────────────
function NewTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Task) => void }) {
  const [form, setForm] = useState({ title: "", desc: "", project: "Квартира на Тверской", priority: "medium" as Priority, deadline: "", assignee: "Елена Смирнова" });

  const handleAdd = () => {
    if (!form.title || !form.deadline) return;
    const [y, m, d] = form.deadline.split("-");
    onAdd({
      id: Date.now(),
      title: form.title,
      project: form.project,
      priority: form.priority,
      deadline: `${d}.${m}.${y}`,
      deadlineDate: form.deadline,
      status: "todo",
      assignee: "ЕС",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-stone">Новая задача</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Icon name="X" size={16} className="text-stone-mid" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-stone-light mb-1 block">Название задачи</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Что нужно сделать?"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
            />
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">Описание</label>
            <textarea
              value={form.desc}
              onChange={e => setForm(p => ({ ...p, desc: e.target.value }))}
              rows={2}
              placeholder="Детали задачи..."
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-light mb-1 block">Проект</label>
              <select
                value={form.project}
                onChange={e => setForm(p => ({ ...p, project: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20"
              >
                {["Квартира на Тверской", "Загородный дом", "Студия на Арбате"].map(pr => (
                  <option key={pr}>{pr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Приоритет</label>
              <select
                value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20"
              >
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-light mb-1 block">Дедлайн</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20"
              />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Исполнитель</label>
              <select
                value={form.assignee}
                onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20"
              >
                <option>Елена Смирнова</option>
                <option>Ирина Шевцова</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-stone-mid text-sm hover:bg-muted transition-colors">
            Отмена
          </button>
          <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl terra-gradient text-white text-sm hover:opacity-90 transition-opacity font-medium">
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Tasks() {
  const navigate = useNavigate();
  const [view, setView] = useState<"calendar" | "kanban" | "list">("calendar");
  const [tasks, setTasks] = useState<Task[]>(INIT_TASKS);
  const [filterProject, setFilterProject] = useState("Все проекты");
  const [filterPriority, setFilterPriority] = useState("Все");
  const [showModal, setShowModal] = useState(false);

  const filtered = tasks.filter(t => {
    const matchProject = filterProject === "Все проекты" || t.project === filterProject;
    const matchPriority = filterPriority === "Все" || PRIORITY_CONFIG[t.priority].label === filterPriority;
    return matchProject && matchPriority;
  });

  const views = [
    { id: "calendar", label: "Календарь", icon: "CalendarDays" },
    { id: "kanban", label: "Канбан", icon: "Columns3" },
    { id: "list", label: "Список", icon: "List" },
  ] as const;

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
            <div className="w-10 h-10 terra-gradient rounded-full flex items-center justify-center text-white font-semibold text-sm">ЕС</div>
            <div>
              <div className="text-sm font-semibold text-stone">Елена Смирнова</div>
              <div className="text-xs text-stone-mid">Дизайнер интерьеров</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                item.id === "tasks" ? "bg-terra-pale text-terra font-medium" : "text-stone-mid hover:bg-muted hover:text-stone"
              }`}
            >
              <Icon name={item.icon} fallback="Circle" size={17} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto w-5 h-5 terra-gradient rounded-full text-white text-xs flex items-center justify-center">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-mid hover:bg-muted hover:text-stone transition-all">
            <Icon name="LogOut" size={17} /><span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto pb-24 md:pb-8">
        <div className="px-4 md:px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-light text-stone">Задачи</h1>
              <p className="text-stone-mid text-sm mt-1">Все задачи по всем проектам</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 terra-gradient text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              <Icon name="Plus" size={15} className="text-white" />
              <span className="hidden sm:inline">Новая задача</span>
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 items-center mb-5">
            {/* View switcher */}
            <div className="flex gap-1 bg-white border border-border rounded-xl p-1">
              {views.map(v => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v.id ? "terra-gradient text-white" : "text-stone-mid hover:text-stone"}`}
                >
                  <Icon name={v.icon} fallback="Circle" size={13} className={view === v.id ? "text-white" : ""} />
                  {v.label}
                </button>
              ))}
            </div>

            {/* Project filter */}
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20"
            >
              {["Все проекты", "Квартира на Тверской", "Загородный дом", "Студия на Арбате"].map(p => (
                <option key={p}>{p}</option>
              ))}
            </select>

            {/* Priority filter */}
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20"
            >
              {["Все", "Высокий", "Средний", "Низкий"].map(p => (
                <option key={p}>{p}</option>
              ))}
            </select>

            <span className="text-xs text-stone-light ml-auto">{filtered.length} задач</span>
          </div>

          {/* View content */}
          <div className="animate-fade-in" key={view}>
            {view === "calendar" && <CalendarView tasks={filtered} />}
            {view === "kanban" && <KanbanView tasks={filtered} setTasks={setTasks} />}
            {view === "list" && <ListView tasks={filtered} />}
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-1 py-2 flex justify-around">
        {NAV_ITEMS.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${item.id === "tasks" ? "text-terra" : "text-stone-light"}`}
          >
            <Icon name={item.icon} fallback="Circle" size={19} />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <NewTaskModal
          onClose={() => setShowModal(false)}
          onAdd={t => setTasks(p => [...p, t])}
        />
      )}
    </div>
  );
}