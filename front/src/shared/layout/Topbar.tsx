import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStore } from "../auth/authStore";
import { notificationService } from "../../features/notifications/notificationService";
import { searchService } from "../../features/search/searchService";
import type { Notification } from "../../features/notifications/types";
import type { SearchResult } from "../../features/search/types";
import { useSidebar } from "./Sidebar";

interface TopbarProps {
  title: string;
}

const TYPE_ICONS: Record<string, string> = {
  Company: "🏢", Contact: "👤", Project: "📁", Task: "✅", Deal: "💰",
};

const NOTIF_ICONS: Record<string, string> = {
  TaskAssigned: "📋", TaskCommented: "💬", ProjectAdded: "📁",
  TaskOverdue: "⚠️", ReminderDue: "⏰", DealStageChanged: "💰", Info: "ℹ️",
};

const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const navigate = useNavigate();
  const { setMobileOpen } = useSidebar();

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await searchService.search(q);
      setSearchResults(res);
      setShowSearch(true);
    } catch { setSearchResults([]); }
  }, []);

  const onSearchInput = (val: string) => {
    setSearchQuery(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(val), 300);
  };

  // ── Notifications ──
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifsRef = useRef<HTMLDivElement>(null);

  const loadNotifs = useCallback(async () => {
    try {
      const [list, { count }] = await Promise.all([
        notificationService.getMine(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadNotifs(); const id = setInterval(loadNotifs, 30_000); return () => clearInterval(id); }, [loadNotifs]);

  const markRead = async (id: number) => {
    await notificationService.markAsRead(id);
    loadNotifs();
  };
  const markAllRead = async () => {
    await notificationService.markAllAsRead();
    loadNotifs();
  };

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-14 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between px-3 sm:px-6 bg-slate-950/70 dark:bg-slate-950/70 backdrop-blur gap-2 sm:gap-4">
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
        aria-label="Abrir menú"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h14M3 10h14M3 14h14" />
        </svg>
      </button>
      <h2 className="text-lg font-semibold shrink-0 truncate">{title}</h2>

      {/* Search bar */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
        <div className="flex items-center bg-slate-800/60 rounded-lg border border-slate-700/50 px-3 py-1.5">
          <span className="text-slate-500 text-sm mr-2">🔍</span>
          <input
            value={searchQuery}
            onChange={e => onSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearch(true)}
            placeholder="Buscar empresas, contactos, proyectos..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-slate-500"
            aria-label="Buscar en el CRM"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setSearchResults([]); setShowSearch(false); }}
              className="text-slate-500 hover:text-slate-300 text-xs ml-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Limpiar búsqueda">✕</button>
          )}
        </div>

        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
            {searchResults.map((r, i) => (
              <button key={`${r.type}-${r.id}-${i}`}
                onClick={() => { if (r.link) navigate(r.link); setShowSearch(false); setSearchQuery(""); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition text-left"
              >
                <span className="text-lg">{TYPE_ICONS[r.type] ?? "📄"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-[10px] text-slate-500">{r.type}{r.subtitle && ` · ${r.subtitle}`}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">

        {/* Notifications */}
        <div ref={notifsRef} className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition text-lg relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
            aria-expanded={showNotifs}>
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-slate-950 !bg-opacity-100 !opacity-100 isolate border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl z-50 max-h-96 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-transparent">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notificaciones</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline">
                    Marcar todas leídas
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center">Sin notificaciones</p>
                ) : notifications.map(n => (
                  <button key={n.id} onClick={() => markRead(n.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition text-left border-b border-black/5 dark:border-white/5 last:border-0 ${!n.isRead ? "bg-indigo-500/10 dark:bg-indigo-500/10" : ""}`}>
                    <span className="text-base mt-0.5">{NOTIF_ICONS[n.type] ?? "ℹ️"}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs ${!n.isRead ? "font-semibold text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"}`}>{n.title}</p>
                      {n.message && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{n.message}</p>}
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                        {new Date(n.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {authStore.user && (
          <div className="flex items-center gap-2 text-xs text-slate-400 ml-1">
            <span>{authStore.user.email}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
