import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import { getClient, updateClient, archiveClient, getClientNotes, createClientNote } from "@/lib/api";
import { Client, ClientNote, CLIENT_STATUSES, CLIENT_SOURCES, ENTITY_TYPES } from "./ClientTypes";

interface ClientDetailProps {
  clientId: string;
  onBack: () => void;
}

type TabId = "data" | "notes" | "projects" | "documents" | "chats";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "data", label: "Данные", icon: "FileText" },
  { id: "notes", label: "Заметки", icon: "StickyNote" },
  { id: "projects", label: "Проекты", icon: "FolderOpen" },
  { id: "documents", label: "Документы", icon: "Files" },
  { id: "chats", label: "Чаты", icon: "MessageSquare" },
];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "?";
}

export default function ClientDetail({ clientId, onBack }: ClientDetailProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("data");

  const fetchClient = useCallback(async () => {
    try {
      const data = await getClient(clientId);
      setClient(data.client);
    } catch {
      toast.error("Не удалось загрузить клиента");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-terra/30 border-t-terra rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) return null;

  const statusInfo = CLIENT_STATUSES.find(s => s.value === client.status);

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-stone-mid hover:text-stone mb-4 transition-colors">
        <Icon name="ArrowLeft" size={16} /> Назад к списку
      </button>

      <div className="bg-white rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-stone-900 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {getInitials(client.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl text-stone truncate">{client.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {statusInfo && (
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              )}
              {client.contact_person && (
                <span className="text-sm text-stone-mid">{client.contact_person}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-2xl border border-border p-1.5 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all ${
              tab === t.id
                ? "bg-terra-pale text-terra font-medium shadow-sm"
                : "text-stone-mid hover:bg-muted hover:text-stone"
            }`}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "data" && <DataTab client={client} onSave={fetchClient} />}
      {tab === "notes" && <NotesTab clientId={clientId} />}
      {tab === "projects" && <ProjectsTab />}
      {tab === "documents" && <DocumentsTab />}
      {tab === "chats" && <ChatsTab />}
    </div>
  );
}

function DataTab({ client, onSave }: { client: Client; onSave: () => void }) {
  const [form, setForm] = useState({ ...client });
  const [saving, setSaving] = useState(false);

  const set = (field: string, value: string | null) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra";

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateClient(client.id, {
        name: form.name,
        contact_person: form.contact_person || null,
        phone: form.phone || "",
        email: form.email || null,
        status: form.status,
        entity_type: form.entity_type || null,
        org_name: form.org_name || null,
        inn: form.inn || null,
        ogrn: form.ogrn || null,
        kpp: form.kpp || null,
        legal_address: form.legal_address || null,
        bank_name: form.bank_name || null,
        bik: form.bik || null,
        account_number: form.account_number || null,
        corr_account: form.corr_account || null,
        address: form.address || null,
        source: form.source || null,
      });
      toast.success("Данные сохранены");
      onSave();
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    try {
      const data = await archiveClient(client.id);
      toast.success(data.client.is_archived ? "Клиент архивирован" : "Клиент восстановлен");
      onSave();
    } catch {
      toast.error("Ошибка");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-display text-lg text-stone mb-4">Контакты</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-stone-light mb-1 block">Имя / Название *</label>
            <input value={form.name || ""} onChange={e => set("name", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">Контактное лицо</label>
            <input value={form.contact_person || ""} onChange={e => set("contact_person", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">Телефон</label>
            <input value={form.phone || ""} onChange={e => set("phone", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">E-mail</label>
            <input value={form.email || ""} onChange={e => set("email", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">Статус</label>
            <select value={form.status || "new"} onChange={e => set("status", e.target.value)} className={inputCls}>
              {CLIENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">Источник</label>
            <select value={form.source || ""} onChange={e => set("source", e.target.value)} className={inputCls}>
              <option value="">Не указан</option>
              {CLIENT_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-stone-light mb-1 block">Адрес</label>
            <input value={form.address || ""} onChange={e => set("address", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-display text-lg text-stone mb-4">Юридические данные</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-stone-light mb-1 block">Тип</label>
            <select value={form.entity_type || "individual"} onChange={e => set("entity_type", e.target.value)} className={inputCls}>
              {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">Название организации</label>
            <input value={form.org_name || ""} onChange={e => set("org_name", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">ИНН</label>
            <input value={form.inn || ""} onChange={e => set("inn", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">ОГРН</label>
            <input value={form.ogrn || ""} onChange={e => set("ogrn", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">КПП</label>
            <input value={form.kpp || ""} onChange={e => set("kpp", e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-stone-light mb-1 block">Юридический адрес</label>
            <input value={form.legal_address || ""} onChange={e => set("legal_address", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-display text-lg text-stone mb-4">Банковские реквизиты</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-stone-light mb-1 block">Банк</label>
            <input value={form.bank_name || ""} onChange={e => set("bank_name", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">БИК</label>
            <input value={form.bik || ""} onChange={e => set("bik", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">Расчётный счёт</label>
            <input value={form.account_number || ""} onChange={e => set("account_number", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-stone-light mb-1 block">Корр. счёт</label>
            <input value={form.corr_account || ""} onChange={e => set("corr_account", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="terra-gradient text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
        <button onClick={handleArchive} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${client.is_archived ? "border border-green-200 text-green-600 hover:bg-green-50" : "border border-red-200 text-red-500 hover:bg-red-50"}`}>
          {client.is_archived ? "Восстановить" : "В архив"}
        </button>
      </div>
    </div>
  );
}

function NotesTab({ clientId }: { clientId: string }) {
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const data = await getClientNotes(clientId);
      setNotes(data.notes || []);
    } catch {
      toast.error("Не удалось загрузить заметки");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await createClientNote(clientId, text.trim());
      setText("");
      fetchNotes();
    } catch {
      toast.error("Ошибка");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-2xl border border-border p-5 mb-4">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Добавить заметку..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 resize-none mb-3"
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim() || sending}
          className="terra-gradient text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {sending ? "Сохранение..." : "Добавить заметку"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-terra/30 border-t-terra rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center">
          <Icon name="StickyNote" size={28} className="text-stone-light mx-auto mb-2" />
          <p className="text-sm text-stone-mid">Заметок пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className="bg-white rounded-2xl border border-border p-4">
              <p className="text-sm text-stone whitespace-pre-wrap">{n.content}</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-stone-light">
                <span>{n.first_name} {n.last_name}</span>
                <span>·</span>
                <span>{new Date(n.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectsTab() {
  return (
    <div className="bg-white rounded-2xl border border-border p-8 text-center">
      <Icon name="FolderOpen" size={28} className="text-stone-light mx-auto mb-2" />
      <p className="text-sm text-stone-mid mb-1">Проекты клиента</p>
      <p className="text-xs text-stone-light">Привязка проектов к клиентам — в следующем обновлении</p>
    </div>
  );
}

function DocumentsTab() {
  return (
    <div className="bg-white rounded-2xl border border-border p-8 text-center">
      <Icon name="Files" size={28} className="text-stone-light mx-auto mb-2" />
      <p className="text-sm text-stone-mid mb-1">Документы</p>
      <p className="text-xs text-stone-light">Документы из проектов клиента — в следующем обновлении</p>
    </div>
  );
}

function ChatsTab() {
  return (
    <div className="bg-white rounded-2xl border border-border p-8 text-center">
      <Icon name="MessageSquare" size={28} className="text-stone-light mx-auto mb-2" />
      <p className="text-sm text-stone-mid mb-1">Чаты</p>
      <p className="text-xs text-stone-light">Интеграция с Авито — в разработке</p>
    </div>
  );
}
