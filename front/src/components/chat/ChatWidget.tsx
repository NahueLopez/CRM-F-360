import React, { useEffect, useState, useRef } from "react";
import type { Conversation, ChatMessage } from "../../types/chat";
import { chatService } from "../../services/chatService";
import { authStore } from "../../auth/authStore";
import * as hub from "../../services/chatHub";

type Screen = "list" | "chat" | "newGroup" | "newDm";
type ChatUser = { id: number; fullName: string; email: string };

const ChatWidget: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [screen, setScreen] = useState<Screen>("list");
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
    const [typingUsers, setTypingUsers] = useState<Map<number, number>>(new Map()); // convId → userId
    const [totalUnread, setTotalUnread] = useState(0);
    // convId → latest readAt time from OTHER participants
    const [readReceipts, setReadReceipts] = useState<Map<number, string>>(new Map());
    // convIds where messages have been delivered to the other user
    const [deliveredConvs, setDeliveredConvs] = useState<Set<number>>(new Set());
    const [groupName, setGroupName] = useState("");
    const [groupMembers, setGroupMembers] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
    const activeConvRef = useRef<number | null>(null);
    const myId = authStore.user?.id ?? 0;

    // Notification sound via Web Audio API (no external files)
    const playNotificationSound = () => {
        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(830, ctx.currentTime);
            osc.frequency.setValueAtTime(1050, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch { /* Audio not supported */ }
    };

    // ── SignalR Setup ────────────────────────────────────
    useEffect(() => {
        const handleMessage = (msg: ChatMessage) => {
            setMessages(prev => {
                if (prev.length > 0 && prev[0]?.conversationId === msg.conversationId) {
                    return [...prev, msg];
                }
                return prev;
            });
            setConversations(prev => {
                const exists = prev.some(c => c.id === msg.conversationId);
                if (!exists) {
                    // New conversation — reload from API
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
            // Acknowledge delivery to the sender + play notification sound
            if (msg.senderId !== myId) {
                hub.acknowledgeDelivery(msg.conversationId).catch(() => { });
                // Only ding if not currently viewing that conversation
                if (activeConvRef.current !== msg.conversationId) {
                    playNotificationSound();
                }
            }
        };

        const handleTyping = (convId: number, userId: number) => {
            setTypingUsers(prev => new Map(prev).set(convId, userId));
            setTimeout(() => setTypingUsers(prev => { const m = new Map(prev); m.delete(convId); return m; }), 3000);
        };

        const handleOnline = (userId: number) => setOnlineUsers(prev => new Set(prev).add(userId));
        const handleOffline = (userId: number) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s; });

        const handleDelivered = (convId: number) => {
            setDeliveredConvs(prev => new Set(prev).add(convId));
        };

        const handleMessagesRead = (convId: number, _userId: number, readAt: string) => {
            setReadReceipts(prev => {
                const m = new Map(prev);
                const existing = m.get(convId);
                // Only update if this readAt is newer
                if (!existing || new Date(readAt) > new Date(existing)) {
                    m.set(convId, readAt);
                }
                return m;
            });
            // Also update conversations for unread count purposes
            setConversations(prev => prev.map(c =>
                c.id === convId
                    ? { ...c, participants: c.participants.map(p => p.userId === _userId ? { ...p, lastReadAt: readAt } : p) }
                    : c
            ));
        };

        hub.onReceiveMessage(handleMessage);
        hub.onUserTyping(handleTyping);
        hub.onUserOnline(handleOnline);
        hub.onUserOffline(handleOffline);
        hub.onMessagesRead(handleMessagesRead);
        hub.onMessageDelivered(handleDelivered);

        hub.startConnection()
            .then(() => hub.getOnlineUsers().then(ids => setOnlineUsers(new Set(ids))))
            .catch(err => console.error("[ChatHub] Connection failed:", err));

        return () => {
            hub.offReceiveMessage(handleMessage);
            hub.offUserTyping(handleTyping);
            hub.offMessagesRead(handleMessagesRead);
            hub.offMessageDelivered(handleDelivered);
        };
    }, [myId]);

    // ── Load conversations + unread on open ──────────────
    useEffect(() => {
        if (open) {
            loadConversations();
        }
    }, [open]);

    // Auto-load unread periodically
    useEffect(() => {
        const load = () => chatService.getTotalUnread()
            .then(r => { console.log("[Chat] unread response:", r); setTotalUnread(typeof r === 'number' ? r : (r as any).count ?? 0); })
            .catch(err => console.error("[Chat] unread error:", err));
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadConversations = async () => {
        try {
            const convs = await chatService.getConversations();
            console.log("[Chat] Loaded conversations:", convs.length);
            setConversations(convs);
            // Initialize readReceipts from API data for historical ✓✓
            setReadReceipts(prev => {
                const m = new Map(prev);
                const norm = (d: string) => d.endsWith('Z') ? d : d + 'Z';
                for (const c of convs) {
                    const others = c.participants.filter(p => p.userId !== myId);
                    // For ✓✓, ALL others must have read — use the MINIMUM lastReadAt
                    const readTimes = others.map(p => p.lastReadAt).filter(Boolean) as string[];
                    if (readTimes.length === others.length && readTimes.length > 0) {
                        const minRead = readTimes.reduce((a, b) => new Date(norm(a)) < new Date(norm(b)) ? a : b);
                        // Only set if no real-time receipt exists yet (don't overwrite newer data)
                        if (!m.has(c.id)) {
                            m.set(c.id, norm(minRead));
                        }
                    }
                }
                return m;
            });
        } catch (err) { console.error("[Chat] loadConversations error:", err); }

        try {
            const u = await chatService.getUsers();
            setUsers(u.filter((u: any) => u.id !== myId));
        } catch {
            // /api/users may require admin role — extract users from conversations instead
            setUsers(prev => prev.length > 0 ? prev : []);
        }
    };

    // ── Open a conversation ──────────────────────────────
    const openConversation = async (conv: Conversation) => {
        setActiveConv(conv);
        activeConvRef.current = conv.id;
        setScreen("chat");
        setLoading(true);
        // Join the SignalR group so we receive MessagesRead broadcasts
        await hub.joinConversation(conv.id).catch(() => { });
        try {
            const msgs = await chatService.getMessages(conv.id);
            console.log("[Chat] Messages loaded:", msgs.length);
            setMessages(msgs);
            // Only mark as read if there are actual messages to see
            if (msgs.length > 0) {
                await chatService.markRead(conv.id).catch(() => { });
                await hub.markRead(conv.id).catch(() => { });
            }
            setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
            setTotalUnread(prev => Math.max(0, prev - conv.unreadCount));
        } catch (err) { console.error("[Chat] openConversation error:", err); }
        setLoading(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    // ── Send message ─────────────────────────────────────
    const handleSend = async () => {
        if (!draft.trim() || !activeConv) return;
        const text = draft.trim();
        setDraft("");
        try {
            await hub.sendMessage(activeConv.id, text);
        } catch (err) {
            console.error("Send failed", err);
            setDraft(text);
        }
    };

    const closeWidget = () => {
        setOpen(false);
        setScreen("list");
        setActiveConv(null);
        activeConvRef.current = null;
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

    // ── Create DM ────────────────────────────────────────
    const startDm = async (userId: number) => {
        try {
            const conv = await chatService.getOrCreateDm(userId);
            await hub.joinConversation(conv.id);
            await loadConversations();
            openConversation(conv);
        } catch { /* ignore */ }
    };

    // ── Create Group ─────────────────────────────────────
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

    // ── Scroll to bottom on new messages ─────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Helpers ──────────────────────────────────────────
    const normDate = (iso: string) => new Date(iso.endsWith('Z') ? iso : iso + 'Z');

    const msgTime = (iso: string) => {
        const d = normDate(iso);
        const now = new Date();
        const hhmm = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
        // Same day → just HH:mm
        if (d.toDateString() === now.toDateString()) return hhmm;
        // This week → day + HH:mm
        const diff = now.getTime() - d.getTime();
        if (diff < 7 * 86400000) {
            const dayName = d.toLocaleDateString("es-AR", { weekday: "short" });
            return `${dayName} ${hhmm}`;
        }
        // Older → dd/mm HH:mm
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

    const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const isUserOnline = (uid: number) => onlineUsers.has(uid);

    // Normalize date strings — backend may omit the Z suffix causing local vs UTC mismatch
    const toUtcMs = (d: string) => new Date(d.endsWith('Z') ? d : d + 'Z').getTime();

    // 3-state receipt: 'sent' → 'delivered' → 'read'
    const getReceiptStatus = (msg: ChatMessage): 'sent' | 'delivered' | 'read' => {
        if (msg.senderId !== myId || !activeConv) return 'sent';
        // Check if read
        const receipt = readReceipts.get(activeConv.id);
        if (receipt && toUtcMs(receipt) >= toUtcMs(msg.sentAt)) return 'read';
        // Check if delivered
        if (deliveredConvs.has(activeConv.id)) return 'delivered';
        return 'sent';
    };

    const typingLabel = activeConv && typingUsers.has(activeConv.id)
        ? users.find(u => u.id === typingUsers.get(activeConv.id))?.fullName?.split(" ")[0] ?? "Alguien"
        : null;

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/25 hover:scale-105 transition-all flex items-center justify-center"
            >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {totalUnread > 9 ? "9+" : totalUnread}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="fixed bottom-5 right-5 z-50 w-[370px] h-[520px] bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden animate-in">
            {/* ── Header ────────────────────────── */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-slate-700/50 bg-slate-800/60 shrink-0">
                {screen === "list" && (
                    <>
                        <h3 className="text-sm font-semibold">💬 Chat</h3>
                        <div className="flex items-center gap-1">
                            <button onClick={() => { setScreen("newDm"); }} className="text-xs text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition" title="Nuevo mensaje">
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                            </button>
                            <button onClick={() => setScreen("newGroup")} className="text-xs text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition" title="Nuevo grupo">
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </button>
                            <button onClick={closeWidget} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition">✕</button>
                        </div>
                    </>
                )}
                {screen === "chat" && activeConv && (
                    <>
                        <button onClick={() => { setScreen("list"); setActiveConv(null); activeConvRef.current = null; }} className="text-slate-400 hover:text-white p-1 rounded transition mr-2">←</button>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{activeConv.isGroup ? "👥" : ""} {activeConv.name}</p>
                            {typingLabel ? (
                                <p className="text-[10px] text-indigo-400 animate-pulse">{typingLabel} escribiendo...</p>
                            ) : activeConv.isGroup ? (
                                <p className="text-[10px] text-slate-500">{activeConv.participants.length} miembros</p>
                            ) : (
                                <p className="text-[10px] text-slate-500">{isUserOnline(activeConv.participants.find(p => p.userId !== myId)?.userId ?? 0) ? "🟢 online" : "⚪ offline"}</p>
                            )}
                        </div>
                        <button onClick={closeWidget} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition">✕</button>
                    </>
                )}
                {(screen === "newDm" || screen === "newGroup") && (
                    <>
                        <button onClick={() => setScreen("list")} className="text-slate-400 hover:text-white p-1 rounded transition mr-2">←</button>
                        <h3 className="text-sm font-semibold flex-1">{screen === "newDm" ? "Nuevo mensaje" : "Nuevo grupo"}</h3>
                        <button onClick={closeWidget} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition">✕</button>
                    </>
                )}
            </div>

            {/* ── Conversation List ───────────────── */}
            {screen === "list" && (
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6">
                            <span className="text-4xl mb-3">💬</span>
                            <p className="text-sm text-slate-400">No tenés conversaciones aún</p>
                            <p className="text-[10px] text-slate-600 mt-1">Usá el botón + para iniciar un chat</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => openConversation(conv)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800/60 transition border-b border-slate-800/30 text-left"
                            >
                                <div className="relative shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${conv.isGroup ? "bg-violet-500/20 text-violet-400" : "bg-indigo-500/20 text-indigo-400"}`}>
                                        {conv.isGroup ? "👥" : getInitials(conv.name ?? "?")}
                                    </div>
                                    {!conv.isGroup && isUserOnline(conv.participants.find(p => p.userId !== myId)?.userId ?? 0) && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium truncate">{conv.name ?? "Chat"}</p>
                                        <span className="text-[10px] text-slate-500 shrink-0 ml-2">{relTime(conv.lastMessageAt)}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                        {conv.lastMessageContent
                                            ? `${conv.lastMessageSenderName?.split(" ")[0] ?? ""}: ${conv.lastMessageContent}`
                                            : "Sin mensajes"}
                                    </p>
                                </div>
                                {conv.unreadCount > 0 && (
                                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* ── Chat View ───────────────────────── */}
            {screen === "chat" && activeConv && (
                <>
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-center">
                                <p className="text-xs text-slate-500">Iniciá la conversación 👋</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = msg.senderId === myId;
                                const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.senderId !== msg.senderId);
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${showAvatar ? "mt-3" : "mt-0.5"}`}>
                                        {!isMe && showAvatar && (
                                            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300 mr-2 shrink-0 mt-1">
                                                {getInitials(msg.senderName)}
                                            </div>
                                        )}
                                        {!isMe && !showAvatar && <div className="w-7 mr-2 shrink-0" />}
                                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${isMe
                                            ? "bg-indigo-600 text-white rounded-br-md"
                                            : "bg-slate-800/80 text-slate-200 rounded-bl-md border border-slate-700/30"
                                            }`}>
                                            {!isMe && showAvatar && activeConv.isGroup && (
                                                <p className="text-[10px] text-indigo-400 font-medium mb-0.5">{msg.senderName.split(" ")[0]}</p>
                                            )}
                                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                            <p className={`text-[9px] mt-1 ${isMe ? "text-indigo-200/60" : "text-slate-600"} text-right flex items-center justify-end gap-1`}>
                                                {msgTime(msg.sentAt)}
                                                {isMe && (() => {
                                                    const status = getReceiptStatus(msg);
                                                    return (
                                                        <span className={status === 'read' ? 'text-emerald-400' : 'text-indigo-200/50'}>
                                                            {status === 'sent' ? '✓' : '✓✓'}
                                                        </span>
                                                    );
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="px-3 py-2 border-t border-slate-700/50 bg-slate-800/40">
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                value={draft}
                                onChange={e => { setDraft(e.target.value); handleTypingIndicator(); }}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribí un mensaje..."
                                rows={1}
                                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/50 text-sm placeholder:text-slate-600 resize-none max-h-20 focus:outline-none focus:border-indigo-500/50"
                                style={{ minHeight: "36px" }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!draft.trim()}
                                className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition shrink-0"
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" /></svg>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ── New DM ──────────────────────────── */}
            {screen === "newDm" && (
                <div className="flex-1 overflow-y-auto">
                    <p className="px-4 pt-3 pb-2 text-[10px] text-slate-500 uppercase tracking-wider">Seleccioná un usuario</p>
                    {users.map(u => (
                        <button
                            key={u.id}
                            onClick={() => startDm(u.id)}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-800/60 transition text-left"
                        >
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                                    {getInitials(u.fullName)}
                                </div>
                                {isUserOnline(u.id) && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{u.fullName}</p>
                                <p className="text-[10px] text-slate-500">{u.email}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* ── New Group ───────────────────────── */}
            {screen === "newGroup" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <input
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        placeholder="Nombre del grupo"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm placeholder:text-slate-500"
                    />

                    {/* Selected members chips */}
                    {groupMembers.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {groupMembers.map(uid => {
                                const u = users.find(u => u.id === uid);
                                return (
                                    <span key={uid} className="px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-[11px] flex items-center gap-1">
                                        {u?.fullName?.split(" ")[0]}
                                        <button onClick={() => setGroupMembers(prev => prev.filter(id => id !== uid))} className="hover:text-white">✕</button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Agregar miembros</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {users.filter(u => !groupMembers.includes(u.id)).map(u => (
                            <button
                                key={u.id}
                                onClick={() => setGroupMembers(prev => [...prev, u.id])}
                                className="w-full px-3 py-2 flex items-center gap-2 rounded-lg hover:bg-slate-800/60 transition text-left"
                            >
                                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300">
                                    {getInitials(u.fullName)}
                                </div>
                                <span className="text-sm">{u.fullName}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={createGroup}
                        disabled={!groupName.trim() || groupMembers.length === 0}
                        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-sm font-medium transition"
                    >
                        Crear grupo ({groupMembers.length + 1} miembros)
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
