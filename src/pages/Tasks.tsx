import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { Task, PRIORITY_CONFIG, INIT_TASKS, NAV_ITEMS } from "./tasks.types";
import TaskCalendarView from "./TaskCalendarView";
import TaskBoardView from "./TaskBoardView";

export default function Tasks() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(INIT_TASKS);
  const [filterProject, setFilterProject] = useState("Все проекты");
  const [filterPriority, setFilterPriority] = useState("Все");
  const [showModal, setShowModal] = useState(false);

  const filtered = tasks.filter(t => {
    const matchProject = filterProject === "Все проекты" || t.project === filterProject;
    const matchPriority = filterPriority === "Все" || PRIORITY_CONFIG[t.priority].label === filterPriority;
    return matchProject && matchPriority;
  });

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
            <div className="w-10 h-10 terra-gradient rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {`${(user?.first_name || "")[0] || ""}${(user?.last_name || "")[0] || ""}`.toUpperCase() || "?"}
            </div>
            <div>
              <div className="text-sm font-semibold text-stone">{user?.first_name} {user?.last_name}</div>
              <div className="text-xs text-stone-mid">{user?.role === "designer" ? "Дизайнер интерьеров" : user?.role === "client" ? "Клиент" : "Работник"}</div>
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
          <button onClick={() => { logout(); navigate("/"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-mid hover:bg-muted hover:text-stone transition-all">
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

          {/* Блок 1 — Фильтры */}
          <div className="flex flex-wrap gap-2 items-center mb-5">
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20"
            >
              {["Все проекты", "Квартира на Тверской", "Загородный дом", "Студия на Арбате"].map(p => (
                <option key={p}>{p}</option>
              ))}
            </select>
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

          {/* Блок 2 — Календарь + задачи на день */}
          <div className="mb-6">
            <TaskCalendarView tasks={filtered} />
          </div>

          {/* Блок 3 — Канбан / Список */}
          <TaskBoardView
            tasks={filtered}
            setTasks={setTasks}
            showModal={showModal}
            onCloseModal={() => setShowModal(false)}
            onAddTask={t => setTasks(p => [...p, t])}
          />
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
    </div>
  );
}