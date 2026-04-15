import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { useDesigners, useSendDm } from "@/lib/queries";

interface Designer {
  id: string;
  first_name: string;
  last_name: string;
  city?: string;
  specialization?: string;
  rating: number;
  projects_count: number;
  avatar_url?: string;
  bio?: string;
  personal_id?: string;
  experience_years?: number;
  work_styles?: string;
  work_objects?: string;
  accepting_orders?: boolean;
  phone?: string;
  email?: string;
  telegram?: string;
  contacts_public?: boolean;
}

const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "/dashboard" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "/dashboard" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "Users", label: "Клиенты", id: "clients", path: "/dashboard" },
  { icon: "Handshake", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "UsersRound", label: "Команда", id: "team", path: "/team" },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard?tab=profile" },
];

const SPEC_LABELS: Record<string, string> = {
  residential: "Жилые интерьеры",
  commercial: "Коммерческие",
  landscape: "Ландшафт",
};

const specColors: Record<string, string> = {
  residential: "bg-terra-pale text-terra border-terra/20",
  commercial: "bg-blue-50 text-blue-700 border-blue-200",
  landscape: "bg-green-50 text-green-700 border-green-200",
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
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(first?: string, last?: string) {
  return `${(first || "")[0] || ""}${(last || "")[0] || ""}`.toUpperCase() || "?";
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-sm ${i <= Math.floor(rating) ? "text-amber-400" : "text-stone-light"}`}>★</span>
      ))}
      <span className="text-sm font-semibold text-stone ml-1">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

export default function DesignerProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, logout } = useAuth();

  const { data: designers = [], isLoading } = useDesigners({});
  const designer = designers.find((d: Designer) => d.id === id) as Designer | undefined;

  const [dmTarget, setDmTarget] = useState<{ id: string; name: string } | null>(null);
  const [dmInput, setDmInput] = useState("");
  const [dmSending, setDmSending] = useState(false);

  const sendDmMutation = useSendDm(user ? { id: user.id, first_name: user.first_name, last_name: user.last_name } : undefined);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userInitials = user
    ? getInitials(user.first_name, user.last_name)
    : "?";

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-body flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 terra-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Icon name="User" size={24} className="text-white" />
          </div>
          <p className="text-stone-mid text-sm">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!designer) {
    return (
      <div className="min-h-screen bg-background font-body flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-border p-12 text-center max-w-sm">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="UserX" size={28} className="text-stone-light" />
          </div>
          <h3 className="font-display text-xl text-stone mb-2">Дизайнер не найден</h3>
          <p className="text-stone-mid text-sm mb-6">Профиль не существует или был удалён.</p>
          <button
            onClick={() => navigate("/guild")}
            className="terra-gradient text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90"
          >
            Вернуться в гильдию
          </button>
        </div>
      </div>
    );
  }

  const color = getAvatarColor(designer.id);
  const initials = getInitials(designer.first_name, designer.last_name);
  const specLabel = designer.specialization ? (SPEC_LABELS[designer.specialization] || designer.specialization) : "";
  const specColor = designer.specialization ? (specColors[designer.specialization] || "bg-muted text-stone-mid border-border") : "";
  const workStyles = (designer.work_styles || "").split(",").map(s => s.trim()).filter(Boolean);
  const workObjects = (designer.work_objects || "").split(",").map(s => s.trim()).filter(Boolean);
  const fullName = `${designer.first_name} ${designer.last_name}`;

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
              {userInitials}
            </div>
            <div>
              <div className="text-sm font-semibold text-stone">{user?.first_name} {user?.last_name}</div>
              <div className="text-xs text-stone-mid">
                {user?.role === "designer" ? "Дизайнер интерьеров" : user?.role === "client" ? "Клиент" : "Участник"}
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                item.id === "guild" ? "bg-terra-pale text-terra font-medium" : "text-stone-mid hover:bg-muted hover:text-stone"
              }`}
            >
              <Icon name={item.icon} fallback="Circle" size={17} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-mid hover:bg-muted hover:text-stone transition-all">
            <Icon name="LogOut" size={17} /><span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto pb-24 md:pb-8">
        {/* Breadcrumb */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 md:px-8 py-3">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => navigate("/guild")} className="flex items-center gap-1.5 text-stone-mid hover:text-stone transition-colors">
              <Icon name="ArrowLeft" size={15} />
              <span>Гильдия</span>
            </button>
            <span className="text-stone-light">/</span>
            <span className="text-stone font-medium truncate">{fullName}</span>
          </div>
        </div>

        <div className="px-4 md:px-8 py-6 max-w-4xl">
          {/* Hero card */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden mb-5">
            {/* Cover gradient */}
            <div className={`h-32 bg-gradient-to-br ${color} opacity-30`} />
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-5">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {designer.avatar_url ? (
                    <img
                      src={designer.avatar_url}
                      alt=""
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg`}>
                      {initials}
                    </div>
                  )}
                </div>
                <div className="flex-1 sm:pb-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="font-display text-2xl font-semibold text-stone">{fullName}</h1>
                    {specLabel && (
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${specColor}`}>
                        {specLabel}
                      </span>
                    )}
                    {designer.accepting_orders !== false && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                        Берёт заказы
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-stone-mid text-sm">
                    {designer.city && (
                      <span className="flex items-center gap-1">
                        <Icon name="MapPin" size={13} />
                        {designer.city}
                      </span>
                    )}
                    {designer.personal_id && (
                      <span className="text-stone-light font-mono text-xs">ID: {designer.personal_id}</span>
                    )}
                  </div>
                </div>
                {/* Action buttons */}
                {designer.id !== user?.id && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setDmTarget({ id: designer.id, name: fullName })}
                      className="flex items-center gap-2 terra-gradient text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Icon name="MessageCircle" size={15} className="text-white" />
                      Написать
                    </button>
                    <button
                      onClick={() => setDmTarget({ id: designer.id, name: fullName })}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-stone text-sm font-medium hover:border-terra/40 hover:text-terra transition-all"
                    >
                      <Icon name="UserPlus" size={15} />
                      В команду
                    </button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Проектов", value: designer.projects_count || 0, icon: "FolderOpen" },
                  { label: "Лет опыта", value: designer.experience_years || 0, icon: "Award" },
                  { label: "Рейтинг", value: designer.rating || 0, icon: "Star" },
                ].map(s => (
                  <div key={s.label} className="text-center bg-muted/40 rounded-xl py-3">
                    <div className="font-display text-2xl font-semibold text-terra">
                      {s.label === "Рейтинг" ? Number(s.value).toFixed(1) : s.value}
                    </div>
                    <div className="text-xs text-stone-light mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* About */}
          {designer.bio && (
            <div className="bg-white rounded-2xl border border-border p-6 mb-5">
              <h2 className="font-semibold text-stone text-sm mb-3 flex items-center gap-2">
                <Icon name="FileText" size={15} className="text-stone-mid" />
                О себе
              </h2>
              <p className="text-stone-mid text-sm leading-relaxed whitespace-pre-line">{designer.bio}</p>
            </div>
          )}

          {/* Work styles & objects */}
          {(workStyles.length > 0 || workObjects.length > 0) && (
            <div className="bg-white rounded-2xl border border-border p-6 mb-5">
              <h2 className="font-semibold text-stone text-sm mb-4 flex items-center gap-2">
                <Icon name="Palette" size={15} className="text-stone-mid" />
                Специализация
              </h2>

              {workStyles.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-stone-light mb-2">Стили работы</p>
                  <div className="flex flex-wrap gap-1.5">
                    {workStyles.map(s => (
                      <span key={s} className="text-xs px-3 py-1 rounded-full bg-terra-pale text-terra border border-terra/20 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {workObjects.length > 0 && (
                <div>
                  <p className="text-xs text-stone-light mb-2">Типы объектов</p>
                  <div className="flex flex-wrap gap-1.5">
                    {workObjects.map(s => (
                      <span key={s} className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contacts */}
          {designer.contacts_public && (designer.phone || designer.email || designer.telegram) && (
            <div className="bg-white rounded-2xl border border-border p-6 mb-5">
              <h2 className="font-semibold text-stone text-sm mb-4 flex items-center gap-2">
                <Icon name="Contact" size={15} className="text-stone-mid" />
                Контакты
              </h2>
              <div className="space-y-3">
                {designer.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <Icon name="Phone" size={14} className="text-stone-mid" />
                    </div>
                    <span className="text-stone">{designer.phone}</span>
                  </div>
                )}
                {designer.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <Icon name="Mail" size={14} className="text-stone-mid" />
                    </div>
                    <a href={`mailto:${designer.email}`} className="text-terra hover:underline">{designer.email}</a>
                  </div>
                )}
                {designer.telegram && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <Icon name="Send" size={14} className="text-stone-mid" />
                    </div>
                    <a href={`https://t.me/${designer.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-terra hover:underline">{designer.telegram}</a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rating */}
          <div className="bg-white rounded-2xl border border-border p-6 mb-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-stone text-sm flex items-center gap-2">
                <Icon name="Star" size={15} className="text-stone-mid" />
                Рейтинг
              </h2>
              <StarRating rating={designer.rating || 0} />
            </div>
            <p className="text-xs text-stone-light">На основе {designer.projects_count || 0} выполненных проектов</p>
          </div>

          {/* Portfolio placeholder */}
          <div className="bg-white rounded-2xl border border-border p-6 mb-5">
            <h2 className="font-semibold text-stone text-sm mb-4 flex items-center gap-2">
              <Icon name="Image" size={15} className="text-stone-mid" />
              Портфолио
            </h2>
            <div className="bg-muted/40 rounded-xl p-10 text-center">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Icon name="ImagePlus" size={28} className="text-stone-light" />
              </div>
              <p className="text-stone-mid text-sm mb-1">Портфолио скоро появится</p>
              <p className="text-stone-light text-xs">Дизайнер пока не добавил работы в портфолио</p>
            </div>
          </div>
        </div>
      </main>

      {/* DM Modal */}
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

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-1 py-2 flex justify-around">
        {NAV_ITEMS.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all relative ${item.id === "guild" ? "text-terra" : "text-stone-light"}`}
          >
            <Icon name={item.icon} fallback="Circle" size={19} />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
