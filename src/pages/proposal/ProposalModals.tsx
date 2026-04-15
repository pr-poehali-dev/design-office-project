import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { fmtMoney } from "../projectDetail.types";
import { PRESET_BACKGROUNDS } from "./proposalTypes";
import type { Proposal, ProposalItem, Template } from "./proposalTypes";

interface BgPickerProps {
  proposal: Proposal;
  uploadPending: boolean;
  onClose: () => void;
  onPresetBg: (presetId: string) => void;
  onUploadBg: (file: File) => void;
}

export function BgPickerModal({ proposal, uploadPending, onClose, onPresetBg, onUploadBg }: BgPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-stone">Фон КП</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><Icon name="X" size={16} className="text-stone-mid" /></button>
        </div>
        <p className="text-xs text-stone-light mb-3">Готовые фоны</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {PRESET_BACKGROUNDS.map(preset => (
            <button key={preset.id} onClick={() => onPresetBg(preset.id)} className={`relative h-16 rounded-xl border-2 overflow-hidden transition-all ${proposal.background_preset === preset.id ? "border-terra" : "border-border hover:border-terra/40"}`}>
              {preset.url ? (<><img src={preset.url} alt={preset.label} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-white/60" /></>) : (<div className="w-full h-full bg-gradient-to-br from-gray-50 to-white" />)}
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-stone">{preset.label}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-xs text-stone-light mb-2">Или загрузите свой</p>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUploadBg(f); }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploadPending} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-sm text-stone-mid hover:border-terra/40 hover:text-stone transition-colors disabled:opacity-50">
            <Icon name="Upload" size={16} /> {uploadPending ? "Загрузка..." : "Загрузить изображение"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TemplatesModalProps {
  templates: Template[];
  onClose: () => void;
  onApply: (tpl: Template) => void;
  onDelete: (id: string) => void;
}

export function TemplatesModal({ templates, onClose, onApply, onDelete }: TemplatesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-stone">Шаблоны КП</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><Icon name="X" size={16} className="text-stone-mid" /></button>
        </div>
        {templates.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3"><Icon name="LayoutTemplate" size={24} className="text-stone-light" /></div>
            <p className="text-sm text-stone-mid mb-1">Шаблонов пока нет</p>
            <p className="text-xs text-stone-light">Сохраните текущее КП как шаблон</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map(tpl => (
              <div key={tpl.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-stone">{tpl.name}</p>
                  <p className="text-xs text-stone-light">{(tpl.items as ProposalItem[]).length} пунктов — {fmtMoney((tpl.items as ProposalItem[]).reduce((s, i) => s + Number(i.price || 0), 0))}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => onApply(tpl)} className="text-xs px-3 py-1.5 rounded-lg terra-gradient text-white hover:opacity-90">Применить</button>
                  <button onClick={() => onDelete(tpl.id)} className="p-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50"><Icon name="Trash2" size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SaveTemplateModalProps {
  name: string;
  itemsCount: number;
  subtotal: number;
  saving: boolean;
  onClose: () => void;
  onChangeName: (name: string) => void;
  onSave: () => void;
}

export function SaveTemplateModal({ name, itemsCount, subtotal, saving, onClose, onChangeName, onSave }: SaveTemplateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-stone">Сохранить как шаблон</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><Icon name="X" size={16} className="text-stone-mid" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-stone-light mb-1 block">Название шаблона</label>
            <input value={name} onChange={e => onChangeName(e.target.value)} placeholder="Например: Полный проект" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" autoFocus />
          </div>
          <p className="text-xs text-stone-light">{itemsCount} пунктов, {fmtMoney(subtotal)}</p>
          <button onClick={onSave} disabled={!name.trim() || saving} className="w-full terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? "Сохраняем..." : "Сохранить шаблон"}
          </button>
        </div>
      </div>
    </div>
  );
}
