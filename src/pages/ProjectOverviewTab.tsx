import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { fmtMoney } from "./projectDetail.types";
import { useProjectTasks, useCreateTask, useUpdateTask, useMessages, useSendMessage, useInviteMember, useDeleteProject } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import type { ProjectData } from "./ProjectDetail";

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

type TaskCol = "todo" | "in_progress" | "review" | "done";
interface TaskItem { id: string; title: string; status: TaskCol; priority: string; }
interface Msg { id: string; content: string; sender_id: string; sender_first_name: string; sender_last_name: string; created_at: string; }

const COL_LABELS: Record<TaskCol, string> = { todo: "К выполнению", in_progress: "В работе", review: "На проверке", done: "Готово" };

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

interface OverviewProps {
  project: ProjectData;
}

export function OverviewTab({ project }: OverviewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [msgInput, setMsgInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Tasks
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);
  const dragId = useRef<string | null>(null);
  const dragCol = useRef<TaskCol | null>(null);

  // Chat
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("client");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState("");

  const { data: tasks = [] } = useProjectTasks(project.id);
  const { data: messages = [] } = useMessages(project.id);
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const sendMessageMutation = useSendMessage(user ? { id: user.id, first_name: user.first_name, last_name: user.last_name } : undefined);
  const inviteMutation = useInviteMember();
  const deleteProjectMutation = useDeleteProject();

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    setCreatingTask(true);
    try {
      await createTaskMutation.mutateAsync({ project_id: project.id, title: newTaskTitle.trim() });
      setNewTaskTitle("");
      setShowTaskForm(false);
    } catch { /* empty */ }
    setCreatingTask(false);
  };

  const handleDrop = async () => {
    if (!dragId.current || !dragCol.current) return;
    const id = dragId.current;
    const newStatus = dragCol.current;
    dragId.current = null; dragCol.current = null;
    try { await updateTaskMutation.mutateAsync({ id, data: { status: newStatus } }); } catch { /* empty */ }
  };

  const handleSendMsg = async () => {
    if (!msgInput.trim()) return;
    setSendingMsg(true);
    try {
      await sendMessageMutation.mutateAsync({ project_id: project.id, content: msgInput.trim() });
      setMsgInput("");
    } catch { /* empty */ }
    setSendingMsg(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteResult("");
    try {
      await inviteMutation.mutateAsync({ email: inviteEmail.trim(), project_id: project.id, role: inviteRole });
      setInviteResult("Приглашение отправлено!");
      setInviteEmail("");
    } catch (err: unknown) {
      setInviteResult(err instanceof Error ? err.message : "Ошибка");
    }
    setInviting(false);
  };

  const statusInfo = STATUS_MAP[project.status] || STATUS_MAP.draft;
  const clientMember = project.members?.find(m => m.role === "client");
  const clientName = clientMember ? `${clientMember.first_name || ""} ${clientMember.last_name || ""}`.trim() : null;

  const infoRows = [
    clientName ? ["Клиент", clientName] : null,
    project.address ? ["Адрес", project.address] : null,
    project.area ? ["Площадь", `${project.area} м²`] : null,
    project.rooms ? ["Комнат", String(project.rooms)] : null,
    project.style ? ["Стиль", project.style] : null,
    project.start_date ? ["Начало", formatDate(project.start_date)] : null,
    project.deadline ? ["Дедлайн", formatDate(project.deadline)] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <div className="space-y-6">
      {/* Project info */}
      <div className="bg-white rounded-2xl border border-border p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="font-display text-2xl font-light text-stone">{project.title}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
            {project.description && <p className="text-sm text-stone-mid mb-3">{project.description}</p>}
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
            <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl terra-gradient text-white hover:opacity-90 transition-all">
              <Icon name="UserPlus" size={14} className="text-white" /> Пригласить
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all">
              <Icon name="Trash2" size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 3 widgets */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Chat */}
        <div className="bg-white rounded-2xl border border-border p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 terra-gradient rounded-lg flex items-center justify-center"><Icon name="MessageCircle" size={13} className="text-white" /></div>
            <span className="font-semibold text-stone text-sm">Чат</span>
          </div>

          <div ref={chatRef} className="flex-1 space-y-2 overflow-y-auto max-h-44 mb-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mb-2"><Icon name="MessagesSquare" size={18} className="text-stone-light" /></div>
                <p className="text-xs text-stone-mid">Нет сообщений</p>
              </div>
            ) : messages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-2.5 py-1.5 ${isMe ? "terra-gradient" : "bg-muted"}`}>
                    {!isMe && <p className="text-xs font-semibold mb-0.5" style={{ color: isMe ? "white" : "#3D3028" }}>{msg.sender_first_name}</p>}
                    <p className={`text-xs ${isMe ? "text-white" : "text-stone"}`}>{msg.content}</p>
                    <p className={`text-xs mt-0.5 ${isMe ? "text-white/60" : "text-stone-light"}`}>{formatTime(msg.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendMsg()} placeholder="Сообщение..." className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-stone text-xs focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" />
            <button onClick={handleSendMsg} disabled={sendingMsg} className="terra-gradient text-white p-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
              <Icon name="Send" size={13} className="text-white" />
            </button>
          </div>
        </div>

        {/* Tasks kanban */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 terra-gradient rounded-lg flex items-center justify-center"><Icon name="CheckSquare" size={13} className="text-white" /></div>
              <span className="font-semibold text-stone text-sm">Задачи</span>
            </div>
            <button onClick={() => setShowTaskForm(true)} className="text-xs text-terra hover:underline">+ Добавить</button>
          </div>

          {showTaskForm && (
            <div className="mb-3 flex gap-2">
              <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Название задачи..." onKeyDown={e => e.key === "Enter" && handleCreateTask()} className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-stone focus:outline-none focus:ring-1 focus:ring-terra/30" autoFocus />
              <button onClick={handleCreateTask} disabled={creatingTask} className="terra-gradient text-white px-2.5 py-1.5 rounded-lg text-xs disabled:opacity-50">
                {creatingTask ? "..." : "OK"}
              </button>
              <button onClick={() => { setShowTaskForm(false); setNewTaskTitle(""); }} className="text-stone-light text-xs px-1">✕</button>
            </div>
          )}

          {tasks.length === 0 && !showTaskForm ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mb-2"><Icon name="ListTodo" size={18} className="text-stone-light" /></div>
              <p className="text-xs text-stone-mid">Задач пока нет</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {(["todo", "in_progress", "review", "done"] as TaskCol[]).map(col => (
                <div key={col} onDragOver={e => { e.preventDefault(); dragCol.current = col; }} onDrop={handleDrop} className="min-h-[40px]">
                  <div className="text-xs text-stone-light font-medium mb-1 text-center truncate">{COL_LABELS[col]}</div>
                  <div className="space-y-1">
                    {tasks.filter(t => t.status === col).map(task => (
                      <div key={task.id} draggable onDragStart={() => { dragId.current = task.id; }} className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-stone cursor-grab active:cursor-grabbing hover:border-terra/30 transition-all select-none truncate">
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Finance */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 terra-gradient rounded-lg flex items-center justify-center"><Icon name="Wallet" size={13} className="text-white" /></div>
            <span className="font-semibold text-stone text-sm">Финансы</span>
          </div>
          <div className="space-y-2.5 mb-4">
            {([["Стоимость", project.budget || 0, "text-stone"], ["Оплачено", 0, "text-green-600"], ["Осталось", project.budget || 0, "text-amber-600"]] as [string, number, string][]).map(([label, val, cls]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs text-stone-mid">{label}</span>
                <span className={`text-sm font-semibold ${cls}`}>{fmtMoney(val)}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-green-400 rounded-full" style={{ width: "0%" }} /></div>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-stone">Пригласить участника</h3>
              <button onClick={() => { setShowInvite(false); setInviteResult(""); }} className="p-1.5 hover:bg-muted rounded-lg"><Icon name="X" size={16} className="text-stone-mid" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-light mb-1 block">Email или личный ID</label>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@example.com или 998E6648" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" />
              </div>
              <div>
                <label className="text-xs text-stone-light mb-1 block">Роль</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20">
                  <option value="client">Клиент</option>
                  <option value="worker">Работник</option>
                </select>
              </div>
              {inviteResult && (
                <p className={`text-xs ${inviteResult.includes("отправлено") ? "text-green-600" : "text-red-500"}`}>{inviteResult}</p>
              )}
              <button onClick={handleInvite} disabled={inviting} className="w-full terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {inviting ? "Отправляем..." : "Пригласить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4"><Icon name="Trash2" size={22} className="text-red-500" /></div>
            <h3 className="font-display text-xl text-stone text-center mb-2">Удалить проект?</h3>
            <p className="text-stone-mid text-sm text-center mb-6">Проект «{project.title}» и все данные будут удалены безвозвратно.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-stone-mid text-sm font-medium hover:bg-muted transition-colors">Отмена</button>
              <button onClick={async () => { setDeleting(true); try { await deleteProjectMutation.mutateAsync(project.id); navigate("/dashboard"); } catch { setDeleting(false); setShowDeleteConfirm(false); } }} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60">
                {deleting ? "Удаляем..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ExecutionProps { project: ProjectData; }

export function ExecutionTab({ project }: ExecutionProps) {
  const stages = project.stages || [];
  const [openStage, setOpenStage] = useState<string | null>(stages.find(s => s.status === "in_progress")?.id || stages[0]?.id || null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  if (stages.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4"><Icon name="ListChecks" size={28} className="text-stone-light" /></div>
        <h3 className="font-display text-xl text-stone mb-2">Нет этапов</h3>
        <p className="text-stone-mid text-sm mb-6">Добавьте первый этап проекта</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {stages.map((stage, idx) => {
        const stageInfo = STAGE_STATUS_MAP[stage.status] || STAGE_STATUS_MAP.pending;
        return (
          <div key={stage.id} className="relative pl-10">
            {idx < stages.length - 1 && <div className={`absolute left-4 top-9 bottom-0 w-0.5 ${stage.status === "completed" ? "bg-green-300" : "bg-border"}`} />}
            <div className={`absolute left-2 top-5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${stage.status === "completed" ? "bg-green-400 border-green-400" : stage.status === "in_progress" ? "bg-terra border-terra" : "bg-white border-stone-light"}`}>
              {stage.status === "completed" && <Icon name="Check" size={9} className="text-white" />}
              {stage.status === "in_progress" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
            <div className="bg-white rounded-2xl border border-border mb-4 overflow-hidden">
              <button className="w-full text-left p-5 flex items-center justify-between hover:bg-muted/30 transition-colors" onClick={() => setOpenStage(openStage === stage.id ? null : stage.id)}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-stone text-sm">{stage.title}</span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${stageInfo.color}`}>{stageInfo.icon} {stageInfo.label}</span>
                  <span className="text-xs text-stone-light">{formatDate(stage.start_date)} — {formatDate(stage.end_date)}</span>
                </div>
                <Icon name={openStage === stage.id ? "ChevronUp" : "ChevronDown"} size={16} className="text-stone-light flex-shrink-0" />
              </button>
              {openStage === stage.id && (
                <div className="px-5 pb-5 border-t border-border space-y-4 animate-fade-in">
                  <p className="text-sm text-stone-mid pt-4">{stage.description || "Описание этапа пока не добавлено"}</p>
                  <div>
                    <p className="text-xs font-semibold text-stone mb-2">Файлы</p>
                    <button className="w-16 h-16 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 hover:border-terra/40 transition-colors">
                      <Icon name="Plus" size={16} className="text-stone-light" /><span className="text-xs text-stone-light">Файл</span>
                    </button>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone mb-2">Комментарии</p>
                    <p className="text-xs text-stone-light mb-3">Комментариев пока нет</p>
                    <div className="flex gap-2">
                      <input value={commentInputs[stage.id] || ""} onChange={e => setCommentInputs(p => ({ ...p, [stage.id]: e.target.value }))} placeholder="Добавить комментарий..." className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-stone text-xs focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" />
                      <button className="terra-gradient text-white px-3 py-2 rounded-xl text-xs hover:opacity-90 transition-opacity"><Icon name="Send" size={13} className="text-white" /></button>
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
          <Icon name="Plus" size={16} /> Добавить этап
        </button>
      </div>
    </div>
  );
}