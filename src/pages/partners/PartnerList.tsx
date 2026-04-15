import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Partner, PartnerType, PARTNER_TYPE_CONFIG, PARTNER_TYPES } from "./PartnerTypes";

interface PartnerListProps {
  partners: Partner[];
  loading: boolean;
  onSelect: (partner: Partner) => void;
  onAdd: () => void;
  filterType: string;
  onFilterType: (type: string) => void;
  search: string;
  onSearch: (q: string) => void;
}

export default function PartnerList({
  partners, loading, onSelect, onAdd, filterType, onFilterType, search, onSearch,
}: PartnerListProps) {
  const [sortKey, setSortKey] = useState<"name" | "discount" | "partner_type">("name");
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const sorted = [...partners].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    else if (sortKey === "discount") cmp = a.discount - b.discount;
    else if (sortKey === "partner_type") cmp = a.partner_type.localeCompare(b.partner_type);
    return sortAsc ? cmp : -cmp;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl md:text-3xl text-stone">Партнёры</h1>
        <button onClick={onAdd} className="flex items-center gap-1.5 terra-gradient text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="Plus" size={16} /> Добавить
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select
          value={filterType}
          onChange={e => onFilterType(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 min-w-[150px]"
        >
          <option value="">Все типы</option>
          {PARTNER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-light" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Поиск по названию, товарам..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-white text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20"
          />
        </div>
        <div className="flex gap-1">
          {(["name", "discount", "partner_type"] as const).map(key => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs transition-all ${
                sortKey === key ? "bg-terra-pale text-terra font-medium" : "text-stone-mid hover:bg-muted"
              }`}
            >
              {key === "name" ? "Имя" : key === "discount" ? "Скидка" : "Тип"}
              {sortKey === key && <Icon name={sortAsc ? "ChevronUp" : "ChevronDown"} size={12} />}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="w-10 h-10 border-2 border-terra/30 border-t-terra rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-mid">Загрузка...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="Handshake" size={28} className="text-stone-light" />
          </div>
          <h3 className="font-display text-xl text-stone mb-2">Партнёров пока нет</h3>
          <p className="text-stone-mid text-sm mb-4">Добавьте первого партнёра</p>
          <button onClick={onAdd} className="terra-gradient text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            Добавить партнёра
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(p => (
            <PartnerRow key={p.id} partner={p} onClick={() => onSelect(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PartnerRow({ partner, onClick }: { partner: Partner; onClick: () => void }) {
  const typeConf = PARTNER_TYPE_CONFIG[partner.partner_type as PartnerType];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-border p-4 flex items-center gap-4 cursor-pointer hover:border-terra/30 hover:shadow-sm transition-all ${partner.is_archived ? "opacity-60" : ""}`}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden border border-border flex-shrink-0 flex items-center justify-center bg-muted/30">
        {partner.logo_url ? (
          <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" />
        ) : (
          <Icon name={typeConf.icon} size={24} className="text-stone-light" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-stone text-sm truncate">{partner.name}</span>
          {partner.is_archived && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">Архив</span>
          )}
        </div>
        {partner.services && (
          <p className="text-xs text-stone-mid truncate">{partner.services}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-stone-light mt-1">
          <Icon name="Phone" size={11} />
          {partner.phone}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="flex items-center gap-1.5 text-xs text-stone-mid">
          <Icon name={typeConf.icon} size={13} /> {typeConf.label}
        </span>
        <span className="text-sm font-semibold text-terra whitespace-nowrap">
          {partner.discount}%
        </span>
        <Icon name="ChevronRight" size={16} className="text-stone-light" />
      </div>
    </div>
  );
}
