export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  note: string | null;
  source: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  project_count?: number;
  contact_person: string | null;
  status: string;
  entity_type: string | null;
  org_name: string | null;
  inn: string | null;
  ogrn: string | null;
  kpp: string | null;
  legal_address: string | null;
  bank_name: string | null;
  bik: string | null;
  account_number: string | null;
  corr_account: string | null;
}

export interface ClientNote {
  id: string;
  client_id: string;
  author_id: string;
  content: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

export const CLIENT_STATUSES = [
  { value: "new", label: "Новый", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { value: "active", label: "Активный", color: "bg-green-50 text-green-600 border-green-200" },
  { value: "vip", label: "VIP", color: "bg-amber-50 text-amber-600 border-amber-200" },
  { value: "inactive", label: "Неактивный", color: "bg-stone-100 text-stone-500 border-stone-200" },
];

export const CLIENT_SOURCES = [
  { value: "referral", label: "Рекомендация" },
  { value: "website", label: "Сайт" },
  { value: "social", label: "Соцсети" },
  { value: "advertising", label: "Реклама" },
  { value: "repeat", label: "Повторный" },
  { value: "other", label: "Другое" },
];

export const ENTITY_TYPES = [
  { value: "individual", label: "Физлицо" },
  { value: "self_employed", label: "Самозанятый" },
  { value: "ip", label: "ИП" },
  { value: "ooo", label: "ООО" },
];
