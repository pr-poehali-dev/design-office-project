import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { loginUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      navigate(user.role === "client" ? "/client" : "/dashboard", { replace: true });
    }
  }, [user, authLoading]);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);
      login(data.token, data.user);

      if (data.user.role === "designer") {
        navigate("/dashboard");
      } else {
        navigate("/client");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen warm-bg font-body flex items-center justify-center px-4">
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
          <h1 className="font-display text-3xl font-light text-stone">Добро пожаловать</h1>
          <p className="text-stone-mid text-sm mt-1">Войдите в свой аккаунт</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-stone/8 border border-border p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <Icon name="AlertCircle" size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
                  placeholder="••••••••"
                  required
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border accent-terra" />
                <span className="text-sm text-stone-mid">Запомнить меня</span>
              </label>
              <button type="button" className="text-sm text-terra hover:text-terra-dark transition-colors">
                Забыли пароль?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full terra-gradient text-white font-medium py-3.5 rounded-xl hover:opacity-90 transition-all hover:shadow-lg hover:shadow-terra/20 text-sm disabled:opacity-60"
            >
              {loading ? "Входим..." : "Войти"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-stone-mid text-sm">Нет аккаунта? </span>
            <button
              onClick={() => navigate("/register")}
              className="text-terra text-sm font-medium hover:text-terra-dark transition-colors"
            >
              Зарегистрироваться
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-stone-light mt-6">
          Нажимая «Войти», вы соглашаетесь с{" "}
          <span className="text-terra cursor-pointer hover:underline">условиями использования</span>
        </p>
      </div>
    </div>
  );
}