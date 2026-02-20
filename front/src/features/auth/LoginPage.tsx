import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStore } from "../../shared/auth/authStore";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 p-8 rounded-xl w-full max-w-sm border border-slate-700 shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-white">
          CRM <span className="text-indigo-400">F360</span>
        </h2>

        {error && (
          <p className="text-red-400 text-sm mb-3 text-center bg-red-400/10 rounded-lg py-2">
            {error}
          </p>
        )}

        <label className="block text-xs text-slate-400 mb-1">
          Email
        </label>
        <input
          type="email"
          placeholder="tu@email.com"
          className="w-full px-3 py-2 rounded bg-slate-700 mb-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block text-xs text-slate-400 mb-1">
          Contraseña
        </label>
        <input
          type="password"
          placeholder="••••••••"
          className="w-full px-3 py-2 rounded bg-slate-700 mb-5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition"
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
