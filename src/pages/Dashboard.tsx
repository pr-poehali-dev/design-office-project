import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const PROJECTS = [
  {
    id: 1,
    name: "Квартира на Тверской",
    status: "В работе",
    statusColor: "bg-blue-50 text-blue-700 border-blue-200",
    client: "Анна Петрова",
    date: "15 янв 2025",
    area: "92 м²",
    budget: "4 200 000 ₽",
    images: 12,
    progress: 65,
  },
  {
    id: 2,
    name: "Загородный дом в Подмосковье",
    status: "Согласование",
    statusColor: "bg-amber-50 text-amber-700 border-amber-200",
    client: "Игорь Сидоров",
    date: "03 фев 2025",
    area: "280 м²",
    budget: "11 500 000 ₽",
    images: 8,
    progress: 40,
  },
  {
    id: 3,
    name: "Студия на Арбате",
    status: "Завершён",
    statusColor: "bg-green-50 text-green-700 border-green-200",
    client: "Мария Козлова",
    date: "28 дек 2024",
    area: "45 м²",
    budget: "1 800 000 ₽",
    images: 24,
    progress: 100,
  },
];

const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard" },
  { icon: "FolderOpen", label: "Проекты", id: "projects" },
  { icon: "Users", label: "Клиенты", id: "clients" },
  { icon: "FileText", label: "Документы", id: "docs" },
  { icon: "MessageCircle", label: "Сообщения", id: "messages", badge: 3 },
  { icon: "User", label: "Профиль", id: "profile" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-body flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-border h-screen sticky top-0">
        <div className="p-5 border-b border-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="Layers" size={15} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-stone">DesignOffice</span>
          </button>
        </div>

        {/* Designer info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 terra-gradient rounded-full flex items-center justify-center text-white font-semibold text-sm">
              ЕС
            </div>
            <div>
              <div className="text-sm font-semibold text-stone">Елена Смирнова</div>
              <div className="text-xs text-stone-mid">Дизайнер интерьеров</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeNav === item.id
                  ? "bg-terra-pale text-terra font-medium"
                  : "text-stone-mid hover:bg-muted hover:text-stone"
              }`}
            >
              <Icon name={item.icon} fallback="Circle" size={17} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto w-5 h-5 terra-gradient rounded-full text-white text-xs flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-mid hover:bg-muted hover:text-stone transition-all"
          >
            <Icon name="LogOut" size={17} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-2 py-2 flex justify-around">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${
              activeNav === item.id ? "text-terra" : "text-stone-light"
            }`}
          >
            <Icon name={item.icon} fallback="Circle" size={20} />
            <span className="text-xs">{item.label}</span>
            {item.badge && (
              <span className="absolute -top-0.5 right-1 w-4 h-4 terra-gradient rounded-full text-white text-xs flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-light text-stone">
              {activeNav === "dashboard" && "Обзор"}
              {activeNav === "projects" && "Проекты"}
              {activeNav === "clients" && "Клиенты"}
              {activeNav === "docs" && "Документы"}
              {activeNav === "messages" && "Сообщения"}
              {activeNav === "profile" && "Профиль"}
            </h1>
            <p className="text-stone-mid text-sm mt-0.5">Среда, 14 апреля 2025</p>
          </div>
          <button className="terra-gradient text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Icon name="Plus" size={15} className="text-white" />
            <span className="hidden sm:inline">Новый проект</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Активных проектов", value: "2", icon: "FolderOpen", color: "text-blue-500" },
            { label: "Клиентов", value: "8", icon: "Users", color: "text-purple-500" },
            { label: "На согласовании", value: "1", icon: "Clock", color: "text-amber-500" },
            { label: "Завершено", value: "12", icon: "CheckCircle", color: "text-green-500" },
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

        {/* Projects */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-body font-semibold text-stone">Текущие проекты</h2>
            <button className="text-terra text-sm hover:underline">Все проекты</button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROJECTS.map((p, i) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-border overflow-hidden hover-scale cursor-pointer hover:border-terra/30 hover:shadow-md hover:shadow-terra/5 transition-all animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Cover */}
                <div className="h-36 bg-gradient-to-br from-terra-pale via-terra/10 to-stone/5 flex items-center justify-center relative">
                  <Icon name="Image" size={32} className="text-terra/25" />
                  <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full border font-medium ${p.statusColor}`}>
                    {p.status}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-stone text-sm mb-1 leading-snug">{p.name}</h3>

                  <div className="flex items-center gap-1.5 text-stone-mid text-xs mb-3">
                    <Icon name="User" size={11} />
                    <span>{p.client}</span>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-stone-light">Готовность</span>
                      <span className="text-xs text-stone-mid font-medium">{p.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full terra-gradient rounded-full transition-all"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                    <div className="text-center">
                      <div className="text-xs text-stone-light">Площадь</div>
                      <div className="text-xs font-medium text-stone mt-0.5">{p.area}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-stone-light">Фото</div>
                      <div className="text-xs font-medium text-stone mt-0.5">{p.images}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-stone-light">Дата</div>
                      <div className="text-xs font-medium text-stone mt-0.5">{p.date}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-body font-semibold text-stone mb-4">Последние действия</h2>
          <div className="space-y-3">
            {[
              { icon: "Upload", text: "Загружены визуализации гостиной", project: "Квартира на Тверской", time: "2 ч назад" },
              { icon: "MessageCircle", text: "Новый комментарий от клиента", project: "Загородный дом в Подмосковье", time: "5 ч назад" },
              { icon: "CheckCircle", text: "Смета согласована", project: "Студия на Арбате", time: "вчера" },
              { icon: "FileText", text: "Загружен договор", project: "Квартира на Тверской", time: "2 дня назад" },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 bg-terra-pale rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name={a.icon} fallback="Circle" size={14} className="text-terra" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone">{a.text}</p>
                  <p className="text-xs text-stone-light">{a.project}</p>
                </div>
                <span className="text-xs text-stone-light whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
