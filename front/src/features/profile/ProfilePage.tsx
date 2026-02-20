import React, { useState } from "react";
import { authStore } from "../../shared/auth/authStore";

const ProfilePage: React.FC = () => {
    const user = authStore.user;

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword.length < 6) {
            setMessage({
                type: "error",
                text: "La nueva contraseña debe tener al menos 6 caracteres",
            });
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
            setMessage({ type: "success", text: "Contraseña actualizada ✓" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            setMessage({
                type: "error",
                text: "Contraseña actual incorrecta",
            });
        }
    };

    return (
        <div className="max-w-2xl space-y-8">
            {/* User info */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">
                    Mi perfil
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-slate-500 text-xs">Nombre</span>
                        <p className="text-slate-200 font-medium">{user?.fullName}</p>
                    </div>
                    <div>
                        <span className="text-slate-500 text-xs">Email</span>
                        <p className="text-slate-200">{user?.email}</p>
                    </div>
                    <div>
                        <span className="text-slate-500 text-xs">Teléfono</span>
                        <p className="text-slate-200">{user?.phone ?? "—"}</p>
                    </div>
                    <div>
                        <span className="text-slate-500 text-xs">Roles</span>
                        <div className="flex gap-1 mt-0.5">
                            {user?.roles.map((r) => (
                                <span
                                    key={r}
                                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300"
                                >
                                    {r}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Change password */}
            <form
                onSubmit={handleChangePassword}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4"
            >
                <h3 className="text-sm font-semibold text-slate-200">
                    Cambiar contraseña
                </h3>

                <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Contraseña actual"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nueva contraseña"
                        required
                        minLength={6}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmar contraseña"
                        required
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {message && (
                    <div
                        className={`text-xs px-3 py-2 rounded-lg ${message.type === "success"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-medium transition disabled:opacity-50"
                >
                    {loading ? "Guardando..." : "Actualizar contraseña"}
                </button>
            </form>
        </div>
    );
};

export default ProfilePage;
