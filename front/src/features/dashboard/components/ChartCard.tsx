/** Reusable chart card wrapper */
const ChartCard = ({
    title,
    subtitle,
    icon,
    children,
}: {
    title: string;
    subtitle?: string;
    icon?: string;
    children: React.ReactNode;
}) => (
    <div className="bg-slate-800/25 border border-slate-700/30 rounded-2xl p-5 transition-colors hover:border-slate-700/50">
        <div className="flex items-start justify-between mb-4">
            <div>
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    {icon && <span className="text-xs">{icon}</span>}
                    {title}
                </h4>
                {subtitle && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
                )}
            </div>
        </div>
        {children}
    </div>
);

/** Empty chart placeholder */
export const EmptyChart = ({ message }: { message: string }) => (
    <div className="h-48 flex flex-col items-center justify-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-lg opacity-40">
            📊
        </div>
        <p className="text-xs text-slate-600">{message}</p>
    </div>
);

export default ChartCard;
