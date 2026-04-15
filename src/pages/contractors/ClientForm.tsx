import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Client, CLIENT_SOURCES } from "./ClientTypes";

interface ClientFormProps {
  client?: Client | null;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  onArchive?: () => void;
  saving?: boolean;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  let result = "+7";
  if (digits.length > 1) result += " (" + digits.slice(1, 4);
  if (digits.length > 4) result += ") " + digits.slice(4, 7);
  if (digits.length > 7) result += "-" + digits.slice(7, 9);
  if (digits.length > 9) result += "-" + digits.slice(9, 11);
  return result;
}

function unformatPhone(value: string): string {
  return value.replace(/\D/g, "");
}

export default function ClientForm({ client, onSave, onCancel, onArchive, saving }: ClientFormProps) {
  const [form, setForm] = useState({
    name: client?.name || "",
    phone: client?.phone ? formatPhone(client.phone) : "+7",
    email: client?.email || "",
    address: client?.address || "",
    source: client?.source || "",
    note: client?.note || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Минимум 2 символа";
    if (unformatPhone(form.phone).length < 11) e.phone = "Введите полный номер";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Некорректный email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      name: form.name.trim(),
      phone: form.phone,
      email: form.email || null,
      address: form.address || null,
      source: form.source || null,
      note: form.note || null,
    });
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl text-stone">{client ? "Редактировать клиента" : "Новый клиент"}</h3>
          <button onClick={onCancel} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <Icon name="X" size={16} className="text-stone-mid" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-stone-light mb-1 block">Имя / Название *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ФИО или компания" className={inputCls} autoFocus />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-xs text-stone-light mb-1 block">Телефон *</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))} placeholder="+7 (999) 123-45-67" className={inputCls} />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-light mb-1 block">E-mail</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className={inputCls} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Источник</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className={inputCls}>
                <option value="">Не указан</option>
                {CLIENT_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-stone-light mb-1 block">Адрес</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Город, улица, дом" className={inputCls} />
          </div>

          <div>
            <label className="text-xs text-stone-light mb-1 block">Примечание</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Дополнительная информация..." rows={2} className={`${inputCls} resize-none`} />
          </div>

          <div className="flex gap-2 pt-2">
            {client && onArchive && (
              <button onClick={onArchive} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${client.is_archived ? "border border-green-200 text-green-600 hover:bg-green-50" : "border border-red-200 text-red-500 hover:bg-red-50"}`}>
                {client.is_archived ? "Восстановить" : "В архив"}
              </button>
            )}
            <button onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-border text-stone-mid text-sm hover:bg-muted transition-colors">
              Отмена
            </button>
            <button onClick={handleSubmit} disabled={saving} className="flex-1 terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? "Сохранение..." : client ? "Сохранить" : "Создать"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
