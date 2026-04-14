import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Task, TaskStatus, Priority, PRIORITY_CONFIG, PROJECT_COLORS, STATUS_LABELS } from "./tasks.types";

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

// ─── TaskBoardView — Kanban/List + modal ──────────────────────────────────────
interface TaskBoardViewProps {
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  showModal: boolean;
  onCloseModal: () => void;
  onAddTask: (t: Task) => void;
}

export default function TaskBoardView({ tasks, setTasks, showModal, onCloseModal, onAddTask }: TaskBoardViewProps) {
  const [bottomView, setBottomView] = useState<"kanban" | "list">("kanban");

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-stone text-base">Все задачи</h2>
        <div className="flex gap-1 bg-white border border-border rounded-xl p-1">
          {([
            { id: "kanban", label: "Канбан", icon: "Columns3" },
            { id: "list", label: "Список", icon: "List" },
          ] as const).map(v => (
            <button
              key={v.id}
              onClick={() => setBottomView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${bottomView === v.id ? "terra-gradient text-white" : "text-stone-mid hover:text-stone"}`}
            >
              <Icon name={v.icon} fallback="Circle" size={13} className={bottomView === v.id ? "text-white" : ""} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-fade-in" key={bottomView}>
        {bottomView === "kanban" && <KanbanView tasks={tasks} setTasks={setTasks} />}
        {bottomView === "list" && <ListView tasks={tasks} />}
      </div>

      {showModal && (
        <NewTaskModal onClose={onCloseModal} onAdd={onAddTask} />
      )}
    </>
  );
}
