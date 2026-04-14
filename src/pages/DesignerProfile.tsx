import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";

const DESIGNERS = [
  { id: 1, name: "Елена Волкова", spec: "Жилые интерьеры", city: "Москва", rating: 4.9, projects: 47, experience: 8, initials: "ЕВ", color: "from-rose-400 to-orange-400",
    bio: "Специализируюсь на создании уютных жилых интерьеров с акцентом на натуральные материалы и скандинавскую эстетику. Работаю с объектами от 40 до 300 м². Люблю нестандартные планировки и интересные архитектурные решения.",
    reviews: [
      { author: "Анна К.", text: "Елена создала именно тот интерьер, о котором я мечтала. Внимательна к деталям, всегда на связи.", rating: 5 },
      { author: "Михаил Р.", text: "Профессиональный подход и чёткое соблюдение сроков. Рекомендую!", rating: 5 },
      { author: "Светлана Д.", text: "Работали над трёхкомнатной квартирой. Результат превзошёл ожидания.", rating: 5 },
    ],
  },
  { id: 2, name: "Дмитрий Орлов", spec: "Коммерческие", city: "Санкт-Петербург", rating: 4.7, projects: 32, experience: 6, initials: "ДО", color: "from-blue-400 to-indigo-500",
    bio: "Специализируюсь на дизайне коммерческих пространств: рестораны, кафе, офисы, торговые площади. Понимаю бизнес-задачи и создаю интерьеры, которые работают на бренд.",
    reviews: [
      { author: "Виктор П.", text: "Дмитрий спроектировал наш ресторан — отличный результат и полное погружение в концепцию.", rating: 5 },
      { author: "Ирина Л.", text: "Офис выглядит современно и функционально. Сотрудники довольны!", rating: 4 },
    ],
  },
  { id: 3, name: "Анастасия Ким", spec: "Жилые интерьеры", city: "Москва", rating: 4.8, projects: 28, experience: 5, initials: "АК", color: "from-purple-400 to-pink-400",
    bio: "Создаю интерьеры в стилях минимализм, japandi и современная классика. Работаю с жилыми пространствами любой сложности, от студий до загородных домов.",
    reviews: [
      { author: "Алексей Н.", text: "Анастасия — настоящий профессионал. Реализовала сложный проект в срок и в бюджет.", rating: 5 },
      { author: "Мария В.", text: "Отличная работа с деталями, красивый результат. Спасибо!", rating: 5 },
    ],
  },
  { id: 4, name: "Максим Петров", spec: "Ландшафт", city: "Казань", rating: 4.6, projects: 19, experience: 4, initials: "МП", color: "from-green-400 to-teal-500",
    bio: "Ландшафтный дизайнер с опытом в создании садов и парковых зон. Работаю с частными домовладениями, загородными участками и городским озеленением.",
    reviews: [
      { author: "Олег С.", text: "Максим преобразил наш участок — теперь это настоящий сад!", rating: 5 },
      { author: "Наталья Ф.", text: "Прекрасно учёл рельеф и особенности почвы. Очень доволен результатом.", rating: 4 },
    ],
  },
  { id: 5, name: "Ольга Сидорова", spec: "Жилые интерьеры", city: "Екатеринбург", rating: 5.0, projects: 51, experience: 12, initials: "ОС", color: "from-amber-400 to-orange-500",
    bio: "12 лет в профессии, более 50 реализованных проектов. Специализируюсь на классических и неоклассических интерьерах. Работаю с объектами от 80 м².",
    reviews: [
      { author: "Людмила К.", text: "Лучший дизайнер, с которым мне доводилось работать! Идеальное воплощение нашей мечты.", rating: 5 },
      { author: "Сергей М.", text: "Ольга невероятно талантлива. Каждая деталь продумана до мелочей.", rating: 5 },
      { author: "Татьяна Р.", text: "Работаем с Ольгой уже третий проект — всегда результат выше ожиданий.", rating: 5 },
    ],
  },
  { id: 6, name: "Артём Новиков", spec: "Коммерческие", city: "Москва", rating: 4.5, projects: 15, experience: 3, initials: "АН", color: "from-cyan-400 to-blue-500",
    bio: "Молодой и амбициозный дизайнер коммерческих пространств. Специализируюсь на pop-up магазинах, кофейнях и современных офисах.",
    reviews: [
      { author: "Денис Г.", text: "Артём сделал отличный дизайн нашей кофейни — атмосферно и функционально.", rating: 5 },
    ],
  },
  { id: 7, name: "Виктория Лебедева", spec: "Жилые интерьеры", city: "Новосибирск", rating: 4.7, projects: 23, experience: 5, initials: "ВЛ", color: "from-fuchsia-400 to-purple-500",
    bio: "Дизайнер жилых интерьеров с фокусом на семейные пространства. Создаю практичные и красивые интерьеры для семей с детьми.",
    reviews: [
      { author: "Екатерина Б.", text: "Виктория отлично понимает нужды семей с детьми — всё продумано и безопасно!", rating: 5 },
      { author: "Андрей Н.", text: "Красивый результат, сданный точно в срок. Спасибо!", rating: 4 },
    ],
  },
  { id: 8, name: "Роман Козлов", spec: "Коммерческие", city: "Сочи", rating: 4.8, projects: 37, experience: 7, initials: "РК", color: "from-terra to-rose-500",
    bio: "Специализируюсь на дизайне отелей, курортных объектов и ресторанов. Знаю специфику южных регионов и средиземноморский стиль.",
    reviews: [
      { author: "Игорь В.", text: "Роман создал потрясающий дизайн нашего бутик-отеля. Гости в восторге!", rating: 5 },
      { author: "Нина Ш.", text: "Профессионал высокого уровня. Проект сдан вовремя и без компромиссов по качеству.", rating: 5 },
    ],
  },
];

const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "/dashboard" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "/dashboard" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "Users", label: "Клиенты", id: "clients", path: "/dashboard" },
  { icon: "Handshake", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "MessageCircle", label: "Сообщения", id: "messages", path: "/dashboard", badge: 3 },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard" },
];

const specColors: Record<string, string> = {
  "Жилые интерьеры": "bg-terra-pale text-terra border-terra/20",
  "Коммерческие": "bg-blue-50 text-blue-700 border-blue-200",
  "Ландшафт": "bg-green-50 text-green-700 border-green-200",
};

export default function DesignerProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const designer = DESIGNERS.find(d => d.id === Number(id)) || DESIGNERS[0];

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
            <div className="w-10 h-10 terra-gradient rounded-full flex items-center justify-center text-white font-semibold text-sm">ЕС</div>
            <div>
              <div className="text-sm font-semibold text-stone">Елена Смирнова</div>
              <div className="text-xs text-stone-mid">Дизайнер интерьеров</div>
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
              {item.badge && (
                <span className="ml-auto w-5 h-5 terra-gradient rounded-full text-white text-xs flex items-center justify-center">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-mid hover:bg-muted hover:text-stone transition-all">
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
            <span className="text-stone font-medium truncate">{designer.name}</span>
          </div>
        </div>

        <div className="px-4 md:px-8 py-6 max-w-4xl">
          {/* Hero card */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden mb-5">
            {/* Cover gradient */}
            <div className={`h-32 bg-gradient-to-br ${designer.color} opacity-30`} />
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-5">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${designer.color} flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg flex-shrink-0`}>
                  {designer.initials}
                </div>
                <div className="flex-1 sm:pb-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="font-display text-2xl font-semibold text-stone">{designer.name}</h1>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${specColors[designer.spec] || "bg-muted text-stone-mid border-border"}`}>
                      {designer.spec}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-stone-mid text-sm">
                    <Icon name="MapPin" size={13} />
                    {designer.city}
                  </div>
                </div>
                <button className="flex items-center gap-2 terra-gradient text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
                  <Icon name="MessageCircle" size={15} className="text-white" />
                  Написать сообщение
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Проектов", value: designer.projects, icon: "FolderOpen" },
                  { label: "Лет опыта", value: designer.experience, icon: "Award" },
                  { label: "Рейтинг", value: designer.rating, icon: "Star" },
                ].map(s => (
                  <div key={s.label} className="text-center bg-muted/40 rounded-xl py-3">
                    <div className="font-display text-2xl font-semibold text-terra">{s.value}</div>
                    <div className="text-xs text-stone-light mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl border border-border p-6 mb-5">
            <h2 className="font-semibold text-stone text-sm mb-3">О себе</h2>
            <p className="text-stone-mid text-sm leading-relaxed">{designer.bio}</p>
          </div>

          {/* Portfolio */}
          <div className="bg-white rounded-2xl border border-border p-6 mb-5">
            <h2 className="font-semibold text-stone text-sm mb-4">Портфолио</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-xl bg-gradient-to-br ${designer.color} flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity`}
                  style={{ opacity: 0.3 + i * 0.08 }}
                >
                  <Icon name="Image" size={28} className="text-white/50" />
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone text-sm">Отзывы</h2>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className={`text-sm ${i <= Math.floor(designer.rating) ? "text-amber-400" : "text-stone-light"}`}>★</span>
                ))}
                <span className="text-sm font-semibold text-stone ml-1">{designer.rating}</span>
              </div>
            </div>
            <div className="space-y-4">
              {designer.reviews.map((rev, i) => (
                <div key={i} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-stone font-semibold text-xs">
                        {rev.author[0]}
                      </div>
                      <span className="text-sm font-medium text-stone">{rev.author}</span>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} className={`text-xs ${i <= rev.rating ? "text-amber-400" : "text-stone-light"}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-stone-mid leading-relaxed">{rev.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-1 py-2 flex justify-around">
        {NAV_ITEMS.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${item.id === "guild" ? "text-terra" : "text-stone-light"}`}
          >
            <Icon name={item.icon} fallback="Circle" size={19} />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
