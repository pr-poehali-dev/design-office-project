export interface ProposalItem {
  id?: string;
  order_number: number;
  title: string;
  description: string;
  price: number;
}

export interface Proposal {
  id: string;
  status: string;
  background_url: string | null;
  background_preset: string | null;
  template_name: string | null;
  discount: number;
  discount_type: string;
  items: ProposalItem[];
  created_at?: string;
}

export interface Template {
  id: string;
  name: string;
  items: ProposalItem[];
}

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Черновик", color: "bg-gray-50 text-gray-600 border-gray-200" },
  sent: { label: "Отправлено", color: "bg-blue-50 text-blue-700 border-blue-200" },
  accepted: { label: "Принято", color: "bg-green-50 text-green-700 border-green-200" },
  declined: { label: "Отклонено", color: "bg-red-50 text-red-600 border-red-200" },
};

export const PRESET_BACKGROUNDS: { id: string; label: string; url: string }[] = [
  { id: "marble", label: "Мрамор", url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=60" },
  { id: "concrete", label: "Бетон", url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&q=60" },
  { id: "wood", label: "Дерево", url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=60" },
  { id: "minimal", label: "Минимализм", url: "" },
];

export function formatDate(d?: string) {
  if (!d) return new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}
