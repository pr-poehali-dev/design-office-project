import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Task, PRIORITY_CONFIG, PROJECT_COLORS, STATUS_LABELS } from "./tasks.types";

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function TaskCalendarView({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const getTasksForDay = (day: number) => {
    const dateStr = `${String(day).padStart(2, "0")}.${String(month + 1).padStart(2, "0")}.${year}`;
    return tasks.filter(t => t.deadline === dateStr);
  };

  const todayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Mini Calendar — compact 1/3 */}
      <div className="lg:w-72 flex-shrink-0 bg-white rounded-2xl border border-border p-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Icon name="ChevronLeft" size={14} className="text-stone" />
          </button>
          <span className="text-sm font-semibold text-stone">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Icon name="ChevronRight" size={14} className="text-stone" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs text-stone-light font-medium py-0.5">{d}</div>
          ))}
        </div>

        {/* Days grid — compact */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayTasks = getTasksForDay(day);
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = day === selectedDay;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`relative flex flex-col items-center py-1 rounded-lg transition-all ${
                  isSelected ? "terra-gradient text-white" :
                  isToday ? "border border-terra text-terra" :
                  "hover:bg-muted text-stone"
                }`}
              >
                <span className="text-xs font-medium leading-tight">{day}</span>
                {dayTasks.length > 0 && (
                  <div className="flex gap-px mt-0.5">
                    {dayTasks.slice(0, 3).map((t, j) => (
                      <span
                        key={j}
                        className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/70" : PRIORITY_CONFIG[t.priority].dot}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2">
          {[
            { dot: "bg-red-500", label: "Высокий" },
            { dot: "bg-amber-400", label: "Средний" },
            { dot: "bg-green-400", label: "Низкий" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${l.dot}`} />
              <span className="text-xs text-stone-light">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day tasks panel — large 2/3 */}
      <div className="flex-1 bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-stone">
              {selectedDay
                ? `${selectedDay} ${MONTHS[month]}, ${year}`
                : "Выберите день в календаре"}
            </h3>
            {todayTasks.length > 0 && (
              <p className="text-xs text-stone-light mt-0.5">{todayTasks.length} задач{todayTasks.length === 1 ? "а" : todayTasks.length < 5 ? "и" : ""}</p>
            )}
          </div>
          {selectedDay && (
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
              selectedDay === today.getDate() && month === today.getMonth()
                ? "bg-terra-pale text-terra border-terra/20"
                : "bg-muted text-stone-mid border-border"
            }`}>
              {selectedDay === today.getDate() && month === today.getMonth() ? "Сегодня" : DAYS[(new Date(year, month, selectedDay).getDay() + 6) % 7]}
            </span>
          )}
        </div>

        {todayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-3">
              <Icon name="CalendarCheck" size={26} className="text-stone-light" />
            </div>
            <p className="text-stone font-medium text-sm mb-1">Задач нет</p>
            <p className="text-xs text-stone-light">На этот день задачи не запланированы</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map(t => (
              <div
                key={t.id}
                className="border border-border rounded-2xl p-4 hover:border-terra/30 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-base font-semibold text-stone leading-snug group-hover:text-terra transition-colors">{t.title}</span>
                  <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                    t.priority === "high" ? "bg-red-50 text-red-600 border-red-200" :
                    t.priority === "medium" ? "bg-amber-50 text-amber-600 border-amber-200" :
                    "bg-green-50 text-green-600 border-green-200"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[t.priority].dot}`} />
                    {PRIORITY_CONFIG[t.priority].label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${PROJECT_COLORS[t.project] || "bg-muted text-stone-mid border-border"}`}>
                    {t.project}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                    t.status === "done" ? "bg-green-50 text-green-700 border-green-200" :
                    t.status === "doing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    t.status === "review" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-muted text-stone-mid border-border"
                  }`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-stone-light">
                    <Icon name="Calendar" size={12} />
                    <span>Дедлайн: {t.deadline}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-light">Исполнитель</span>
                    <div className="w-7 h-7 terra-gradient rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {t.assignee}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}