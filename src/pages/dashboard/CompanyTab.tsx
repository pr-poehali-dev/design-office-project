import { useState, useMemo, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { useCompanyData, useSaveCompanyData } from "@/lib/queries";

type EntityType = "individual" | "ip" | "ooo";

const ENTITY_TABS: { id: EntityType; label: string }[] = [
  { id: "individual", label: "Физ. лицо" },
  { id: "ip", label: "ИП" },
  { id: "ooo", label: "ООО" },
];

const TAX_OPTIONS = ["УСН 6%", "УСН 15%", "Патент", "НПД", "ОСНО"];

const IND_DEFAULTS = { full_name: "", birth_date: "", phone: "", email: "", passport_series: "", passport_issued_by: "", passport_date: "", passport_code: "", registration_address: "", bank_name: "", card_number: "", bik: "" };
const IP_DEFAULTS = { full_name: "", inn: "", ogrnip: "", reg_date: "", tax_system: "", legal_address: "", bank_name: "", account: "", corr_account: "", bik: "" };
const OOO_DEFAULTS = { full_name: "", short_name: "", inn: "", kpp: "", ogrn: "", director: "", director_title: "Генеральный директор", basis: "Устава", tax_system: "", legal_address: "", actual_address: "", same_address: true, bank_name: "", account: "", corr_account: "", bik: "" };

function Field({ label, value, onChange, placeholder, type, masked }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; masked?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const displayVal = masked && !visible && value ? value.replace(/./g, "•") : value;
  return (
    <div>
      <label className="text-xs text-stone-light mb-1 block">{label}</label>
      <div className="relative">
        <input type={type || "text"} value={masked && !visible ? displayVal : value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Не заполнено"} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm placeholder:text-stone-light placeholder:italic focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra focus:bg-terra-pale/20 transition-all pr-10" />
        {masked && <button type="button" onClick={() => setVisible(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-stone-light hover:text-stone transition-colors"><Icon name={visible ? "EyeOff" : "Eye"} size={15} /></button>}
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 terra-gradient rounded-lg flex items-center justify-center"><Icon name={icon} fallback="Circle" size={13} className="text-white" /></div>
        <h3 className="font-semibold text-stone text-sm">{title}</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

export default function CompanyTab() {
  const { user } = useAuth();
  const { data: serverData, isLoading } = useCompanyData();
  const saveMutation = useSaveCompanyData();
  const fullName = `${user?.last_name || ""} ${user?.first_name || ""}`.trim();

  const [entityType, setEntityType] = useState<EntityType>("individual");
  const [ind, setInd] = useState({ ...IND_DEFAULTS });
  const [ip, setIp] = useState({ ...IP_DEFAULTS });
  const [ooo, setOoo] = useState({ ...OOO_DEFAULTS });
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!serverData || loaded) return;
    const et = (serverData.entity_type || "individual") as EntityType;
    setEntityType(et);
    const d = serverData.data || {};
    if (et === "individual") setInd({ ...IND_DEFAULTS, full_name: fullName, phone: user?.phone || "", email: user?.email || "", ...d });
    else if (et === "ip") setIp({ ...IP_DEFAULTS, full_name: `ИП ${fullName}`, ...d });
    else setOoo({ ...OOO_DEFAULTS, director: fullName, ...d });
    setLoaded(true);
  }, [serverData]);

  useEffect(() => {
    if (loaded) return;
    setInd(p => ({ ...p, full_name: p.full_name || fullName, phone: p.phone || user?.phone || "", email: p.email || user?.email || "" }));
    setIp(p => ({ ...p, full_name: p.full_name || `ИП ${fullName}` }));
    setOoo(p => ({ ...p, director: p.director || fullName }));
  }, [fullName]);

  const filledCount = useMemo(() => {
    if (entityType === "individual") {
      const f = [ind.full_name, ind.birth_date, ind.phone, ind.email, ind.passport_series, ind.passport_issued_by, ind.bank_name, ind.bik];
      return { filled: f.filter(Boolean).length, total: f.length };
    }
    if (entityType === "ip") {
      const f = [ip.full_name, ip.inn, ip.ogrnip, ip.tax_system, ip.legal_address, ip.bank_name, ip.account, ip.bik];
      return { filled: f.filter(Boolean).length, total: f.length };
    }
    const f = [ooo.full_name, ooo.inn, ooo.kpp, ooo.ogrn, ooo.director, ooo.tax_system, ooo.legal_address, ooo.bank_name, ooo.account, ooo.bik];
    return { filled: f.filter(Boolean).length, total: f.length };
  }, [entityType, ind, ip, ooo]);

  const pct = Math.round((filledCount.filled / filledCount.total) * 100);
  const barColor = pct < 30 ? "bg-red-400" : pct < 70 ? "bg-amber-400" : "bg-green-400";

  const handleSave = async () => {
    const formData = entityType === "individual" ? ind : entityType === "ip" ? ip : ooo;
    try {
      await saveMutation.mutateAsync({ entity_type: entityType, data: formData as unknown as Record<string, unknown> });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* empty */ }
  };

  const u = <T extends Record<string, unknown>>(setter: React.Dispatch<React.SetStateAction<T>>, field: string) =>
    (v: string) => setter(prev => ({ ...prev, [field]: v }));

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={22} className="text-terra animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-border p-1.5 flex gap-1">
        {ENTITY_TABS.map(tab => (
          <button key={tab.id} onClick={() => setEntityType(tab.id)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${entityType === tab.id ? "terra-gradient text-white shadow-sm" : "text-stone-mid hover:text-stone hover:bg-muted"}`}>{tab.label}</button>
        ))}
      </div>

      <div className="flex items-start gap-3 bg-terra-pale/50 border border-terra/15 rounded-2xl p-4">
        <div className="w-6 h-6 rounded-full bg-terra/10 flex items-center justify-center flex-shrink-0 mt-0.5"><Icon name="Info" size={13} className="text-terra" /></div>
        <p className="text-xs text-stone-mid leading-relaxed">Данные используются для автоматического заполнения договоров, актов и счетов. Не видны другим участникам Гильдии.</p>
      </div>

      {entityType === "individual" && (
        <>
          <Section icon="User" title="Персональные данные">
            <Field label="ФИО полностью" value={ind.full_name} onChange={u(setInd, "full_name")} />
            <Field label="Дата рождения" value={ind.birth_date} onChange={u(setInd, "birth_date")} placeholder="15.03.1991" />
            <Field label="Телефон" value={ind.phone} onChange={u(setInd, "phone")} />
            <Field label="Email" value={ind.email} onChange={u(setInd, "email")} />
          </Section>
          <Section icon="FileText" title="Паспортные данные">
            <Field label="Серия и номер" value={ind.passport_series} onChange={u(setInd, "passport_series")} masked />
            <Field label="Кем выдан" value={ind.passport_issued_by} onChange={u(setInd, "passport_issued_by")} />
            <Field label="Дата выдачи" value={ind.passport_date} onChange={u(setInd, "passport_date")} />
            <Field label="Код подразделения" value={ind.passport_code} onChange={u(setInd, "passport_code")} />
            <div className="sm:col-span-2"><Field label="Адрес регистрации" value={ind.registration_address} onChange={u(setInd, "registration_address")} /></div>
          </Section>
          <Section icon="Landmark" title="Банковские реквизиты">
            <Field label="Название банка" value={ind.bank_name} onChange={u(setInd, "bank_name")} />
            <Field label="Номер карты" value={ind.card_number} onChange={u(setInd, "card_number")} masked placeholder="•••• •••• •••• ••••" />
            <Field label="БИК" value={ind.bik} onChange={u(setInd, "bik")} />
          </Section>
        </>
      )}

      {entityType === "ip" && (
        <>
          <Section icon="Briefcase" title="Данные ИП">
            <div className="sm:col-span-2"><Field label="Полное наименование" value={ip.full_name} onChange={u(setIp, "full_name")} /></div>
            <Field label="ИНН" value={ip.inn} onChange={u(setIp, "inn")} placeholder="12 цифр" />
            <Field label="ОГРНИП" value={ip.ogrnip} onChange={u(setIp, "ogrnip")} placeholder="15 цифр" />
            <Field label="Дата регистрации" value={ip.reg_date} onChange={u(setIp, "reg_date")} />
            <div>
              <label className="text-xs text-stone-light mb-1 block">Система налогообложения</label>
              <select value={ip.tax_system} onChange={e => setIp(p => ({ ...p, tax_system: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra">
                <option value="">Выберите</option>
                {TAX_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </Section>
          <Section icon="MapPin" title="Адрес">
            <div className="sm:col-span-2"><Field label="Юридический адрес" value={ip.legal_address} onChange={u(setIp, "legal_address")} /></div>
          </Section>
          <Section icon="Landmark" title="Банковские реквизиты">
            <div className="sm:col-span-2"><Field label="Наименование банка" value={ip.bank_name} onChange={u(setIp, "bank_name")} /></div>
            <Field label="Расчётный счёт" value={ip.account} onChange={u(setIp, "account")} placeholder="20 цифр" />
            <Field label="Корреспондентский счёт" value={ip.corr_account} onChange={u(setIp, "corr_account")} placeholder="20 цифр" />
            <Field label="БИК" value={ip.bik} onChange={u(setIp, "bik")} placeholder="9 цифр" />
          </Section>
        </>
      )}

      {entityType === "ooo" && (
        <>
          <Section icon="Building2" title="Данные организации">
            <div className="sm:col-span-2"><Field label="Полное наименование" value={ooo.full_name} onChange={u(setOoo, "full_name")} placeholder='ООО "Название"' /></div>
            <Field label="Краткое наименование" value={ooo.short_name} onChange={u(setOoo, "short_name")} />
            <Field label="ИНН" value={ooo.inn} onChange={u(setOoo, "inn")} placeholder="10 цифр" />
            <Field label="КПП" value={ooo.kpp} onChange={u(setOoo, "kpp")} placeholder="9 цифр" />
            <Field label="ОГРН" value={ooo.ogrn} onChange={u(setOoo, "ogrn")} placeholder="13 цифр" />
            <Field label="Генеральный директор" value={ooo.director} onChange={u(setOoo, "director")} />
            <Field label="Должность подписанта" value={ooo.director_title} onChange={u(setOoo, "director_title")} />
            <Field label="Действует на основании" value={ooo.basis} onChange={u(setOoo, "basis")} />
            <div>
              <label className="text-xs text-stone-light mb-1 block">Система налогообложения</label>
              <select value={ooo.tax_system} onChange={e => setOoo(p => ({ ...p, tax_system: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra">
                <option value="">Выберите</option>
                {TAX_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </Section>
          <Section icon="MapPin" title="Адреса">
            <div className="sm:col-span-2"><Field label="Юридический адрес" value={ooo.legal_address} onChange={u(setOoo, "legal_address")} /></div>
            {!ooo.same_address && <div className="sm:col-span-2"><Field label="Фактический адрес" value={ooo.actual_address} onChange={u(setOoo, "actual_address")} /></div>}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={ooo.same_address} onChange={e => setOoo(p => ({ ...p, same_address: e.target.checked }))} className="rounded accent-terra" />
                <span className="text-xs text-stone-mid">Фактический совпадает с юридическим</span>
              </label>
            </div>
          </Section>
          <Section icon="Landmark" title="Банковские реквизиты">
            <div className="sm:col-span-2"><Field label="Наименование банка" value={ooo.bank_name} onChange={u(setOoo, "bank_name")} /></div>
            <Field label="Расчётный счёт" value={ooo.account} onChange={u(setOoo, "account")} placeholder="20 цифр" />
            <Field label="Корреспондентский счёт" value={ooo.corr_account} onChange={u(setOoo, "corr_account")} placeholder="20 цифр" />
            <Field label="БИК" value={ooo.bik} onChange={u(setOoo, "bik")} placeholder="9 цифр" />
          </Section>
        </>
      )}

      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-stone">Заполненность</span>
          <span className="text-xs text-stone-mid">Заполнено {filledCount.filled} из {filledCount.total} полей</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-2">
          <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-stone-light">Заполните все поля, чтобы документы формировались автоматически</p>
      </div>

      <button onClick={handleSave} disabled={saveMutation.isPending} className="w-full terra-gradient text-white py-3 rounded-2xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50">
        {saveMutation.isPending ? "Сохраняем..." : saved ? "Данные сохранены" : "Сохранить данные"}
      </button>

      <div className="flex items-center gap-2.5 justify-center py-2">
        <Icon name="Lock" size={13} className="text-stone-light" />
        <p className="text-xs text-stone-light">Данные зашифрованы и не видны другим участникам Гильдии</p>
      </div>
    </div>
  );
}
