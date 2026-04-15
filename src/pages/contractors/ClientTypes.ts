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
}

export const CLIENT_SOURCES = [
  { value: "referral", label: "Рекомендация" },
  { value: "website", label: "Сайт" },
  { value: "social", label: "Соцсети" },
  { value: "advertising", label: "Реклама" },
  { value: "repeat", label: "Повторный" },
  { value: "other", label: "Другое" },
];
