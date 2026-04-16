import Icon from "@/components/ui/icon";
import InboxBlock from "@/components/InboxBlock";

interface Project {
  id: string;
  title: string;
  status: string;
  address?: string;
  area?: number;
  budget?: number;
  created_at: string;
  is_team_project?: boolean;
  designer_first_name?: string;
  designer_last_name?: string;
}

interface User {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  role?: string;
  personal_id?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Черновик", color: "bg-gray-50 text-gray-600 border-gray-200" },
  active: { label: "В работе", color: "bg-blue-50 text-blue-700 border-blue-200" },
  review: { label: "Согласование", color: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "Завершён", color: "bg-green-50 text-green-700 border-green-200" },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

function formatBudget(budget?: number) {
  if (!budget) return "-";
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(budget);
}

interface DashboardViewProps {
  projects: Project[];
  loadingProjects: boolean;
  activeCount: number;
  reviewCount: number;
  completedCount: number;
  isDesigner: boolean;
  onCreateProject: () => void;
  onOpenProject: (id: string) => void;
  onGoToProjects: () => void;
}

export function DashboardView({
  projects, loadingProjects, activeCount, reviewCount, completedCount,
  isDesigner, onCreateProject, onOpenProject, onGoToProjects,
}: DashboardViewProps) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Всего проектов", value: String(projects.length), icon: "FolderOpen", color: "text-blue-500" },
          { label: "Активных", value: String(activeCount), icon: "Zap", color: "text-purple-500" },
          { label: "На согласовании", value: String(reviewCount), icon: "Clock", color: "text-amber-500" },
          { label: "Завершено", value: String(completedCount), icon: "CheckCircle", color: "text-green-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-stone-light text-xs">{s.label}</span>
              <Icon name={s.icon} fallback="Circle" size={15} className={s.color} />
            </div>
            <div className="font-display text-3xl font-light text-stone">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <InboxBlock />
        </div>
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-body font-semibold text-stone">Текущие проекты</h2>
            {projects.length > 0 && (
              <button onClick={onGoToProjects} className="text-xs text-terra hover:underline">Все проекты</button>
            )}
          </div>
          {loadingProjects ? (
            <div className="text-center py-12 text-stone-mid animate-pulse">Загрузка проектов...</div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <div className="w-16 h-16 bg-terra-pale rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="FolderPlus" size={28} className="text-terra" />
              </div>
              <h3 className="font-display text-xl text-stone mb-2">Пока нет проектов</h3>
              <p className="text-stone-mid text-sm mb-6">Создайте свой первый проект, чтобы начать работу</p>
              {isDesigner && (
                <button onClick={onCreateProject} className="terra-gradient text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm">
                  Создать первый проект
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((p, i) => {
                const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.draft;
                return (
                  <div key={p.id} onClick={() => onOpenProject(p.id)} className="bg-white rounded-2xl border border-border overflow-hidden hover-scale cursor-pointer hover:border-terra/30 hover:shadow-md hover:shadow-terra/5 transition-all animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="h-28 bg-gradient-to-br from-terra-pale via-terra/10 to-stone/5 flex items-center justify-center relative">
                      <Icon name="Image" size={28} className="text-terra/25" />
                      <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full border font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                      {p.is_team_project && (
                        <span className="absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 font-medium flex items-center gap-1">
                          <Icon name="Users" size={10} /> Команда
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-stone text-sm mb-1 leading-snug">{p.title}</h3>
                      {p.is_team_project && p.designer_first_name && (
                        <div className="flex items-center gap-1.5 text-purple-500 text-xs mb-0.5">
                          <Icon name="User" size={10} />
                          <span>{p.designer_first_name} {p.designer_last_name}</span>
                        </div>
                      )}
                      {p.address && <div className="flex items-center gap-1.5 text-stone-mid text-xs"><Icon name="MapPin" size={11} /><span>{p.address}</span></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface ProfileViewProps {
  user: User | null;
  userInitials: string;
}

export function ProfileView({ user, userInitials }: ProfileViewProps) {
  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-2xl border border-border p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 terra-gradient rounded-2xl flex items-center justify-center text-white font-bold text-xl">
            {userInitials}
          </div>
          <div>
            <h2 className="font-semibold text-stone text-lg">{user?.first_name} {user?.last_name}</h2>
            <p className="text-stone-mid text-sm">{user?.email}</p>
          </div>
        </div>
        <div className="bg-muted rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-light mb-1">Ваш личный ID</p>
              <p className="font-mono text-xl font-bold text-stone tracking-wider">{user?.personal_id || "—"}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(user?.personal_id || ""); }}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border text-stone-mid hover:bg-white transition-colors"
            >
              <Icon name="Copy" size={13} /> Копировать
            </button>
          </div>
          <p className="text-xs text-stone-light mt-2">Поделитесь ID, чтобы вас могли найти и пригласить в проект или команду</p>
        </div>
        <div className="space-y-3">
          {user?.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Icon name="Phone" size={15} className="text-stone-light" />
              <span className="text-stone">{user.phone}</span>
            </div>
          )}
          {user?.city && (
            <div className="flex items-center gap-3 text-sm">
              <Icon name="MapPin" size={15} className="text-stone-light" />
              <span className="text-stone">{user.city}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <Icon name="Briefcase" size={15} className="text-stone-light" />
            <span className="text-stone">{user?.role === "designer" ? "Дизайнер интерьеров" : user?.role === "client" ? "Клиент" : "Работник"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProjectsViewProps {
  projects: Project[];
  loadingProjects: boolean;
  isDesigner: boolean;
  onCreateProject: () => void;
  onOpenProject: (id: string) => void;
}

export function ProjectsView({ projects, loadingProjects, isDesigner, onCreateProject, onOpenProject }: ProjectsViewProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-body font-semibold text-stone">Все проекты</h2>
      </div>
      {loadingProjects ? (
        <div className="text-center py-12 text-stone-mid animate-pulse">Загрузка проектов...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-terra-pale rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="FolderPlus" size={28} className="text-terra" />
          </div>
          <h3 className="font-display text-xl text-stone mb-2">Пока нет проектов</h3>
          <p className="text-stone-mid text-sm mb-6">Создайте свой первый проект, чтобы начать работу</p>
          {isDesigner && (
            <button onClick={onCreateProject} className="terra-gradient text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm">
              Создать первый проект
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p, i) => {
            const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.draft;
            return (
              <div key={p.id} onClick={() => onOpenProject(p.id)} className="bg-white rounded-2xl border border-border overflow-hidden hover-scale cursor-pointer hover:border-terra/30 hover:shadow-md hover:shadow-terra/5 transition-all animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="h-36 bg-gradient-to-br from-terra-pale via-terra/10 to-stone/5 flex items-center justify-center relative">
                  <Icon name="Image" size={32} className="text-terra/25" />
                  <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full border font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-stone text-sm mb-1 leading-snug">{p.title}</h3>
                  {p.address && (
                    <div className="flex items-center gap-1.5 text-stone-mid text-xs mb-3">
                      <Icon name="MapPin" size={11} /><span>{p.address}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                    <div className="text-center">
                      <div className="text-xs text-stone-light">Площадь</div>
                      <div className="text-xs font-medium text-stone mt-0.5">{p.area ? `${p.area} м²` : "-"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-stone-light">Бюджет</div>
                      <div className="text-xs font-medium text-stone mt-0.5">{formatBudget(p.budget)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-stone-light">Дата</div>
                      <div className="text-xs font-medium text-stone mt-0.5">{formatDate(p.created_at)}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}