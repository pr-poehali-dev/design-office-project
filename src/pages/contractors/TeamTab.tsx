import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useTeam, useProjects, useInviteToTeam, useRemoveTeamMember, useInviteMember, useSendDm } from "@/lib/queries";

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

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface TeamMember {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city?: string;
  specialization?: string;
  bio?: string;
  rating: number;
  team_role: string;
  accepted: boolean;
  invited_at: string;
  active_projects: number;
  projects: { id: string; title: string }[];
}

interface TeamTabProps {
  user: { id: string; first_name: string; last_name: string; email: string; role: string };
}

export default function TeamTab({ user }: TeamTabProps) {
  const navigate = useNavigate();
  const { data: members = [], isLoading } = useTeam();
  const { data: projects = [] } = useProjects();
  const inviteMutation = useInviteToTeam();
  const removeMutation = useRemoveTeamMember();

  const [showInvite, setShowInvite] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("designer");
  const [invResult, setInvResult] = useState("");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [assignMember, setAssignMember] = useState<TeamMember | null>(null);
  const [assignProjectId, setAssignProjectId] = useState("");
  const [assignResult, setAssignResult] = useState("");
  const assignMutation = useInviteMember();
  const [dmTarget, setDmTarget] = useState<{ id: string; name: string } | null>(null);
  const [dmInput, setDmInput] = useState("");
  const [dmSending, setDmSending] = useState(false);
  const sendDmMutation = useSendDm({ id: user.id, first_name: user.first_name, last_name: user.last_name });

  const handleInvite = async () => {
    if (!invEmail.trim()) return;
    setInvResult("");
    try {
      await inviteMutation.mutateAsync({ email: invEmail.trim(), team_role: invRole });
      setInvResult("Приглашение отправлено!");
      setInvEmail("");
    } catch (err: unknown) {
      setInvResult(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try { await removeMutation.mutateAsync(id); } catch { /* empty */ }
    setRemovingId(null);
  };

  const handleAssignToProject = async () => {
    if (!assignMember || !assignProjectId) return;
    setAssignResult("");
    try {
      await assignMutation.mutateAsync({ email: assignMember.email, project_id: assignProjectId, role: "worker" });
      setAssignResult("Назначен на проект!");
      setTimeout(() => { setAssignMember(null); setAssignResult(""); setAssignProjectId(""); }, 1200);
    } catch (err: unknown) {
      setAssignResult(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const getAvailableProjects = (member: TeamMember) => {
    const memberProjectIds = new Set((member.projects || []).map(p => p.id));
    return (projects as { id: string; title: string }[]).filter(p => !memberProjectIds.has(p.id));
  };

  const filtered = (members as TeamMember[]).filter(m => {
    if (search) {
      const q = search.toLowerCase();
      const name = `${m.first_name} ${m.last_name}`.toLowerCase();
      if (!name.includes(q) && !m.email.toLowerCase().includes(q)) return false;
    }
    if (filterRole !== "all" && m.team_role !== filterRole) return false;
    if (filterProject !== "all" && !m.projects?.some(p => p.id === filterProject)) return false;
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <p className="text-stone-mid text-sm">
          Всего: {(members as TeamMember[]).length} {(members as TeamMember[]).length === 1 ? "человек" : (members as TeamMember[]).length < 5 ? "человека" : "человек"}
        </p>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 terra-gradient text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          <Icon name="UserPlus" size={15} className="text-white" />
          <span className="hidden sm:inline">Пригласить</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-5">
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-light" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени..." className="pl-8 pr-3 py-2 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 w-48" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20">
          <option value="all">Все роли</option>
          {Object.entries(TEAM_ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20">
          <option value="all">Все проекты</option>
          {(projects as { id: string; title: string }[]).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <span className="text-xs text-stone-light ml-auto">{filtered.length} из {(members as TeamMember[]).length}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-terra/30 border-t-terra rounded-full animate-spin" />
        </div>
      ) : (members as TeamMember[]).length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="UsersRound" size={36} className="text-stone-light" />
          </div>
          <h3 className="font-display text-2xl text-stone mb-2">Ваша команда пока пуста</h3>
          <p className="text-stone-mid text-sm mb-6 max-w-md mx-auto">Пригласите дизайнеров, визуализаторов, чертёжников и других специалистов</p>
          <button onClick={() => setShowInvite(true)} className="terra-gradient text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90">
            <Icon name="UserPlus" size={15} className="text-white inline mr-1.5" /> Пригласить специалиста
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(member => {
            const initials = `${(member.first_name || "")[0] || ""}${(member.last_name || "")[0] || ""}`.toUpperCase();
            const colorGrad = getAvatarColor(member.member_id);
            return (
              <div key={member.id} className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-all group">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorGrad} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone text-sm truncate">{member.first_name} {member.last_name}</h3>
                      {!member.accepted && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0">Ожидает</span>
                      )}
                    </div>
                    <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border font-medium mt-1 ${ROLE_COLORS[member.team_role] || "bg-muted text-stone-mid border-border"}`}>
                      {TEAM_ROLES[member.team_role] || member.team_role}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-stone-mid">
                    <Icon name="Briefcase" size={12} className="text-stone-light flex-shrink-0" />
                    <span>{member.active_projects || 0} активных проектов</span>
                  </div>
                  {member.rating > 0 && (
                    <div className="flex items-center gap-2 text-xs text-stone-mid">
                      <span className="text-amber-400">★</span>
                      <span>{Number(member.rating).toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-stone-mid">
                    <Icon name="Mail" size={12} className="text-stone-light flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-xs text-stone-mid">
                      <Icon name="Phone" size={12} className="text-stone-light flex-shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                {member.projects && member.projects.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-stone-light mb-1.5">Проекты:</p>
                    <div className="flex flex-wrap gap-1">
                      {member.projects.slice(0, 3).map(p => (
                        <button key={p.id} onClick={() => navigate(`/project/${p.id}`)} className="text-xs px-2 py-0.5 rounded-full bg-muted text-stone-mid border border-border hover:border-terra/30 transition-colors truncate max-w-[120px]">
                          {p.title}
                        </button>
                      ))}
                      {member.projects.length > 3 && (
                        <span className="text-xs text-stone-light">+{member.projects.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-border">
                  <button onClick={() => { setAssignMember(member); setAssignProjectId(""); setAssignResult(""); }} className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-xl terra-gradient text-white hover:opacity-90 transition-opacity">
                    <Icon name="FolderPlus" size={12} className="text-white" /> На проект
                  </button>
                  {member.member_id !== user.id && (
                    <button onClick={() => setDmTarget({ id: member.member_id, name: `${member.first_name} ${member.last_name}` })} className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-xl border border-border text-stone-mid hover:bg-muted transition-colors">
                      <Icon name="MessageCircle" size={12} /> Написать
                    </button>
                  )}
                  <button onClick={() => navigate(`/guild/designer/${member.member_id}`)} className="flex items-center justify-center gap-1 text-xs py-2 px-3 rounded-xl border border-border text-stone-mid hover:bg-muted transition-colors">
                    <Icon name="User" size={12} />
                  </button>
                  <button onClick={() => handleRemove(member.id)} disabled={removingId === member.id} className="flex items-center justify-center gap-1 text-xs py-2 px-3 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40">
                    <Icon name="UserMinus" size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-stone">Пригласить специалиста</h3>
              <button onClick={() => { setShowInvite(false); setInvResult(""); }} className="p-1.5 hover:bg-muted rounded-lg"><Icon name="X" size={16} className="text-stone-mid" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-light mb-1 block">Email или личный ID</label>
                <input value={invEmail} onChange={e => setInvEmail(e.target.value)} placeholder="email@example.com или 998E6648" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" />
              </div>
              <div>
                <label className="text-xs text-stone-light mb-1 block">Роль</label>
                <select value={invRole} onChange={e => setInvRole(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20">
                  {Object.entries(TEAM_ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {invResult && <p className={`text-xs ${invResult.includes("отправлено") ? "text-green-600" : "text-red-500"}`}>{invResult}</p>}
              <button onClick={handleInvite} disabled={inviteMutation.isPending} className="w-full terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {inviteMutation.isPending ? "Отправляем..." : "Пригласить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {assignMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-stone">Назначить на проект</h3>
              <button onClick={() => { setAssignMember(null); setAssignResult(""); }} className="p-1.5 hover:bg-muted rounded-lg"><Icon name="X" size={16} className="text-stone-mid" /></button>
            </div>
            <p className="text-sm text-stone-mid mb-4">{assignMember.first_name} {assignMember.last_name} — {TEAM_ROLES[assignMember.team_role] || assignMember.team_role}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-light mb-1 block">Выберите проект</label>
                {getAvailableProjects(assignMember).length === 0 ? (
                  <p className="text-xs text-stone-mid py-2">Участник уже назначен на все ваши проекты</p>
                ) : (
                  <select value={assignProjectId} onChange={e => setAssignProjectId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20">
                    <option value="">Выберите проект...</option>
                    {getAvailableProjects(assignMember).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                )}
              </div>
              {assignResult && <p className={`text-xs ${assignResult.includes("Назначен") ? "text-green-600" : "text-red-500"}`}>{assignResult}</p>}
              {getAvailableProjects(assignMember).length > 0 && (
                <button onClick={handleAssignToProject} disabled={!assignProjectId || assignMutation.isPending} className="w-full terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {assignMutation.isPending ? "Назначаем..." : "Назначить"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {dmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-stone">Написать {dmTarget.name}</h3>
              <button onClick={() => { setDmTarget(null); setDmInput(""); }} className="p-1.5 hover:bg-muted rounded-lg"><Icon name="X" size={16} className="text-stone-mid" /></button>
            </div>
            <textarea value={dmInput} onChange={e => setDmInput(e.target.value)} placeholder="Ваше сообщение..." rows={4} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 resize-none mb-3" autoFocus />
            <button
              onClick={async () => {
                if (!dmInput.trim()) return;
                setDmSending(true);
                try {
                  await sendDmMutation.mutateAsync({ receiver_id: dmTarget.id, content: dmInput.trim() });
                  setDmTarget(null);
                  setDmInput("");
                } catch { /* empty */ }
                setDmSending(false);
              }}
              disabled={!dmInput.trim() || dmSending}
              className="w-full terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {dmSending ? "Отправка..." : "Отправить"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
