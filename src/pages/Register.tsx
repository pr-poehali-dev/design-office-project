import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { registerUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Role = "designer" | "client";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<Role>("designer");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [specialization, setSpecialization] = useState("residential");
  const [phone, setPhone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Пароль должен быть не менее 8 символов");
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser({
        email,
        password,
        role,
        first_name: firstName,
        last_name: lastName,
        city: city || undefined,
        specialization: role === "designer" ? specialization : undefined,
        phone: phone || undefined,
      });

      login(data.token, data.user);

      if (role === "designer") {
        navigate("/dashboard");
      } else {
        navigate("/client");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen warm-bg font-body flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
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
          <p className="text-stone-mid text-sm mt-1">Начните работу бесплатно</p>
        </div>

        {/* Role selector */}
        <div className="bg-white rounded-3xl shadow-lg shadow-stone/8 border border-border p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <Icon name="AlertCircle" size={16} />
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm font-medium text-stone mb-3">Я являюсь:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("designer")}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  role === "designer"
                    ? "border-terra bg-terra-pale"
                    : "border-border bg-background hover:border-terra/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                  role === "designer" ? "terra-gradient" : "bg-muted"
                }`}>
                  <Icon name="Pencil" size={15} className={role === "designer" ? "text-white" : "text-stone-mid"} />
                </div>
                <div className={`font-medium text-sm ${role === "designer" ? "text-stone" : "text-stone-mid"}`}>Дизайнер</div>
                <div className="text-xs text-stone-light mt-0.5">Веду проекты</div>
              </button>

              <button
                type="button"
                onClick={() => setRole("client")}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  role === "client"
                    ? "border-terra bg-terra-pale"
                    : "border-border bg-background hover:border-terra/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                  role === "client" ? "terra-gradient" : "bg-muted"
                }`}>
                  <Icon name="User" size={15} className={role === "client" ? "text-white" : "text-stone-mid"} />
                </div>
                <div className={`font-medium text-sm ${role === "client" ? "text-stone" : "text-stone-mid"}`}>Клиент</div>
                <div className="text-xs text-stone-light mt-0.5">Смотрю проект</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone mb-1.5">Имя</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Анна"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone mb-1.5">Фамилия</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Петрова"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  required
                  minLength={8}
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

            <div>
              <label className="block text-sm font-medium text-stone mb-1.5">Телефон</label>
              <div className="relative">
                <Icon name="Phone" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-light" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone mb-1.5">Город</label>
              <div className="relative">
                <Icon name="MapPin" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-light" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Москва"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                />
              </div>
            </div>

            {role === "designer" && (
              <div>
                <label className="block text-sm font-medium text-stone mb-1.5">Специализация</label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-stone text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
                >
                  <option value="residential">Жилые интерьеры</option>
                  <option value="commercial">Коммерческие</option>
                  <option value="landscape">Ландшафт</option>
                </select>
              </div>
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

        <p className="text-center text-xs text-stone-light mt-6">
          Нажимая «Создать аккаунт», вы соглашаетесь с{" "}
          <span className="text-terra cursor-pointer hover:underline">условиями использования</span>
        </p>
      </div>
    </div>
  );
}