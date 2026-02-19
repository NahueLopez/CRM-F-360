import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (type: ToastType, message: string, durationMs?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (type: ToastType, message: string, durationMs = 4000) => {
            const id = crypto.randomUUID();
            setToasts((prev) => [...prev, { id, type, message }]);
            setTimeout(() => removeToast(id), durationMs);
        },
        [removeToast]
    );

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
        </ToastContext.Provider>
    );
};

/* ─── Render ─── */
const typeStyles: Record<ToastType, { bg: string; icon: string; border: string }> = {
    success: { bg: "bg-emerald-500/15", icon: "✅", border: "border-emerald-500/30" },
    error: { bg: "bg-red-500/15", icon: "❌", border: "border-red-500/30" },
    warning: { bg: "bg-amber-500/15", icon: "⚠️", border: "border-amber-500/30" },
    info: { bg: "bg-blue-500/15", icon: "ℹ️", border: "border-blue-500/30" },
};

const ToastContainer: React.FC<{ toasts: Toast[]; onDismiss: (id: string) => void }> = ({
    toasts,
    onDismiss,
}) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((t) => {
                const s = typeStyles[t.type];
                return (
                    <div
                        key={t.id}
                        className={`flex items-start gap-2 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg
                        ${s.bg} ${s.border} text-sm animate-slide-in`}
                        role="alert"
                    >
                        <span className="shrink-0 text-base">{s.icon}</span>
                        <p className="flex-1 min-w-0">{t.message}</p>
                        <button
                            onClick={() => onDismiss(t.id)}
                            className="shrink-0 text-slate-400 hover:text-white transition text-xs"
                        >
                            ✕
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
