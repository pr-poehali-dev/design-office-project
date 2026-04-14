import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";

const features = [
  {
    icon: "FolderOpen",
    title: "Все проекты в одном месте",
    desc: "Ведите несколько объектов одновременно: статусы, сроки, визуализации и документы всегда под рукой.",
  },
  {
    icon: "Users",
    title: "Удобная работа с клиентами",
    desc: "Клиент видит только свой проект: согласовывает варианты, оставляет комментарии, подписывает документы.",
  },
  {
    icon: "Images",
    title: "Сравнение вариантов дизайна",
    desc: "Загружайте визуализации и показывайте клиенту несколько концепций. Он выбирает — вы двигаетесь дальше.",
  },
  {
    icon: "FileText",
    title: "Документы и сметы",
    desc: "Договоры, технические задания, сметы — всё хранится в проекте и доступно в любое время.",
  },
  {
    icon: "MessageCircle",
    title: "Переписка без мессенджеров",
    desc: "Обсуждайте детали прямо в проекте. Вся история в одном месте — не нужно искать в WhatsApp.",
  },
  {
    icon: "Smartphone",
    title: "Работает на телефоне",
    desc: "Полноценный офис в кармане. Принимайте решения и отвечайте клиентам где угодно.",
  },
];

const steps = [
  { num: "01", title: "Создайте проект", desc: "Заведите объект, добавьте клиента и загрузите первые материалы." },
  { num: "02", title: "Загрузите визуализации", desc: "Показывайте варианты концепций — клиент смотрит и выбирает онлайн." },
  { num: "03", title: "Согласуйте и подпишите", desc: "Все документы и сметы прямо в системе. Быстро и прозрачно." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === "client" ? "/client" : "/dashboard", { replace: true });
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen warm-bg font-body">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-card px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 terra-gradient rounded-lg flex items-center justify-center">
              <Icon name="Layers" size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-stone">DesignOffice</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-stone-mid text-sm font-medium hover:text-terra transition-colors px-3 py-2"
            >
              Войти
            </button>
            <button
              onClick={() => navigate("/register")}
              className="terra-gradient text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Начать бесплатно
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-terra-pale border border-terra/20 rounded-full px-4 py-1.5 mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 bg-terra rounded-full"></span>
          <span className="text-terra text-sm font-medium">Для дизайнеров интерьеров</span>
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-light text-stone leading-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          DesignOffice —<br />
          <em className="text-terra not-italic">Мобильный офис</em><br />
          дизайнера интерьеров
        </h1>
        <p className="text-stone-mid text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '0.25s' }}>
          Управляйте проектами, клиентами и документами в одном красивом пространстве. Без лишних звонков и потерянных файлов.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <button
            onClick={() => navigate("/register")}
            className="terra-gradient text-white font-medium px-8 py-4 rounded-2xl hover:opacity-90 transition-all hover:shadow-lg hover:shadow-terra/20 text-base"
          >
            Начать бесплатно
          </button>
          <button
            onClick={() => navigate("/login")}
            className="bg-white text-stone font-medium px-8 py-4 rounded-2xl border border-border hover:border-terra/30 transition-all text-base"
          >
            Войти в аккаунт
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mt-16 animate-fade-in" style={{ animationDelay: '0.45s' }}>
          {[["500+", "Дизайнеров"], ["2400+", "Проектов"], ["4.9", "Рейтинг"]].map(([val, label]) => (
            <div key={label} className="text-center">
              <div className="font-display text-3xl font-semibold text-terra">{val}</div>
              <div className="text-stone-mid text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mock dashboard preview */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="relative bg-white rounded-3xl shadow-2xl shadow-stone/10 overflow-hidden border border-border p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="ml-3 text-stone-light text-xs">designoffice.app/dashboard</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Квартира на Тверской", status: "В работе", client: "Анна Петрова", color: "bg-blue-50 text-blue-700" },
              { name: "Загородный дом", status: "Согласование", client: "Игорь Сидоров", color: "bg-amber-50 text-amber-700" },
              { name: "Студия на Арбате", status: "Завершён", client: "Мария Козлова", color: "bg-green-50 text-green-700" },
            ].map((p) => (
              <div key={p.name} className="bg-background rounded-2xl p-4 border border-border hover-scale cursor-pointer">
                <div className="w-full h-28 bg-gradient-to-br from-terra-pale to-terra/10 rounded-xl mb-3 flex items-center justify-center">
                  <Icon name="Image" size={28} className="text-terra/40" />
                </div>
                <h3 className="font-body font-semibold text-stone text-sm mb-1">{p.name}</h3>
                <p className="text-stone-mid text-xs mb-2">{p.client}</p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${p.color}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl md:text-5xl font-light text-stone mb-4">
            Всё для вашей работы
          </h2>
          <p className="text-stone-mid text-base max-w-xl mx-auto">
            Сервис создан специально для дизайнеров интерьеров и их клиентов
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 border border-border hover-scale transition-all hover:border-terra/30 hover:shadow-md hover:shadow-terra/5"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-10 h-10 terra-gradient rounded-xl flex items-center justify-center mb-4">
                <Icon name={f.icon} fallback="Star" size={18} className="text-white" />
              </div>
              <h3 className="font-body font-semibold text-stone mb-2 text-sm">{f.title}</h3>
              <p className="text-stone-mid text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl md:text-5xl font-light text-stone mb-4">
            Как это работает
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.num} className="relative">
              <div className="font-display text-7xl font-light text-terra/15 mb-2 leading-none">{s.num}</div>
              <h3 className="font-body font-semibold text-stone mb-2">{s.title}</h3>
              <p className="text-stone-mid text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-16 mb-12">
        <div className="terra-gradient rounded-3xl p-10 md:p-14 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-4">
            Готовы попробовать?
          </h2>
          <p className="text-white/80 text-base mb-8 max-w-lg mx-auto">
            Присоединяйтесь к сотням дизайнеров, которые уже работают в удовольствие
          </p>
          <button
            onClick={() => navigate("/register")}
            className="bg-white text-terra font-semibold px-8 py-4 rounded-2xl hover:bg-terra-pale transition-all text-base"
          >
            Начать бесплатно
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 terra-gradient rounded-md flex items-center justify-center">
              <Icon name="Layers" size={12} className="text-white" />
            </div>
            <span className="font-display text-stone font-medium">DesignOffice</span>
          </div>
          <p className="text-stone-light text-sm">© 2024 DesignOffice. Мобильный офис дизайнера интерьеров.</p>
        </div>
      </footer>
    </div>
  );
}