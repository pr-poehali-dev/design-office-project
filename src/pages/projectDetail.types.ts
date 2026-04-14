export type KanbanCol = "todo" | "doing" | "done";
export interface KanbanTask { id: number; text: string; col: KanbanCol; }
export interface ChatMsg { id: number; from: "designer" | "client"; text: string; time: string; }
export interface TimelineStage {
  id: number; title: string;
  status: "done" | "active" | "waiting";
  dateStart: string; dateEnd: string;
  desc: string; files: number; comments: { author: string; text: string; time: string; }[];
}

export const INIT_TASKS: KanbanTask[] = [
  { id: 1, text: "Согласовать планировку", col: "todo" },
  { id: 2, text: "Подобрать светильники", col: "todo" },
  { id: 3, text: "Замерить кухню", col: "doing" },
  { id: 4, text: "Отправить мудборд", col: "doing" },
  { id: 5, text: "Заказать плитку", col: "done" },
  { id: 6, text: "Утвердить визуализацию", col: "done" },
];

export const CHAT_MSGS: Record<string, ChatMsg[]> = {
  client: [
    { id: 1, from: "designer", text: "Анна, загрузила новые визуализации гостиной. Посмотрите!", time: "14:32" },
    { id: 2, from: "client", text: "Очень нравится! Хотела бы обсудить цвет акцентной стены.", time: "15:10" },
    { id: 3, from: "designer", text: "Конечно! Пришлю варианты завтра.", time: "15:15" },
    { id: 4, from: "client", text: "Отлично, жду!", time: "15:16" },
  ],
  workers: [
    { id: 1, from: "designer", text: "Укладка паркета начинается в понедельник. Уточните доставку.", time: "10:00" },
    { id: 2, from: "client", text: "Понял, доставка на вторник.", time: "10:45" },
    { id: 3, from: "designer", text: "Супер, спасибо!", time: "10:50" },
  ],
};

export const TIMELINE: TimelineStage[] = [
  {
    id: 1, title: "Обмеры и техзадание", status: "done",
    dateStart: "10 янв 2025", dateEnd: "15 янв 2025",
    desc: "Выезд на объект, замеры помещений, согласование технического задания с клиентом.",
    files: 2,
    comments: [
      { author: "Елена", text: "Все замеры готовы, загружаю план.", time: "16 янв" },
      { author: "Анна", text: "Получила, всё верно!", time: "17 янв" },
      { author: "Елена", text: "Отлично, двигаемся дальше.", time: "17 янв" },
    ],
  },
  {
    id: 2, title: "Концепция и мудборд", status: "done",
    dateStart: "16 янв 2025", dateEnd: "25 янв 2025",
    desc: "Разработка нескольких концепций, подбор референсов, составление мудборда.",
    files: 4,
    comments: [
      { author: "Анна", text: "Концепция А очень нравится!", time: "26 янв" },
      { author: "Елена", text: "Рада, что понравилась! Берём в работу.", time: "26 янв" },
    ],
  },
  {
    id: 3, title: "Планировочное решение", status: "active",
    dateStart: "26 янв 2025", dateEnd: "10 фев 2025",
    desc: "Разработка планировочных решений, расстановка мебели, согласование с клиентом.",
    files: 1,
    comments: [
      { author: "Анна", text: "Можно переместить диван к окну?", time: "28 янв" },
    ],
  },
  {
    id: 4, title: "Визуализация", status: "waiting",
    dateStart: "11 фев 2025", dateEnd: "5 мар 2025",
    desc: "3D-визуализация всех помещений, финальное согласование с клиентом.",
    files: 0, comments: [],
  },
  {
    id: 5, title: "Рабочая документация", status: "waiting",
    dateStart: "6 мар 2025", dateEnd: "25 мар 2025",
    desc: "Разработка рабочей документации, чертежей для строителей.",
    files: 0, comments: [],
  },
  {
    id: 6, title: "Авторский надзор", status: "waiting",
    dateStart: "Апр 2025", dateEnd: "Июн 2025",
    desc: "Контроль за реализацией проекта на объекте.",
    files: 0, comments: [],
  },
];

export const ESTIMATE_CATEGORIES = [
  {
    name: "Мебель", items: [
      { id: 1, name: "Диван угловой", qty: 1, unit: "шт", price: 180000 },
      { id: 2, name: "Обеденный стол", qty: 1, unit: "шт", price: 95000 },
      { id: 3, name: "Стулья", qty: 6, unit: "шт", price: 12000 },
    ],
  },
  {
    name: "Материалы", items: [
      { id: 4, name: "Паркет дуб", qty: 92, unit: "м²", price: 4500 },
      { id: 5, name: "Краска стены", qty: 35, unit: "л", price: 3200 },
      { id: 6, name: "Плитка ванная", qty: 28, unit: "м²", price: 6800 },
    ],
  },
  {
    name: "Работы", items: [
      { id: 7, name: "Укладка паркета", qty: 92, unit: "м²", price: 1200 },
      { id: 8, name: "Покраска стен", qty: 180, unit: "м²", price: 450 },
    ],
  },
  {
    name: "Декор", items: [
      { id: 9, name: "Шторы", qty: 4, unit: "шт", price: 25000 },
      { id: 10, name: "Светильники", qty: 8, unit: "шт", price: 15000 },
    ],
  },
];

export const PAYMENTS = [
  { stage: "Предоплата 30%", amount: 750000, status: "paid", date: "15.01.2025" },
  { stage: "После концепции", amount: 500000, status: "paid", date: "10.02.2025" },
  { stage: "После визуализации", amount: 750000, status: "pending", date: "15.03.2025" },
  { stage: "Финальная оплата", amount: 500000, status: "pending", date: "30.04.2025" },
];

export const EXPENSES = [
  { date: "12.01.25", desc: "Выезд на объект", category: "Прочее", amount: 5000, paid: true },
  { date: "20.01.25", desc: "Материалы для мудборда", category: "Материалы", amount: 3500, paid: true },
  { date: "05.02.25", desc: "Печать чертежей", category: "Прочее", amount: 2800, paid: true },
  { date: "10.02.25", desc: "Доставка образцов", category: "Доставка", amount: 1500, paid: false },
  { date: "15.02.25", desc: "Плитка — образцы", category: "Материалы", amount: 12000, paid: false },
];

export const WORKERS_PAY = [
  { name: "Алексей Марков", work: "3D-визуализация", amount: 120000, paid: true },
  { name: "Ирина Шевцова", work: "Рабочая документация", amount: 80000, paid: false },
  { name: "Дмитрий Орлов", work: "Выезд и замеры", amount: 15000, paid: true },
];

export const STYLE_OPTIONS = ["Modern", "Loft", "Scandinavian", "Classic", "Minimalism", "Art Deco", "Japandi", "Eclectic"];

export const DOCS_GENERATED = [
  { name: "Договор на дизайн-проект", ready: true },
  { name: "Смета", ready: true },
  { name: "График работ", ready: true },
  { name: "Акт выполненных работ (этап 1)", ready: true },
  { name: "Акт выполненных работ (этап 2)", ready: false },
];

export const DOCS_UPLOADED = [
  { name: "Договор (подписан клиентом)", date: "20.01.2025" },
  { name: "Акт этап 1 (подписан)", date: "15.02.2025" },
];

export const fmtMoney = (n: number) => n.toLocaleString("ru-RU") + " ₽";

export const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "/dashboard" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "/dashboard" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "Users", label: "Клиенты", id: "clients", path: "/dashboard" },
  { icon: "Handshake", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "MessageCircle", label: "Сообщения", id: "messages", path: "/dashboard", badge: 3 },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard" },
];

export const TABS = [
  { id: "overview", label: "Обзор", icon: "LayoutDashboard" },
  { id: "execution", label: "Выполнение", icon: "ListChecks" },
  { id: "brief", label: "Бриф", icon: "ClipboardList" },
  { id: "estimate", label: "Смета", icon: "Receipt" },
  { id: "finance", label: "Финансы", icon: "TrendingUp" },
  { id: "documents", label: "Документы", icon: "FolderOpen" },
];
