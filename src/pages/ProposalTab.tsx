import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { useProposal, useCreateProposal, useUpdateProposal, useUploadProposalBg, useProposalTemplates, useSaveProposalTemplate, useDeleteProposalTemplate } from "@/lib/queries";
import { fmtMoney } from "./projectDetail.types";
import type { ProjectData } from "./ProjectDetail";
import type { ProposalItem, Proposal, Template } from "./proposal/proposalTypes";
import { STATUS_MAP } from "./proposal/proposalTypes";
import ProposalDocument from "./proposal/ProposalDocument";
import { BgPickerModal, TemplatesModal, SaveTemplateModal } from "./proposal/ProposalModals";

export default function ProposalTab({ project }: { project: ProjectData }) {
  const { user } = useAuth();
  const { data: proposal, isLoading } = useProposal(project.id);
  const { data: templates = [] } = useProposalTemplates();
  const createMutation = useCreateProposal();
  const updateMutation = useUpdateProposal();
  const uploadBgMutation = useUploadProposalBg();
  const saveTemplateMutation = useSaveProposalTemplate();
  const deleteTemplateMutation = useDeleteProposalTemplate();

  const [editingItems, setEditingItems] = useState<ProposalItem[] | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [editDiscount, setEditDiscount] = useState<number | null>(null);
  const [editDiscountType, setEditDiscountType] = useState<string>("fixed");
  const [saving, setSaving] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);
  const dragIdx = useRef<number | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const isDesigner = user?.role === "designer";
  const prop = proposal as Proposal | null;
  const items = editingItems || prop?.items || [];
  const subtotal = items.reduce((s, i) => s + Number(i.price || 0), 0);

  const discount = editDiscount !== null ? editDiscount : Number(prop?.discount || 0);
  const discountType = editDiscount !== null ? editDiscountType : (prop?.discount_type || "fixed");
  const discountAmount = discountType === "percent" ? Math.round(subtotal * discount / 100) : discount;
  const total = Math.max(0, subtotal - discountAmount);
  const pricePerSqm = project.area ? Math.round(total / project.area) : 0;

  const statusInfo = STATUS_MAP[prop?.status || "draft"] || STATUS_MAP.draft;

  const handleCreate = async (templateItems?: ProposalItem[]) => {
    try {
      await createMutation.mutateAsync({
        project_id: project.id,
        items: templateItems ? templateItems.map((item, idx) => ({ title: item.title, description: item.description || "", price: Number(item.price), order_number: idx })) : undefined,
      });
    } catch { /* empty */ }
    setShowTemplates(false);
  };

  const startEditing = () => {
    setEditingItems(items.map((i, idx) => ({ ...i, order_number: idx })));
    setEditDiscount(Number(prop?.discount || 0));
    setEditDiscountType(prop?.discount_type || "fixed");
  };

  const handleSave = async () => {
    if (!prop || !editingItems) return;
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: prop.id,
        data: {
          items: editingItems.map((item, idx) => ({ title: item.title, description: item.description, price: Number(item.price), order_number: idx })),
          discount: editDiscount || 0,
          discount_type: editDiscountType,
        },
      });
      setEditingItems(null);
      setEditIdx(null);
      setEditDiscount(null);
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

  const handleSaveAsTemplate = async () => {
    if (!saveTemplateName.trim() || items.length === 0) return;
    try {
      await saveTemplateMutation.mutateAsync({
        name: saveTemplateName.trim(),
        items: items.map((item, idx) => ({ title: item.title, description: item.description || "", price: Number(item.price), order_number: idx })),
      });
      setSaveTemplateName("");
      setShowSaveTemplate(false);
    } catch { /* empty */ }
  };

  const handleApplyTemplate = async (tpl: Template) => {
    if (!prop) return;
    try {
      await updateMutation.mutateAsync({
        id: prop.id,
        data: {
          items: (tpl.items as ProposalItem[]).map((item, idx) => ({ title: item.title, description: item.description || "", price: Number(item.price), order_number: idx })),
        },
      });
      setShowTemplates(false);
    } catch { /* empty */ }
  };

  const handleDownloadPdf = useCallback(async () => {
    if (!docRef.current) return;
    setGeneratingPdf(true);
    try {
      const el = docRef.current;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", logging: false });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdfW = 210;
      const pdfH = (canvas.height * pdfW) / canvas.width;
      const pdf = new jsPDF({ orientation: pdfH > pdfW ? "portrait" : "landscape", unit: "mm", format: [pdfW, pdfH] });
      pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
      pdf.save(`КП_${project.title || "проект"}.pdf`);
    } catch { /* empty */ }
    setGeneratingPdf(false);
  }, [project.title]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-terra/30 border-t-terra rounded-full animate-spin" /></div>;
  }

  if (!prop) {
    return (
      <div className="bg-white rounded-2xl border border-border p-12 text-center">
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4"><Icon name="FileText" size={36} className="text-stone-light" /></div>
        <h3 className="font-display text-2xl text-stone mb-2">Коммерческое предложение</h3>
        <p className="text-stone-mid text-sm mb-6 max-w-md mx-auto">Создайте КП для клиента с детальным описанием этапов и стоимости работ</p>
        {isDesigner && (
          <div className="flex flex-col items-center gap-3">
            <button onClick={() => handleCreate()} disabled={createMutation.isPending} className="terra-gradient text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {createMutation.isPending ? "Создаём..." : "Создать КП (стандартный шаблон)"}
            </button>
            {(templates as Template[]).length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {(templates as Template[]).map(tpl => (
                  <button key={tpl.id} onClick={() => handleCreate(tpl.items)} className="text-xs px-3 py-2 rounded-xl border border-border text-stone-mid hover:bg-muted transition-colors">
                    <Icon name="FileTemplate" size={12} className="inline mr-1" /> {tpl.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const isEditing = editingItems !== null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
        {isDesigner && !isEditing && (
          <>
            <button onClick={startEditing} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-border text-stone-mid hover:bg-muted transition-colors">
              <Icon name="Pencil" size={12} /> Редактировать
            </button>
            <button onClick={() => setShowBgPicker(true)} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-border text-stone-mid hover:bg-muted transition-colors">
              <Icon name="Image" size={12} /> Фон
            </button>
            <button onClick={handleDownloadPdf} disabled={generatingPdf} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-border text-stone-mid hover:bg-muted transition-colors disabled:opacity-50">
              <Icon name="Download" size={12} /> {generatingPdf ? "Генерация..." : "Скачать PDF"}
            </button>
            <button onClick={() => setShowTemplates(true)} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-border text-stone-mid hover:bg-muted transition-colors">
              <Icon name="LayoutTemplate" size={12} /> Шаблоны
            </button>
            <button onClick={() => { setSaveTemplateName(""); setShowSaveTemplate(true); }} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-dashed border-terra/40 text-terra hover:bg-terra-pale transition-colors">
              <Icon name="Save" size={12} /> Сохранить как шаблон
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
            <button onClick={() => { setEditingItems(null); setEditIdx(null); setEditDiscount(null); }} className="text-xs px-3 py-2 rounded-xl border border-border text-stone-mid hover:bg-muted">Отмена</button>
            <button onClick={addItem} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-dashed border-terra/40 text-terra hover:bg-terra-pale">
              <Icon name="Plus" size={12} /> Добавить пункт
            </button>
          </>
        )}
      </div>

      {/* Document */}
      <ProposalDocument
        ref={docRef}
        proposal={prop}
        project={project}
        items={items}
        isEditing={isEditing}
        editIdx={editIdx}
        subtotal={subtotal}
        discount={discount}
        discountType={discountType}
        discountAmount={discountAmount}
        total={total}
        pricePerSqm={pricePerSqm}
        editDiscount={editDiscount}
        editDiscountType={editDiscountType}
        user={user}
        dragIdxRef={dragIdx}
        onSetEditIdx={setEditIdx}
        onUpdateItem={updateItem}
        onRemoveItem={removeItem}
        onDragOver={handleDragOver}
        onSetEditDiscount={setEditDiscount}
        onSetEditDiscountType={setEditDiscountType}
      />

      {/* Modals */}
      {showBgPicker && (
        <BgPickerModal
          proposal={prop}
          uploadPending={uploadBgMutation.isPending}
          onClose={() => setShowBgPicker(false)}
          onPresetBg={handlePresetBg}
          onUploadBg={handleBgUpload}
        />
      )}

      {showTemplates && (
        <TemplatesModal
          templates={templates as Template[]}
          onClose={() => setShowTemplates(false)}
          onApply={handleApplyTemplate}
          onDelete={async (id) => { await deleteTemplateMutation.mutateAsync(id); }}
        />
      )}

      {showSaveTemplate && (
        <SaveTemplateModal
          name={saveTemplateName}
          itemsCount={items.length}
          subtotal={subtotal}
          saving={saveTemplateMutation.isPending}
          onClose={() => setShowSaveTemplate(false)}
          onChangeName={setSaveTemplateName}
          onSave={handleSaveAsTemplate}
        />
      )}
    </div>
  );
}
