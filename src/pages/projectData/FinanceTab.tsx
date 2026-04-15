import { useState } from "react";
import Icon from "@/components/ui/icon";
import { fmtMoney } from "../projectDetail.types";
import { useAuth } from "@/lib/auth";
import { usePayments, useAddPayment, useUpdatePayment, useDeletePayment } from "@/lib/queries";
import { EmptyState } from "./shared";
import type { Payment } from "./shared";

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Ожидает", color: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Оплачено", color: "bg-green-50 text-green-700 border-green-200" },
  overdue: { label: "Просрочено", color: "bg-red-50 text-red-600 border-red-200" },
};

export default function FinanceTab({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const isDesigner = user?.role === "designer";

  const { data, isLoading } = usePayments(projectId);
  const addMutation = useAddPayment();
  const updateMutation = useUpdatePayment();
  const deleteMutation = useDeletePayment();

  const payments: Payment[] = data?.payments || [];

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "income" as "income" | "expense",
    status: "pending" as "pending" | "paid" | "overdue",
    due_date: "",
    category: "",
  });

  const totalIncome = payments.filter(p => p.type === "income").reduce((s, p) => s + p.amount, 0);
  const paidIncome = payments.filter(p => p.type === "income" && p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pendingIncome = payments.filter(p => p.type === "income" && p.status !== "paid").reduce((s, p) => s + p.amount, 0);
  const totalExpense = payments.filter(p => p.type === "expense").reduce((s, p) => s + p.amount, 0);

  const summaryCards = [
    { label: "Стоимость проекта", value: totalIncome, icon: "Wallet", color: "text-stone" },
    { label: "Оплачено", value: paidIncome, icon: "CheckCircle", color: "text-green-600" },
    { label: "К оплате", value: pendingIncome, icon: "Clock", color: "text-amber-600" },
    { label: "Расходы", value: totalExpense, icon: "TrendingDown", color: "text-red-500" },
  ];

  const handleAdd = () => {
    if (!form.description || !form.amount) return;
    addMutation.mutate({
      projectId,
      data: {
        description: form.description,
        amount: Number(form.amount),
        type: form.type,
        status: form.status,
        due_date: form.due_date || undefined,
        category: form.category || undefined,
      },
    }, {
      onSuccess: () => {
        setForm({ description: "", amount: "", type: "income", status: "pending", due_date: "", category: "" });
        setShowForm(false);
      },
    });
  };

  const handleToggleStatus = (payment: Payment) => {
    if (!isDesigner) return;
    const newStatus = payment.status === "pending" ? "paid" : "pending";
    updateMutation.mutate({
      projectId,
      paymentId: payment.id,
      data: {
        status: newStatus,
        ...(newStatus === "paid" ? { paid_date: new Date().toISOString().split("T")[0] } : { paid_date: null }),
      },
    });
  };

  const handleDelete = (paymentId: string) => {
    deleteMutation.mutate({ projectId, paymentId });
  };

  const formatDate = (d?: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="Loader2" size={22} className="text-terra animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-muted rounded-xl flex items-center justify-center">
                <Icon name={card.icon} fallback="Circle" size={16} className="text-stone-light" />
              </div>
            </div>
            <p className="text-xs text-stone-light mb-0.5">{card.label}</p>
            <p className={`font-display text-lg font-semibold ${card.color}`}>{fmtMoney(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone text-sm">Платежи</h3>
        {isDesigner && (
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border border-border text-stone hover:border-terra/40 transition-all">
            <Icon name="Plus" size={14} /> Добавить
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <h4 className="font-semibold text-stone text-sm">Новый платёж</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-light mb-1 block">Описание *</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Аванс за проект" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Сумма *</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="100000" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Тип</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as "income" | "expense" }))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20">
                <option value="income">Доход</option>
                <option value="expense">Расход</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Статус</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as "pending" | "paid" | "overdue" }))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20">
                <option value="pending">Ожидает</option>
                <option value="paid">Оплачено</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Срок оплаты</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20" />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Категория</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Дизайн-проект" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={addMutation.isPending} className="terra-gradient text-white font-medium px-5 py-2 rounded-xl hover:opacity-90 transition-all text-sm disabled:opacity-60">
              {addMutation.isPending ? "Сохранение..." : "Добавить платёж"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl border border-border text-stone-mid text-sm hover:bg-muted transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <EmptyState icon="TrendingUp" title="Финансы пусты" subtitle="Добавьте платежи проекта" action={isDesigner ? "Добавить платёж" : undefined} onAction={() => setShowForm(true)} />
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {payments.map(payment => {
            const statusInfo = PAYMENT_STATUS_MAP[payment.status] || PAYMENT_STATUS_MAP.pending;
            return (
              <div key={payment.id} className="flex items-center gap-3 px-5 py-3.5 group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${payment.type === "income" ? "bg-green-50" : "bg-red-50"}`}>
                  <Icon name={payment.type === "income" ? "ArrowDownLeft" : "ArrowUpRight"} size={15} className={payment.type === "income" ? "text-green-600" : "text-red-500"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone font-medium truncate">{payment.description}</p>
                  <p className="text-xs text-stone-light">
                    {payment.category && <span>{payment.category}</span>}
                    {payment.category && payment.due_date && <span> &middot; </span>}
                    {payment.due_date && <span>{formatDate(payment.due_date)}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleStatus(payment)}
                    disabled={!isDesigner || updateMutation.isPending}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${statusInfo.color} ${isDesigner ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                  >
                    {statusInfo.label}
                  </button>
                  <span className={`text-sm font-semibold whitespace-nowrap ${payment.type === "income" ? "text-stone" : "text-red-500"}`}>
                    {payment.type === "expense" ? "-" : ""}{fmtMoney(payment.amount)}
                  </span>
                  {isDesigner && (
                    <button onClick={() => handleDelete(payment.id)} disabled={deleteMutation.isPending} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-stone-light hover:text-red-500 transition-all">
                      <Icon name="Trash2" size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
