import { useState } from "react";
import Icon from "@/components/ui/icon";
import { STYLE_OPTIONS, fmtMoney } from "./projectDetail.types";

function EmptyState({ icon, title, subtitle, action, onAction }: {
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

export function BriefTab() {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [budget, setBudget] = useState(0);

  const toggleStyle = (s: string) =>
    setSelectedStyles(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">⏳ Не заполнен</span>
        </div>
        <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl terra-gradient text-white hover:opacity-90 transition-all">
          <Icon name="Send" size={14} className="text-white" /> Отправить клиенту
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-stone text-sm mb-4">Общая информация</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Тип помещения", placeholder: "Квартира" },
            { label: "Общая площадь", placeholder: "92 м²" },
            { label: "Количество жильцов", placeholder: "2" },
            { label: "Дети", placeholder: "Нет" },
            { label: "Животные", placeholder: "Нет" },
            { label: "Количество комнат", placeholder: "3" },
          ].map(({ label, placeholder }) => (
            <div key={label}>
              <label className="text-xs text-stone-light mb-1 block">{label}</label>
              <input
                placeholder={placeholder}
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
            placeholder="Белый, натуральное дерево, терракота"
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
                    <input type="checkbox" className="rounded accent-terra" />
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
          <span className="text-sm font-semibold text-terra">{budget > 0 ? fmtMoney(budget) : "Не указан"}</span>
        </div>
        <input
          type="range" min={0} max={10000000} step={100000}
          value={budget}
          onChange={e => setBudget(Number(e.target.value))}
          className="w-full accent-terra"
        />
        <div className="flex justify-between text-xs text-stone-light mt-1">
          <span>0 ₽</span><span>10 000 000 ₽</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone text-sm">Референсы</h3>
          <button className="flex items-center gap-1.5 text-xs text-terra border border-terra/30 px-3 py-1.5 rounded-xl hover:bg-terra-pale transition-colors">
            <Icon name="Upload" size={12} /> Загрузить
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mb-2">
            <Icon name="Image" size={18} className="text-stone-light" />
          </div>
          <p className="text-xs text-stone-mid">Референсов пока нет</p>
          <p className="text-xs text-stone-light">Загрузите фотографии для вдохновения</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-stone text-sm mb-3">Дополнительные пожелания</h3>
        <textarea
          placeholder="Опишите свои пожелания по интерьеру..."
          rows={4}
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra resize-none"
        />
      </div>
    </div>
  );
}

export function EstimateTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-stone-mid">Итого: <span className="font-display text-xl font-semibold text-stone">0 ₽</span></div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border border-border text-stone hover:border-terra/40 transition-all">
            <Icon name="Plus" size={14} /> Добавить
          </button>
          <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl terra-gradient text-white hover:opacity-90 transition-all">
            <Icon name="Download" size={14} className="text-white" /> PDF
          </button>
        </div>
      </div>
      <EmptyState
        icon="Receipt"
        title="Смета не заполнена"
        subtitle="Добавьте позиции в смету проекта"
        action="Добавить позицию"
      />
    </div>
  );
}

export function FinanceTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Стоимость проекта", value: 0, color: "text-stone", icon: "TrendingUp" },
          { label: "Оплачено клиентом", value: 0, color: "text-green-600", icon: "CheckCircle" },
          { label: "Расходы", value: 0, color: "text-red-500", icon: "ArrowDownCircle" },
          { label: "Прибыль", value: 0, color: "text-terra", icon: "Sparkles" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-light leading-tight">{s.label}</span>
              <Icon name={s.icon} fallback="Circle" size={14} className={s.color} />
            </div>
            <div className={`font-display text-xl font-semibold ${s.color}`}>{fmtMoney(s.value)}</div>
          </div>
        ))}
      </div>

      <EmptyState
        icon="CreditCard"
        title="Финансы пусты"
        subtitle="Добавьте платежи и расходы по проекту"
        action="Добавить платёж"
      />
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
          <Icon name="Upload" size={14} className="text-white" /> Загрузить документ
        </button>
      </div>

      <EmptyState
        icon="FileText"
        title="Нет документов"
        subtitle="Документы будут появляться по мере работы над проектом"
        action="Загрузить документ"
      />
    </div>
  );
}
