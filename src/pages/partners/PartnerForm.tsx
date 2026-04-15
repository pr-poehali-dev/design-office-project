import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Partner, PartnerType, PARTNER_TYPES } from "./PartnerTypes";

interface PartnerFormProps {
  partner?: Partner | null;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
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

export default function PartnerForm({ partner, onSave, onCancel, saving }: PartnerFormProps) {
  const [form, setForm] = useState({
    name: partner?.name || "",
    partner_type: (partner?.partner_type || "shop") as PartnerType,
    discount: partner?.discount?.toString() || "0",
    services: partner?.services || "",
    phone: partner?.phone ? formatPhone(partner.phone) : "+7",
    email: partner?.email || "",
    website: partner?.website || "",
    address: partner?.address || "",
    contact_person: partner?.contact_person || "",
    note: partner?.note || "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(partner?.logo_url || null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoContentType, setLogoContentType] = useState<string>("image/jpeg");
  const [removeLogo, setRemoveLogo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setErrors(prev => ({ ...prev, logo: "Допустимые форматы: JPG, PNG, WebP" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: "Максимальный размер: 5 МБ" }));
      return;
    }
    setErrors(prev => { const n = { ...prev }; delete n.logo; return n; });
    setLogoContentType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setLogoBase64(result.split(",")[1]);
      setRemoveLogo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoBase64(null);
    setRemoveLogo(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Минимум 2 символа";
    if (form.name.trim().length > 255) e.name = "Максимум 255 символов";

    const discount = parseFloat(form.discount);
    if (isNaN(discount) || discount < 0 || discount > 100) e.discount = "Число от 0 до 100";

    const phoneDigits = unformatPhone(form.phone);
    if (phoneDigits.length < 11) e.phone = "Введите полный номер";

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Некорректный email";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const data: Record<string, unknown> = {
      name: form.name.trim(),
      partner_type: form.partner_type,
      discount: parseFloat(form.discount),
      services: form.services || null,
      phone: form.phone,
      email: form.email || null,
      website: form.website || null,
      address: form.address || null,
      contact_person: form.contact_person || null,
      note: form.note || null,
    };

    if (logoBase64) {
      data.logo_base64 = logoBase64;
      data.logo_content_type = logoContentType;
    }
    if (removeLogo) {
      data.remove_logo = true;
    }

    onSave(data);
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra";

  return (
    <div className="bg-white rounded-2xl border border-border p-6 animate-fade-in">
      <h2 className="font-display text-2xl text-stone mb-6">
        {partner ? "Редактирование партнёра" : "Новый партнёр"}
      </h2>

      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="relative group">
            <div
              className="w-24 h-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-terra/50 transition-colors bg-muted/30"
              onClick={() => fileRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Icon name="ImagePlus" size={24} className="text-stone-light mx-auto" />
                  <span className="text-xs text-stone-light mt-1 block">Загрузить</span>
                </div>
              )}
            </div>
            {logoPreview && (
              <button
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icon name="X" size={12} />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoChange} />
            {errors.logo && <p className="text-xs text-red-500 mt-1 text-center">{errors.logo}</p>}
          </div>
        </div>

        <div>
          <label className="text-xs text-stone-light mb-1 block">Название *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Название компании / ФИО" className={inputCls} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-stone-light mb-1 block">Тип *</label>
            <select value={form.partner_type} onChange={e => setForm(f => ({ ...f, partner_type: e.target.value as PartnerType }))} className={inputCls}>
              {PARTNER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">Скидка, % *</label>
            <input type="number" step="0.1" min="0" max="100" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} className={inputCls} />
            {errors.discount && <p className="text-xs text-red-500 mt-1">{errors.discount}</p>}
          </div>
        </div>

        <div>
          <label className="text-xs text-stone-light mb-1 block">Услуги / Товары</label>
          <textarea value={form.services} onChange={e => setForm(f => ({ ...f, services: e.target.value }))} placeholder="Перечень товаров или услуг..." rows={2} className={`${inputCls} resize-none`} />
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <h3 className="text-sm font-semibold text-stone mb-3">Контакты</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-stone-light mb-1 block">Телефон *</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
                placeholder="+7 (999) 123-45-67"
                className={inputCls}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-light mb-1 block">E-mail</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className={inputCls} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-xs text-stone-light mb-1 block">Сайт</label>
                <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="example.com" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Адрес</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Город, улица, дом" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-stone-light mb-1 block">Контактное лицо</label>
              <input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="ФИО" className={inputCls} />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-stone-light mb-1 block">Примечание</label>
          <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Дополнительная информация..." rows={2} className={`${inputCls} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-border text-stone-mid text-sm hover:bg-muted transition-colors">
            Отмена
          </button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving ? "Сохранение..." : partner ? "Сохранить" : "Создать партнёра"}
          </button>
        </div>
      </div>
    </div>
  );
}
