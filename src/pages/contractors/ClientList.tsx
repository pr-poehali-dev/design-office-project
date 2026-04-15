import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Client, CLIENT_STATUSES } from "./ClientTypes";

interface ClientListProps {
  clients: Client[];
  loading: boolean;
  onSelect: (client: Client) => void;
  onAdd: (name: string) => void;
  search: string;
  onSearch: (q: string) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map(w => w[0] || "")
    .join("")
    .toUpperCase() || "?";
}

function getStatusBadge(status: string) {
  const s = CLIENT_STATUSES.find(x => x.value === status);
  if (!s) return null;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}

export default function ClientList({ clients, loading, onSelect, onAdd, search, onSearch }: ClientListProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState("");

  const handleQuickAdd = () => {
    if (quickName.trim().length >= 2) {
      onAdd(quickName.trim());
      setQuickName("");
      setShowQuickAdd(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-light" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Поиск по имени, контактному лицу..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20"
          />
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="flex items-center gap-1.5 terra-gradient text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Icon name="Plus" size={16} /> Добавить
        </button>
      </div>

      {showQuickAdd && (
        <div className="bg-white rounded-2xl border border-terra/30 p-4 mb-5 flex items-center gap-3 shadow-sm animate-fade-in">
          <input
            value={quickName}
            onChange={e => setQuickName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleQuickAdd()}
            placeholder="Имя клиента..."
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
            autoFocus
          />
          <button
            onClick={handleQuickAdd}
            disabled={quickName.trim().length < 2}
            className="terra-gradient text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Создать
          </button>
          <button
            onClick={() => { setShowQuickAdd(false); setQuickName(""); }}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon name="X" size={16} className="text-stone-mid" />
          </button>
        </div>
      )}

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
          <p className="text-stone-mid text-sm mb-4">Добавьте первого заказчика</p>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="terra-gradient text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Добавить клиента
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(c => (
            <div
              key={c.id}
              onClick={() => onSelect(c)}
              className={`bg-white rounded-2xl border border-border p-5 cursor-pointer hover:border-terra/30 hover:shadow-md transition-all ${c.is_archived ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-stone-900 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {getInitials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-stone text-sm truncate">{c.name}</h4>
                  {getStatusBadge(c.status)}
                </div>
              </div>

              <div className="space-y-1.5">
                {c.contact_person && (
                  <div className="flex items-center gap-2 text-xs text-stone-mid">
                    <Icon name="UserRound" size={12} className="text-stone-light flex-shrink-0" />
                    <span className="truncate">{c.contact_person}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2 text-xs text-stone-mid">
                    <Icon name="Mail" size={12} className="text-stone-light flex-shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-stone-mid">
                  <Icon name="FolderOpen" size={12} className="text-stone-light flex-shrink-0" />
                  <span>{c.project_count ?? 0} проектов</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
