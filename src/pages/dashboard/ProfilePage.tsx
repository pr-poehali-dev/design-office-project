import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";

const PROFILE_TABS = [
  { id: "card", label: "Личная карточка", icon: "UserCircle" },
  { id: "company", label: "Компания", icon: "Building2" },
];

const MOCK_STYLES = ["Современный", "Минимализм", "Скандинавский"];
const MOCK_OBJECTS = ["Квартиры", "Дома", "Коммерция"];
const MOCK_PORTFOLIO = [
  { id: "1", title: "Квартира 85м²" },
  { id: "2", title: "Студия 42м²" },
  { id: "3", title: "Лофт 120м²" },
  { id: "4", title: "Дом 200м²" },
  { id: "5", title: "Офис 95м²" },
  { id: "6", title: "Пентхаус 150м²" },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("card");
  const [showPreview, setShowPreview] = useState(false);

  const userInitials = user
    ? `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase()
    : "?";
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  const roleLabel = user?.role === "designer" ? "Дизайнер интерьеров" : user?.role === "client" ? "Клиент" : "Работник";

  return (
    <div className="max-w-2xl">
      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 mb-6">
        <div className="flex gap-1 bg-white border border-border rounded-2xl p-1 min-w-max md:min-w-0">
          {PROFILE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "terra-gradient text-white shadow-sm"
                  : "text-stone-mid hover:text-stone hover:bg-muted"
              }`}
            >
              <Icon name={tab.icon} fallback="Circle" size={15} className={activeTab === tab.id ? "text-white" : ""} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "company" && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="Building2" size={28} className="text-stone-light" />
          </div>
          <h3 className="font-display text-xl text-stone mb-2">Раздел в разработке</h3>
          <p className="text-stone-mid text-sm">Здесь появятся реквизиты и данные вашей компании</p>
        </div>
      )}

      {activeTab === "card" && (
        <div className="space-y-4">
          {/* Header / Avatar */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 terra-gradient rounded-full flex items-center justify-center text-white font-bold text-3xl">
                  {userInitials}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-muted transition-colors">
                  <Icon name="Camera" size={14} className="text-stone-mid" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl font-light text-stone">{fullName}</h2>
                <p className="text-stone-mid text-sm">{roleLabel}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {user?.city && (
                    <span className="flex items-center gap-1 text-xs text-stone-mid">
                      <Icon name="MapPin" size={11} /> {user.city}
                    </span>
                  )}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-terra-pale text-terra border border-terra/20 font-medium">Опыт 5 лет</span>
                  <span className="flex items-center gap-1.5 text-xs text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Онлайн
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-stone text-sm">О себе</h3>
              <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <Icon name="Pencil" size={13} className="text-stone-light" />
              </button>
            </div>
            <p className="text-sm text-stone-mid leading-relaxed">
              Создаю функциональные и эстетичные интерьеры. Специализируюсь на современном стиле и минимализме. Работаю с объектами от 40 до 300 м².
            </p>
          </div>

          {/* Styles & Specialization */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone text-sm">Стили и специализация</h3>
              <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <Icon name="Pencil" size={13} className="text-stone-light" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs text-stone-light mb-2">Стили работы</p>
              <div className="flex flex-wrap gap-1.5">
                {MOCK_STYLES.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-terra-pale text-terra border border-terra/20 font-medium">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-stone-light mb-2">Типы объектов</p>
              <div className="flex flex-wrap gap-1.5">
                {MOCK_OBJECTS.map(o => (
                  <span key={o} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">{o}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone text-sm">Портфолио <span className="text-stone-light font-normal">({MOCK_PORTFOLIO.length} работ)</span></h3>
              <button className="flex items-center gap-1 text-xs text-terra hover:underline">
                <Icon name="Plus" size={12} /> Добавить работу
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {MOCK_PORTFOLIO.map(item => (
                <div key={item.id} className="flex-shrink-0 w-32">
                  <div className="h-24 bg-gradient-to-br from-terra-pale via-terra/10 to-stone/5 rounded-xl flex items-center justify-center mb-1.5">
                    <Icon name="Image" size={22} className="text-terra/25" />
                  </div>
                  <p className="text-xs text-stone-mid text-center truncate">{item.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contacts */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone text-sm">Контакты</h3>
              <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <Icon name="Pencil" size={13} className="text-stone-light" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center"><Icon name="Phone" size={14} className="text-stone-light" /></div>
                <span className="text-stone">{user?.phone || "Не указан"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center"><Icon name="Mail" size={14} className="text-stone-light" /></div>
                <span className="text-stone">{user?.email || "Не указан"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center"><Icon name="Send" size={14} className="text-stone-light" /></div>
                <span className="text-stone-light">Telegram — не указан</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center"><Icon name="Globe" size={14} className="text-stone-light" /></div>
                <span className="text-stone-light">Сайт / Behance — не указан</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "проекта", value: "4", icon: "FolderOpen", color: "text-blue-500" },
              { label: "завершено", value: "2", icon: "CheckCircle", color: "text-green-500" },
              { label: "год в Гильдии", value: "1", icon: "Shield", color: "text-terra" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-border p-4 text-center">
                <Icon name={s.icon} fallback="Circle" size={18} className={`${s.color} mx-auto mb-2`} />
                <p className="font-display text-xl font-semibold text-stone">{s.value}</p>
                <p className="text-xs text-stone-light">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Personal ID */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="bg-muted rounded-xl p-4">
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
          </div>

          {/* Preview button */}
          <button
            onClick={() => setShowPreview(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-border text-sm text-stone-mid hover:border-terra/40 hover:text-stone transition-colors"
          >
            <Icon name="Eye" size={16} /> Как меня видят в Гильдии
          </button>
        </div>
      )}

      {/* Guild Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg text-stone">Карточка в Гильдии</h3>
              <button onClick={() => setShowPreview(false)} className="p-1.5 hover:bg-muted rounded-lg">
                <Icon name="X" size={16} className="text-stone-mid" />
              </button>
            </div>

            {/* Mini card */}
            <div className="text-center mb-4">
              <div className="w-16 h-16 terra-gradient rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                {userInitials}
              </div>
              <h4 className="font-semibold text-stone">{fullName}</h4>
              <p className="text-xs text-stone-mid">{roleLabel}</p>
              <p className="text-xs text-stone-light mt-1">
                4 проекта &bull; {user?.city || "Москва"} &bull; 5 лет опыта
              </p>
            </div>

            {/* Portfolio preview */}
            <div className="flex gap-2 mb-4 justify-center">
              {MOCK_PORTFOLIO.slice(0, 2).map(item => (
                <div key={item.id} className="w-28 h-20 bg-gradient-to-br from-terra-pale via-terra/10 to-stone/5 rounded-xl flex items-center justify-center">
                  <Icon name="Image" size={18} className="text-terra/25" />
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 justify-center mb-5">
              {MOCK_STYLES.map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-terra-pale text-terra border border-terra/20 font-medium">{s}</span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90">
                <Icon name="MessageCircle" size={14} className="text-white" /> Написать
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 border border-border text-stone py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                <Icon name="UserPlus" size={14} /> В команду
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
