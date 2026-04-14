import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { KanbanCol, KanbanTask, TimelineStage, INIT_TASKS, CHAT_MSGS, TIMELINE, fmtMoney } from "./projectDetail.types";

function StatusBadge({ s }: { s: TimelineStage["status"] }) {
  if (s === "done") return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">✅ Завершён</span>;
  if (s === "active") return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">🔄 В работе</span>;
  return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-stone/5 text-stone-mid border border-border font-medium">⏳ Ожидает</span>;
}

export function OverviewTab() {
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-border p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="font-display text-2xl font-light text-stone">Квартира на Тверской</h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">В работе</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm">
              {[
                ["Клиент", "Анна Петрова"],
                ["Адрес", "ул. Тверская, 18, кв. 54"],
                ["Площадь", "92 м²"],
                ["Комнат", "3"],
                ["Стиль", "Скандинавский минимализм"],
                ["Начало", "10 янв 2025"],
                ["Дедлайн", "30 июн 2025"],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-stone-light text-xs">{k}</span>
                  <div className="text-stone font-medium mt-0.5">{v}</div>
                </div>
              ))}
            </div>
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
              ["Стоимость", 2500000, "text-stone"],
              ["Оплачено", 1250000, "text-green-600"],
              ["Осталось", 1250000, "text-amber-600"],
            ].map(([label, val, cls]) => (
              <div key={label as string} className="flex justify-between items-center">
                <span className="text-xs text-stone-mid">{label as string}</span>
                <span className={`text-sm font-semibold ${cls}`}>{fmtMoney(val as number)}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full" style={{ width: "50%" }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-stone-light">Оплачено</span>
            <span className="text-xs font-medium text-stone">50%</span>
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

export function ExecutionTab() {
  const [openStage, setOpenStage] = useState<number | null>(3);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  return (
    <div className="space-y-0">
      {TIMELINE.map((stage, idx) => (
        <div key={stage.id} className="relative pl-10">
          {idx < TIMELINE.length - 1 && (
            <div className={`absolute left-4 top-9 bottom-0 w-0.5 ${stage.status === "done" ? "bg-green-300" : "bg-border"}`} />
          )}
          <div className={`absolute left-2 top-5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            stage.status === "done" ? "bg-green-400 border-green-400" :
            stage.status === "active" ? "bg-terra border-terra" :
            "bg-white border-stone-light"
          }`}>
            {stage.status === "done" && <Icon name="Check" size={9} className="text-white" />}
            {stage.status === "active" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
          </div>

          <div className="bg-white rounded-2xl border border-border mb-4 overflow-hidden">
            <button
              className="w-full text-left p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
              onClick={() => setOpenStage(openStage === stage.id ? null : stage.id)}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-stone text-sm">{stage.title}</span>
                <StatusBadge s={stage.status} />
                <span className="text-xs text-stone-light">{stage.dateStart} — {stage.dateEnd}</span>
              </div>
              <Icon name={openStage === stage.id ? "ChevronUp" : "ChevronDown"} size={16} className="text-stone-light flex-shrink-0" />
            </button>

            {openStage === stage.id && (
              <div className="px-5 pb-5 border-t border-border space-y-4 animate-fade-in">
                <p className="text-sm text-stone-mid pt-4">{stage.desc}</p>

                <div>
                  <p className="text-xs font-semibold text-stone mb-2">Файлы ({stage.files})</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: stage.files }).map((_, i) => (
                      <div key={i} className="w-16 h-16 bg-terra-pale rounded-xl flex items-center justify-center border border-terra/20">
                        <Icon name="FileText" size={20} className="text-terra/50" />
                      </div>
                    ))}
                    <button className="w-16 h-16 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 hover:border-terra/40 transition-colors">
                      <Icon name="Plus" size={16} className="text-stone-light" />
                      <span className="text-xs text-stone-light">Файл</span>
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-stone mb-2">Комментарии ({stage.comments.length})</p>
                  <div className="space-y-2 mb-3">
                    {stage.comments.map((c, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="w-6 h-6 terra-gradient rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {c.author[0]}
                        </div>
                        <div className="bg-muted rounded-xl px-3 py-2 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-stone">{c.author}</span>
                            <span className="text-xs text-stone-light">{c.time}</span>
                          </div>
                          <p className="text-xs text-stone-mid">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
      ))}

      <div className="pl-10">
        <button className="flex items-center gap-2 text-sm text-terra border-2 border-dashed border-terra/30 rounded-2xl px-5 py-3 w-full justify-center hover:bg-terra-pale transition-colors">
          <Icon name="Plus" size={16} />
          Добавить этап
        </button>
      </div>
    </div>
  );
}
