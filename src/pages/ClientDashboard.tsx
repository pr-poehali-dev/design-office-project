import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const CLIENT_PROJECTS = [
  {
    id: 1,
    name: "Квартира на Тверской",
    designer: "Елена Смирнова",
    status: "В работе",
    statusColor: "bg-blue-50 text-blue-700 border-blue-200",
    progress: 65,
    nextStep: "Согласование концепции гостиной",
    images: 12,
    docs: 3,
  },
];

const VARIANTS = [
  { id: 1, name: "Концепция А — Скандинавский минимализм", liked: true },
  { id: 2, name: "Концепция Б — Современная классика", liked: false },
  { id: 3, name: "Концепция В — Эко-стиль", liked: false },
];

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("projects");
  const [variants, setVariants] = useState(VARIANTS);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<number[]>([]);

  const toggleLike = (id: number) => {
    setVariants(variants.map(v => v.id === id ? { ...v, liked: !v.liked } : v));
  };

  const toggleCompare = (id: number) => {
    setSelectedVariants(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const TABS = [
    { id: "projects", label: "Мои проекты", icon: "FolderOpen" },
    { id: "variants", label: "Варианты дизайна", icon: "Images" },
    { id: "messages", label: "Сообщения", icon: "MessageCircle" },
    { id: "docs", label: "Документы", icon: "FileText" },
  ];

  return (
    <div className="min-h-screen bg-background font-body pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <div className="w-8 h-8 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="Layers" size={15} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-stone">DesignOffice</span>
          </button>
          <div className="flex items-center gap-3">
            <button className="relative">
              <Icon name="Bell" size={20} className="text-stone-mid" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-terra rounded-full"></span>
            </button>
            <div className="w-8 h-8 terra-gradient rounded-full flex items-center justify-center text-white text-xs font-semibold">
              АП
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Greeting */}
        <div className="mb-6 animate-fade-in">
          <h1 className="font-display text-3xl font-light text-stone">Добрый день, Анна!</h1>
          <p className="text-stone-mid text-sm mt-1">Ваш проект активно развивается</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-2xl p-1 mb-6 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-white text-stone shadow-sm"
                  : "text-stone-mid hover:text-stone"
              }`}
            >
              <Icon name={tab.icon} fallback="Circle" size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Projects tab */}
        {activeTab === "projects" && (
          <div className="space-y-4 animate-fade-in">
            {CLIENT_PROJECTS.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-terra-pale to-terra/10 flex items-center justify-center relative">
                  <Icon name="Image" size={36} className="text-terra/25" />
                  <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full border font-medium ${p.statusColor}`}>
                    {p.status}
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="font-semibold text-stone text-base mb-1">{p.name}</h2>
                  <p className="text-stone-mid text-sm mb-4">Дизайнер: {p.designer}</p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs text-stone-mid">Готовность проекта</span>
                      <span className="text-xs font-semibold text-terra">{p.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full terra-gradient rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>

                  {/* Next step */}
                  <div className="bg-terra-pale rounded-xl p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Icon name="Clock" size={14} className="text-terra mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-terra font-medium">Следующий шаг</p>
                        <p className="text-xs text-stone mt-0.5">{p.nextStep}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveTab("variants")}
                      className="flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-sm text-stone hover:border-terra/30 transition-all"
                    >
                      <Icon name="Images" size={14} />
                      {p.images} фото
                    </button>
                    <button
                      onClick={() => setActiveTab("docs")}
                      className="flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-sm text-stone hover:border-terra/30 transition-all"
                    >
                      <Icon name="FileText" size={14} />
                      {p.docs} документа
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Variants / Compare tab */}
        {activeTab === "variants" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone">Варианты концепций</h2>
              <button
                onClick={() => { setCompareMode(!compareMode); setSelectedVariants([]); }}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border transition-all ${
                  compareMode ? "border-terra bg-terra-pale text-terra" : "border-border text-stone-mid"
                }`}
              >
                <Icon name="Columns2" fallback="LayoutGrid" size={14} />
                Сравнить
              </button>
            </div>

            {compareMode && selectedVariants.length >= 2 && (
              <div className="bg-terra-pale border border-terra/20 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="ArrowLeftRight" fallback="Columns2" size={15} className="text-terra" />
                  <span className="text-sm font-medium text-terra">Режим сравнения</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {selectedVariants.map(id => {
                    const v = variants.find(v => v.id === id);
                    return v ? (
                      <div key={id} className="bg-white rounded-xl p-2">
                        <div className="h-24 bg-gradient-to-br from-stone/5 to-terra/10 rounded-lg mb-2 flex items-center justify-center">
                          <Icon name="Image" size={20} className="text-terra/30" />
                        </div>
                        <p className="text-xs text-stone leading-tight">{v.name}</p>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                    compareMode && selectedVariants.includes(v.id) ? "border-terra shadow-md shadow-terra/10" : "border-border"
                  }`}
                >
                  <div
                    className="h-44 bg-gradient-to-br from-terra-pale via-stone/5 to-terra/10 flex items-center justify-center cursor-pointer"
                    onClick={() => compareMode && toggleCompare(v.id)}
                  >
                    {compareMode && (
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center absolute top-3 left-3 ${
                        selectedVariants.includes(v.id) ? "bg-terra border-terra" : "bg-white border-stone-light"
                      }`}>
                        {selectedVariants.includes(v.id) && <Icon name="Check" size={12} className="text-white" />}
                      </div>
                    )}
                    <Icon name="Image" size={36} className="text-terra/25" />
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-stone">{v.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {compareMode ? (
                        <button
                          onClick={() => toggleCompare(v.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                            selectedVariants.includes(v.id)
                              ? "border-terra bg-terra-pale text-terra"
                              : "border-border text-stone-mid"
                          }`}
                        >
                          {selectedVariants.includes(v.id) ? "Выбрано" : "Выбрать"}
                        </button>
                      ) : (
                        <button onClick={() => toggleLike(v.id)} className="transition-all">
                          <Icon
                            name={v.liked ? "Heart" : "Heart"}
                            fallback="Heart"
                            size={18}
                            className={v.liked ? "text-terra fill-terra" : "text-stone-light"}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages tab */}
        {activeTab === "messages" && (
          <div className="animate-fade-in">
            <div className="space-y-3 mb-4">
              {[
                { from: "Елена Смирнова", text: "Загрузила финальные визуализации гостиной, посмотрите, пожалуйста!", time: "14:32", isDesigner: true },
                { from: "Вы", text: "Очень нравится! Хотела бы обсудить цвет акцентной стены.", time: "15:10", isDesigner: false },
                { from: "Елена Смирнова", text: "Конечно! Завтра смогу прислать несколько вариантов для сравнения", time: "15:15", isDesigner: true },
              ].map((msg, i) => (
                <div key={i} className={`flex ${msg.isDesigner ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-xs rounded-2xl px-4 py-3 ${
                    msg.isDesigner ? "bg-white border border-border" : "terra-gradient"
                  }`}>
                    {msg.isDesigner && <p className="text-xs text-terra font-medium mb-1">{msg.from}</p>}
                    <p className={`text-sm ${msg.isDesigner ? "text-stone" : "text-white"}`}>{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.isDesigner ? "text-stone-light" : "text-white/60"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Написать сообщение..."
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra"
              />
              <button className="terra-gradient text-white p-3 rounded-xl hover:opacity-90 transition-opacity">
                <Icon name="Send" size={16} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Docs tab */}
        {activeTab === "docs" && (
          <div className="animate-fade-in space-y-3">
            {[
              { name: "Договор на дизайн-проект.pdf", size: "1.2 MB", date: "10 янв 2025", icon: "FileText" },
              { name: "Техническое задание.docx", size: "856 KB", date: "12 янв 2025", icon: "FileText" },
              { name: "Смета 1-й этап.xlsx", size: "340 KB", date: "15 янв 2025", icon: "FileSpreadsheet" },
            ].map((doc) => (
              <div key={doc.name} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3 hover:border-terra/30 transition-all cursor-pointer">
                <div className="w-10 h-10 bg-terra-pale rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name={doc.icon} fallback="FileText" size={18} className="text-terra" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone truncate">{doc.name}</p>
                  <p className="text-xs text-stone-light">{doc.size} · {doc.date}</p>
                </div>
                <Icon name="Download" size={16} className="text-stone-light hover:text-terra transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-2 py-2 flex justify-around">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === tab.id ? "text-terra" : "text-stone-light"
            }`}
          >
            <Icon name={tab.icon} fallback="Circle" size={20} />
            <span className="text-xs">{tab.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
