import React, { useState } from "react";
import { authStore } from "../../auth/authStore";

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");     
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ok = await authStore.login(email, password);

    if (!ok) {
      setError("Credenciales incorrectas");
      return;
    }

    setError("");
    onLogin();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 p-8 rounded-xl w-full max-w-sm border border-slate-700 shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-white">
          Iniciar sesión
        </h2>

        {error && (
          <p className="text-red-400 text-sm mb-3 text-center">{error}</p>
        )}

        <label className="block text-xs text-slate-400 mb-1">Email</label>
        <input
          type="email"
          placeholder="Email"
          className="w-full px-3 py-2 rounded bg-slate-700 mb-3 text-sm text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block text-xs text-slate-400 mb-1">Contraseña</label>
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full px-3 py-2 rounded bg-slate-700 mb-5 text-sm text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full py-2 px-4 bg-primary hover:bg-indigo-600 rounded-lg text-sm font-medium text-white"
        >
          Entrar
        </button>

        <p className="mt-4 text-[11px] text-slate-500 text-center">
          Ingresá con tu usuario registrado en el sistema.
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
