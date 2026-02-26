/** Dashboard loading skeleton */
const DashboardSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="space-y-2">
            <div className="skeleton h-7 w-64 rounded-lg" />
            <div className="skeleton h-4 w-40 rounded-lg" />
        </div>
        {/* KPI cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-700/30 bg-slate-800/30 p-5 space-y-3">
                    <div className="skeleton h-3 w-16 rounded" />
                    <div className="skeleton h-8 w-12 rounded" />
                </div>
            ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-700/30 bg-slate-800/30 p-5 space-y-4">
                    <div className="skeleton h-4 w-36 rounded" />
                    <div className="skeleton h-48 w-full rounded-xl" />
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-700/30 bg-slate-800/30 p-5 space-y-4">
                    <div className="skeleton h-4 w-40 rounded" />
                    <div className="skeleton h-56 w-full rounded-xl" />
                </div>
            ))}
        </div>
    </div>
);

export default DashboardSkeleton;
