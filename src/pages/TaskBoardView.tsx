import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Task, TeamMember } from "./tasks.types";
import TaskKanbanView from "./TaskKanbanView";
import TaskListView from "./TaskListView";
import { EditTaskModal, NewTaskModal } from "./TaskModals";

interface BoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  onUpdateTask: (taskId: string, data: Record<string, unknown>) => void;
  onDeleteTask: (taskId: string) => void;
  showModal: boolean;
  onCloseModal: () => void;
  onAddTask: (data: { project_id: string | null; title: string; priority: string; deadline: string; description: string; assigned_to: string }) => void;
  projects: { id: string; title: string }[];
  teamMembers: TeamMember[];
  currentUserId: string;
}

export default function TaskBoardView({
  tasks, onStatusChange, onUpdateTask, onDeleteTask,
  showModal, onCloseModal, onAddTask, projects,
  teamMembers, currentUserId
}: BoardProps) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
  };

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
          <p className="text-stone-mid text-sm mb-4">Создайте первую задачу</p>
        </div>
      ) : view === "kanban" ? (
        <TaskKanbanView tasks={tasks} onStatusChange={onStatusChange} onTaskClick={handleTaskClick} />
      ) : (
        <TaskListView tasks={tasks} onTaskClick={handleTaskClick} />
      )}

      {showModal && (
        <NewTaskModal
          onClose={onCloseModal}
          onAdd={onAddTask}
          projects={projects}
          teamMembers={teamMembers}
          currentUserId={currentUserId}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={onUpdateTask}
          onDelete={onDeleteTask}
          projects={projects}
          teamMembers={teamMembers}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
