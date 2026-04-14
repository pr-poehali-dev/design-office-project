import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

type Role = "designer" | "client";

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("designer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "designer") {
      navigate("/dashboard");
    } else {
      navigate("/client");
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
            <div>
              <label className="block text-sm font-medium text-stone mb-1.5">Имя</label>
              <div className="relative">
                <Icon name="User" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-light" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Анна Петрова"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-stone placeholder:text-stone-light text-sm focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra transition-all"
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
                  placeholder="Минимум 6 символов"
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

            <button
              type="submit"
              className="w-full terra-gradient text-white font-medium py-3.5 rounded-xl hover:opacity-90 transition-all hover:shadow-lg hover:shadow-terra/20 text-sm"
            >
              Создать аккаунт
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
