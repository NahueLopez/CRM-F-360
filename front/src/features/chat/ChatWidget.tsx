import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import type { Conversation, ChatMessage } from "./types";
import { chatService } from "./chatService";
import { authStore } from "../../shared/auth/authStore";
import * as hub from "./chatHub";

type Screen = "list" | "chat" | "newGroup" | "newDm";
type ChatUser = { id: number; fullName: string; email: string };

// Optimistic message type
interface OptimisticMessage extends ChatMessage {
    _optimistic?: boolean;
    _failed?: boolean;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "👏", "🎉", "💯", "✅"];

const ChatWidget: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [closing, setClosing] = useState(false); // for close animation
    const [expanded, setExpanded] = useState(false);
    const [screen, setScreen] = useState<Screen>("list");
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<OptimisticMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
    const [typingUsers, setTypingUsers] = useState<Map<number, number>>(new Map());
    const [totalUnread, setTotalUnread] = useState(0);
    const [readReceipts, setReadReceipts] = useState<Map<number, string>>(new Map());
    const [deliveredConvs, setDeliveredConvs] = useState<Set<number>>(new Set());
    const [groupName, setGroupName] = useState("");
    const [groupMembers, setGroupMembers] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);
    const [newMsgCount, setNewMsgCount] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
    const activeConvRef = useRef<number | null>(null);
    const myId = authStore.user?.id ?? 0;
    const audioCtxRef = useRef<AudioContext | null>(null);
    const optimisticIdRef = useRef(-1);

    // ── Notification Sound ──
    const playNotificationSound = useCallback(() => {
        try {
            if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(830, ctx.currentTime);
            osc.frequency.setValueAtTime(1050, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch { /* Audio not supported */ }
    }, []);

    // ── Smart Scroll ──
    const isNearBottom = useCallback(() => {
        const el = messagesContainerRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    }, []);

    const scrollToBottom = useCallback((smooth = true) => {
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
        });
        setShowNewMsgBtn(false);
        setNewMsgCount(0);
    }, []);

    // ── SignalR Setup ──
    useEffect(() => {
        const handleMessage = (msg: ChatMessage) => {
            setMessages(prev => {
                // Replace optimistic message if exists
                const withoutOptimistic = prev.filter(
                    m => !(m._optimistic && m.content === msg.content && m.senderId === msg.senderId)
                );
                if (withoutOptimistic.length > 0 && withoutOptimistic[0]?.conversationId === msg.conversationId) {
                    return [...withoutOptimistic, msg];
                }
                if (prev.length > 0 && prev[0]?.conversationId === msg.conversationId) {
                    return [...prev, msg];
                }
                return prev;
            });
            setConversations(prev => {
                const exists = prev.some(c => c.id === msg.conversationId);
                if (!exists) {
                    chatService.getConversations().then(convs => setConversations(convs)).catch(() => { });
                    return prev;
                }
                return prev.map(c =>
                    c.id === msg.conversationId
                        ? { ...c, lastMessageContent: msg.content, lastMessageSenderName: msg.senderName, lastMessageAt: msg.sentAt, unreadCount: msg.senderId !== myId ? c.unreadCount + 1 : c.unreadCount }
                        : c
                ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
            });
            setTotalUnread(prev => msg.senderId !== myId ? prev + 1 : prev);

            if (msg.senderId !== myId) {
                hub.acknowledgeDelivery(msg.conversationId).catch(() => { });
                if (activeConvRef.current !== msg.conversationId) {
                    playNotificationSound();
                } else if (!isNearBottom()) {
                    setShowNewMsgBtn(true);
                    setNewMsgCount(prev => prev + 1);
                }
            }

            // Auto-scroll only if near bottom
            if (isNearBottom()) {
                scrollToBottom();
            }
        };

        const handleTyping = (convId: number, userId: number) => {
            setTypingUsers(prev => new Map(prev).set(convId, userId));
            setTimeout(() => setTypingUsers(prev => { const m = new Map(prev); m.delete(convId); return m; }), 3000);
        };

        const handleOnline = (userId: number) => setOnlineUsers(prev => new Set(prev).add(userId));
        const handleOffline = (userId: number) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s; });
        const handleDelivered = (convId: number) => setDeliveredConvs(prev => new Set(prev).add(convId));

        const handleMessagesRead = (convId: number, _userId: number, readAt: string) => {
            setReadReceipts(prev => {
                const m = new Map(prev);
                const existing = m.get(convId);
                if (!existing || new Date(readAt) > new Date(existing)) m.set(convId, readAt);
                return m;
            });
            setConversations(prev => prev.map(c =>
                c.id === convId ? { ...c, participants: c.participants.map(p => p.userId === _userId ? { ...p, lastReadAt: readAt } : p) } : c
            ));
        };

        hub.onReceiveMessage(handleMessage);
        hub.onUserTyping(handleTyping);
        hub.onUserOnline(handleOnline);
        hub.onUserOffline(handleOffline);
        hub.onMessagesRead(handleMessagesRead);
        hub.onMessageDelivered(handleDelivered);

        hub.startConnection()
            .then(async () => {
                try {
                    const ids = await hub.getOnlineUsers();
                    setOnlineUsers(new Set(ids));
                } catch (e) {
                    console.warn("[ChatHub] getOnlineUsers failed, will retry:", e);
                }
            })
            .catch(err => console.error("[ChatHub] Connection failed:", err));

        return () => {
            hub.offReceiveMessage(handleMessage);
            hub.offUserTyping(handleTyping);
            hub.offMessagesRead(handleMessagesRead);
            hub.offMessageDelivered(handleDelivered);
        };
    }, [myId, playNotificationSound, isNearBottom, scrollToBottom]);

    // ── Load on open ──
    useEffect(() => {
        if (open) loadConversations();
    }, [open]);

    // ── Periodic unread ──
    useEffect(() => {
        const load = () => chatService.getTotalUnread()
            .then(r => setTotalUnread(typeof r === "number" ? r : (r as any).count ?? 0))
            .catch(() => { });
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadConversations = async () => {
        try {
            const convs = await chatService.getConversations();
            setConversations(convs);
            setReadReceipts(prev => {
                const m = new Map(prev);
                const norm = (d: string) => d.endsWith("Z") ? d : d + "Z";
                for (const c of convs) {
                    const others = c.participants.filter(p => p.userId !== myId);
                    const readTimes = others.map(p => p.lastReadAt).filter(Boolean) as string[];
                    if (readTimes.length === others.length && readTimes.length > 0) {
                        const minRead = readTimes.reduce((a, b) => new Date(norm(a)) < new Date(norm(b)) ? a : b);
                        if (!m.has(c.id)) m.set(c.id, norm(minRead));
                    }
                }
                return m;
            });
        } catch (err) { console.error("[Chat] loadConversations error:", err); }

        try {
            const u = await chatService.getUsers();
            setUsers(u.filter((u: any) => u.id !== myId));
        } catch {
            setUsers(prev => prev.length > 0 ? prev : []);
        }
    };

    // ── Open conversation ──
    const openConversation = async (conv: Conversation) => {
        setActiveConv(conv);
        activeConvRef.current = conv.id;
        setScreen("chat");
        setLoading(true);
        setReplyTo(null);
        await hub.joinConversation(conv.id).catch(() => { });
        try {
            const msgs = await chatService.getMessages(conv.id);
            setMessages(msgs);
            if (msgs.length > 0) {
                await chatService.markRead(conv.id).catch(() => { });
                await hub.markRead(conv.id).catch(() => { });
            }
            setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
            setTotalUnread(prev => Math.max(0, prev - conv.unreadCount));
        } catch (err) { console.error("[Chat] openConversation error:", err); }
        setLoading(false);
        setTimeout(() => scrollToBottom(false), 50);
    };

    // ── Send message (optimistic) ──
    const handleSend = async () => {
        if (!draft.trim() || !activeConv) return;
        const text = draft.trim();
        const replyContent = replyTo ? `> ${replyTo.senderName.split(" ")[0]}: ${replyTo.content.slice(0, 80)}\n\n${text}` : text;
        setDraft("");
        setReplyTo(null);
        setShowEmojiPicker(false);

        // Add optimistic message
        const optimisticMsg: OptimisticMessage = {
            id: optimisticIdRef.current--,
            conversationId: activeConv.id,
            senderId: myId,
            senderName: authStore.user?.fullName ?? "Yo",
            content: replyContent,
            sentAt: new Date().toISOString(),
            _optimistic: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);
        scrollToBottom();

        // Auto-resize textarea back
        if (inputRef.current) {
            inputRef.current.style.height = "38px";
        }

        try {
            await hub.sendMessage(activeConv.id, replyContent);
        } catch {
            // Mark as failed
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, _failed: true } : m));
        }
    };

    // ── Widget open/close ──
    const handleClose = () => {
        setClosing(true);
        setTimeout(() => {
            setOpen(false);
            setClosing(false);
            setScreen("list");
            setActiveConv(null);
            activeConvRef.current = null;
            setSearchQuery("");
        }, 200);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTypingIndicator = () => {
        if (!activeConv) return;
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        hub.sendTyping(activeConv.id).catch(() => { });
        typingTimeout.current = setTimeout(() => { }, 3000);
    };

    // ── Auto-resize textarea ──
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraft(e.target.value);
        handleTypingIndicator();
        // Auto-resize
        const el = e.target;
        el.style.height = "38px";
        el.style.height = Math.min(el.scrollHeight, 120) + "px";
    };

    // ── Create DM ──
    const startDm = async (userId: number) => {
        try {
            const conv = await chatService.getOrCreateDm(userId);
            await hub.joinConversation(conv.id);
            await loadConversations();
            openConversation(conv);
        } catch { /* ignore */ }
    };

    // ── Create Group ──
    const createGroup = async () => {
        if (!groupName.trim() || groupMembers.length === 0) return;
        try {
            const conv = await chatService.createGroup(groupName, groupMembers);
            await hub.joinConversation(conv.id);
            setGroupName("");
            setGroupMembers([]);
            await loadConversations();
            openConversation(conv);
        } catch { /* ignore */ }
    };

    // ── Scroll listener ──
    useEffect(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const handler = () => {
            if (isNearBottom()) {
                setShowNewMsgBtn(false);
                setNewMsgCount(0);
            }
        };
        el.addEventListener("scroll", handler);
        return () => el.removeEventListener("scroll", handler);
    }, [isNearBottom, screen]);

    // ── Helpers ──
    const normDate = (iso: string) => new Date(iso.endsWith("Z") ? iso : iso + "Z");
    const toUtcMs = (d: string) => new Date(d.endsWith("Z") ? d : d + "Z").getTime();

    const msgTime = (iso: string) => {
        const d = normDate(iso);
        const now = new Date();
        const hhmm = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
        if (d.toDateString() === now.toDateString()) return hhmm;
        const diff = now.getTime() - d.getTime();
        if (diff < 7 * 86400000) return d.toLocaleDateString("es-AR", { weekday: "short" }) + " " + hhmm;
        return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) + " " + hhmm;
    };

    const relTime = (iso: string) => {
        const d = normDate(iso);
        const diff = Date.now() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "ahora";
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d`;
        return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
    };

    const dateSeparator = (iso: string) => {
        const d = normDate(iso);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) return "Hoy";
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return "Ayer";
        const diff = now.getTime() - d.getTime();
        if (diff < 7 * 86400000) return d.toLocaleDateString("es-AR", { weekday: "long" });
        return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
    };

    const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const isUserOnline = (uid: number) => onlineUsers.has(uid);

    const getReceiptStatus = (msg: OptimisticMessage): "sending" | "sent" | "delivered" | "read" | "failed" => {
        if (msg._failed) return "failed";
        if (msg._optimistic) return "sending";
        if (msg.senderId !== myId || !activeConv) return "sent";
        const receipt = readReceipts.get(activeConv.id);
        if (receipt && toUtcMs(receipt) >= toUtcMs(msg.sentAt)) return "read";
        if (deliveredConvs.has(activeConv.id)) return "delivered";
        return "sent";
    };

    const typingLabel = activeConv && typingUsers.has(activeConv.id)
        ? users.find(u => u.id === typingUsers.get(activeConv.id))?.fullName?.split(" ")[0] ?? "Alguien"
        : null;

    // ── Filtered conversations ──
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter(c =>
            c.name?.toLowerCase().includes(q) ||
            c.lastMessageContent?.toLowerCase().includes(q)
        );
    }, [conversations, searchQuery]);

    // ── Messages with date separators ──
    const messagesWithDates = useMemo(() => {
        const result: { type: "date" | "msg"; date?: string; msg?: OptimisticMessage }[] = [];
        let lastDate = "";
        for (const msg of messages) {
            const d = normDate(msg.sentAt).toDateString();
            if (d !== lastDate) {
                result.push({ type: "date", date: dateSeparator(msg.sentAt) });
                lastDate = d;
            }
            result.push({ type: "msg", msg });
        }
        return result;
    }, [messages]);

    // Widget sizes
    const widgetW = expanded ? "w-[600px]" : "w-[380px]";
    const widgetH = expanded ? "h-[680px]" : "h-[540px]";

    // ── CLOSED STATE ──
    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="chat-fab fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group"
            >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="group-hover:rotate-12 transition-transform">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900 animate-bounce">
                        {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                )}
            </button>
        );
    }

    // ── Receipt icon ──
    const ReceiptIcon = ({ status }: { status: string }) => {
        if (status === "sending") return <span className="text-slate-400 text-[9px]">⏳</span>;
        if (status === "failed") return <span className="text-red-400 text-[9px]" title="Error al enviar">⚠️</span>;
        if (status === "read") return <span className="text-emerald-400">✓✓</span>;
        if (status === "delivered") return <span className="text-indigo-200/50">✓✓</span>;
        return <span className="text-indigo-200/50">✓</span>;
    };

    return (
        <div className={`fixed bottom-5 right-5 z-50 ${widgetW} ${widgetH} flex flex-col overflow-hidden
            bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl
            shadow-2xl shadow-black/50
            ${closing ? "chat-widget-close" : "chat-widget-open"}
            transition-[width,height] duration-300 ease-out`}
        >
            {/* ── Header ── */}
            <div className="px-4 h-13 flex items-center justify-between border-b border-slate-700/40 bg-gradient-to-r from-slate-800/80 to-slate-800/40 shrink-0">
                {screen === "list" && (
                    <>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h3 className="text-sm font-semibold tracking-tight">Mensajes</h3>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <button onClick={() => setScreen("newDm")} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all" title="Nuevo mensaje directo">
                                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                            </button>
                            <button onClick={() => setScreen("newGroup")} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all" title="Nuevo grupo">
                                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </button>
                            <button onClick={() => setExpanded(!expanded)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all" title={expanded ? "Reducir" : "Expandir"}>
                                {expanded ? (
                                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" /></svg>
                                ) : (
                                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                                )}
                            </button>
                            <button onClick={handleClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/20 transition-all">
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </>
                )}
                {screen === "chat" && activeConv && (
                    <>
                        <button onClick={() => { setScreen("list"); setActiveConv(null); activeConvRef.current = null; setReplyTo(null); }} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all mr-2">
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate leading-tight">{activeConv.isGroup ? "👥 " : ""}{activeConv.name}</p>
                            {typingLabel ? (
                                <p className="text-[10px] text-indigo-400 flex items-center gap-1 leading-tight mt-0.5">
                                    <span className="inline-flex gap-0.5"><span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} /><span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} /><span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} /></span>
                                    {typingLabel} escribiendo
                                </p>
                            ) : activeConv.isGroup ? (
                                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{activeConv.participants.length} miembros</p>
                            ) : (
                                <p className="text-[10px] leading-tight mt-0.5">
                                    {isUserOnline(activeConv.participants.find(p => p.userId !== myId)?.userId ?? 0)
                                        ? <span className="text-emerald-400">● en línea</span>
                                        : <span className="text-slate-500">○ desconectado</span>}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-0.5">
                            <button onClick={() => setExpanded(!expanded)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all" title={expanded ? "Reducir" : "Expandir"}>
                                {expanded ? (
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" /></svg>
                                ) : (
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                                )}
                            </button>
                            <button onClick={handleClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/20 transition-all">
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </>
                )}
                {(screen === "newDm" || screen === "newGroup") && (
                    <>
                        <button onClick={() => setScreen("list")} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all mr-2">
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        </button>
                        <h3 className="text-sm font-semibold flex-1">{screen === "newDm" ? "Nuevo mensaje" : "Nuevo grupo"}</h3>
                        <button onClick={handleClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/20 transition-all">
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                    </>
                )}
            </div>

            {/* ── Conversation List ── */}
            {screen === "list" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Search */}
                    <div className="px-3 py-2 shrink-0">
                        <div className="relative">
                            <svg width="14" height="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Buscar conversación..."
                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/30 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
                                    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                </div>
                                <p className="text-sm text-slate-400 font-medium">{searchQuery ? "Sin resultados" : "Sin conversaciones"}</p>
                                <p className="text-[11px] text-slate-600 mt-1">{searchQuery ? "Intentá con otro término" : "Tocá ✏️ para iniciar un chat"}</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const otherUser = conv.participants.find(p => p.userId !== myId);
                                const online = !conv.isGroup && isUserOnline(otherUser?.userId ?? 0);
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => openConversation(conv)}
                                        className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-800/50 active:bg-slate-800/70 transition-all text-left group"
                                    >
                                        <div className="relative shrink-0">
                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-105 ${conv.isGroup ? "bg-gradient-to-br from-violet-500/25 to-purple-600/25 text-violet-400" : "bg-gradient-to-br from-indigo-500/25 to-blue-600/25 text-indigo-400"}`}>
                                                {conv.isGroup ? "👥" : getInitials(conv.name ?? "?")}
                                            </div>
                                            {online && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-[2.5px] border-slate-900 shadow-sm shadow-emerald-500/50" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[13px] font-semibold truncate">{conv.name ?? "Chat"}</p>
                                                <span className="text-[10px] text-slate-500 shrink-0 tabular-nums">{relTime(conv.lastMessageAt)}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-tight">
                                                {conv.lastMessageContent
                                                    ? <><span className="text-slate-400">{conv.lastMessageSenderName?.split(" ")[0]}:</span> {conv.lastMessageContent}</>
                                                    : <span className="italic">Sin mensajes aún</span>}
                                            </p>
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <span className="min-w-5 h-5 px-1.5 rounded-full bg-indigo-600 text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/30">
                                                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* ── Chat View ── */}
            {screen === "chat" && activeConv && (
                <>
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 relative">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center mb-3">
                                    <span className="text-2xl">👋</span>
                                </div>
                                <p className="text-sm text-slate-400">Enviá el primer mensaje</p>
                                <p className="text-[10px] text-slate-600 mt-1">Iniciá la conversación con {activeConv.name}</p>
                            </div>
                        ) : (
                            messagesWithDates.map((item, idx) => {
                                if (item.type === "date") {
                                    return (
                                        <div key={`date-${idx}`} className="flex items-center gap-3 my-4">
                                            <div className="flex-1 h-px bg-slate-700/40" />
                                            <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-800/60 shrink-0">{item.date}</span>
                                            <div className="flex-1 h-px bg-slate-700/40" />
                                        </div>
                                    );
                                }
                                const msg = item.msg!;
                                const isMe = msg.senderId === myId;
                                const prevMsg = idx > 0 ? messagesWithDates[idx - 1] : null;
                                const showAvatar = !isMe && (prevMsg?.type === "date" || (prevMsg?.type === "msg" && prevMsg.msg?.senderId !== msg.senderId));
                                const status = getReceiptStatus(msg);
                                const isReplyMsg = msg.content.startsWith("> ");

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMe ? "justify-end" : "justify-start"} ${showAvatar ? "mt-3" : "mt-0.5"} group/msg`}
                                    >
                                        {!isMe && showAvatar && (
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300 mr-2 shrink-0 mt-1">
                                                {getInitials(msg.senderName)}
                                            </div>
                                        )}
                                        {!isMe && !showAvatar && <div className="w-7 mr-2 shrink-0" />}
                                        <div className="relative max-w-[78%]">
                                            {/* Reply action */}
                                            <button
                                                onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                                                className={`absolute top-1 ${isMe ? "-left-8" : "-right-8"} opacity-0 group-hover/msg:opacity-100 p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-700/60 transition-all`}
                                                title="Responder"
                                            >
                                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 17H4V12" /><path d="M4 17L15 6" /><path d="M15 6h5v5" /></svg>
                                            </button>

                                            <div className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed transition-all ${msg._optimistic && !msg._failed ? "opacity-70" : ""
                                                } ${msg._failed ? "opacity-60 ring-1 ring-red-500/50" : ""} ${isMe
                                                    ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-md shadow-sm shadow-indigo-500/20"
                                                    : "bg-slate-800/80 text-slate-200 rounded-bl-md border border-slate-700/30"
                                                }`}>
                                                {!isMe && showAvatar && activeConv.isGroup && (
                                                    <p className="text-[10px] text-indigo-400 font-semibold mb-0.5">{msg.senderName.split(" ")[0]}</p>
                                                )}
                                                {/* Quote/reply block */}
                                                {isReplyMsg && (() => {
                                                    const lines = msg.content.split("\n");
                                                    const quoteLine = lines[0].replace(/^>\s*/, "");
                                                    const restContent = lines.slice(2).join("\n");
                                                    return (
                                                        <>
                                                            <div className={`text-[11px] mb-1.5 pl-2 border-l-2 ${isMe ? "border-indigo-300/40 text-indigo-200/70" : "border-slate-600 text-slate-400"} py-0.5`}>
                                                                {quoteLine}
                                                            </div>
                                                            <p className="whitespace-pre-wrap break-words">{restContent}</p>
                                                        </>
                                                    );
                                                })()}
                                                {!isReplyMsg && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                                                <div className={`text-[9px] mt-1 ${isMe ? "text-indigo-200/50" : "text-slate-600"} text-right flex items-center justify-end gap-1`}>
                                                    {msgTime(msg.sentAt)}
                                                    {isMe && <ReceiptIcon status={status} />}
                                                </div>
                                            </div>
                                            {msg._failed && (
                                                <button onClick={handleSend} className="text-[10px] text-red-400 hover:text-red-300 mt-0.5 ml-1 transition-colors">
                                                    Reintentar envío
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />

                        {/* New messages button */}
                        {showNewMsgBtn && (
                            <button
                                onClick={() => scrollToBottom()}
                                className="sticky bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-medium shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all flex items-center gap-1.5 z-10"
                            >
                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
                                {newMsgCount} {newMsgCount === 1 ? "mensaje nuevo" : "mensajes nuevos"}
                            </button>
                        )}
                    </div>

                    {/* Reply banner */}
                    {replyTo && (
                        <div className="px-3 py-2 bg-slate-800/70 border-t border-slate-700/30 flex items-center gap-2 shrink-0">
                            <div className="w-1 h-8 rounded-full bg-indigo-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-indigo-400 font-semibold">{replyTo.senderName.split(" ")[0]}</p>
                                <p className="text-[11px] text-slate-400 truncate">{replyTo.content}</p>
                            </div>
                            <button onClick={() => setReplyTo(null)} className="p-1 rounded text-slate-500 hover:text-white transition-colors shrink-0">
                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                    )}

                    {/* Emoji picker */}
                    {showEmojiPicker && (
                        <div className="px-3 py-2 bg-slate-800/50 border-t border-slate-700/30 shrink-0">
                            <div className="flex items-center gap-1 flex-wrap">
                                {QUICK_EMOJIS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => { setDraft(prev => prev + emoji); setShowEmojiPicker(false); inputRef.current?.focus(); }}
                                        className="w-9 h-9 rounded-lg hover:bg-slate-700/60 flex items-center justify-center text-lg transition-all hover:scale-110 active:scale-95"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="px-3 py-2 border-t border-slate-700/40 bg-slate-800/30 shrink-0">
                        <div className="flex items-end gap-2">
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all ${showEmojiPicker ? "bg-indigo-600/20 text-indigo-400" : "text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"}`}
                            >
                                <span className="text-lg">😊</span>
                            </button>
                            <textarea
                                ref={inputRef}
                                value={draft}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribí un mensaje..."
                                rows={1}
                                className="flex-1 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/40 text-[13px] placeholder:text-slate-600 resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                style={{ minHeight: "38px", maxHeight: "120px" }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!draft.trim()}
                                className="w-9 h-9 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-all active:scale-90 shadow-sm shadow-indigo-500/20"
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" /></svg>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ── New DM ── */}
            {screen === "newDm" && (
                <div className="flex-1 overflow-y-auto">
                    <p className="px-4 pt-3 pb-2 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Seleccioná un usuario</p>
                    {users.map(u => (
                        <button
                            key={u.id}
                            onClick={() => startDm(u.id)}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-800/50 active:bg-slate-800/70 transition-all text-left group"
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/25 to-blue-600/25 flex items-center justify-center text-xs font-bold text-indigo-400 transition-transform group-hover:scale-105">
                                    {getInitials(u.fullName)}
                                </div>
                                {isUserOnline(u.id) && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium truncate">{u.fullName}</p>
                                <p className="text-[10px] text-slate-500">{u.email}</p>
                            </div>
                            {isUserOnline(u.id) && <span className="text-[9px] text-emerald-400 font-medium">online</span>}
                        </button>
                    ))}
                </div>
            )}

            {/* ── New Group ── */}
            {screen === "newGroup" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <input
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        placeholder="Nombre del grupo"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40 transition-colors"
                    />

                    {groupMembers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {groupMembers.map(uid => {
                                const u = users.find(u => u.id === uid);
                                return (
                                    <span key={uid} className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 text-[11px] font-medium flex items-center gap-1.5 border border-indigo-500/20">
                                        {u?.fullName?.split(" ")[0]}
                                        <button onClick={() => setGroupMembers(prev => prev.filter(id => id !== uid))} className="hover:text-white transition-colors">
                                            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Agregar miembros</p>
                    <div className="space-y-0.5 max-h-48 overflow-y-auto">
                        {users.filter(u => !groupMembers.includes(u.id)).map(u => (
                            <button
                                key={u.id}
                                onClick={() => setGroupMembers(prev => [...prev, u.id])}
                                className="w-full px-3 py-2 flex items-center gap-2.5 rounded-xl hover:bg-slate-800/50 transition-all text-left"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300">
                                    {getInitials(u.fullName)}
                                </div>
                                <span className="text-sm">{u.fullName}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={createGroup}
                        disabled={!groupName.trim() || groupMembers.length === 0}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-30 text-sm font-medium transition-all shadow-sm shadow-indigo-500/20 active:scale-[0.98]"
                    >
                        Crear grupo ({groupMembers.length + 1} miembros)
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
