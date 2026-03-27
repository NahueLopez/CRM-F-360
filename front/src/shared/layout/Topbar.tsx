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
    <header className="h-14 border-b border-slate-800 flex items-center justify-between px-3 sm:px-6 bg-slate-950 gap-2 sm:gap-4 relative z-40">
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

          {showNotifs && (() => {
            const isLight = document.body.classList.contains('light');
            const bg = isLight ? '#ffffff' : '#0f172a';
            const bgHover = isLight ? '#f1f5f9' : '#1e293b';
            const bgUnread = isLight ? '#eef2ff' : '#1e1b4b';
            const textTitle = isLight ? '#1e293b' : '#f1f5f9';
            const textTitleRead = isLight ? '#475569' : '#cbd5e1';
            const textMsg = isLight ? '#64748b' : '#94a3b8';
            const textTime = isLight ? '#94a3b8' : '#64748b';
            const textEmpty = isLight ? '#94a3b8' : '#64748b';
            const borderColor = isLight ? '#e2e8f0' : '#334155';
            const borderItem = isLight ? 'rgba(226,232,240,0.5)' : 'rgba(51,65,85,0.3)';
            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#818cf8';
            return (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.15)', zIndex: 9998 }} onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 top-full mt-1 w-80 rounded-xl shadow-2xl max-h-96 flex flex-col overflow-hidden"
                style={{ background: bg, border: `1px solid ${borderColor}`, isolation: 'isolate', zIndex: 9999 }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ background: bg, borderBottom: `1px solid ${borderColor}` }}>
                  <h4 className="text-sm font-semibold" style={{ color: textTitle }}>Notificaciones</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] hover:underline transition" style={{ color: accentColor }}>
                      Marcar todas leídas
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1" style={{ background: bg }}>
                  {notifications.length === 0 ? (
                    <p className="text-xs p-4 text-center" style={{ color: textEmpty }}>Sin notificaciones</p>
                  ) : notifications.map(n => (
                    <button key={n.id} onClick={() => markRead(n.id)}
                      className="w-full flex items-start gap-3 px-4 py-3 transition text-left"
                      style={{ background: !n.isRead ? bgUnread : bg, borderBottom: `1px solid ${borderItem}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = bgHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = !n.isRead ? bgUnread : bg)}>
                      <span className="text-base mt-0.5">{NOTIF_ICONS[n.type] ?? "ℹ️"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs" style={{ color: !n.isRead ? textTitle : textTitleRead, fontWeight: !n.isRead ? 600 : 400 }}>{n.title}</p>
                        {n.message && <p className="text-[10px] mt-0.5 truncate" style={{ color: textMsg }}>{n.message}</p>}
                        <p className="text-[9px] mt-1" style={{ color: textTime }}>
                          {new Date(n.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {!n.isRead && <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: accentColor }} />}
                    </button>
                  ))}
                </div>
              </div>
            </>
            );
          })()}
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
