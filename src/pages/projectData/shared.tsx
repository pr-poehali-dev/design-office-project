import Icon from "@/components/ui/icon";

export interface EstimateItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total: number;
}

export interface Payment {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  due_date?: string;
  paid_date?: string;
  category?: string;
}

export interface Document {
  id: string;
  type: "uploaded" | "generated";
  title: string;
  generated_url?: string;
  signed_url?: string;
  status?: string;
  created_at: string;
}

export function EmptyState({ icon, title, subtitle, action, onAction }: {
  icon: string; title: string; subtitle: string; action?: string; onAction?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-12 text-center">
      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon name={icon} fallback="Circle" size={28} className="text-stone-light" />
      </div>
      <h3 className="font-display text-xl text-stone mb-2">{title}</h3>
      <p className="text-stone-mid text-sm mb-6">{subtitle}</p>
      {action && (
        <button
          onClick={onAction}
          className="terra-gradient text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm"
        >
          {action}
        </button>
      )}
    </div>
  );
}
