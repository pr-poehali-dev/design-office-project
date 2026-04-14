import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth, UserRole } from "@/lib/auth";

const SPECIALIZATIONS = ["Жилые интерьеры", "Коммерческие", "Ландшафт", "Универсал"];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();

  const inviteRole = searchParams.get("role") as UserRole | null;
  const inviteProject = searchParams.get("project");

  const [role, setRole] = useState<UserRole>(inviteRole || "designer");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !email || !password) return;
    setError("");
    setLoading(true);

    const { error: err } = await signUp(email, password, {
      first_name: firstName,
      last_name: lastName,
      role,
      city: city || undefined,
      specialization: specialization || undefined,
      phone: phone || undefined,
    });

    setLoading(false);
    if (err) {
      if (err.includes("already registered")) setError("Этот email уже зарегистрирован");
      else setError(err);
      return;
    }

    if (role === "designer") navigate("/dashboard");
    else navigate("/client");
  };

  return (
    <div className="min-h-screen warm-bg font-body flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 terra-gradient rounded-xl flex items-center justify-center">
              <Icon name="Layers" size={18} className="text-white" />
            </div>
            <span className="font-display text-2xl font-semibold text-stone">DesignOffice</span>
          </button>
          <h1 className="font-display text-3xl font-light text-stone">Создать аккаунт</h1>
          <p className="text-stone-mid text-sm mt-1">
            {inviteProject ? "Вас пригласили в проект — завершите регистрацию" : "Начните работу бесплатно"}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg shadow-stone/8 border border-border p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {!inviteRole && (
            <div className="mb-6">
              <p className="text-sm font-medium text-stone mb-3">Я являюсь:</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "designer" as UserRole, icon: "Pencil", label: "Дизайнер", sub: "Веду проекты" },
                  { key: "client" as UserRole, icon: "User", label: "Клиент", sub: "Смотрю проект" },
                ].map(r => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      role === r.key ? "border-terra bg-terra-pale" : "border-border bg-background hover:border-terra/30"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${role === r.key ? "terra-gradient" : "bg-muted"}`}>
                      <Icon name={r.icon} size={15} className={role === r.key ? "text-white" : "text-stone-mid"} />
                    </div>
                    <div className={`font-medium text-sm ${role === r.key ? "text-stone" : "text-stone-mid"}`}>{r.label}</div>
                    <div className="text-xs text-stone-light mt-0.5">{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone mb-1.5">Имя</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Анна"
                  required
                  className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone mb-1.5">Фамилия</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Петрова"
                  className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone mb-1.5">Email</label>
              <div className="relative">
                <Icon name="Mail" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-light" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="anna@studio.ru"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone mb-1.5">Пароль</label>
              <div className="relative">
                <Icon name="Lock" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-light" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-light hover:text-stone-mid transition-colors"
                >
                  <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
            </div>

            {role === "designer" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-stone mb-1.5">Телефон</label>
                  <div className="relative">
                    <Icon name="Phone" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-light" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+7 (999) 123-45-67"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-stone mb-1.5">Город</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Москва"
                      className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone mb-1.5">Специализация</label>
                    <select
                      value={specialization}
                      onChange={e => setSpecialization(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                    >
                      <option value="">Выберите</option>
                      {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full terra-gradient text-white font-medium py-3.5 rounded-xl hover:opacity-90 transition-all hover:shadow-lg hover:shadow-terra/20 text-sm disabled:opacity-60"
            >
              {loading ? "Создаём аккаунт..." : "Создать аккаунт"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-stone-mid text-sm">Уже есть аккаунт? </span>
            <button
              onClick={() => navigate("/login")}
              className="text-terra text-sm font-medium hover:text-terra-dark transition-colors"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
