import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { STYLE_OPTIONS, fmtMoney } from "./projectDetail.types";
import { useAuth } from "@/lib/auth";
import {
  useEstimate,
  useAddEstimateItem,
  useDeleteEstimateItem,
  usePayments,
  useAddPayment,
  useUpdatePayment,
  useDeletePayment,
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
} from "@/lib/queries";

/* ─── Shared EmptyState ─── */

function EmptyState({ icon, title, subtitle, action, onAction }: {
  icon: string; title: string; subtitle: string; action?: string; onAction?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-12 text-center">
      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon name={icon} fallback="Circle" size={28} className="text-stone-light" />
      </div>
      <h3 className="font-display text-xl text-stone mb-2">{title}</h3>
      <p className="text-stone-mid text-sm mb-6">{subtitle}</p>
      {action && (
        <button
          onClick={onAction}
          className="terra-gradient text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm"
        >
          {action}
        </button>
      )}
    </div>
  );
}

/* ─── BriefTab (unchanged) ─── */

export function BriefTab() {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [budget, setBudget] = useState(0);

  const toggleStyle = (s: string) =>
    setSelectedStyles(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">⏳ Не заполнен</span>
        </div>
        <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl terra-gradient text-white hover:opacity-90 transition-all">
          <Icon name="Send" size={14} className="text-white" /> Отправить клиенту
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-stone text-sm mb-4">Общая информация</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Тип помещения", placeholder: "Квартира" },
            { label: "Общая площадь", placeholder: "92 м²" },
            { label: "Количество жильцов", placeholder: "2" },
            { label: "Дети", placeholder: "Нет" },
            { label: "Животные", placeholder: "Нет" },
            { label: "Количество комнат", placeholder: "3" },
          ].map(({ label, placeholder }) => (
            <div key={label}>
              <label className="text-xs text-stone-light mb-1 block">{label}</label>
              <input
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-stone text-sm mb-4">Стилевые предпочтения</h3>
        <div className="flex flex-wrap gap-2">
          {STYLE_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => toggleStyle(s)}
              className={`px-3 py-1.5 rounded-xl text-sm border font-medium transition-all ${
                selectedStyles.includes(s)
                  ? "terra-gradient text-white border-transparent"
                  : "border-border text-stone-mid hover:border-terra/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label className="text-xs text-stone-light mb-1 block">Любимые цвета</label>
          <input
            placeholder="Белый, натуральное дерево, терракота"
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-stone text-sm mb-4">Функциональные требования</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { room: "Гостиная", items: ["Место для ТВ", "Диван с местом хранения", "Рабочая зона", "Гостевые места"] },
            { room: "Кухня", items: ["Остров/полуостров", "Место для 6+ человек", "Мощная вытяжка", "Встроенная техника"] },
            { room: "Спальня", items: ["King-size кровать", "Гардеробная", "Рабочий стол", "Зона отдыха"] },
            { room: "Ванная", items: ["Ванна", "Двойная раковина", "Тёплый пол", "Большое зеркало"] },
          ].map(({ room, items }) => (
            <div key={room}>
              <p className="text-xs font-semibold text-stone mb-2">{room}</p>
              <div className="space-y-1.5">
                {items.map(item => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded accent-terra" />
                    <span className="text-xs text-stone-mid">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-stone text-sm mb-4">Бюджет</h3>
        <div className="mb-2 flex justify-between">
          <span className="text-xs text-stone-light">Общий бюджет на реализацию</span>
          <span className="text-sm font-semibold text-terra">{budget > 0 ? fmtMoney(budget) : "Не указан"}</span>
        </div>
        <input
          type="range" min={0} max={10000000} step={100000}
          value={budget}
          onChange={e => setBudget(Number(e.target.value))}
          className="w-full accent-terra"
        />
        <div className="flex justify-between text-xs text-stone-light mt-1">
          <span>0 ₽</span><span>10 000 000 ₽</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone text-sm">Референсы</h3>
          <button className="flex items-center gap-1.5 text-xs text-terra border border-terra/30 px-3 py-1.5 rounded-xl hover:bg-terra-pale transition-colors">
            <Icon name="Upload" size={12} /> Загрузить
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mb-2">
            <Icon name="Image" size={18} className="text-stone-light" />
          </div>
          <p className="text-xs text-stone-mid">Референсов пока нет</p>
          <p className="text-xs text-stone-light">Загрузите фотографии для вдохновения</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-stone text-sm mb-3">Дополнительные пожелания</h3>
        <textarea
          placeholder="Опишите свои пожелания по интерьеру..."
          rows={4}
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra resize-none"
        />
      </div>
    </div>
  );
}

/* ─── Types ─── */

interface EstimateItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total: number;
}

interface Payment {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  due_date?: string;
  paid_date?: string;
  category?: string;
}

interface Document {
  id: string;
  type: "uploaded" | "generated";
  title: string;
  generated_url?: string;
  signed_url?: string;
  status?: string;
  created_at: string;
}

/* ─── EstimateTab ─── */

export function EstimateTab({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const isDesigner = user?.role === "designer";

  const { data, isLoading } = useEstimate(projectId);
  const addMutation = useAddEstimateItem();
  const deleteMutation = useDeleteEstimateItem();

  const items: EstimateItem[] = data?.items || [];
  const totalSum = data?.estimate?.total ?? items.reduce((s, i) => s + (i.total || 0), 0);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", quantity: "", unit: "", price_per_unit: "" });

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
          <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl terra-gradient text-white hover:opacity-90 transition-all">
            <Icon name="Download" size={14} className="text-white" /> PDF
          </button>
        </div>
      </div>

      {/* Inline add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <h4 className="font-semibold text-stone text-sm">Новая позиция</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-light mb-1 block">Название *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ламинат дубовый"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Категория</label>
              <input
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="Материалы"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Количество *</label>
              <input
                type="number"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="10"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Единица</label>
              <input
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="м²"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Цена за единицу *</label>
              <input
                type="number"
                value={form.price_per_unit}
                onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))}
                placeholder="1500"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="terra-gradient text-white font-medium px-5 py-2 rounded-xl hover:opacity-90 transition-all text-sm disabled:opacity-60"
            >
              {addMutation.isPending ? "Сохранение..." : "Добавить позицию"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-xl border border-border text-stone-mid text-sm hover:bg-muted transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Items grouped by category */}
      {items.length === 0 ? (
        <EmptyState
          icon="Receipt"
          title="Смета не заполнена"
          subtitle="Добавьте позиции в смету проекта"
          action={isDesigner ? "Добавить позицию" : undefined}
          onAction={() => setShowForm(true)}
        />
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
                      <p className="text-xs text-stone-light">
                        {item.quantity} {item.unit} x {fmtMoney(item.price_per_unit)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-stone whitespace-nowrap">{fmtMoney(item.total)}</span>
                      {isDesigner && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-stone-light hover:text-red-500 transition-all"
                        >
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

/* ─── FinanceTab ─── */

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Ожидает", color: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Оплачено", color: "bg-green-50 text-green-700 border-green-200" },
  overdue: { label: "Просрочено", color: "bg-red-50 text-red-600 border-red-200" },
};

export function FinanceTab({ projectId }: { projectId: string }) {
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
      {/* Summary cards */}
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

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone text-sm">Платежи</h3>
        {isDesigner && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border border-border text-stone hover:border-terra/40 transition-all"
          >
            <Icon name="Plus" size={14} /> Добавить
          </button>
        )}
      </div>

      {/* Inline add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <h4 className="font-semibold text-stone text-sm">Новый платёж</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-light mb-1 block">Описание *</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Аванс за проект"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Сумма *</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="150000"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Тип</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as "income" | "expense" }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              >
                <option value="income">Доход</option>
                <option value="expense">Расход</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Статус</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as "pending" | "paid" | "overdue" }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              >
                <option value="pending">Ожидает</option>
                <option value="paid">Оплачено</option>
                <option value="overdue">Просрочено</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Дата оплаты</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Категория</label>
              <input
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="Проектирование"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="terra-gradient text-white font-medium px-5 py-2 rounded-xl hover:opacity-90 transition-all text-sm disabled:opacity-60"
            >
              {addMutation.isPending ? "Сохранение..." : "Добавить платёж"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-xl border border-border text-stone-mid text-sm hover:bg-muted transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Payment list */}
      {payments.length === 0 ? (
        <EmptyState
          icon="TrendingUp"
          title="Платежей пока нет"
          subtitle="Добавьте доходы и расходы проекта"
          action={isDesigner ? "Добавить платёж" : undefined}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {payments.map(payment => {
            const statusInfo = PAYMENT_STATUS_MAP[payment.status] || PAYMENT_STATUS_MAP.pending;
            return (
              <div key={payment.id} className="flex items-center gap-3 px-5 py-3.5 group">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  payment.type === "income" ? "bg-green-50" : "bg-red-50"
                }`}>
                  <Icon
                    name={payment.type === "income" ? "ArrowDownLeft" : "ArrowUpRight"}
                    size={15}
                    className={payment.type === "income" ? "text-green-600" : "text-red-500"}
                  />
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
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${statusInfo.color} ${
                      isDesigner ? "cursor-pointer hover:opacity-80" : "cursor-default"
                    }`}
                  >
                    {statusInfo.label}
                  </button>
                  <span className={`text-sm font-semibold whitespace-nowrap ${
                    payment.type === "income" ? "text-stone" : "text-red-500"
                  }`}>
                    {payment.type === "expense" ? "-" : ""}{fmtMoney(payment.amount)}
                  </span>
                  {isDesigner && (
                    <button
                      onClick={() => handleDelete(payment.id)}
                      disabled={deleteMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-stone-light hover:text-red-500 transition-all"
                    >
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

/* ─── DocsTab ─── */

type DocFilter = "all" | "uploaded" | "generated";

export function DocsTab({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const isDesigner = user?.role === "designer";

  const { data, isLoading } = useDocuments(projectId);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  const documents: Document[] = data?.documents || [];

  const [filter, setFilter] = useState<DocFilter>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = filter === "all" ? documents : documents.filter(d => d.type === filter);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      const ext = file.name.split(".").pop() || "pdf";
      uploadMutation.mutate({
        projectId,
        data: {
          title: file.name,
          file: base64,
          content_type: file.type,
          ext,
        },
      });
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-uploaded
    e.target.value = "";
  };

  const handleDelete = (docId: string) => {
    deleteMutation.mutate({ projectId, docId });
  };

  const getDownloadUrl = (doc: Document) => doc.signed_url || doc.generated_url || "";

  const formatDate = (d?: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  };

  const filterTabs: { id: DocFilter; label: string }[] = [
    { id: "all", label: "Все" },
    { id: "uploaded", label: "Загруженные" },
    { id: "generated", label: "Сгенерированные" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="Loader2" size={22} className="text-terra animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === tab.id
                  ? "bg-white text-stone shadow-sm"
                  : "text-stone-mid hover:text-stone"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {isDesigner && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border border-border text-stone hover:border-terra/40 transition-all disabled:opacity-60"
            >
              <Icon name="Upload" size={14} />
              {uploadMutation.isPending ? "Загрузка..." : "Загрузить"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.svg"
            />
          </>
        )}
      </div>

      {/* Document list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="FolderOpen"
          title="Документов пока нет"
          subtitle="Загрузите файлы проекта"
          action={isDesigner ? "Загрузить документ" : undefined}
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {filtered.map(doc => {
            const url = getDownloadUrl(doc);
            const ext = doc.title?.split(".").pop()?.toUpperCase() || "FILE";
            return (
              <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  doc.type === "generated" ? "bg-blue-50" : "bg-muted"
                }`}>
                  <Icon
                    name={doc.type === "generated" ? "FileText" : "File"}
                    size={18}
                    className={doc.type === "generated" ? "text-blue-600" : "text-stone-light"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone font-medium truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 text-xs text-stone-light">
                    <span className="uppercase">{ext}</span>
                    {doc.created_at && (
                      <>
                        <span>&middot;</span>
                        <span>{formatDate(doc.created_at)}</span>
                      </>
                    )}
                    {doc.type === "generated" && (
                      <>
                        <span>&middot;</span>
                        <span className="text-blue-600">Сгенерирован</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-muted text-stone-light hover:text-terra transition-all"
                    >
                      <Icon name="Download" size={16} />
                    </a>
                  )}
                  {isDesigner && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleteMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-stone-light hover:text-red-500 transition-all"
                    >
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
