export type PartnerType = "shop" | "supplier" | "finisher" | "other";

export interface Partner {
  id: string;
  name: string;
  partner_type: PartnerType;
  discount: number;
  services: string | null;
  phone: string;
  email: string | null;
  website: string | null;
  address: string | null;
  contact_person: string | null;
  note: string | null;
  logo_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export const PARTNER_TYPE_CONFIG: Record<PartnerType, { label: string; icon: string }> = {
  shop: { label: "Магазин", icon: "Store" },
  supplier: { label: "Поставщик", icon: "Truck" },
  finisher: { label: "Отделочник", icon: "Wrench" },
  other: { label: "Другое", icon: "CircleHelp" },
};

export const PARTNER_TYPES: { value: PartnerType; label: string }[] = [
  { value: "shop", label: "Магазин" },
  { value: "supplier", label: "Поставщик" },
  { value: "finisher", label: "Отделочник" },
  { value: "other", label: "Другое" },
];
