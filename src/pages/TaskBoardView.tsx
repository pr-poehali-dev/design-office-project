import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Task, TaskStatus, Priority, PRIORITY_CONFIG, STATUS_LABELS, formatDeadline, getAssigneeInitials } from "./tasks.types";

interface BoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  showModal: boolean;
  onCloseModal: () => void;
  onAddTask: (data: { project_id: string; title: string; priority: string; deadline: string; description: string }) => void;
  projects: { id: string; title: string }[];
}

function KanbanView({ tasks, onStatusChange }: { tasks: Task[]; onStatusChange: (id: string, status: string) => void }) {
  const dragId = useRef<string | null>(null);
  const dragOverCol = useRef<TaskStatus | null>(null);

  const cols: { key: TaskStatus; label: string; color: string }[] = [
    { key: "todo", label: "К выполнению", color: "bg-stone/5" },
    { key: "in_progress", label: "В работе", color: "bg-blue-50" },
    { key: "review", label: "На проверке", color: "bg-amber-50" },
    { key: "done", label: "Готово", color: "bg-green-50" },
  ];

  const onDrop = () => {
    if (!dragId.current || !dragOverCol.current) return;
    onStatusChange(dragId.current, dragOverCol.current);
    dragId.current = null;
    dragOverCol.current = null;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {cols.map(col => (
        <div key={col.key} onDragOver={e => { e.preventDefault(); dragOverCol.current = col.key; }} onDrop={onDrop} className="flex-shrink-0 w-72">
          <div className={`rounded-2xl border border-border ${col.color} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-stone text-sm">{col.label}</span>
              <span className="text-xs bg-white border border-border text-stone-mid px-2 py-0.5 rounded-full">
                {tasks.filter(t => t.status === col.key).length}
              </span>
            </div>
            <div className="space-y-2.5 min-h-[100px]">
              {tasks.filter(t => t.status === col.key).map(task => (
                <div key={task.id} draggable onDragStart={() => { dragId.current = task.id; }} className="bg-white rounded-xl border border-border p-3 cursor-grab active:cursor-grabbing hover:border-terra/30 hover:shadow-sm transition-all select-none">
                  <p className="text-sm font-medium text-stone mb-2 leading-snug">{task.title}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-muted text-stone-mid border-border truncate max-w-[120px]">
                      {task.project_title || "Проект"}
                    </span>
                    {task.priority && (
                      <span className={`text-xs font-medium ${PRIORITY_CONFIG[task.priority]?.color || ""}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[task.priority]?.dot || ""} mr-1`} />
                        {PRIORITY_CONFIG[task.priority]?.label || ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-stone-light">
                      <Icon name="Calendar" size={11} />
                      {formatDeadline(task.deadline)}
                    </div>
                    <div className="w-6 h-6 terra-gradient rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {getAssigneeInitials(task)}
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

type SortKey = "title" | "project" | "priority" | "deadline" | "status";

function ListView({ tasks }: { tasks: Task[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("deadline");
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const statusOrder: Record<string, number> = { todo: 0, in_progress: 1, review: 2, done: 3 };

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "title") cmp = a.title.localeCompare(b.title);
    else if (sortKey === "project") cmp = (a.project_title || "").localeCompare(b.project_title || "");
    else if (sortKey === "priority") cmp = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
    else if (sortKey === "deadline") cmp = (a.deadline || "").localeCompare(b.deadline || "");
    else if (sortKey === "status") cmp = (statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0);
    return sortAsc ? cmp : -cmp;
  });

  const SortTh = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="text-left px-4 py-3 text-xs text-stone-light font-medium whitespace-nowrap cursor-pointer hover:text-stone transition-colors select-none" onClick={() => toggleSort(k)}>
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
                <td className="px-4 py-3"><span className="text-sm font-medium text-stone">{task.title}</span></td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-muted text-stone-mid border-border">{task.project_title || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  {task.priority && (
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${PRIORITY_CONFIG[task.priority]?.color || ""}`}>
                      <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[task.priority]?.dot || ""}`} />
                      {PRIORITY_CONFIG[task.priority]?.label || ""}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-stone-mid whitespace-nowrap">{formatDeadline(task.deadline)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                    task.status === "done" ? "bg-green-50 text-green-700 border-green-200" :
                    task.status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    task.status === "review" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-muted text-stone-mid border-border"
                  }`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="w-7 h-7 terra-gradient rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {getAssigneeInitials(task)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewTaskModal({ onClose, onAdd, projects }: { onClose: () => void; onAdd: (data: { project_id: string; title: string; priority: string; deadline: string; description: string }) => void; projects: { id: string; title: string }[] }) {
  const [form, setForm] = useState({ title: "", description: "", project_id: projects[0]?.id || "", priority: "medium" as Priority, deadline: "" });

  const handleAdd = () => {
    if (!form.title || !form.project_id) return;
    onAdd({ project_id: form.project_id, title: form.title, priority: form.priority, deadline: form.deadline, description: form.description });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl text-stone">Новая задача</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Icon name="X" size={16} className="text-stone-mid" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-stone-light mb-1 block">Название *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Что нужно сделать?" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" autoFocus />
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">Описание</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Подробности..." rows={2} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-light mb-1 block">Проект *</label>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20">
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Приоритет</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20">
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">Дедлайн</label>
            <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20" />
          </div>
          <button onClick={handleAdd} disabled={!form.title || !form.project_id} className="w-full terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-2">
            Создать задачу
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TaskBoardView({ tasks, onStatusChange, showModal, onCloseModal, onAddTask, projects }: BoardProps) {
  const [view, setView] = useState<"kanban" | "list">("kanban");

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setView("kanban")} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ${view === "kanban" ? "bg-terra-pale text-terra font-medium" : "text-stone-mid hover:bg-muted"}`}>
          <Icon name="LayoutGrid" size={14} /> Канбан
        </button>
        <button onClick={() => setView("list")} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ${view === "list" ? "bg-terra-pale text-terra font-medium" : "text-stone-mid hover:bg-muted"}`}>
          <Icon name="List" size={14} /> Список
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="ListTodo" size={28} className="text-stone-light" />
          </div>
          <h3 className="font-display text-xl text-stone mb-2">Задач пока нет</h3>
          <p className="text-stone-mid text-sm mb-4">Создайте первую задачу для проекта</p>
          <button onClick={() => onCloseModal} className="terra-gradient text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90">
            <Icon name="Plus" size={14} className="text-white inline mr-1.5" /> Новая задача
          </button>
        </div>
      ) : view === "kanban" ? (
        <KanbanView tasks={tasks} onStatusChange={onStatusChange} />
      ) : (
        <ListView tasks={tasks} />
      )}

      {showModal && <NewTaskModal onClose={onCloseModal} onAdd={onAddTask} projects={projects} />}
    </div>
  );
}
