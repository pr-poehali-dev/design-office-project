import { useState, useEffect, useCallback } from "react";
import { getClients, createClient, updateClient, archiveClient } from "@/lib/api";
import { Client } from "./ClientTypes";
import ClientList from "./ClientList";
import ClientForm from "./ClientForm";
import { toast } from "sonner";

export default function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      const data = await getClients(params);
      setClients(data.clients || []);
    } catch {
      toast.error("Не удалось загрузить клиентов");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCreate = async (formData: Record<string, unknown>) => {
    setSaving(true);
    try {
      await createClient(formData);
      toast.success("Клиент добавлен");
      setShowForm(false);
      fetchClients();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка создания");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (formData: Record<string, unknown>) => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateClient(editing.id, formData);
      toast.success("Клиент обновлён");
      setEditing(null);
      fetchClients();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!editing) return;
    try {
      const data = await archiveClient(editing.id);
      toast.success(data.client.is_archived ? "Клиент архивирован" : "Клиент восстановлен");
      setEditing(null);
      fetchClients();
    } catch {
      toast.error("Ошибка");
    }
  };

  return (
    <div>
      <ClientList
        clients={clients}
        loading={loading}
        onSelect={c => setEditing(c)}
        onAdd={() => setShowForm(true)}
        search={search}
        onSearch={setSearch}
      />

      {showForm && (
        <ClientForm
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}

      {editing && (
        <ClientForm
          client={editing}
          onSave={handleUpdate}
          onCancel={() => setEditing(null)}
          onArchive={handleArchive}
          saving={saving}
        />
      )}
    </div>
  );
}
