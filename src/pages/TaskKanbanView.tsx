import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Task, TaskStatus, PRIORITY_CONFIG, formatDeadline, getAssigneeInitials } from "./tasks.types";

interface KanbanViewProps {
  tasks: Task[];
  onStatusChange: (id: string, status: string) => void;
  onTaskClick: (task: Task) => void;
}

const cols: { key: TaskStatus; label: string; color: string }[] = [
  { key: "todo", label: "К выполнению", color: "bg-stone/5" },
  { key: "in_progress", label: "В работе", color: "bg-blue-50" },
  { key: "review", label: "На проверке", color: "bg-amber-50" },
  { key: "done", label: "Готово", color: "bg-green-50" },
];

export default function TaskKanbanView({ tasks, onStatusChange, onTaskClick }: KanbanViewProps) {
  const dragId = useRef<string | null>(null);
  const dragOverCol = useRef<TaskStatus | null>(null);
  const [draggingOver, setDraggingOver] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    dragId.current = taskId;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colKey: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOverCol.current = colKey;
    setDraggingOver(colKey);
  };

  const handleDragLeave = () => {
    setDraggingOver(null);
  };

  const handleDrop = (e: React.DragEvent, colKey: TaskStatus) => {
    e.preventDefault();
    setDraggingOver(null);
    const taskId = dragId.current;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== colKey) {
      onStatusChange(taskId, colKey);
    }
    dragId.current = null;
    dragOverCol.current = null;
  };

  const handleDragEnd = () => {
    dragId.current = null;
    dragOverCol.current = null;
    setDraggingOver(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {cols.map(col => (
        <div
          key={col.key}
          onDragOver={e => handleDragOver(e, col.key)}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, col.key)}
          className="flex-shrink-0 w-72"
        >
          <div className={`rounded-2xl border ${draggingOver === col.key ? "border-terra/50 ring-2 ring-terra/20" : "border-border"} ${col.color} p-4 transition-all`}>
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
                  onDragStart={e => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onTaskClick(task)}
                  className="bg-white rounded-xl border border-border p-3 cursor-grab active:cursor-grabbing hover:border-terra/30 hover:shadow-sm transition-all select-none"
                >
                  <p className="text-sm font-medium text-stone mb-2 leading-snug">{task.title}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {task.project_id ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-muted text-stone-mid border-border truncate max-w-[120px]">
                        {task.project_title || "Проект"}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-stone-100 text-stone-500 border-stone-200">
                        Личное
                      </span>
                    )}
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
