import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { KanbanCol, KanbanTask, INIT_TASKS, CHAT_MSGS, fmtMoney } from "./projectDetail.types";
import type { ProjectData, StageData } from "./ProjectDetail";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Черновик", color: "bg-gray-50 text-gray-600 border-gray-200" },
  active: { label: "В работе", color: "bg-blue-50 text-blue-700 border-blue-200" },
  review: { label: "Согласование", color: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "Завершён", color: "bg-green-50 text-green-700 border-green-200" },
};

const STAGE_STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  completed: { label: "Завершён", color: "bg-green-50 text-green-700 border-green-200", icon: "✅" },
  in_progress: { label: "В работе", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "🔄" },
  pending: { label: "Ожидает", color: "bg-stone/5 text-stone-mid border-border", icon: "⏳" },
};

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

interface OverviewProps {
  project: ProjectData;
}

export function OverviewTab({ project }: OverviewProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>(INIT_TASKS);
  const [chatTab, setChatTab] = useState<"client" | "workers">("client");
  const [msgInput, setMsgInput] = useState("");
  const dragId = useRef<number | null>(null);
  const dragOver = useRef<KanbanCol | null>(null);

  const onDragStart = (id: number) => { dragId.current = id; };
  const onDragOver = (col: KanbanCol, e: React.DragEvent) => { e.preventDefault(); dragOver.current = col; };
  const onDrop = () => {
    if (dragId.current === null || dragOver.current === null) return;
    setTasks(t => t.map(task => task.id === dragId.current ? { ...task, col: dragOver.current! } : task));
    dragId.current = null; dragOver.current = null;
  };

  const cols: { key: KanbanCol; label: string }[] = [
    { key: "todo", label: "К выполнению" },
    { key: "doing", label: "В работе" },
    { key: "done", label: "Готово" },
  ];

  const statusInfo = STATUS_MAP[project.status] || STATUS_MAP.draft;

  const clientMember = project.members?.find(m => m.role === "client");
  const clientName = clientMember ? `${clientMember.first_name || ""} ${clientMember.last_name || ""}`.trim() : "Не назначен";

  const infoRows = [
    clientMember ? ["Клиент", clientName] : null,
    project.address ? ["Адрес", project.address] : null,
    project.area ? ["Площадь", `${project.area} м²`] : null,
    project.rooms ? ["Комнат", String(project.rooms)] : null,
    project.style ? ["Стиль", project.style] : null,
    project.start_date ? ["Начало", formatDate(project.start_date)] : null,
    project.deadline ? ["Дедлайн", formatDate(project.deadline)] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-border p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="font-display text-2xl font-light text-stone">{project.title}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
            {project.description && (
              <p className="text-sm text-stone-mid mb-3">{project.description}</p>
            )}
            {infoRows.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm">
                {infoRows.map(([k, v]) => (
                  <div key={k}>
                    <span className="text-stone-light text-xs">{k}</span>
                    <div className="text-stone font-medium mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border border-border text-stone hover:border-terra/40 transition-all">
              <Icon name="Pencil" size={14} /> Редактировать
            </button>
            <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl terra-gradient text-white hover:opacity-90 transition-all">
              <Icon name="UserPlus" size={14} className="text-white" /> Пригласить
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="Wallet" size={13} className="text-white" />
            </div>
            <span className="font-semibold text-stone text-sm">Финансы</span>
          </div>
          <div className="space-y-2.5 mb-4">
            {[
              ["Стоимость", project.budget || 0, "text-stone"],
              ["Оплачено", 0, "text-green-600"],
              ["Осталось", project.budget || 0, "text-amber-600"],
            ].map(([label, val, cls]) => (
              <div key={label as string} className="flex justify-between items-center">
                <span className="text-xs text-stone-mid">{label as string}</span>
                <span className={`text-sm font-semibold ${cls}`}>{fmtMoney(val as number)}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full" style={{ width: "0%" }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-stone-light">Оплачено</span>
            <span className="text-xs font-medium text-stone">0%</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="Kanban" fallback="Layout" size={13} className="text-white" />
            </div>
            <span className="font-semibold text-stone text-sm">Задачи</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {cols.map(col => (
              <div
                key={col.key}
                onDragOver={(e) => onDragOver(col.key, e)}
                onDrop={onDrop}
                className="min-h-[80px]"
              >
                <div className="text-xs text-stone-light font-medium mb-1.5 text-center">{col.label}</div>
                <div className="space-y-1.5">
                  {tasks.filter(t => t.col === col.key).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => onDragStart(task.id)}
                      className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-stone cursor-grab active:cursor-grabbing hover:border-terra/30 transition-all select-none"
                    >
                      {task.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="MessageCircle" size={13} className="text-white" />
            </div>
            <span className="font-semibold text-stone text-sm">Чат</span>
          </div>
          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-3">
            {(["client", "workers"] as const).map(t => (
              <button
                key={t}
                onClick={() => setChatTab(t)}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${chatTab === t ? "bg-white text-stone shadow-sm" : "text-stone-mid"}`}
              >
                {t === "client" ? "С клиентом" : "С рабочими"}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto max-h-36 mb-3">
            {CHAT_MSGS[chatTab].map(msg => (
              <div key={msg.id} className={`flex ${msg.from === "designer" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-xl px-2.5 py-1.5 ${msg.from === "designer" ? "bg-muted" : "terra-gradient"}`}>
                  <p className={`text-xs ${msg.from === "designer" ? "text-stone" : "text-white"}`}>{msg.text}</p>
                  <p className={`text-xs mt-0.5 ${msg.from === "designer" ? "text-stone-light" : "text-white/60"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              placeholder="Сообщение..."
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-stone text-xs focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
            />
            <button onClick={() => setMsgInput("")} className="terra-gradient text-white p-2 rounded-xl hover:opacity-90 transition-opacity">
              <Icon name="Send" size={13} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ExecutionProps {
  project: ProjectData;
}

export function ExecutionTab({ project }: ExecutionProps) {
  const stages = project.stages || [];
  const [openStage, setOpenStage] = useState<string | null>(
    stages.find(s => s.status === "in_progress")?.id || stages[0]?.id || null
  );
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  return (
    <div className="space-y-0">
      {stages.map((stage, idx) => {
        const stageInfo = STAGE_STATUS_MAP[stage.status] || STAGE_STATUS_MAP.pending;
        return (
          <div key={stage.id} className="relative pl-10">
            {idx < stages.length - 1 && (
              <div className={`absolute left-4 top-9 bottom-0 w-0.5 ${stage.status === "completed" ? "bg-green-300" : "bg-border"}`} />
            )}
            <div className={`absolute left-2 top-5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              stage.status === "completed" ? "bg-green-400 border-green-400" :
              stage.status === "in_progress" ? "bg-terra border-terra" :
              "bg-white border-stone-light"
            }`}>
              {stage.status === "completed" && <Icon name="Check" size={9} className="text-white" />}
              {stage.status === "in_progress" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>

            <div className="bg-white rounded-2xl border border-border mb-4 overflow-hidden">
              <button
                className="w-full text-left p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                onClick={() => setOpenStage(openStage === stage.id ? null : stage.id)}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-stone text-sm">{stage.title}</span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${stageInfo.color}`}>
                    {stageInfo.icon} {stageInfo.label}
                  </span>
                  <span className="text-xs text-stone-light">
                    {formatDate(stage.start_date)} — {formatDate(stage.end_date)}
                  </span>
                </div>
                <Icon name={openStage === stage.id ? "ChevronUp" : "ChevronDown"} size={16} className="text-stone-light flex-shrink-0" />
              </button>

              {openStage === stage.id && (
                <div className="px-5 pb-5 border-t border-border space-y-4 animate-fade-in">
                  <p className="text-sm text-stone-mid pt-4">
                    {stage.description || "Описание этапа пока не добавлено"}
                  </p>

                  <div>
                    <p className="text-xs font-semibold text-stone mb-2">Файлы</p>
                    <div className="flex flex-wrap gap-2">
                      <button className="w-16 h-16 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 hover:border-terra/40 transition-colors">
                        <Icon name="Plus" size={16} className="text-stone-light" />
                        <span className="text-xs text-stone-light">Файл</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-stone mb-2">Комментарии</p>
                    <p className="text-xs text-stone-light mb-3">Комментариев пока нет</p>
                    <div className="flex gap-2">
                      <input
                        value={commentInputs[stage.id] || ""}
                        onChange={e => setCommentInputs(p => ({ ...p, [stage.id]: e.target.value }))}
                        placeholder="Добавить комментарий..."
                        className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-stone text-xs focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
                      />
                      <button className="terra-gradient text-white px-3 py-2 rounded-xl text-xs hover:opacity-90 transition-opacity">
                        <Icon name="Send" size={13} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="pl-10">
        <button className="flex items-center gap-2 text-sm text-terra border-2 border-dashed border-terra/30 rounded-2xl px-5 py-3 w-full justify-center hover:bg-terra-pale transition-colors">
          <Icon name="Plus" size={16} />
          Добавить этап
        </button>
      </div>
    </div>
  );
}