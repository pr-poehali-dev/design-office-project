import { useState, useEffect, useCallback } from "react";
import { getClients, createClient } from "@/lib/api";
import { Client } from "./ClientTypes";
import ClientList from "./ClientList";
import ClientDetail from "./ClientDetail";
import { toast } from "sonner";

export default function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const handleQuickAdd = async (name: string) => {
    try {
      const data = await createClient({ name });
      toast.success("Клиент добавлен");
      setSelectedId(data.client.id);
      fetchClients();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка создания");
    }
  };

  if (selectedId) {
    return (
      <ClientDetail
        clientId={selectedId}
        onBack={() => { setSelectedId(null); fetchClients(); }}
      />
    );
  }

  return (
    <ClientList
      clients={clients}
      loading={loading}
      onSelect={c => setSelectedId(c.id)}
      onAdd={handleQuickAdd}
      search={search}
      onSearch={setSearch}
    />
  );
}
