import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import { useTeam, useProjects, useInviteToTeam, useRemoveTeamMember } from "@/lib/queries";
import { updateTeamMember } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

const TEAM_ROLES: Record<string, string> = {
  designer: "Дизайнер",
  visualizer: "Визуализатор",
  draftsman: "Чертёжник",
  procurement: "Комплектатор",
  foreman: "Прораб",
};

const ROLE_COLORS: Record<string, string> = {
  designer: "bg-terra-pale text-terra border-terra/20",
  visualizer: "bg-purple-50 text-purple-700 border-purple-200",
  draftsman: "bg-blue-50 text-blue-700 border-blue-200",
  procurement: "bg-amber-50 text-amber-700 border-amber-200",
  foreman: "bg-green-50 text-green-700 border-green-200",
};

const AVATAR_COLORS = [
  "from-rose-400 to-orange-400",
  "from-blue-400 to-indigo-500",
  "from-purple-400 to-pink-400",
  "from-green-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-blue-500",
  "from-fuchsia-400 to-purple-500",
  "from-terra to-rose-500",
];

const PERMISSION_LABELS: Record<string, string> = {
  overview: "Обзор проекта",
  execution: "Выполнение (этапы)",
  brief: "Бриф",
  estimate: "Смета",
  finance: "Финансы",
  documents: "Документы",
  proposal: "КП (коммерческое предложение)",
};

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface TeamMember {
  id: string;
  member_id: string;
  owner_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city?: string;
  specialization?: string;
  bio?: string;
  rating: number;
  personal_id?: string;
  team_role: string;
  accepted: boolean;
  invited_at: string;
  access_permissions: Record<string, boolean>;
  allowed_project_ids: string[];
  allowed_projects: { id: string; title: string; status: string }[];
}

interface TeamTabProps {
  user: { id: string; first_name: string; last_name: string; email: string; role: string };
}

// ----- Member Access Modal -----
function MemberAccessModal({
  member,
  allProjects,
  onClose,
}: {
  member: TeamMember;
  allProjects: { id: string; title: string }[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    member.access_permissions || {
      overview: true, execution: true, brief: true,
      estimate: false, finance: false, documents: false, proposal: false,
    }
  );
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    member.allowed_project_ids || []
  );
  const [saving, setSaving] = useState(false);

  const togglePerm = (key: string) => setPermissions(p => ({ ...p, [key]: !p[key] }));

  const toggleProject = (id: string) =>
    setSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTeamMember(member.id, {
        access_permissions: permissions,
        allowed_project_ids: selectedProjects,
      });
      await qc.invalidateQueries({ queryKey: ["team"] });
      toast.success("Права доступа сохранены");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-xl text-stone">Права доступа</h3>
            <p className="text-sm text-stone-mid">{member.first_name} {member.last_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg">
            <Icon name="X" size={16} className="text-stone-mid" />
          </button>
        </div>

        {/* Projects */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-stone mb-2">Доступные проекты</p>
          {allProjects.length === 0 ? (
            <p className="text-xs text-stone-light">У вас пока нет проектов</p>
          ) : (
            <div className="space-y-2">
              {allProjects.map(p => (
                <label key={p.id} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => toggleProject(p.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      selectedProjects.includes(p.id)
                        ? "bg-terra border-terra"
                        : "border-border group-hover:border-terra/50"
                    }`}
                  >
                    {selectedProjects.includes(p.id) && <Icon name="Check" size={11} className="text-white" />}
                  </div>
                  <span className="text-sm text-stone">{p.title}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Permissions */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-stone mb-1">Разделы проекта</p>
          <p className="text-xs text-stone-light mb-3">Выберите что будет видеть специалист в каждом проекте</p>
          <div className="space-y-2">
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => togglePerm(key)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    permissions[key]
                      ? "bg-terra border-terra"
                      : "border-border group-hover:border-terra/50"
                  }`}
                >
                  {permissions[key] && <Icon name="Check" size={11} className="text-white" />}
                </div>
                <span className="text-sm text-stone">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-stone-mid text-sm hover:bg-muted transition-colors">
            Отмена
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-60">
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----- Main Component -----
export default function TeamTab({ user }: TeamTabProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: members = [], isLoading } = useTeam();
  const { data: allProjects = [] } = useProjects();
  const inviteMutation = useInviteToTeam();
  const removeMutation = useRemoveTeamMember();

  const [showInvite, setShowInvite] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("designer");
  const [inviting, setInviting] = useState(false);
  const [invResult, setInvResult] = useState("");
  const [search, setSearch] = useState("");
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const typedMembers = members as TeamMember[];
  const typedProjects = allProjects as { id: string; title: string }[];
  const accepted = typedMembers.filter(m => m.accepted);
  const pending = typedMembers.filter(m => !m.accepted);

  const filtered = typedMembers.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const handleInvite = async () => {
    if (!invEmail.trim()) return;
    setInviting(true);
    setInvResult("");
    try {
      await inviteMutation.mutateAsync({ email: invEmail.trim(), team_role: invRole });
      setInvResult("Приглашение отправлено! Специалист увидит его в своих сообщениях.");
      setInvEmail("");
    } catch (err: unknown) {
      setInvResult(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await removeMutation.mutateAsync(id);
      toast.success("Специалист удалён из команды");
    } catch {
      toast.error("Ошибка удаления");
    }
    setRemovingId(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <p className="text-stone-mid text-sm">
          {accepted.length} {accepted.length === 1 ? "специалист" : accepted.length < 5 ? "специалиста" : "специалистов"} в команде
          {pending.length > 0 && <span className="ml-2 text-amber-600">· {pending.length} ожидает ответа</span>}
        </p>
        <button onClick={() => { setShowInvite(true); setInvResult(""); }} className="flex items-center gap-1.5 terra-gradient text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:opacity-90">
          <Icon name="UserPlus" size={15} className="text-white" />
          <span className="hidden sm:inline">Пригласить</span>
        </button>
      </div>

      {/* Search */}
      {typedMembers.length > 0 && (
        <div className="relative mb-5">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-light" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени или email..." className="pl-8 pr-3 py-2 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 w-full max-w-xs" />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-terra/30 border-t-terra rounded-full animate-spin" />
        </div>
      ) : typedMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="UsersRound" size={36} className="text-stone-light" />
          </div>
          <h3 className="font-display text-2xl text-stone mb-2">Ваша команда пока пуста</h3>
          <p className="text-stone-mid text-sm mb-6 max-w-md mx-auto">Пригласите специалистов из раздела Гильдия или по email/ID</p>
          <button onClick={() => setShowInvite(true)} className="terra-gradient text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90">
            <Icon name="UserPlus" size={15} className="text-white inline mr-1.5" /> Пригласить специалиста
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pending invitations section */}
          {pending.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 px-1">Ожидают ответа</p>
              <div className="space-y-2">
                {pending.filter(m => !search || `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase())).map(member => {
                  const initials = `${(member.first_name || "")[0] || ""}${(member.last_name || "")[0] || ""}`.toUpperCase();
                  const colorGrad = getAvatarColor(member.member_id);
                  const roleLabel = TEAM_ROLES[member.team_role] || member.team_role;
                  const roleColor = ROLE_COLORS[member.team_role] || "bg-muted text-stone-mid border-border";
                  return (
                    <div key={member.id} className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex items-center gap-3 opacity-80">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorGrad} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-stone text-sm">{member.first_name} {member.last_name}</div>
                        <div className="text-xs text-stone-light truncate">{member.email}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${roleColor}`}>{roleLabel}</span>
                      <span className="text-xs text-amber-600">Ожидает</span>
                      <button onClick={() => handleRemove(member.id)} disabled={removingId === member.id} className="p-1.5 hover:bg-red-50 rounded-lg text-stone-light hover:text-red-500 transition-colors">
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accepted members */}
          {accepted.length > 0 && (
            <div>
              {pending.length > 0 && <p className="text-xs font-semibold text-stone-mid uppercase tracking-wide mb-2 px-1">Специалисты</p>}
              <div className="grid sm:grid-cols-2 gap-4">
                {accepted.filter(m => !search || `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase())).map(member => {
                  const initials = `${(member.first_name || "")[0] || ""}${(member.last_name || "")[0] || ""}`.toUpperCase();
                  const colorGrad = getAvatarColor(member.member_id);
                  const roleLabel = TEAM_ROLES[member.team_role] || member.team_role;
                  const roleColor = ROLE_COLORS[member.team_role] || "bg-muted text-stone-mid border-border";
                  const allowedProjects = member.allowed_projects || [];
                  const permCount = Object.values(member.access_permissions || {}).filter(Boolean).length;
                  return (
                    <div key={member.id} className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3 mb-4">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorGrad} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 cursor-pointer`}
                          onClick={() => navigate(`/designer/${member.personal_id || member.member_id}`)}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <button onClick={() => navigate(`/designer/${member.personal_id || member.member_id}`)} className="font-semibold text-stone text-sm hover:text-terra transition-colors text-left">
                            {member.first_name} {member.last_name}
                          </button>
                          <div className="text-xs text-stone-light truncate">{member.email}</div>
                          {member.city && <div className="text-xs text-stone-light">{member.city}</div>}
                        </div>
                        <button onClick={() => handleRemove(member.id)} disabled={removingId === member.id} className="p-1.5 hover:bg-red-50 rounded-lg text-stone-light hover:text-red-500 transition-colors flex-shrink-0">
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${roleColor}`}>{roleLabel}</span>
                      </div>

                      {/* Projects access */}
                      <div className="mb-3">
                        <p className="text-xs text-stone-light mb-1">
                          {allowedProjects.length === 0 ? "Нет доступа к проектам" : `Проекты: ${allowedProjects.map(p => p.title).join(", ")}`}
                        </p>
                        <p className="text-xs text-stone-light">Разделы: {permCount} из {Object.keys(PERMISSION_LABELS).length}</p>
                      </div>

                      <button
                        onClick={() => setEditMember(member)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-terra border border-terra/30 rounded-xl py-2 hover:bg-terra-pale transition-colors"
                      >
                        <Icon name="Settings" size={13} /> Права доступа
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl text-stone">Пригласить специалиста</h3>
              <button onClick={() => setShowInvite(false)} className="p-1.5 hover:bg-muted rounded-lg"><Icon name="X" size={16} className="text-stone-mid" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-light mb-1 block">Email или личный ID специалиста</label>
                <input
                  value={invEmail}
                  onChange={e => setInvEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleInvite()}
                  placeholder="email@example.com или ID (напр. A3B1C2D4)"
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20"
                />
              </div>
              <div>
                <label className="text-xs text-stone-light mb-1 block">Роль</label>
                <select value={invRole} onChange={e => setInvRole(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20">
                  {Object.entries(TEAM_ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {invResult && (
                <p className={`text-xs ${invResult.includes("отправлено") || invResult.includes("!") ? "text-green-600" : "text-red-500"}`}>{invResult}</p>
              )}
              <button onClick={handleInvite} disabled={!invEmail.trim() || inviting} className="w-full terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {inviting ? "Отправляем..." : "Отправить приглашение"}
              </button>
              <p className="text-xs text-stone-light text-center">Специалист получит уведомление в разделе Сообщения</p>
            </div>
          </div>
        </div>
      )}

      {/* Access Rights Modal */}
      {editMember && (
        <MemberAccessModal
          member={editMember}
          allProjects={typedProjects}
          onClose={() => setEditMember(null)}
        />
      )}
    </div>
  );
}
