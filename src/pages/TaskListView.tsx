import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Task, PRIORITY_CONFIG, STATUS_LABELS, formatDeadline, getAssigneeInitials } from "./tasks.types";

type SortKey = "title" | "project" | "priority" | "deadline" | "status";

interface ListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function TaskListView({ tasks, onTaskClick }: ListViewProps) {
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
              <tr key={task.id} onClick={() => onTaskClick(task)} className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer">
                <td className="px-4 py-3"><span className="text-sm font-medium text-stone">{task.title}</span></td>
                <td className="px-4 py-3">
                  {task.project_id ? (
                    <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-muted text-stone-mid border-border">{task.project_title || "—"}</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-stone-100 text-stone-500 border-stone-200">Личное</span>
                  )}
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
