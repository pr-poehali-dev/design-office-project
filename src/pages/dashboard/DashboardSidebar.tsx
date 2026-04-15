import Icon from "@/components/ui/icon";

interface NavItem {
  icon: string;
  label: string;
  id: string;
  path: string;
}

interface DashboardSidebarProps {
  navItems: NavItem[];
  activeNav: string;
  userInitials: string;
  userName: string;
  userRole: string;
  unreadCount: number;
  onNavClick: (item: NavItem) => void;
  onLogoClick: () => void;
  onLogout: () => void;
}

export default function DashboardSidebar({
  navItems, activeNav, userInitials, userName, userRole,
  unreadCount, onNavClick, onLogoClick, onLogout,
}: DashboardSidebarProps) {
  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-border h-screen sticky top-0">
        <div className="p-5 border-b border-border">
          <button onClick={onLogoClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
              <div className="text-sm font-semibold text-stone">{userName}</div>
              <div className="text-xs text-stone-mid">{userRole}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavClick(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeNav === item.id
                  ? "bg-terra-pale text-terra font-medium"
                  : "text-stone-mid hover:bg-muted hover:text-stone"
              }`}
            >
              <Icon name={item.icon} fallback="Circle" size={17} />
              <span>{item.label}</span>
              {item.id === "dashboard" && unreadCount > 0 ? (
                <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-mid hover:bg-muted hover:text-stone transition-all"
          >
            <Icon name="LogOut" size={17} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-1 py-2 flex justify-around">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => onNavClick(item)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all relative ${
              activeNav === item.id ? "text-terra" : "text-stone-light"
            }`}
          >
            <div className="relative">
              <Icon name={item.icon} fallback="Circle" size={19} />
              {item.id === "dashboard" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center">{unreadCount > 9 ? "+" : unreadCount}</span>
              )}
            </div>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
