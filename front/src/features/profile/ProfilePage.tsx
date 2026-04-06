import React, { useState } from "react";
import { authStore } from "../../shared/auth/authStore";

const ProfilePage: React.FC = () => {
    const user = authStore.user;

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "La nueva contraseña debe tener al menos 6 caracteres" });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Las contraseñas no coinciden" });
            return;
        }

        setLoading(true);
        const ok = await authStore.changePassword(currentPassword, newPassword);
        setLoading(false);

        if (ok) {
            setMessage({ type: "success", text: "Contraseña actualizada correctamente" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            setMessage({ type: "error", text: "Contraseña actual incorrecta" });
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return "U";
        return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    };

    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-200">Ajustes de Perfil</h3>
                    <p className="text-sm text-slate-400 mt-1">Administrá tu información personal y de seguridad.</p>
                </div>
            </div>

            {/* Profile Hero Card */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden shadow-sm animate-page-in">
                {/* Header Banner */}
                <div className="h-24 sm:h-32 bg-linear-to-r from-indigo-500/20 via-purple-500/10 to-transparent border-b border-slate-700/50 relative"></div>
                
                {/* Profile Avatar & Title */}
                <div className="px-6 sm:px-8 pb-6 sm:pb-8 relative">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-12 sm:-mt-16 mb-6">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-4xl sm:text-5xl font-extrabold text-indigo-400 shadow-xl z-10 shrink-0">
                            {getInitials(user?.fullName)}
                        </div>
                        <div className="text-center sm:text-left mb-2">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-200">{user?.fullName}</h2>
                            <p className="text-indigo-400 font-medium text-sm sm:text-base">{user?.roles?.[0]}</p>
                        </div>
                    </div>

                    {/* Detail Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-700/30">
                        <div className="space-y-1">
                            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <span>📧</span> Email
                            </span>
                            <p className="text-slate-200 font-medium text-sm">{user?.email}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <span>📞</span> Teléfono
                            </span>
                            <p className="text-slate-200 font-medium text-sm">{user?.phone || "No especificado"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <span>🛡️</span> Roles
                            </span>
                            <div className="flex gap-2 pt-1">
                                {user?.roles?.map(r => (
                                    <span key={r} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg">
                        🔐
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-200">Seguridad y acceso</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Mantené tu cuenta segura actualizando tu contraseña periódicamente.</p>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">
                    <div className="space-y-1.5 p-4 rounded-xl border border-slate-700/30 bg-slate-900/20">
                        <label className="text-xs font-medium text-slate-400 px-1">Contraseña actual</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 rounded-lg bg-slate-900/80 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 px-1">Nueva contraseña</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                                className="w-full px-4 py-3 rounded-lg bg-slate-900/80 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 px-1">Confirmar contraseña</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repita nueva contraseña"
                                required
                                minLength={6}
                                className="w-full px-4 py-3 rounded-lg bg-slate-900/80 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`text-xs px-4 py-3 rounded-xl flex items-center gap-2 ${
                            message.type === "success"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                            <span className="text-sm">{message.type === 'success' ? '✓' : '⚠'}</span>
                            <span className="font-medium">{message.text}</span>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-medium shadow-sm shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {loading ? "Actualizando..." : "Actualizar contraseña"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;

