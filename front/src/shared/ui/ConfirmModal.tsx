import React, { useEffect, useRef } from "react";

interface ConfirmModalProps {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
    onCancel: () => void;
}

const variantConfig = {
    danger: {
        icon: "🗑️",
        iconBg: "bg-red-500/15 border-red-500/30",
        button: "bg-red-600 hover:bg-red-500 shadow-red-500/20",
    },
    warning: {
        icon: "⚠️",
        iconBg: "bg-amber-500/15 border-amber-500/30",
        button: "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20",
    },
    info: {
        icon: "ℹ️",
        iconBg: "bg-indigo-500/15 border-indigo-500/30",
        button: "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20",
    },
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    title = "¿Estás seguro?",
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "danger",
    onConfirm,
    onCancel,
}) => {
    const cancelRef = useRef<HTMLButtonElement>(null);
    const cfg = variantConfig[variant];

    useEffect(() => {
        if (open) {
            cancelRef.current?.focus();
            const handler = (e: KeyboardEvent) => {
                if (e.key === "Escape") onCancel();
            };
            document.addEventListener("keydown", handler);
            return () => document.removeEventListener("keydown", handler);
        }
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm confirm-modal-backdrop"
                onClick={onCancel}
                aria-hidden="true"
            />
            {/* Modal */}
            <div className="relative bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 w-full max-w-sm p-6 confirm-modal-content">
                <div className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-2xl ${cfg.iconBg} border flex items-center justify-center text-2xl mb-4`}>
                        {cfg.icon}
                    </div>
                    <h3 id="confirm-title" className="text-base font-semibold mb-1">{title}</h3>
                    <p id="confirm-desc" className="text-sm text-slate-400 leading-relaxed">{message}</p>
                </div>
                <div className="flex gap-3 mt-6">
                    <button
                        ref={cancelRef}
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.97] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${cfg.button}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
