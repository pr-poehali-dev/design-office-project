import Icon from "@/components/ui/icon";
import { Client, CLIENT_SOURCES } from "./ClientTypes";

interface ClientListProps {
  clients: Client[];
  loading: boolean;
  onSelect: (client: Client) => void;
  onAdd: () => void;
  search: string;
  onSearch: (q: string) => void;
}

export default function ClientList({ clients, loading, onSelect, onAdd, search, onSearch }: ClientListProps) {
  const getSourceLabel = (src: string | null) => {
    if (!src) return null;
    return CLIENT_SOURCES.find(s => s.value === src)?.label || src;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <p className="text-stone-mid text-sm">Заказчики ваших проектов</p>
        <button onClick={onAdd} className="flex items-center gap-1.5 terra-gradient text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="Plus" size={16} /> Добавить клиента
        </button>
      </div>

      <div className="mb-5">
        <div className="relative max-w-md">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-light" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Поиск по имени, телефону, email..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="w-10 h-10 border-2 border-terra/30 border-t-terra rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-mid">Загрузка...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="UserCheck" size={28} className="text-stone-light" />
          </div>
          <h3 className="font-display text-xl text-stone mb-2">Клиентов пока нет</h3>
          <p className="text-stone-mid text-sm mb-4">Добавьте первого клиента</p>
          <button onClick={onAdd} className="terra-gradient text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            Добавить клиента
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(c => (
            <div
              key={c.id}
              onClick={() => onSelect(c)}
              className={`bg-white rounded-2xl border border-border p-4 flex items-center gap-4 cursor-pointer hover:border-terra/30 hover:shadow-sm transition-all ${c.is_archived ? "opacity-60" : ""}`}
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Icon name="User" size={22} className="text-stone-light" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-stone text-sm truncate">{c.name}</span>
                  {c.is_archived && <span className="text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">Архив</span>}
                </div>
                {c.note && <p className="text-xs text-stone-mid truncate">{c.note}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-stone-light">
                    <Icon name="Phone" size={11} /> {c.phone}
                  </span>
                  {c.email && (
                    <span className="flex items-center gap-1 text-xs text-stone-light">
                      <Icon name="Mail" size={11} /> {c.email}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                {getSourceLabel(c.source) && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-stone-mid border border-border">
                    {getSourceLabel(c.source)}
                  </span>
                )}
                <Icon name="ChevronRight" size={16} className="text-stone-light" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
