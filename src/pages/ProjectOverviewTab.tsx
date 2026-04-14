import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { fmtMoney } from "./projectDetail.types";
import { deleteProject } from "@/lib/api";
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

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

function EmptyBlock({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mb-2">
        <Icon name={icon} fallback="Circle" size={18} className="text-stone-light" />
      </div>
      <p className="text-xs font-medium text-stone-mid">{title}</p>
      <p className="text-xs text-stone-light mt-0.5">{subtitle}</p>
    </div>
  );
}

interface OverviewProps {
  project: ProjectData;
}

export function OverviewTab({ project }: OverviewProps) {
  const navigate = useNavigate();
  const [msgInput, setMsgInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all"
            >
              <Icon name="Trash2" size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Finance widget */}
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

        {/* Tasks widget — empty */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="CheckSquare" fallback="Layout" size={13} className="text-white" />
            </div>
            <span className="font-semibold text-stone text-sm">Задачи</span>
          </div>
          <EmptyBlock icon="ListTodo" title="Задач пока нет" subtitle="Создайте первую задачу" />
        </div>

        {/* Chat widget — empty */}
        <div className="bg-white rounded-2xl border border-border p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="MessageCircle" size={13} className="text-white" />
            </div>
            <span className="font-semibold text-stone text-sm">Чат</span>
          </div>
          <div className="flex-1 mb-3">
            <EmptyBlock icon="MessagesSquare" title="Нет сообщений" subtitle="Пригласите участников для общения" />
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icon name="Trash2" size={22} className="text-red-500" />
            </div>
            <h3 className="font-display text-xl text-stone text-center mb-2">Удалить проект?</h3>
            <p className="text-stone-mid text-sm text-center mb-6">
              Проект «{project.title}» и все связанные данные будут удалены безвозвратно.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-stone-mid text-sm font-medium hover:bg-muted transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await deleteProject(project.id);
                    navigate("/dashboard");
                  } catch (err) {
                    console.error("Delete failed:", err);
                    setDeleting(false);
                    setShowDeleteConfirm(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleting ? "Удаляем..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
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

  if (stages.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon name="ListChecks" size={28} className="text-stone-light" />
        </div>
        <h3 className="font-display text-xl text-stone mb-2">Нет этапов</h3>
        <p className="text-stone-mid text-sm mb-6">Добавьте первый этап проекта</p>
        <button className="terra-gradient text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm">
          Добавить этап
        </button>
      </div>
    );
  }

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