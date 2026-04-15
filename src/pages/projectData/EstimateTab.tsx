import { useState } from "react";
import Icon from "@/components/ui/icon";
import { fmtMoney } from "../projectDetail.types";
import { useAuth } from "@/lib/auth";
import { useEstimate, useAddEstimateItem, useDeleteEstimateItem } from "@/lib/queries";
import { EmptyState } from "./shared";
import type { EstimateItem } from "./shared";

export default function EstimateTab({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const isDesigner = user?.role === "designer";

  const { data, isLoading } = useEstimate(projectId);
  const addMutation = useAddEstimateItem();
  const deleteMutation = useDeleteEstimateItem();

  const items: EstimateItem[] = data?.items || [];
  const totalSum = data?.estimate?.total ?? items.reduce((s, i) => s + (i.total || 0), 0);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", quantity: "", unit: "", price_per_unit: "" });
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const grouped = items.reduce<Record<string, EstimateItem[]>>((acc, item) => {
    const cat = item.category || "Без категории";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handleAdd = () => {
    if (!form.name || !form.quantity || !form.price_per_unit) return;
    addMutation.mutate({
      projectId,
      data: {
        name: form.name,
        category: form.category || "Без категории",
        quantity: Number(form.quantity),
        unit: form.unit || "шт",
        price_per_unit: Number(form.price_per_unit),
      },
    }, {
      onSuccess: () => {
        setForm({ name: "", category: "", quantity: "", unit: "", price_per_unit: "" });
        setShowForm(false);
      },
    });
  };

  const handleDelete = (itemId: string) => {
    deleteMutation.mutate({ projectId, itemId });
  };

  const handleExportPdf = async () => {
    if (items.length === 0) return;
    setGeneratingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const w = pdf.internal.pageSize.getWidth();
      let y = 20;

      pdf.setFontSize(18);
      pdf.text("Смета проекта", 14, y);
      y += 10;
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text(`Дата: ${new Date().toLocaleDateString("ru-RU")}`, 14, y);
      y += 10;

      const grouped2 = items.reduce<Record<string, typeof items>>((acc, item) => {
        const cat = item.category || "Без категории";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {});

      for (const [cat, catItems] of Object.entries(grouped2)) {
        if (y > 260) { pdf.addPage(); y = 20; }
        pdf.setFontSize(11);
        pdf.setTextColor(60);
        pdf.text(cat, 14, y);
        const catTotal2 = catItems.reduce((s, i) => s + (i.total || 0), 0);
        pdf.text(fmtMoney(catTotal2), w - 14, y, { align: "right" });
        y += 2;
        pdf.setDrawColor(200);
        pdf.line(14, y, w - 14, y);
        y += 5;

        pdf.setFontSize(9);
        for (const item of catItems) {
          if (y > 275) { pdf.addPage(); y = 20; }
          pdf.setTextColor(40);
          pdf.text(item.name, 18, y);
          pdf.setTextColor(120);
          pdf.text(`${item.quantity} ${item.unit} × ${fmtMoney(item.price_per_unit)}`, 100, y);
          pdf.setTextColor(40);
          pdf.text(fmtMoney(item.total), w - 14, y, { align: "right" });
          y += 6;
        }
        y += 4;
      }

      if (y > 260) { pdf.addPage(); y = 20; }
      y += 2;
      pdf.setDrawColor(60);
      pdf.line(14, y, w - 14, y);
      y += 7;
      pdf.setFontSize(13);
      pdf.setTextColor(40);
      pdf.text("Итого:", 14, y);
      pdf.text(fmtMoney(totalSum), w - 14, y, { align: "right" });

      pdf.save("Смета.pdf");
    } catch { /* empty */ }
    setGeneratingPdf(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="Loader2" size={22} className="text-terra animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-stone-mid">
          Итого: <span className="font-display text-xl font-semibold text-stone">{fmtMoney(totalSum)}</span>
        </div>
        <div className="flex gap-2">
          {isDesigner && (
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border border-border text-stone hover:border-terra/40 transition-all"
            >
              <Icon name="Plus" size={14} /> Добавить
            </button>
          )}
          <button onClick={handleExportPdf} disabled={generatingPdf || items.length === 0} className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl terra-gradient text-white hover:opacity-90 transition-all disabled:opacity-50">
            <Icon name="Download" size={14} className="text-white" /> {generatingPdf ? "Генерация..." : "PDF"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <h4 className="font-semibold text-stone text-sm">Новая позиция</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-light mb-1 block">Название *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ламинат дубовый" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Категория</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Материалы" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Количество *</label>
              <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="10" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Единица</label>
              <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="м²" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Цена за единицу *</label>
              <input type="number" value={form.price_per_unit} onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))} placeholder="1500" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={addMutation.isPending} className="terra-gradient text-white font-medium px-5 py-2 rounded-xl hover:opacity-90 transition-all text-sm disabled:opacity-60">
              {addMutation.isPending ? "Сохранение..." : "Добавить позицию"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl border border-border text-stone-mid text-sm hover:bg-muted transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon="Receipt" title="Смета не заполнена" subtitle="Добавьте позиции в смету проекта" action={isDesigner ? "Добавить позицию" : undefined} onAction={() => setShowForm(true)} />
      ) : (
        Object.entries(grouped).map(([category, catItems]) => {
          const catTotal = catItems.reduce((s, i) => s + (i.total || 0), 0);
          return (
            <div key={category} className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-muted/50 border-b border-border">
                <span className="text-sm font-semibold text-stone">{category}</span>
                <span className="text-sm font-medium text-stone-mid">{fmtMoney(catTotal)}</span>
              </div>
              <div className="divide-y divide-border">
                {catItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone font-medium truncate">{item.name}</p>
                      <p className="text-xs text-stone-light">{item.quantity} {item.unit} x {fmtMoney(item.price_per_unit)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-stone whitespace-nowrap">{fmtMoney(item.total)}</span>
                      {isDesigner && (
                        <button onClick={() => handleDelete(item.id)} disabled={deleteMutation.isPending} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-stone-light hover:text-red-500 transition-all">
                          <Icon name="Trash2" size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
