import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Task, TaskStatus, Priority, TeamMember } from "./tasks.types";

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (id: string, data: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  projects: { id: string; title: string }[];
  teamMembers: TeamMember[];
  currentUserId: string;
}

export function EditTaskModal({
  task, onClose, onSave, onDelete, projects, teamMembers, currentUserId
}: EditTaskModalProps) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    project_id: task.project_id || "__personal__",
    priority: task.priority || "medium" as Priority,
    status: task.status || "todo" as TaskStatus,
    deadline: task.deadline || "",
    assigned_to: task.assigned_to || currentUserId,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPersonal = form.project_id === "__personal__";

  const handleSave = () => {
    if (!form.title) return;
    onSave(task.id, {
      title: form.title,
      description: form.description || null,
      project_id: isPersonal ? null : form.project_id,
      priority: form.priority,
      status: form.status,
      deadline: form.deadline || null,
      assigned_to: isPersonal ? currentUserId : (form.assigned_to || null),
    });
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(task.id);
    onClose();
  };

  const availableMembers = isPersonal ? [] : teamMembers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl text-stone">Редактирование задачи</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Icon name="X" size={16} className="text-stone-mid" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-stone-light mb-1 block">Название *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" />
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">Описание</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-light mb-1 block">Проект</label>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value, assigned_to: e.target.value === "__personal__" ? currentUserId : f.assigned_to }))} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20">
                <option value="__personal__">Личное</option>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-light mb-1 block">Статус</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20">
                <option value="todo">К выполнению</option>
                <option value="in_progress">В работе</option>
                <option value="review">На проверке</option>
                <option value="done">Готово</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Дедлайн</label>
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20" />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">Исполнитель</label>
            <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} disabled={isPersonal} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 disabled:opacity-60">
              <option value={currentUserId}>Я</option>
              {availableMembers.filter(m => m.id !== currentUserId).map(m => (
                <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={!form.title} className="flex-1 terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              Сохранить
            </button>
            <button onClick={handleDelete} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${confirmDelete ? "bg-red-500 text-white" : "border border-red-200 text-red-500 hover:bg-red-50"}`}>
              {confirmDelete ? "Точно удалить?" : "Удалить"}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-border text-stone-mid text-sm hover:bg-muted transition-colors">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NewTaskModalProps {
  onClose: () => void;
  onAdd: (data: { project_id: string | null; title: string; priority: string; deadline: string; description: string; assigned_to: string }) => void;
  projects: { id: string; title: string }[];
  teamMembers: TeamMember[];
  currentUserId: string;
}

export function NewTaskModal({
  onClose, onAdd, projects, teamMembers, currentUserId
}: NewTaskModalProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    project_id: projects.length > 0 ? projects[0].id : "__personal__",
    priority: "medium" as Priority,
    deadline: "",
    assigned_to: currentUserId,
  });

  const isPersonal = form.project_id === "__personal__";

  const handleAdd = () => {
    if (!form.title) return;
    onAdd({
      project_id: isPersonal ? null : form.project_id,
      title: form.title,
      priority: form.priority,
      deadline: form.deadline,
      description: form.description,
      assigned_to: isPersonal ? currentUserId : form.assigned_to,
    });
  };

  const availableMembers = isPersonal ? [] : teamMembers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
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
              <label className="text-xs text-stone-light mb-1 block">Проект</label>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value, assigned_to: e.target.value === "__personal__" ? currentUserId : f.assigned_to }))} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20">
                <option value="__personal__">Личное</option>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-light mb-1 block">Дедлайн</label>
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20" />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Исполнитель</label>
              <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} disabled={isPersonal} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 disabled:opacity-60">
                <option value={currentUserId}>Я</option>
                {availableMembers.filter(m => m.id !== currentUserId).map(m => (
                  <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={handleAdd} disabled={!form.title} className="w-full terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-2">
            Создать задачу
          </button>
        </div>
      </div>
    </div>
  );
}
