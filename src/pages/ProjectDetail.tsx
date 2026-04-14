import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────────────────────
type KanbanCol = "todo" | "doing" | "done";
interface KanbanTask { id: number; text: string; col: KanbanCol; }
interface ChatMsg { id: number; from: "designer" | "client"; text: string; time: string; }
interface TimelineStage {
  id: number; title: string;
  status: "done" | "active" | "waiting";
  dateStart: string; dateEnd: string;
  desc: string; files: number; comments: { author: string; text: string; time: string; }[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INIT_TASKS: KanbanTask[] = [
  { id: 1, text: "Согласовать планировку", col: "todo" },
  { id: 2, text: "Подобрать светильники", col: "todo" },
  { id: 3, text: "Замерить кухню", col: "doing" },
  { id: 4, text: "Отправить мудборд", col: "doing" },
  { id: 5, text: "Заказать плитку", col: "done" },
  { id: 6, text: "Утвердить визуализацию", col: "done" },
];

const CHAT_MSGS: Record<string, ChatMsg[]> = {
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

const TIMELINE: TimelineStage[] = [
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

const ESTIMATE_CATEGORIES = [
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

const PAYMENTS = [
  { stage: "Предоплата 30%", amount: 750000, status: "paid", date: "15.01.2025" },
  { stage: "После концепции", amount: 500000, status: "paid", date: "10.02.2025" },
  { stage: "После визуализации", amount: 750000, status: "pending", date: "15.03.2025" },
  { stage: "Финальная оплата", amount: 500000, status: "pending", date: "30.04.2025" },
];

const EXPENSES = [
  { date: "12.01.25", desc: "Выезд на объект", category: "Прочее", amount: 5000, paid: true },
  { date: "20.01.25", desc: "Материалы для мудборда", category: "Материалы", amount: 3500, paid: true },
  { date: "05.02.25", desc: "Печать чертежей", category: "Прочее", amount: 2800, paid: true },
  { date: "10.02.25", desc: "Доставка образцов", category: "Доставка", amount: 1500, paid: false },
  { date: "15.02.25", desc: "Плитка — образцы", category: "Материалы", amount: 12000, paid: false },
];

const WORKERS_PAY = [
  { name: "Алексей Марков", work: "3D-визуализация", amount: 120000, paid: true },
  { name: "Ирина Шевцова", work: "Рабочая документация", amount: 80000, paid: false },
  { name: "Дмитрий Орлов", work: "Выезд и замеры", amount: 15000, paid: true },
];

const STYLE_OPTIONS = ["Modern", "Loft", "Scandinavian", "Classic", "Minimalism", "Art Deco", "Japandi", "Eclectic"];

const DOCS_GENERATED = [
  { name: "Договор на дизайн-проект", ready: true },
  { name: "Смета", ready: true },
  { name: "График работ", ready: true },
  { name: "Акт выполненных работ (этап 1)", ready: true },
  { name: "Акт выполненных работ (этап 2)", ready: false },
];

const DOCS_UPLOADED = [
  { name: "Договор (подписан клиентом)", date: "20.01.2025" },
  { name: "Акт этап 1 (подписан)", date: "15.02.2025" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtMoney = (n: number) => n.toLocaleString("ru-RU") + " ₽";

function StatusBadge({ s }: { s: TimelineStage["status"] }) {
  if (s === "done") return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">✅ Завершён</span>;
  if (s === "active") return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">🔄 В работе</span>;
  return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-stone/5 text-stone-mid border border-border font-medium">⏳ Ожидает</span>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OverviewTab() {
  const [tasks, setTasks] = useState<KanbanTask[]>(INIT_TASKS);
  const [chatTab, setChatTab] = useState<"client" | "workers">("client");
  const [msgInput, setMsgInput] = useState("");
  const dragId = useRef<number | null>(null);
  const dragOver = useRef<KanbanCol | null>(null);

  const onDragStart = (id: number) => { dragId.current = id; };
  const onDragOver = (col: KanbanCol, e: React.DragEvent) => { e.preventDefault(); dragOver.current = col; };
  const onDrop = () => {
    if (dragId.current === null || dragOver.current === null) return;
    setTasks(t => t.map(task => task.id === dragId.current ? { ...task, col: dragOver.current! } : task));
    dragId.current = null; dragOver.current = null;
  };

  const cols: { key: KanbanCol; label: string }[] = [
    { key: "todo", label: "К выполнению" },
    { key: "doing", label: "В работе" },
    { key: "done", label: "Готово" },
  ];

  return (
    <div className="space-y-6">
      {/* Project info */}
      <div className="bg-white rounded-2xl border border-border p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="font-display text-2xl font-light text-stone">Квартира на Тверской</h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">В работе</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm">
              {[
                ["Клиент", "Анна Петрова"],
                ["Адрес", "ул. Тверская, 18, кв. 54"],
                ["Площадь", "92 м²"],
                ["Комнат", "3"],
                ["Стиль", "Скандинавский минимализм"],
                ["Начало", "10 янв 2025"],
                ["Дедлайн", "30 июн 2025"],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-stone-light text-xs">{k}</span>
                  <div className="text-stone font-medium mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border border-border text-stone hover:border-terra/40 transition-all">
              <Icon name="Pencil" size={14} /> Редактировать
            </button>
            <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl terra-gradient text-white hover:opacity-90 transition-all">
              <Icon name="UserPlus" size={14} className="text-white" /> Пригласить
            </button>
          </div>
        </div>
      </div>

      {/* 3 widgets */}
      <div className="grid md:grid-cols-3 gap-5">

        {/* Finance widget */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="Wallet" size={13} className="text-white" />
            </div>
            <span className="font-semibold text-stone text-sm">Финансы</span>
          </div>
          <div className="space-y-2.5 mb-4">
            {[
              ["Стоимость", 2500000, "text-stone"],
              ["Оплачено", 1250000, "text-green-600"],
              ["Осталось", 1250000, "text-amber-600"],
            ].map(([label, val, cls]) => (
              <div key={label as string} className="flex justify-between items-center">
                <span className="text-xs text-stone-mid">{label as string}</span>
                <span className={`text-sm font-semibold ${cls}`}>{fmtMoney(val as number)}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full" style={{ width: "50%" }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-stone-light">Оплачено</span>
            <span className="text-xs font-medium text-stone">50%</span>
          </div>
        </div>

        {/* Kanban widget */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="Kanban" fallback="Layout" size={13} className="text-white" />
            </div>
            <span className="font-semibold text-stone text-sm">Задачи</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {cols.map(col => (
              <div
                key={col.key}
                onDragOver={(e) => onDragOver(col.key, e)}
                onDrop={onDrop}
                className="min-h-[80px]"
              >
                <div className="text-xs text-stone-light font-medium mb-1.5 text-center">{col.label}</div>
                <div className="space-y-1.5">
                  {tasks.filter(t => t.col === col.key).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => onDragStart(task.id)}
                      className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-stone cursor-grab active:cursor-grabbing hover:border-terra/30 transition-all select-none"
                    >
                      {task.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat widget */}
        <div className="bg-white rounded-2xl border border-border p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="MessageCircle" size={13} className="text-white" />
            </div>
            <span className="font-semibold text-stone text-sm">Чат</span>
          </div>
          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-3">
            {(["client", "workers"] as const).map(t => (
              <button
                key={t}
                onClick={() => setChatTab(t)}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${chatTab === t ? "bg-white text-stone shadow-sm" : "text-stone-mid"}`}
              >
                {t === "client" ? "С клиентом" : "С рабочими"}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto max-h-36 mb-3">
            {CHAT_MSGS[chatTab].map(msg => (
              <div key={msg.id} className={`flex ${msg.from === "designer" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-xl px-2.5 py-1.5 ${msg.from === "designer" ? "bg-muted" : "terra-gradient"}`}>
                  <p className={`text-xs ${msg.from === "designer" ? "text-stone" : "text-white"}`}>{msg.text}</p>
                  <p className={`text-xs mt-0.5 ${msg.from === "designer" ? "text-stone-light" : "text-white/60"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              placeholder="Сообщение..."
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-stone text-xs focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
            />
            <button onClick={() => setMsgInput("")} className="terra-gradient text-white p-2 rounded-xl hover:opacity-90 transition-opacity">
              <Icon name="Send" size={13} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutionTab() {
  const [openStage, setOpenStage] = useState<number | null>(3);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  return (
    <div className="space-y-0">
      {TIMELINE.map((stage, idx) => (
        <div key={stage.id} className="relative pl-10">
          {/* Timeline line */}
          {idx < TIMELINE.length - 1 && (
            <div className={`absolute left-4 top-9 bottom-0 w-0.5 ${stage.status === "done" ? "bg-green-300" : "bg-border"}`} />
          )}
          {/* Dot */}
          <div className={`absolute left-2 top-5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            stage.status === "done" ? "bg-green-400 border-green-400" :
            stage.status === "active" ? "bg-terra border-terra" :
            "bg-white border-stone-light"
          }`}>
            {stage.status === "done" && <Icon name="Check" size={9} className="text-white" />}
            {stage.status === "active" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
          </div>

          <div className="bg-white rounded-2xl border border-border mb-4 overflow-hidden">
            <button
              className="w-full text-left p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
              onClick={() => setOpenStage(openStage === stage.id ? null : stage.id)}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-stone text-sm">{stage.title}</span>
                <StatusBadge s={stage.status} />
                <span className="text-xs text-stone-light">{stage.dateStart} — {stage.dateEnd}</span>
              </div>
              <Icon name={openStage === stage.id ? "ChevronUp" : "ChevronDown"} size={16} className="text-stone-light flex-shrink-0" />
            </button>

            {openStage === stage.id && (
              <div className="px-5 pb-5 border-t border-border space-y-4 animate-fade-in">
                <p className="text-sm text-stone-mid pt-4">{stage.desc}</p>

                {/* Files */}
                <div>
                  <p className="text-xs font-semibold text-stone mb-2">Файлы ({stage.files})</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: stage.files }).map((_, i) => (
                      <div key={i} className="w-16 h-16 bg-terra-pale rounded-xl flex items-center justify-center border border-terra/20">
                        <Icon name="FileText" size={20} className="text-terra/50" />
                      </div>
                    ))}
                    <button className="w-16 h-16 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 hover:border-terra/40 transition-colors">
                      <Icon name="Plus" size={16} className="text-stone-light" />
                      <span className="text-xs text-stone-light">Файл</span>
                    </button>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <p className="text-xs font-semibold text-stone mb-2">Комментарии ({stage.comments.length})</p>
                  <div className="space-y-2 mb-3">
                    {stage.comments.map((c, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="w-6 h-6 terra-gradient rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {c.author[0]}
                        </div>
                        <div className="bg-muted rounded-xl px-3 py-2 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-stone">{c.author}</span>
                            <span className="text-xs text-stone-light">{c.time}</span>
                          </div>
                          <p className="text-xs text-stone-mid">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={commentInputs[stage.id] || ""}
                      onChange={e => setCommentInputs(p => ({ ...p, [stage.id]: e.target.value }))}
                      placeholder="Добавить комментарий..."
                      className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-stone text-xs focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
                    />
                    <button className="terra-gradient text-white px-3 py-2 rounded-xl text-xs hover:opacity-90 transition-opacity">
                      <Icon name="Send" size={13} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="pl-10">
        <button className="flex items-center gap-2 text-sm text-terra border-2 border-dashed border-terra/30 rounded-2xl px-5 py-3 w-full justify-center hover:bg-terra-pale transition-colors">
          <Icon name="Plus" size={16} />
          Добавить этап
        </button>
      </div>
    </div>
  );
}

function BriefTab() {
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["Scandinavian"]);
  const [budget, setBudget] = useState(2500000);

  const toggleStyle = (s: string) =>
    setSelectedStyles(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">✅ Бриф заполнен</span>
        </div>
        <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl terra-gradient text-white hover:opacity-90 transition-all">
          <Icon name="Send" size={14} className="text-white" /> Отправить клиенту
        </button>
      </div>

      {/* General info */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-stone text-sm mb-4">Общая информация</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Тип помещения", value: "Квартира" },
            { label: "Общая площадь", value: "92 м²" },
            { label: "Количество жильцов", value: "2 человека" },
            { label: "Дети", value: "Нет" },
            { label: "Животные", value: "Кошка" },
            { label: "Количество комнат", value: "3" },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="text-xs text-stone-light mb-1 block">{label}</label>
              <input
                defaultValue={value}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Styles */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-stone text-sm mb-4">Стилевые предпочтения</h3>
        <div className="flex flex-wrap gap-2">
          {STYLE_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => toggleStyle(s)}
              className={`px-3 py-1.5 rounded-xl text-sm border font-medium transition-all ${
                selectedStyles.includes(s)
                  ? "terra-gradient text-white border-transparent"
                  : "border-border text-stone-mid hover:border-terra/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label className="text-xs text-stone-light mb-1 block">Любимые цвета</label>
          <input
            defaultValue="Белый, натуральное дерево, терракота"
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra"
          />
        </div>
      </div>

      {/* Functional requirements */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-stone text-sm mb-4">Функциональные требования</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { room: "Гостиная", items: ["Место для ТВ", "Диван с местом хранения", "Рабочая зона", "Гостевые места"] },
            { room: "Кухня", items: ["Остров/полуостров", "Место для 6+ человек", "Мощная вытяжка", "Встроенная техника"] },
            { room: "Спальня", items: ["King-size кровать", "Гардеробная", "Рабочий стол", "Зона отдыха"] },
            { room: "Ванная", items: ["Ванна", "Двойная раковина", "Тёплый пол", "Большое зеркало"] },
          ].map(({ room, items }) => (
            <div key={room}>
              <p className="text-xs font-semibold text-stone mb-2">{room}</p>
              <div className="space-y-1.5">
                {items.map(item => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={Math.random() > 0.4} className="rounded accent-terra" />
                    <span className="text-xs text-stone-mid">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-stone text-sm mb-4">Бюджет</h3>
        <div className="mb-2 flex justify-between">
          <span className="text-xs text-stone-light">Общий бюджет на реализацию</span>
          <span className="text-sm font-semibold text-terra">{fmtMoney(budget)}</span>
        </div>
        <input
          type="range" min={500000} max={10000000} step={100000}
          value={budget}
          onChange={e => setBudget(Number(e.target.value))}
          className="w-full accent-terra"
        />
        <div className="flex justify-between text-xs text-stone-light mt-1">
          <span>500 000 ₽</span><span>10 000 000 ₽</span>
        </div>
      </div>

      {/* References */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone text-sm">Референсы</h3>
          <button className="flex items-center gap-1.5 text-xs text-terra border border-terra/30 px-3 py-1.5 rounded-xl hover:bg-terra-pale transition-colors">
            <Icon name="Upload" size={12} /> Загрузить
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gradient-to-br from-terra-pale to-terra/10 rounded-xl flex items-center justify-center">
              <Icon name="Image" size={22} className="text-terra/30" />
            </div>
          ))}
        </div>
      </div>

      {/* Additional */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-stone text-sm mb-3">Дополнительные пожелания</h3>
        <textarea
          defaultValue="Хотелось бы тёплую атмосферу с использованием натуральных материалов. Важно много хранения в спальне. Детей нет, но кошка — поэтому ткани должны быть практичными."
          rows={4}
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra resize-none"
        />
      </div>
    </div>
  );
}

function EstimateTab() {
  const total = ESTIMATE_CATEGORIES.reduce(
    (sum, cat) => sum + cat.items.reduce((s, i) => s + i.qty * i.price, 0), 0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-stone-mid">Итого: <span className="font-display text-xl font-semibold text-stone">{fmtMoney(total)}</span></div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border border-border text-stone hover:border-terra/40 transition-all">
            <Icon name="Plus" size={14} /> Добавить
          </button>
          <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl terra-gradient text-white hover:opacity-90 transition-all">
            <Icon name="Download" size={14} className="text-white" /> PDF
          </button>
        </div>
      </div>

      {ESTIMATE_CATEGORIES.map(cat => {
        const catTotal = cat.items.reduce((s, i) => s + i.qty * i.price, 0);
        return (
          <div key={cat.name} className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b border-border">
              <span className="font-semibold text-stone text-sm">{cat.name}</span>
              <span className="text-sm font-semibold text-terra">{fmtMoney(catTotal)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["№", "Наименование", "Кол-во", "Ед.", "Цена", "Сумма"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs text-stone-light font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cat.items.map((item, i) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-stone-light">{i + 1}</td>
                      <td className="px-4 py-2.5 text-stone font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-stone-mid">{item.qty}</td>
                      <td className="px-4 py-2.5 text-stone-mid">{item.unit}</td>
                      <td className="px-4 py-2.5 text-stone-mid whitespace-nowrap">{fmtMoney(item.price)}</td>
                      <td className="px-4 py-2.5 font-semibold text-stone whitespace-nowrap">{fmtMoney(item.qty * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div className="bg-white rounded-2xl border border-border px-5 py-4 flex items-center justify-between">
        <span className="font-semibold text-stone">Итого по смете</span>
        <span className="font-display text-2xl font-semibold text-terra">{fmtMoney(total)}</span>
      </div>
    </div>
  );
}

function FinanceTab() {
  const stats = [
    { label: "Стоимость проекта", value: 2500000, color: "text-stone", icon: "TrendingUp" },
    { label: "Оплачено клиентом", value: 1250000, color: "text-green-600", icon: "CheckCircle" },
    { label: "Расходы", value: 342800, color: "text-red-500", icon: "ArrowDownCircle" },
    { label: "Прибыль", value: 907200, color: "text-terra", icon: "Sparkles" },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-light leading-tight">{s.label}</span>
              <Icon name={s.icon} fallback="Circle" size={14} className={s.color} />
            </div>
            <div className={`font-display text-xl font-semibold ${s.color}`}>{fmtMoney(s.value)}</div>
          </div>
        ))}
      </div>

      {/* Payments */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-stone text-sm">График платежей</h3>
          <button className="flex items-center gap-1.5 text-xs terra-gradient text-white px-3 py-1.5 rounded-xl hover:opacity-90 transition-all">
            <Icon name="Plus" size={12} className="text-white" /> Платёж
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Этап", "Сумма", "Статус", "Дата"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-stone-light font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAYMENTS.map((p, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-stone font-medium">{p.stage}</td>
                  <td className="px-4 py-3 font-semibold text-stone whitespace-nowrap">{fmtMoney(p.amount)}</td>
                  <td className="px-4 py-3">
                    {p.status === "paid"
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">✅ Оплачено</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">⏳ Ожидает</span>}
                  </td>
                  <td className="px-4 py-3 text-stone-mid">{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-stone text-sm">Расходы</h3>
          <button className="flex items-center gap-1.5 text-xs terra-gradient text-white px-3 py-1.5 rounded-xl hover:opacity-90 transition-all">
            <Icon name="Plus" size={12} className="text-white" /> Расход
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Дата", "Описание", "Категория", "Сумма", "Статус"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-stone-light font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EXPENSES.map((e, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-stone-mid text-xs">{e.date}</td>
                  <td className="px-4 py-2.5 text-stone">{e.desc}</td>
                  <td className="px-4 py-2.5"><span className="text-xs px-2 py-0.5 rounded-full bg-muted text-stone-mid">{e.category}</span></td>
                  <td className="px-4 py-2.5 font-semibold text-stone whitespace-nowrap">{fmtMoney(e.amount)}</td>
                  <td className="px-4 py-2.5">
                    {e.paid
                      ? <span className="text-xs text-green-600">Оплачено</span>
                      : <span className="text-xs text-amber-600">К оплате</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workers */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-stone text-sm">Оплаты работникам</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Работник", "Вид работы", "Сумма", "Статус"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-stone-light font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WORKERS_PAY.map((w, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-stone font-medium">{w.name}</td>
                  <td className="px-4 py-3 text-stone-mid">{w.work}</td>
                  <td className="px-4 py-3 font-semibold text-stone whitespace-nowrap">{fmtMoney(w.amount)}</td>
                  <td className="px-4 py-3">
                    {w.paid
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">✅ Оплачено</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">⏳ К оплате</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DocsTab() {
  const [filter, setFilter] = useState<"all" | "generated" | "uploaded">("all");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(["all", "generated", "uploaded"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? "bg-white text-stone shadow-sm" : "text-stone-mid hover:text-stone"}`}
            >
              {f === "all" ? "Все" : f === "generated" ? "Сформированные" : "Загруженные"}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl terra-gradient text-white hover:opacity-90 transition-all">
          <Icon name="Upload" size={14} className="text-white" /> Загрузить подписанный
        </button>
      </div>

      {/* Generated */}
      {(filter === "all" || filter === "generated") && (
        <div>
          <h3 className="text-xs font-semibold text-stone-light uppercase tracking-wider mb-3">Сформированные</h3>
          <div className="space-y-2">
            {DOCS_GENERATED.map(doc => (
              <div key={doc.name} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${doc.ready ? "bg-terra-pale" : "bg-muted"}`}>
                  <Icon name="FileText" size={17} className={doc.ready ? "text-terra" : "text-stone-light"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${doc.ready ? "text-stone" : "text-stone-light"}`}>{doc.name}</p>
                  <p className="text-xs text-stone-light">{doc.ready ? "Сформирован" : "Не готов"}</p>
                </div>
                <button
                  disabled={!doc.ready}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                    doc.ready
                      ? "border-terra/30 text-terra hover:bg-terra-pale"
                      : "border-border text-stone-light cursor-not-allowed opacity-50"
                  }`}
                >
                  <Icon name="Download" size={12} /> PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded */}
      {(filter === "all" || filter === "uploaded") && (
        <div>
          <h3 className="text-xs font-semibold text-stone-light uppercase tracking-wider mb-3">Загруженные клиентом</h3>
          <div className="space-y-2">
            {DOCS_UPLOADED.map(doc => (
              <div key={doc.name} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="Paperclip" size={17} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone">{doc.name}</p>
                  <p className="text-xs text-stone-light">Загружен {doc.date}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border border-border text-stone hover:border-terra/30 transition-all">
                    <Icon name="Download" size={12} />
                  </button>
                  <button className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border border-border text-red-400 hover:border-red-300 hover:bg-red-50 transition-all">
                    <Icon name="Trash2" size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NAV (same as Dashboard) ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Дашборд", id: "dashboard", path: "/dashboard" },
  { icon: "FolderOpen", label: "Проекты", id: "projects", path: "/dashboard" },
  { icon: "CheckSquare", label: "Задачи", id: "tasks", path: "/tasks" },
  { icon: "Users", label: "Клиенты", id: "clients", path: "/dashboard" },
  { icon: "Handshake", label: "Гильдия", id: "guild", path: "/guild" },
  { icon: "MessageCircle", label: "Сообщения", id: "messages", path: "/dashboard", badge: 3 },
  { icon: "User", label: "Профиль", id: "profile", path: "/dashboard" },
];

const TABS = [
  { id: "overview", label: "Обзор", icon: "LayoutDashboard" },
  { id: "execution", label: "Выполнение", icon: "ListChecks" },
  { id: "brief", label: "Бриф", icon: "ClipboardList" },
  { id: "estimate", label: "Смета", icon: "Receipt" },
  { id: "finance", label: "Финансы", icon: "TrendingUp" },
  { id: "documents", label: "Документы", icon: "FolderOpen" },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeNav, setActiveNav] = useState("projects");

  const handleNavClick = (item: { id: string; path: string }) => {
    setActiveNav(item.id);
    navigate(item.path);
  };

  return (
    <div className="min-h-screen bg-background font-body flex">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-border h-screen sticky top-0">
        <div className="p-5 border-b border-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="Layers" size={15} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-stone">DesignOffice</span>
          </button>
        </div>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 terra-gradient rounded-full flex items-center justify-center text-white font-semibold text-sm">ЕС</div>
            <div>
              <div className="text-sm font-semibold text-stone">Елена Смирнова</div>
              <div className="text-xs text-stone-mid">Дизайнер интерьеров</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeNav === item.id ? "bg-terra-pale text-terra font-medium" : "text-stone-mid hover:bg-muted hover:text-stone"
              }`}
            >
              <Icon name={item.icon} fallback="Circle" size={17} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto w-5 h-5 terra-gradient rounded-full text-white text-xs flex items-center justify-center">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-mid hover:bg-muted hover:text-stone transition-all">
            <Icon name="LogOut" size={17} /><span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto pb-24 md:pb-8">
        {/* Header with back button */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 md:px-8 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-sm text-stone-mid hover:text-stone transition-colors"
            >
              <Icon name="ArrowLeft" size={16} />
              <span className="hidden sm:inline">Назад</span>
            </button>
            <span className="text-stone-light">/</span>
            <span className="text-sm text-stone-mid hidden sm:inline">Проекты</span>
            <span className="text-stone-light hidden sm:inline">/</span>
            <span className="text-sm font-medium text-stone truncate">Квартира на Тверской</span>
            <div className="ml-auto">
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">В работе</span>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 py-5">
          {/* Tabs — scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 mb-6">
            <div className="flex gap-1 bg-white border border-border rounded-2xl p-1 min-w-max md:min-w-0">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "terra-gradient text-white shadow-sm"
                      : "text-stone-mid hover:text-stone hover:bg-muted"
                  }`}
                >
                  <Icon name={tab.icon} fallback="Circle" size={14} className={activeTab === tab.id ? "text-white" : ""} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="animate-fade-in" key={activeTab}>
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "execution" && <ExecutionTab />}
            {activeTab === "brief" && <BriefTab />}
            {activeTab === "estimate" && <EstimateTab />}
            {activeTab === "finance" && <FinanceTab />}
            {activeTab === "documents" && <DocsTab />}
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-1 py-2 flex justify-around">
        {NAV_ITEMS.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${
              activeNav === item.id ? "text-terra" : "text-stone-light"
            }`}
          >
            <Icon name={item.icon} fallback="Circle" size={20} />
            <span className="text-xs">{item.label}</span>
            {item.badge && (
              <span className="absolute -top-0.5 right-1 w-4 h-4 terra-gradient rounded-full text-white text-xs flex items-center justify-center">{item.badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}