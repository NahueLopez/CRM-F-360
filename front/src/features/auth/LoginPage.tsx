import React, { useState, useEffect } from "react";
import { authStore } from "../../shared/auth/authStore";
import { loadPreferences } from "../../shared/theme/themeEngine";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [prefs, setPrefs] = useState(loadPreferences());
  const isLight = prefs.theme.startsWith("light");

  useEffect(() => {
    const handlePreferencesUpdated = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail) {
            setPrefs(customEvent.detail);
        } else {
            setPrefs(loadPreferences());
        }
    };
    window.addEventListener("preferences-updated", handlePreferencesUpdated);
    return () => window.removeEventListener("preferences-updated", handlePreferencesUpdated);
  }, []);

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

      if (authStore.user?.tenantId) {
        window.location.replace("/");
      } else {
        window.location.replace("/select-workspace");
      }
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black/10 dark:bg-black/20 backdrop-blur-sm">
        {/* Content */}

        <div className="relative flex flex-col justify-between p-12 z-10 w-full h-full">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="CRM F360"
              className="w-12 h-12 rounded-2xl shadow-xl border border-white/20 bg-white/10 backdrop-blur"
            />
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${isLight ? "text-slate-800" : "text-white"}`}>
                CRM <span style={{ color: isLight ? prefs.accentColor : "#fff" }}>F360</span>
              </h1>
              <p className={`text-sm mt-1 font-medium ${isLight ? "text-slate-700/80" : "text-white/80"}`}>
                Gestión integral de negocios
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className={`text-4xl font-bold leading-tight max-w-md ${isLight ? "text-slate-900" : "text-white"}`}>
              Todo tu negocio en un solo lugar
            </h2>
            <p className={`text-lg max-w-md leading-relaxed font-medium ${isLight ? "text-slate-800/80" : "text-white/90"}`}>
              Empresas, contactos, proyectos, tareas, pipeline de ventas y reportes — organizá tu
              equipo con una herramienta pensada para crecer.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {[
                "📊 Dashboard",
                "🏢 Empresas",
                "📁 Proyectos",
                "💰 Pipeline",
                "📅 Calendario",
                "💬 Chat",
              ].map((f) => (
                <span
                  key={f}
                  className={`px-3 py-1.5 rounded-full backdrop-blur text-sm font-semibold border ${
                    isLight 
                       ? "bg-white/40 text-slate-800 border-slate-500/20 shadow-sm" 
                       : "bg-white/10 text-white/90 border-white/20"
                  }`}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          <p className={`text-xs font-semibold tracking-wide ${isLight ? "text-slate-600/70" : "text-white/60"}`}>
            © {new Date().getFullYear()} CRM F360 — Todos los derechos reservados
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form OR Workspace Selector */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile header */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <img
              src="/logo.png"
              alt="CRM F360"
              className="w-12 h-12 rounded-xl shadow-md border border-slate-700/50 mb-3"
            />
            <h1 className="text-2xl font-bold">
              CRM <span className="text-indigo-400">F360</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Gestión integral de negocios</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
              <span className="text-sm">⚠️</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Login form */}
          <>
              <div className="space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-white">Bienvenido</h2>
                <p className="text-sm text-slate-500">Ingresá tus credenciales para continuar</p>
              </div>

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
            </>

          <p className="text-[11px] text-slate-600 text-center mt-8">
            Al iniciar sesión aceptás los términos de servicio
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
