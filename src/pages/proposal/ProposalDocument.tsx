import { forwardRef } from "react";
import Icon from "@/components/ui/icon";
import { fmtMoney } from "../projectDetail.types";
import { formatDate, PRESET_BACKGROUNDS } from "./proposalTypes";
import type { Proposal, ProposalItem } from "./proposalTypes";
import type { ProjectData } from "../ProjectDetail";

interface ProposalDocumentProps {
  proposal: Proposal;
  project: ProjectData;
  items: ProposalItem[];
  isEditing: boolean;
  editIdx: number | null;
  subtotal: number;
  discount: number;
  discountType: string;
  discountAmount: number;
  total: number;
  pricePerSqm: number;
  editDiscount: number | null;
  editDiscountType: string;
  user: { first_name?: string; last_name?: string; email?: string; phone?: string } | null;
  dragIdxRef: React.MutableRefObject<number | null>;
  onSetEditIdx: (idx: number | null) => void;
  onUpdateItem: (idx: number, field: string, value: string | number) => void;
  onRemoveItem: (idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onSetEditDiscount: (val: number) => void;
  onSetEditDiscountType: (val: string) => void;
}

const ProposalDocument = forwardRef<HTMLDivElement, ProposalDocumentProps>(({
  proposal, project, items, isEditing, editIdx,
  subtotal, discount, discountType, discountAmount, total, pricePerSqm,
  editDiscount, editDiscountType, user, dragIdxRef,
  onSetEditIdx, onUpdateItem, onRemoveItem, onDragOver,
  onSetEditDiscount, onSetEditDiscountType,
}, ref) => {
  const bgUrl = proposal.background_url || (proposal.background_preset ? PRESET_BACKGROUNDS.find(p => p.id === proposal.background_preset)?.url : null);
  const clientMember = project.members?.find(m => m.role === "client");
  const clientName = clientMember ? `${clientMember.first_name || ""} ${clientMember.last_name || ""}`.trim() : "—";

  return (
    <div ref={ref} className="relative bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
      {bgUrl && (
        <div className="absolute inset-0 z-0">
          <img src={bgUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-white/85" />
        </div>
      )}
      <div className="relative z-10">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-border/50">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="w-10 h-10 terra-gradient rounded-xl flex items-center justify-center mb-3"><Icon name="Layers" size={18} className="text-white" /></div>
              <h2 className="font-display text-2xl md:text-3xl font-light text-stone">Коммерческое предложение</h2>
              <p className="text-xs text-stone-light mt-1">{formatDate(proposal.created_at)}</p>
            </div>
            <div className="text-right text-xs text-stone-mid space-y-1">
              {project.title && <p><span className="text-stone-light">Проект:</span> {project.title}</p>}
              {project.address && <p><span className="text-stone-light">Адрес:</span> {project.address}</p>}
              {project.area && <p><span className="text-stone-light">Площадь:</span> {project.area} м²</p>}
              <p><span className="text-stone-light">Клиент:</span> {clientName}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-6 md:p-8 space-y-0">
          {items.map((item, idx) => {
            const isItemEditing = isEditing && editIdx === idx;
            return (
              <div key={item.id || idx} draggable={isEditing} onDragStart={() => { dragIdxRef.current = idx; }} onDragOver={e => onDragOver(e, idx)} onDragEnd={() => { dragIdxRef.current = null; }} className={`border-b border-border/40 py-5 ${isEditing ? "cursor-grab active:cursor-grabbing hover:bg-terra-pale/30 rounded-xl px-3 -mx-3 transition-colors" : ""}`}>
                {isItemEditing ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input value={item.title} onChange={e => onUpdateItem(idx, "title", e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-terra/20" />
                      <input type="number" value={item.price} onChange={e => onUpdateItem(idx, "price", e.target.value)} className="w-32 px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm text-right font-semibold focus:outline-none focus:ring-2 focus:ring-terra/20" />
                    </div>
                    <textarea value={item.description} onChange={e => onUpdateItem(idx, "description", e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => onSetEditIdx(null)} className="text-xs px-3 py-1.5 rounded-lg terra-gradient text-white">Готово</button>
                      <button onClick={() => onRemoveItem(idx)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50">Удалить</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => isEditing && onSetEditIdx(idx)} className={isEditing ? "cursor-pointer" : ""}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-baseline gap-2">
                        {isEditing && <Icon name="GripVertical" size={14} className="text-stone-light mt-0.5 flex-shrink-0" />}
                        <h3 className="font-semibold text-stone text-base"><span className="text-stone-light font-normal">{idx + 1}.</span> {item.title}</h3>
                      </div>
                      <span className="font-display text-lg font-semibold text-terra whitespace-nowrap">{fmtMoney(Number(item.price))}</span>
                    </div>
                    {item.description && <p className="text-sm text-stone-mid leading-relaxed ml-0 md:ml-5">{item.description}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer / Total */}
        <div className="p-6 md:p-8 border-t-2 border-stone/10 bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              {(discount > 0 || isEditing) && (
                <div className="space-y-1.5 mb-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-stone-mid text-sm">Подытог:</span>
                    <span className="font-display text-lg text-stone-mid">{fmtMoney(subtotal)}</span>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600">Скидка:</span>
                      <input type="number" value={editDiscount ?? 0} onChange={e => onSetEditDiscount(Number(e.target.value) || 0)} className="w-24 px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-stone text-right focus:outline-none focus:ring-2 focus:ring-terra/20" />
                      <select value={editDiscountType} onChange={e => onSetEditDiscountType(e.target.value)} className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-stone focus:outline-none">
                        <option value="fixed">₽</option>
                        <option value="percent">%</option>
                      </select>
                      {discountAmount > 0 && editDiscountType === "percent" && (
                        <span className="text-xs text-green-600">({fmtMoney(discountAmount)})</span>
                      )}
                    </div>
                  ) : discount > 0 ? (
                    <div className="flex items-baseline gap-3">
                      <span className="text-green-600 text-sm">Скидка:</span>
                      <span className="font-semibold text-green-600">
                        {discountType === "percent" ? `${discount}% (${fmtMoney(discountAmount)})` : fmtMoney(discountAmount)}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
              <div className="flex items-baseline gap-3">
                <span className="text-stone-mid text-sm">Итого:</span>
                <span className="font-display text-3xl font-light text-stone">{fmtMoney(total)}</span>
              </div>
              {pricePerSqm > 0 && <p className="text-sm text-stone-mid">Стоимость за м²: <span className="font-semibold text-stone">{fmtMoney(pricePerSqm)}</span></p>}
              {project.deadline && <p className="text-sm text-stone-mid">Сроки: <span className="font-medium text-stone">до {formatDate(project.deadline)}</span></p>}
            </div>
            <div className="text-right text-xs text-stone-mid space-y-0.5">
              <p className="font-medium text-stone">{user?.first_name} {user?.last_name}</p>
              {user?.email && <p>{user.email}</p>}
              {user?.phone && <p>{user.phone}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProposalDocument.displayName = "ProposalDocument";

export default ProposalDocument;
