import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { useProposal, useCreateProposal, useUpdateProposal, useUploadProposalBg } from "@/lib/queries";
import { fmtMoney } from "./projectDetail.types";
import type { ProjectData } from "./ProjectDetail";

interface ProposalItem {
  id?: string;
  order_number: number;
  title: string;
  description: string;
  price: number;
}

interface Proposal {
  id: string;
  status: string;
  background_url: string | null;
  background_preset: string | null;
  template_name: string | null;
  items: ProposalItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Черновик", color: "bg-gray-50 text-gray-600 border-gray-200" },
  sent: { label: "Отправлено", color: "bg-blue-50 text-blue-700 border-blue-200" },
  accepted: { label: "Принято", color: "bg-green-50 text-green-700 border-green-200" },
  declined: { label: "Отклонено", color: "bg-red-50 text-red-600 border-red-200" },
};

const PRESET_BACKGROUNDS: { id: string; label: string; url: string }[] = [
  { id: "marble", label: "Мрамор", url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=60" },
  { id: "concrete", label: "Бетон", url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&q=60" },
  { id: "wood", label: "Дерево", url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=60" },
  { id: "minimal", label: "Минимализм", url: "" },
];

function formatDate(d?: string) {
  if (!d) return new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default function ProposalTab({ project }: { project: ProjectData }) {
  const { user } = useAuth();
  const { data: proposal, isLoading } = useProposal(project.id);
  const createMutation = useCreateProposal();
  const updateMutation = useUpdateProposal();
  const uploadBgMutation = useUploadProposalBg();

  const [editingItems, setEditingItems] = useState<ProposalItem[] | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragIdx = useRef<number | null>(null);

  const isDesigner = user?.role === "designer";
  const prop = proposal as Proposal | null;
  const items = editingItems || prop?.items || [];
  const total = items.reduce((s, i) => s + Number(i.price || 0), 0);
  const pricePerSqm = project.area ? Math.round(total / project.area) : 0;
  const bgUrl = prop?.background_url || (prop?.background_preset ? PRESET_BACKGROUNDS.find(p => p.id === prop.background_preset)?.url : null);
  const statusInfo = STATUS_MAP[prop?.status || "draft"] || STATUS_MAP.draft;

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({ project_id: project.id });
    } catch { /* empty */ }
  };

  const startEditing = () => {
    setEditingItems(items.map((i, idx) => ({ ...i, order_number: idx })));
  };

  const handleSave = async () => {
    if (!prop || !editingItems) return;
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: prop.id,
        data: { items: editingItems.map((item, idx) => ({ title: item.title, description: item.description, price: Number(item.price), order_number: idx })) },
      });
      setEditingItems(null);
      setEditIdx(null);
    } catch { /* empty */ }
    setSaving(false);
  };

  const updateItem = (idx: number, field: string, value: string | number) => {
    if (!editingItems) return;
    setEditingItems(editingItems.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    if (!editingItems) return;
    setEditingItems([...editingItems, { order_number: editingItems.length, title: "Новый пункт", description: "", price: 0 }]);
    setEditIdx(editingItems.length);
  };

  const removeItem = (idx: number) => {
    if (!editingItems) return;
    setEditingItems(editingItems.filter((_, i) => i !== idx));
    setEditIdx(null);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx || !editingItems) return;
    const updated = [...editingItems];
    const [moved] = updated.splice(dragIdx.current, 1);
    updated.splice(idx, 0, moved);
    dragIdx.current = idx;
    setEditingItems(updated);
  };

  const handleBgUpload = async (file: File) => {
    if (!prop) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        await uploadBgMutation.mutateAsync({ id: prop.id, data: { image: base64, content_type: file.type } });
        setShowBgPicker(false);
      } catch { /* empty */ }
    };
    reader.readAsDataURL(file);
  };

  const handlePresetBg = async (presetId: string) => {
    if (!prop) return;
    try {
      await updateMutation.mutateAsync({ id: prop.id, data: { background_preset: presetId, background_url: null } });
      setShowBgPicker(false);
    } catch { /* empty */ }
  };

  const handleStatusChange = async (status: string) => {
    if (!prop) return;
    try { await updateMutation.mutateAsync({ id: prop.id, data: { status } }); } catch { /* empty */ }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-terra/30 border-t-terra rounded-full animate-spin" />
      </div>
    );
  }

  if (!prop) {
    return (
      <div className="bg-white rounded-2xl border border-border p-12 text-center">
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon name="FileText" size={36} className="text-stone-light" />
        </div>
        <h3 className="font-display text-2xl text-stone mb-2">Коммерческое предложение</h3>
        <p className="text-stone-mid text-sm mb-6 max-w-md mx-auto">Создайте КП для клиента с детальным описанием этапов и стоимости работ</p>
        {isDesigner && (
          <button onClick={handleCreate} disabled={createMutation.isPending} className="terra-gradient text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {createMutation.isPending ? "Создаём..." : "Создать КП"}
          </button>
        )}
      </div>
    );
  }

  const clientMember = project.members?.find(m => m.role === "client");
  const clientName = clientMember ? `${clientMember.first_name || ""} ${clientMember.last_name || ""}`.trim() : "—";
  const isEditing = editingItems !== null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
        {isDesigner && !isEditing && (
          <>
            <button onClick={startEditing} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-border text-stone-mid hover:bg-muted transition-colors">
              <Icon name="Pencil" size={12} /> Реда��тировать
            </button>
            <button onClick={() => setShowBgPicker(true)} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-border text-stone-mid hover:bg-muted transition-colors">
              <Icon name="Image" size={12} /> Фон
            </button>
            {prop.status === "draft" && (
              <button onClick={() => handleStatusChange("sent")} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl terra-gradient text-white hover:opacity-90">
                <Icon name="Send" size={12} className="text-white" /> Отправить клиенту
              </button>
            )}
            {prop.status === "sent" && (
              <div className="flex gap-1">
                <button onClick={() => handleStatusChange("accepted")} className="text-xs px-3 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">Принято</button>
                <button onClick={() => handleStatusChange("declined")} className="text-xs px-3 py-2 rounded-xl bg-red-50 text-red-500 border border-red-200 hover:bg-red-100">Отклонено</button>
              </div>
            )}
          </>
        )}
        {isEditing && (
          <>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl terra-gradient text-white hover:opacity-90 disabled:opacity-50">
              <Icon name="Save" size={12} className="text-white" /> {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button onClick={() => { setEditingItems(null); setEditIdx(null); }} className="text-xs px-3 py-2 rounded-xl border border-border text-stone-mid hover:bg-muted">Отмена</button>
            <button onClick={addItem} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-dashed border-terra/40 text-terra hover:bg-terra-pale">
              <Icon name="Plus" size={12} /> Добавить пункт
            </button>
          </>
        )}
      </div>

      {/* Proposal document */}
      <div className="relative bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
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
                <div className="w-10 h-10 terra-gradient rounded-xl flex items-center justify-center mb-3">
                  <Icon name="Layers" size={18} className="text-white" />
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-light text-stone">Коммерческое предложение</h2>
                <p className="text-xs text-stone-light mt-1">{formatDate(prop.created_at)}</p>
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
                <div
                  key={item.id || idx}
                  draggable={isEditing}
                  onDragStart={() => { dragIdx.current = idx; }}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDragEnd={() => { dragIdx.current = null; }}
                  className={`border-b border-border/40 py-5 ${isEditing ? "cursor-grab active:cursor-grabbing hover:bg-terra-pale/30 rounded-xl px-3 -mx-3 transition-colors" : ""}`}
                >
                  {isItemEditing ? (
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <input value={item.title} onChange={e => updateItem(idx, "title", e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-terra/20" />
                        <input type="number" value={item.price} onChange={e => updateItem(idx, "price", e.target.value)} className="w-32 px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm text-right font-semibold focus:outline-none focus:ring-2 focus:ring-terra/20" />
                      </div>
                      <textarea value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => setEditIdx(null)} className="text-xs px-3 py-1.5 rounded-lg terra-gradient text-white">Готово</button>
                        <button onClick={() => removeItem(idx)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50">Удалить</button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => isEditing && setEditIdx(idx)} className={isEditing ? "cursor-pointer" : ""}>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-baseline gap-2">
                          {isEditing && <Icon name="GripVertical" size={14} className="text-stone-light mt-0.5 flex-shrink-0" />}
                          <h3 className="font-semibold text-stone text-base">
                            <span className="text-stone-light font-normal">{idx + 1}.</span> {item.title}
                          </h3>
                        </div>
                        <span className="font-display text-lg font-semibold text-terra whitespace-nowrap">{fmtMoney(Number(item.price))}</span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-stone-mid leading-relaxed ml-0 md:ml-5">{item.description}</p>
                      )}
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
                <div className="flex items-baseline gap-3">
                  <span className="text-stone-mid text-sm">Итого:</span>
                  <span className="font-display text-3xl font-light text-stone">{fmtMoney(total)}</span>
                </div>
                {pricePerSqm > 0 && (
                  <p className="text-sm text-stone-mid">Стоимость за м²: <span className="font-semibold text-stone">{fmtMoney(pricePerSqm)}</span></p>
                )}
                {project.deadline && (
                  <p className="text-sm text-stone-mid">Сроки: <span className="font-medium text-stone">до {formatDate(project.deadline)}</span></p>
                )}
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

      {/* Background picker modal */}
      {showBgPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-stone">Фон КП</h3>
              <button onClick={() => setShowBgPicker(false)} className="p-1.5 hover:bg-muted rounded-lg"><Icon name="X" size={16} className="text-stone-mid" /></button>
            </div>

            <p className="text-xs text-stone-light mb-3">Готовые фоны</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PRESET_BACKGROUNDS.map(preset => (
                <button key={preset.id} onClick={() => handlePresetBg(preset.id)} className={`relative h-16 rounded-xl border-2 overflow-hidden transition-all ${prop?.background_preset === preset.id ? "border-terra" : "border-border hover:border-terra/40"}`}>
                  {preset.url ? (
                    <>
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-white/60" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-stone">{preset.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-stone-light mb-2">Или загрузите свой</p>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleBgUpload(f); }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadBgMutation.isPending} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-sm text-stone-mid hover:border-terra/40 hover:text-stone transition-colors disabled:opacity-50">
                <Icon name="Upload" size={16} />
                {uploadBgMutation.isPending ? "Загрузка..." : "Загрузить изображение"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
