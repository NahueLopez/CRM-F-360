import React from "react";
import { authStore } from "../../auth/authStore";

interface TopbarProps {
  title: string;
}

const Topbar: React.FC<TopbarProps> = ({ title }) => {
  return (
    <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/70 backdrop-blur">
      <h2 className="text-lg font-semibold">{title}</h2>

      {authStore.user && (
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{authStore.user.email}</span>
        </div>
      )}
    </header>
  );
};

export default Topbar;
