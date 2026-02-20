import React from "react";

interface SkeletonProps {
    className?: string;
}

/** Single skeleton bar */
export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
    <div className={`skeleton ${className}`} />
);

/** Skeleton that mimics a table with rows */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
    rows = 5,
    cols = 5,
}) => (
    <div className="space-y-3">
        {/* Header */}
        <div className="flex gap-4 px-3 py-2">
            {Array.from({ length: cols }).map((_, i) => (
                <div key={i} className="skeleton h-4 flex-1 rounded" />
            ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex gap-4 px-3 py-3 bg-slate-800/20 rounded-lg">
                {Array.from({ length: cols }).map((_, colIdx) => (
                    <div
                        key={colIdx}
                        className="skeleton h-3 flex-1 rounded"
                        style={{ animationDelay: `${(rowIdx * cols + colIdx) * 50}ms` }}
                    />
                ))}
            </div>
        ))}
    </div>
);

/** Skeleton that mimics summary cards */
export const CardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-3`}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                <div className="skeleton h-2.5 w-20 rounded" />
                <div className="skeleton h-6 w-16 rounded" />
            </div>
        ))}
    </div>
);
