import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useCreateProject } from "@/lib/queries";

interface CreateProjectModalProps {
  onClose: () => void;
}

export default function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const createProjectMutation = useCreateProject();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newRooms, setNewRooms] = useState("");
  const [newStyle, setNewStyle] = useState("");
  const [newBudget, setNewBudget] = useState("");

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createProjectMutation.mutateAsync({
        title: newTitle,
        description: newDescription || undefined,
        address: newAddress || undefined,
        area: newArea ? parseFloat(newArea) : undefined,
        rooms: newRooms ? parseInt(newRooms) : undefined,
        style: newStyle || undefined,
        budget: newBudget ? parseFloat(newBudget) : undefined,
      });
      onClose();
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-light text-stone">Новый проект</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <Icon name="X" size={18} className="text-stone-mid" />
          </button>
        </div>

        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone mb-1.5">Название проекта *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Квартира на Тверской"
              required
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone mb-1.5">Описание</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Краткое описание проекта..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone mb-1.5">Адрес</label>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="ул. Тверская, д. 15, кв. 42"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone mb-1.5">Площадь (м²)</label>
              <input
                type="number"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                placeholder="85"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone mb-1.5">Комнат</label>
              <input
                type="number"
                value={newRooms}
                onChange={(e) => setNewRooms(e.target.value)}
                placeholder="3"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone mb-1.5">Стиль</label>
              <input
                type="text"
                value={newStyle}
                onChange={(e) => setNewStyle(e.target.value)}
                placeholder="Современный"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone mb-1.5">Бюджет</label>
              <input
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                placeholder="1500000"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-stone-mid text-sm font-medium hover:bg-muted transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 terra-gradient text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60"
            >
              {creating ? "Создаём..." : "Создать проект"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
