import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStore } from "../../shared/auth/authStore";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const ok = await authStore.login(email, password);
      if (!ok) {
        setError("Credenciales incorrectas");
        return;
      }
      navigate("/", { replace: true });
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-indigo-400/20 blur-3xl" />

        {/* Content */}
        <div className="relative flex flex-col justify-between p-12 z-10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="CRM F360" className="w-12 h-12 rounded-2xl shadow-xl border border-white/10" />
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                CRM <span className="text-indigo-200">F360</span>
              </h1>
              <p className="text-indigo-200/60 text-sm mt-1">Gestión integral de negocios</p>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white leading-tight max-w-md">
              Todo tu negocio en un solo lugar
            </h2>
            <p className="text-lg text-indigo-100/70 max-w-md leading-relaxed">
              Empresas, contactos, proyectos, tareas, pipeline de ventas y reportes —
              organizá tu equipo con una herramienta pensada para crecer.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {["📊 Dashboard", "🏢 Empresas", "📁 Proyectos", "💰 Pipeline", "📅 Calendario", "💬 Chat"].map(f => (
                <span key={f} className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-sm text-white/80 border border-white/10">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-indigo-200/40">
            © {new Date().getFullYear()} CRM F360 — Todos los derechos reservados
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile header */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <img src="/logo.png" alt="CRM F360" className="w-12 h-12 rounded-xl shadow-md border border-slate-700/50 mb-3" />
            <h1 className="text-2xl font-bold">
              CRM <span className="text-indigo-400">F360</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Gestión integral de negocios</p>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-white">Bienvenido</h2>
            <p className="text-sm text-slate-500">Ingresá tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
              <span className="text-sm">⚠️</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-600 text-center mt-8">
            Al iniciar sesión aceptás los términos de servicio
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
