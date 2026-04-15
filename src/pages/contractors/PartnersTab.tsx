import { useState, useEffect, useCallback } from "react";
import { getPartners, createPartner, updatePartner, archivePartner, getPartner } from "@/lib/api";
import { Partner } from "../partners/PartnerTypes";
import PartnerList from "../partners/PartnerList";
import PartnerCard from "../partners/PartnerCard";
import PartnerForm from "../partners/PartnerForm";
import { toast } from "sonner";

type View = "list" | "detail" | "create" | "edit";

export default function PartnersTab() {
  const [view, setView] = useState<View>("list");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Partner | null>(null);
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType) params.type = filterType;
      if (search.trim()) params.search = search.trim();
      const data = await getPartners(params);
      setPartners(data.partners || []);
    } catch {
      toast.error("Не удалось загрузить партнёров");
    } finally {
      setLoading(false);
    }
  }, [filterType, search]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleSelectPartner = async (p: Partner) => {
    try {
      const data = await getPartner(p.id);
      setSelected(data.partner);
      setView("detail");
    } catch {
      toast.error("Не удалось загрузить партнёра");
    }
  };

  const handleCreate = async (formData: Record<string, unknown>) => {
    setSaving(true);
    try {
      await createPartner(formData);
      toast.success("Партнёр добавлен");
      setView("list");
      fetchPartners();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка создания");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (formData: Record<string, unknown>) => {
    if (!selected) return;
    setSaving(true);
    try {
      const data = await updatePartner(selected.id, formData);
      toast.success("Партнёр обновлён");
      setSelected(data.partner);
      setView("detail");
      fetchPartners();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!selected) return;
    try {
      const data = await archivePartner(selected.id);
      setSelected(data.partner);
      toast.success(data.partner.is_archived ? "Партнёр архивирован" : "Партнёр восстановлен");
      fetchPartners();
    } catch {
      toast.error("Ошибка");
    }
  };

  return (
    <div>
      {view === "list" && (
        <PartnerList
          partners={partners}
          loading={loading}
          onSelect={handleSelectPartner}
          onAdd={() => setView("create")}
          filterType={filterType}
          onFilterType={setFilterType}
          search={search}
          onSearch={setSearch}
        />
      )}

      {view === "detail" && selected && (
        <PartnerCard
          partner={selected}
          onEdit={() => setView("edit")}
          onArchive={handleArchive}
          onBack={() => { setSelected(null); setView("list"); }}
        />
      )}

      {view === "create" && (
        <PartnerForm
          onSave={handleCreate}
          onCancel={() => setView("list")}
          saving={saving}
        />
      )}

      {view === "edit" && selected && (
        <PartnerForm
          partner={selected}
          onSave={handleUpdate}
          onCancel={() => setView("detail")}
          saving={saving}
        />
      )}
    </div>
  );
}
