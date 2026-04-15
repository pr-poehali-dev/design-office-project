import Icon from "@/components/ui/icon";
import { Partner, PARTNER_TYPE_CONFIG } from "./PartnerTypes";

interface PartnerCardProps {
  partner: Partner;
  onEdit: () => void;
  onArchive: () => void;
  onBack: () => void;
}

export default function PartnerCard({ partner, onEdit, onArchive, onBack }: PartnerCardProps) {
  const typeConf = PARTNER_TYPE_CONFIG[partner.partner_type];

  return (
    <div className="bg-white rounded-2xl border border-border p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-stone-mid hover:text-stone transition-colors">
          <Icon name="ArrowLeft" size={16} /> Назад
        </button>
        <div className="flex gap-2">
          <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-stone-mid hover:bg-muted transition-colors">
            <Icon name="Pencil" size={14} /> Редактировать
          </button>
          <button onClick={onArchive} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-colors ${partner.is_archived ? "border-green-200 text-green-600 hover:bg-green-50" : "border-red-200 text-red-500 hover:bg-red-50"}`}>
            <Icon name={partner.is_archived ? "ArchiveRestore" : "Archive"} size={14} />
            {partner.is_archived ? "Восстановить" : "В архив"}
          </button>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden border border-border mb-3 flex items-center justify-center bg-muted/30">
          {partner.logo_url ? (
            <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" />
          ) : (
            <Icon name={typeConf.icon} size={32} className="text-stone-light" />
          )}
        </div>
        <h2 className="font-display text-2xl text-stone">{partner.name}</h2>
        <div className="flex items-center justify-center gap-3 mt-2">
          <span className="flex items-center gap-1.5 text-sm text-stone-mid">
            <Icon name={typeConf.icon} size={14} /> {typeConf.label}
          </span>
          <span className="text-sm font-semibold text-terra">Скидка: {partner.discount}%</span>
        </div>
        {partner.is_archived && (
          <span className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 font-medium">В архиве</span>
        )}
      </div>

      {partner.services && (
        <div className="border-t border-border pt-4 mb-4">
          <h3 className="text-xs text-stone-light font-medium mb-2 flex items-center gap-1.5">
            <Icon name="Package" size={13} /> Услуги / Товары
          </h3>
          <p className="text-sm text-stone whitespace-pre-wrap">{partner.services}</p>
        </div>
      )}

      <div className="border-t border-border pt-4 mb-4">
        <h3 className="text-xs text-stone-light font-medium mb-3 flex items-center gap-1.5">
          <Icon name="Contact" size={13} /> Контакты
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Icon name="Phone" size={14} className="text-stone-light" />
            <a href={`tel:${partner.phone}`} className="text-terra hover:underline">{partner.phone}</a>
          </div>
          {partner.email && (
            <div className="flex items-center gap-2 text-sm">
              <Icon name="Mail" size={14} className="text-stone-light" />
              <a href={`mailto:${partner.email}`} className="text-terra hover:underline">{partner.email}</a>
            </div>
          )}
          {partner.website && (
            <div className="flex items-center gap-2 text-sm">
              <Icon name="Globe" size={14} className="text-stone-light" />
              <a href={partner.website.startsWith("http") ? partner.website : `https://${partner.website}`} target="_blank" rel="noopener noreferrer" className="text-terra hover:underline">{partner.website}</a>
            </div>
          )}
          {partner.address && (
            <div className="flex items-center gap-2 text-sm">
              <Icon name="MapPin" size={14} className="text-stone-light" />
              <span className="text-stone">{partner.address}</span>
            </div>
          )}
          {partner.contact_person && (
            <div className="flex items-center gap-2 text-sm">
              <Icon name="User" size={14} className="text-stone-light" />
              <span className="text-stone">{partner.contact_person}</span>
            </div>
          )}
        </div>
      </div>

      {partner.note && (
        <div className="border-t border-border pt-4">
          <h3 className="text-xs text-stone-light font-medium mb-2 flex items-center gap-1.5">
            <Icon name="StickyNote" size={13} /> Примечание
          </h3>
          <p className="text-sm text-stone whitespace-pre-wrap">{partner.note}</p>
        </div>
      )}
    </div>
  );
}
