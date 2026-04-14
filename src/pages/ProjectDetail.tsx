import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { NAV_ITEMS, TABS } from "./projectDetail.types";
import { OverviewTab, ExecutionTab } from "./ProjectOverviewTab";
import { BriefTab, EstimateTab, FinanceTab, DocsTab } from "./ProjectDataTabs";

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeNav, setActiveNav] = useState("projects");

  const handleNavClick = (item: { id: string; path: string }) => {
    setActiveNav(item.id);
    navigate(item.path);
  };

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
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 terra-gradient rounded-full flex items-center justify-center text-white font-semibold text-sm">ЕС</div>
            <div>
              <div className="text-sm font-semibold text-stone">Елена Смирнова</div>
              <div className="text-xs text-stone-mid">Дизайнер интерьеров</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeNav === item.id ? "bg-terra-pale text-terra font-medium" : "text-stone-mid hover:bg-muted hover:text-stone"
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
        {/* Header with back button */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 md:px-8 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-sm text-stone-mid hover:text-stone transition-colors"
            >
              <Icon name="ArrowLeft" size={16} />
              <span className="hidden sm:inline">Назад</span>
            </button>
            <span className="text-stone-light">/</span>
            <span className="text-sm text-stone-mid hidden sm:inline">Проекты</span>
            <span className="text-stone-light hidden sm:inline">/</span>
            <span className="text-sm font-medium text-stone truncate">Квартира на Тверской</span>
            <div className="ml-auto">
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">В работе</span>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 py-5">
          {/* Tabs — scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 mb-6">
            <div className="flex gap-1 bg-white border border-border rounded-2xl p-1 min-w-max md:min-w-0">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "terra-gradient text-white shadow-sm"
                      : "text-stone-mid hover:text-stone hover:bg-muted"
                  }`}
                >
                  <Icon name={tab.icon} fallback="Circle" size={14} className={activeTab === tab.id ? "text-white" : ""} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="animate-fade-in" key={activeTab}>
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "execution" && <ExecutionTab />}
            {activeTab === "brief" && <BriefTab />}
            {activeTab === "estimate" && <EstimateTab />}
            {activeTab === "finance" && <FinanceTab />}
            {activeTab === "documents" && <DocsTab />}
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-1 py-2 flex justify-around">
        {NAV_ITEMS.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all relative ${
              activeNav === item.id ? "text-terra" : "text-stone-light"
            }`}
          >
            <Icon name={item.icon} fallback="Circle" size={19} />
            <span className="text-xs">{item.label}</span>
            {item.badge && (
              <span className="absolute -top-0.5 right-1 w-4 h-4 terra-gradient rounded-full text-white text-xs flex items-center justify-center">{item.badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
