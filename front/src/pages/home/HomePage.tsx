import React from "react";
import { authStore } from "../../auth/authStore";

const HomePage: React.FC = () => {
  const user = authStore.user;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Bienvenido {user?.name}</h1>

      <p className="text-sm text-slate-300">
        Este será tu panel principal. Próximamente: proyectos, horas, tareas…
      </p>
    </div>
  );
};

export default HomePage;
