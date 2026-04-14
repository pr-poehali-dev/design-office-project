import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  ESTIMATE_CATEGORIES, PAYMENTS, EXPENSES, WORKERS_PAY,
  STYLE_OPTIONS, DOCS_GENERATED, DOCS_UPLOADED, fmtMoney,
} from "./projectDetail.types";

export function BriefTab() {
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

export function EstimateTab() {
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

export function FinanceTab() {
  const stats = [
    { label: "Стоимость проекта", value: 2500000, color: "text-stone", icon: "TrendingUp" },
    { label: "Оплачено клиентом", value: 1250000, color: "text-green-600", icon: "CheckCircle" },
    { label: "Расходы", value: 342800, color: "text-red-500", icon: "ArrowDownCircle" },
    { label: "Прибыль", value: 907200, color: "text-terra", icon: "Sparkles" },
  ];

  return (
    <div className="space-y-5">
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

export function DocsTab() {
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
