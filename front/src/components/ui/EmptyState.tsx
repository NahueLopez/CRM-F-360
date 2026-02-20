import React from "react";

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon = "📭",
    title,
    description,
    actionLabel,
    onAction,
}) => (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-page-in">
        <span className="text-5xl mb-4 opacity-80">{icon}</span>
        <h3 className="text-lg font-semibold text-slate-300 mb-1">{title}</h3>
        {description && (
            <p className="text-sm text-slate-500 text-center max-w-sm mb-4">{description}</p>
        )}
        {actionLabel && onAction && (
            <button
                onClick={onAction}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium 
                   rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20"
            >
                {actionLabel}
            </button>
        )}
    </div>
);

export default EmptyState;
