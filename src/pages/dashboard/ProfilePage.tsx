import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { useUpdateProfile } from "@/lib/queries";

const PROFILE_TABS = [
  { id: "card", label: "Личная карточка", icon: "UserCircle" },
  { id: "company", label: "Компания", icon: "Building2" },
];

const ALL_STYLES = ["Современный", "Минимализм", "Скандинавский", "Классика", "Лофт", "Ар-деко", "Японди", "Эклектика"];
const ALL_OBJECTS = ["Квартиры", "Дома", "Коммерция", "Офисы", "Рестораны", "Отели"];

const MOCK_PORTFOLIO = [
  { id: "1", title: "Квартира 85м²" },
  { id: "2", title: "Студия 42м²" },
  { id: "3", title: "Лофт 120м²" },
  { id: "4", title: "Дом 200м²" },
  { id: "5", title: "Офис 95м²" },
  { id: "6", title: "Пентхаус 150м²" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${checked ? "bg-terra" : "bg-stone-light/40"}`}
    >
      <span className={`inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm transform transition-transform ${checked ? "translate-x-5.5" : "translate-x-1"}`} style={{ width: 18, height: 18, transform: checked ? "translateX(22px)" : "translateX(3px)" }} />
    </button>
  );
}

function yearsLabel(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} год`;
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} года`;
  return `${n} лет`;
}

function guildAge(createdAt?: string) {
  if (!createdAt) return "< 1 года";
  const months = Math.floor((Date.now() - new Date(createdAt).getTime()) / (30.44 * 24 * 60 * 60 * 1000));
  if (months < 12) return `${months || 1} мес`;
  return yearsLabel(Math.floor(months / 12));
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const updateMutation = useUpdateProfile();
  const [activeTab, setActiveTab] = useState("card");
  const [showPreview, setShowPreview] = useState(false);
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [contactsPublic, setContactsPublic] = useState(true);

  const [editingAbout, setEditingAbout] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editingContacts, setEditingContacts] = useState(false);
  const [contactForm, setContactForm] = useState({ phone: "", city: "", telegram: "", website: "" });
  const [editingStyles, setEditingStyles] = useState(false);
  const [editStyles, setEditStyles] = useState<string[]>([]);
  const [editObjects, setEditObjects] = useState<string[]>([]);
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({ first_name: "", last_name: "", experience_years: "" });

  const userInitials = user ? `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase() : "?";
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  const roleLabel = user?.role === "designer" ? "Дизайнер интерьеров" : user?.role === "client" ? "Клиент" : "Работник";
  const styles = (user?.work_styles || "").split(",").map(s => s.trim()).filter(Boolean);
  const objects = (user?.work_objects || "").split(",").map(s => s.trim()).filter(Boolean);
  const expYears = user?.experience_years || 0;

  const save = async (data: Record<string, unknown>) => {
    try { await updateMutation.mutateAsync(data); await refreshUser(); } catch { /* empty */ }
  };

  const startEditAbout = () => { setEditBio(user?.bio || ""); setEditingAbout(true); };
  const saveAbout = () => { save({ bio: editBio }); setEditingAbout(false); };
  const startEditContacts = () => { setContactForm({ phone: user?.phone || "", city: user?.city || "", telegram: user?.telegram || "", website: user?.website || "" }); setEditingContacts(true); };
  const saveContacts = () => { save(contactForm); setEditingContacts(false); };
  const startEditStyles = () => { setEditStyles(styles.length ? styles : []); setEditObjects(objects.length ? objects : []); setEditingStyles(true); };
  const toggleTag = (tag: string, list: string[], setter: (v: string[]) => void) => { setter(list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag]); };
  const saveStyles = () => { save({ work_styles: editStyles.join(", "), work_objects: editObjects.join(", ") }); setEditingStyles(false); };
  const startEditHeader = () => { setHeaderForm({ first_name: user?.first_name || "", last_name: user?.last_name || "", experience_years: String(expYears) }); setEditingHeader(true); };
  const saveHeader = () => { save({ first_name: headerForm.first_name, last_name: headerForm.last_name, experience_years: Number(headerForm.experience_years) || 0 }); setEditingHeader(false); };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20";

  return (
    <div>
      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 mb-6">
        <div className="flex gap-1 bg-white border border-border rounded-2xl p-1 min-w-max md:min-w-0 w-fit">
          {PROFILE_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? "terra-gradient text-white shadow-sm" : "text-stone-mid hover:text-stone hover:bg-muted"}`}>
              <Icon name={tab.icon} fallback="Circle" size={15} className={activeTab === tab.id ? "text-white" : ""} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "company" && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4"><Icon name="Building2" size={28} className="text-stone-light" /></div>
          <h3 className="font-display text-xl text-stone mb-2">Раздел в разработке</h3>
          <p className="text-stone-mid text-sm">Здесь появятся реквизиты и данные вашей компании</p>
        </div>
      )}

      {activeTab === "card" && (
        <div className="grid md:grid-cols-[55%_1fr] gap-5">
          {/* Left column */}
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-border p-6">
              {editingHeader ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-stone-light mb-1 block">Имя</label><input value={headerForm.first_name} onChange={e => setHeaderForm(f => ({ ...f, first_name: e.target.value }))} className={inputCls} /></div>
                    <div><label className="text-xs text-stone-light mb-1 block">Фамилия</label><input value={headerForm.last_name} onChange={e => setHeaderForm(f => ({ ...f, last_name: e.target.value }))} className={inputCls} /></div>
                  </div>
                  <div><label className="text-xs text-stone-light mb-1 block">Опыт (лет)</label><input type="number" value={headerForm.experience_years} onChange={e => setHeaderForm(f => ({ ...f, experience_years: e.target.value }))} className="w-32 px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20" /></div>
                  <div className="flex gap-2">
                    <button onClick={saveHeader} disabled={updateMutation.isPending} className="terra-gradient text-white px-4 py-2 rounded-xl text-sm hover:opacity-90 disabled:opacity-50">{updateMutation.isPending ? "..." : "Сохранить"}</button>
                    <button onClick={() => setEditingHeader(false)} className="px-4 py-2 rounded-xl border border-border text-stone-mid text-sm hover:bg-muted">Отмена</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-5">
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 terra-gradient rounded-full flex items-center justify-center text-white font-bold text-3xl">{userInitials}</div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-muted transition-colors"><Icon name="Camera" size={14} className="text-stone-mid" /></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="font-display text-2xl font-light text-stone">{fullName}</h2>
                        <p className="text-stone-mid text-sm">{roleLabel}</p>
                      </div>
                      <button onClick={startEditHeader} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Icon name="Pencil" size={13} className="text-stone-light" /></button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {user?.city && <span className="flex items-center gap-1 text-xs text-stone-mid"><Icon name="MapPin" size={11} /> {user.city}</span>}
                      {expYears > 0 && <span className="text-xs px-2.5 py-0.5 rounded-full bg-terra-pale text-terra border border-terra/20 font-medium">Опыт {yearsLabel(expYears)}</span>}
                      <span className="flex items-center gap-1.5 text-xs text-green-600"><span className="w-2 h-2 bg-green-500 rounded-full" />Онлайн</span>
                    </div>
                    {/* Accepting orders toggle */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
                      <Toggle checked={acceptingOrders} onChange={setAcceptingOrders} />
                      {acceptingOrders ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">Беру заказы</span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 font-medium">Не беру заказы</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-stone text-sm">О себе</h3>
                {!editingAbout && <button onClick={startEditAbout} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Icon name="Pencil" size={13} className="text-stone-light" /></button>}
              </div>
              {editingAbout ? (
                <div className="space-y-3">
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Расскажите о себе..." />
                  <div className="flex gap-2">
                    <button onClick={saveAbout} disabled={updateMutation.isPending} className="terra-gradient text-white px-4 py-2 rounded-xl text-sm hover:opacity-90 disabled:opacity-50">{updateMutation.isPending ? "..." : "Сохранить"}</button>
                    <button onClick={() => setEditingAbout(false)} className="px-4 py-2 rounded-xl border border-border text-stone-mid text-sm hover:bg-muted">Отмена</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-stone-mid leading-relaxed">{user?.bio || <span className="text-stone-light italic">Нажмите карандаш, чтобы добавить описание</span>}</p>
              )}
            </div>

            {/* Styles */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone text-sm">Стили и специализация</h3>
                {!editingStyles && <button onClick={startEditStyles} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Icon name="Pencil" size={13} className="text-stone-light" /></button>}
              </div>
              {editingStyles ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-stone-light mb-2">Стили работы</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_STYLES.map(s => <button key={s} onClick={() => toggleTag(s, editStyles, setEditStyles)} className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${editStyles.includes(s) ? "terra-gradient text-white border-transparent" : "border-border text-stone-mid hover:border-terra/40"}`}>{s}</button>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-stone-light mb-2">Типы объектов</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_OBJECTS.map(o => <button key={o} onClick={() => toggleTag(o, editObjects, setEditObjects)} className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${editObjects.includes(o) ? "bg-blue-500 text-white border-transparent" : "border-border text-stone-mid hover:border-blue-300"}`}>{o}</button>)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveStyles} disabled={updateMutation.isPending} className="terra-gradient text-white px-4 py-2 rounded-xl text-sm hover:opacity-90 disabled:opacity-50">{updateMutation.isPending ? "..." : "Сохранить"}</button>
                    <button onClick={() => setEditingStyles(false)} className="px-4 py-2 rounded-xl border border-border text-stone-mid text-sm hover:bg-muted">Отмена</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-xs text-stone-light mb-2">Стили работы</p>
                    <div className="flex flex-wrap gap-1.5">{styles.length > 0 ? styles.map(s => <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-terra-pale text-terra border border-terra/20 font-medium">{s}</span>) : <span className="text-xs text-stone-light italic">Не указаны</span>}</div>
                  </div>
                  <div>
                    <p className="text-xs text-stone-light mb-2">Типы объектов</p>
                    <div className="flex flex-wrap gap-1.5">{objects.length > 0 ? objects.map(o => <span key={o} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">{o}</span>) : <span className="text-xs text-stone-light italic">Не указаны</span>}</div>
                  </div>
                </>
              )}
            </div>

            {/* Contacts */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone text-sm">Контакты</h3>
                {!editingContacts && <button onClick={startEditContacts} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Icon name="Pencil" size={13} className="text-stone-light" /></button>}
              </div>
              {editingContacts ? (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className="text-xs text-stone-light mb-1 block">Телефон</label><input value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} placeholder="+7..." className={inputCls} /></div>
                    <div><label className="text-xs text-stone-light mb-1 block">Город</label><input value={contactForm.city} onChange={e => setContactForm(f => ({ ...f, city: e.target.value }))} placeholder="Москва" className={inputCls} /></div>
                    <div><label className="text-xs text-stone-light mb-1 block">Telegram</label><input value={contactForm.telegram} onChange={e => setContactForm(f => ({ ...f, telegram: e.target.value }))} placeholder="@username" className={inputCls} /></div>
                    <div><label className="text-xs text-stone-light mb-1 block">Сайт / Behance</label><input value={contactForm.website} onChange={e => setContactForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." className={inputCls} /></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveContacts} disabled={updateMutation.isPending} className="terra-gradient text-white px-4 py-2 rounded-xl text-sm hover:opacity-90 disabled:opacity-50">{updateMutation.isPending ? "..." : "Сохранить"}</button>
                    <button onClick={() => setEditingContacts(false)} className="px-4 py-2 rounded-xl border border-border text-stone-mid text-sm hover:bg-muted">Отмена</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm"><div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center"><Icon name="Phone" size={14} className="text-stone-light" /></div><span className={user?.phone ? "text-stone" : "text-stone-light"}>{user?.phone || "Не указан"}</span></div>
                  <div className="flex items-center gap-3 text-sm"><div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center"><Icon name="Mail" size={14} className="text-stone-light" /></div><span className="text-stone">{user?.email || "Не указан"}</span></div>
                  <div className="flex items-center gap-3 text-sm"><div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center"><Icon name="Send" size={14} className="text-stone-light" /></div><span className={user?.telegram ? "text-stone" : "text-stone-light"}>{user?.telegram || "Telegram — не указан"}</span></div>
                  <div className="flex items-center gap-3 text-sm"><div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center"><Icon name="Globe" size={14} className="text-stone-light" /></div><span className={user?.website ? "text-stone" : "text-stone-light"}>{user?.website || "Сайт — не указан"}</span></div>
                </div>
              )}
              {/* Privacy toggle */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <Toggle checked={contactsPublic} onChange={setContactsPublic} />
                  <span className="text-xs text-stone font-medium">Показывать контакты в Гильдии</span>
                </div>
                <p className="text-xs text-stone-light mt-1.5 ml-14">
                  {contactsPublic
                    ? "Контакты видны участникам Гильдии"
                    : "Контакты скрыты от участников Гильдии. Связаться с вами можно только через личные сообщения"}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "проектов", value: String(user?.projects_count || 0), icon: "FolderOpen", color: "text-blue-500" },
                { label: "завершено", value: "0", icon: "CheckCircle", color: "text-green-500" },
                { label: "в Гильдии", value: guildAge(user?.created_at), icon: "Shield", color: "text-terra" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-border p-4 text-center">
                  <Icon name={s.icon} fallback="Circle" size={18} className={`${s.color} mx-auto mb-2`} />
                  <p className="font-display text-xl font-semibold text-stone">{s.value}</p>
                  <p className="text-xs text-stone-light">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Personal ID */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="bg-muted rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-light mb-1">Ваш личный ID</p>
                    <p className="font-mono text-xl font-bold text-stone tracking-wider">{user?.personal_id || "—"}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(user?.personal_id || ""); }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border text-stone-mid hover:bg-white transition-colors"><Icon name="Copy" size={13} /> Копировать</button>
                </div>
                <p className="text-xs text-stone-light mt-2">Поделитесь ID, чтобы вас могли найти и пригласить в проект или команду</p>
              </div>
            </div>

            {/* Preview */}
            <button onClick={() => setShowPreview(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-border text-sm text-stone-mid hover:border-terra/40 hover:text-stone transition-colors"><Icon name="Eye" size={16} /> Как меня видят в Гильдии</button>
          </div>

          {/* Right column — Portfolio */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-border p-5 md:sticky md:top-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone text-sm">Портфолио <span className="text-stone-light font-normal">({MOCK_PORTFOLIO.length} работ)</span></h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {MOCK_PORTFOLIO.map(item => (
                  <div key={item.id}>
                    <div className="aspect-[4/3] bg-gradient-to-br from-terra-pale via-terra/10 to-stone/5 rounded-xl flex items-center justify-center mb-1.5">
                      <Icon name="Image" size={24} className="text-terra/25" />
                    </div>
                    <p className="text-xs text-stone-mid text-center truncate">{item.title}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-border text-xs text-stone-mid hover:border-terra/40 hover:text-terra transition-colors">
                <Icon name="Plus" size={14} /> Добавить работу
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guild Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg text-stone">Карточка в Гильдии</h3>
              <button onClick={() => setShowPreview(false)} className="p-1.5 hover:bg-muted rounded-lg"><Icon name="X" size={16} className="text-stone-mid" /></button>
            </div>
            <div className="text-center mb-4">
              <div className="w-16 h-16 terra-gradient rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">{userInitials}</div>
              <h4 className="font-semibold text-stone">{fullName}</h4>
              <p className="text-xs text-stone-mid">{roleLabel}</p>
              {acceptingOrders && <span className="inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">Беру заказы</span>}
              <p className="text-xs text-stone-light mt-1.5">{user?.projects_count || 0} проектов &bull; {user?.city || "—"} &bull; {expYears > 0 ? `${yearsLabel(expYears)} опыта` : "—"}</p>
            </div>
            <div className="flex gap-2 mb-4 justify-center">
              {MOCK_PORTFOLIO.slice(0, 2).map(item => (
                <div key={item.id} className="w-28 h-20 bg-gradient-to-br from-terra-pale via-terra/10 to-stone/5 rounded-xl flex items-center justify-center"><Icon name="Image" size={18} className="text-terra/25" /></div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mb-4">
              {styles.slice(0, 3).map(s => <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-terra-pale text-terra border border-terra/20 font-medium">{s}</span>)}
              {styles.length === 0 && <span className="text-xs text-stone-light">Стили не указаны</span>}
            </div>
            {/* Contacts in preview */}
            {contactsPublic ? (
              <div className="mb-4 space-y-1.5 text-center">
                {user?.phone && <p className="text-xs text-stone-mid"><Icon name="Phone" size={10} className="inline mr-1 text-stone-light" />{user.phone}</p>}
                {user?.email && <p className="text-xs text-stone-mid"><Icon name="Mail" size={10} className="inline mr-1 text-stone-light" />{user.email}</p>}
              </div>
            ) : (
              <div className="mb-4 text-center">
                <p className="text-xs text-stone-light mb-2">Контакты скрыты</p>
              </div>
            )}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 terra-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90"><Icon name="MessageCircle" size={14} className="text-white" /> Написать</button>
              <button className="flex-1 flex items-center justify-center gap-1.5 border border-border text-stone py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"><Icon name="UserPlus" size={14} /> В команду</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
