import { useState } from "react";
import { useRooms, useCreateRoom, useDeleteRoom } from "../../shared/hooks/useRoomQuery";
import { useToast } from "../../shared/context/ToastContext";
import { authStore } from "../../shared/auth/authStore";
import type { Room, CreateRoomDto } from "./types";

/* ── Constants ── */
const AMENITY_OPTIONS = ["Proyector", "TV", "Pizarra", "WiFi", "Aire acondicionado", "Webcam", "Teléfono", "Monitor extra"];
const AMENITY_ICONS: Record<string, string> = {
    Proyector: "📽️", TV: "📺", Pizarra: "📝", WiFi: "📶",
    "Aire acondicionado": "❄️", Webcam: "📷", Teléfono: "📞", "Monitor extra": "🖥️",
};
const COLOR_OPTIONS = ["#818cf8", "#22d3ee", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#fb7185", "#94a3b8"];

/* ── Page ── */
const RoomsPage = () => {
    const { addToast } = useToast();
    const isManager = authStore.hasAnyRole("Admin", "Manager");

    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const { data: rooms = [], isLoading } = useRooms();
    const createRoom = useCreateRoom();
    const deleteRoom = useDeleteRoom();

    const handleCreateRoom = async (dto: CreateRoomDto) => {
        try {
            await createRoom.mutateAsync(dto);
            addToast("success", "Sala creada correctamente");
            setShowCreateRoom(false);
        } catch { addToast("error", "Error al crear la sala"); }
    };

    const handleDeleteRoom = async (id: number) => {
        if (!confirm("¿Eliminar esta sala?")) return;
        try {
            await deleteRoom.mutateAsync(id);
            addToast("success", "Sala eliminada");
        } catch { addToast("error", "Error al eliminar"); }
    };

    if (isLoading) return <RoomsSkeleton />;

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Salas</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Gestioná las salas de reuniones. Para reservar, usá el <span className="text-indigo-400">Calendario</span>.
                    </p>
                </div>
                {isManager && (
                    <button
                        onClick={() => setShowCreateRoom(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all active:scale-[0.97] shadow-sm shadow-indigo-500/20"
                    >
                        + Nueva sala
                    </button>
                )}
            </div>

            {/* ── Room Cards ── */}
            {rooms.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-3xl mx-auto mb-4 opacity-40">🏢</div>
                    <p className="text-slate-500 text-sm">No hay salas creadas todavía</p>
                    {isManager && (
                        <button onClick={() => setShowCreateRoom(true)} className="mt-3 text-indigo-400 text-sm hover:underline">
                            Crear la primera sala →
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {rooms.map((room) => (
                        <RoomCard
                            key={room.id}
                            room={room}
                            onDelete={isManager ? () => handleDeleteRoom(room.id) : undefined}
                        />
                    ))}
                </div>
            )}

            {/* ── Create Modal ── */}
            {showCreateRoom && (
                <CreateRoomModal
                    onSubmit={handleCreateRoom}
                    onClose={() => setShowCreateRoom(false)}
                    loading={createRoom.isPending}
                />
            )}
        </div>
    );
};

/* ═══════════ Sub-components ═══════════ */

const RoomCard = ({
    room,
    onDelete,
}: {
    room: Room;
    onDelete?: () => void;
}) => (
    <div
        className="group relative bg-slate-800/25 border border-slate-700/30 rounded-2xl p-5 hover:border-slate-700/60 transition-all"
        style={{ borderTopColor: room.color ?? "#818cf8", borderTopWidth: 3 }}
    >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
            <div>
                <h4 className="text-sm font-semibold text-slate-200">{room.name}</h4>
                {room.location && (
                    <p className="text-[10px] text-slate-500 mt-0.5">📍 {room.location}</p>
                )}
            </div>
            <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${room.isOccupied
                    ? "bg-red-500/15 text-red-400 border border-red-500/30"
                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    }`}
            >
                {room.isOccupied ? "Ocupada" : "Libre"}
            </span>
        </div>

        {/* Capacity */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-3">
            <span>👥</span>
            <span>{room.capacity} {room.capacity === 1 ? "persona" : "personas"}</span>
        </div>

        {/* Current reservation */}
        {room.isOccupied && room.currentReservationTitle && (
            <p className="text-[10px] text-indigo-400/80 mb-3 truncate">
                🔒 {room.currentReservationTitle}
            </p>
        )}

        {/* Amenities */}
        {room.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
                {room.amenities.map((a) => (
                    <span
                        key={a}
                        className="text-[10px] bg-slate-700/40 text-slate-400 px-2 py-0.5 rounded-md"
                        title={a}
                    >
                        {AMENITY_ICONS[a] ?? "📦"} {a}
                    </span>
                ))}
            </div>
        )}

        {/* Description */}
        {room.description && (
            <p className="text-[10px] text-slate-500 mb-3 line-clamp-2">{room.description}</p>
        )}

        {/* Actions (admin only) */}
        {onDelete && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/30">
                <button
                    onClick={onDelete}
                    className="text-xs text-slate-600 hover:text-red-400 transition px-2 py-1.5 rounded-lg hover:bg-red-500/10"
                    title="Eliminar sala"
                >
                    🗑️ Eliminar
                </button>
            </div>
        )}
    </div>
);

/* ── Create Room Modal ── */
const CreateRoomModal = ({
    onSubmit,
    onClose,
    loading,
}: {
    onSubmit: (dto: CreateRoomDto) => void;
    onClose: () => void;
    loading: boolean;
}) => {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [capacity, setCapacity] = useState(4);
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(COLOR_OPTIONS[0]);
    const [amenities, setAmenities] = useState<string[]>([]);

    const toggleAmenity = (a: string) =>
        setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
            <div className="relative bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-base font-semibold mb-4">Nueva sala</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Nombre *</label>
                        <input value={name} onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Sala de reuniones A" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Ubicación</label>
                            <input value={location} onChange={(e) => setLocation(e.target.value)}
                                className="mt-1 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Piso 3" />
                        </div>
                        <div>
                            <label className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Capacidad</label>
                            <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(+e.target.value)}
                                className="mt-1 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Color</label>
                        <div className="flex gap-2 mt-1.5">
                            {COLOR_OPTIONS.map((c) => (
                                <button key={c} onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-lg border-2 transition-all ${c === color ? "border-white scale-110" : "border-transparent"}`}
                                    style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Amenities</label>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {AMENITY_OPTIONS.map((a) => (
                                <button key={a} onClick={() => toggleAmenity(a)}
                                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${amenities.includes(a)
                                        ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                                        : "bg-slate-700/30 border-slate-700/50 text-slate-500 hover:text-slate-400"
                                        }`}>
                                    {AMENITY_ICONS[a]} {a}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Descripción</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                            className="mt-1 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="Notas adicionales..." />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-sm font-medium text-slate-300 hover:bg-slate-700 transition">
                        Cancelar
                    </button>
                    <button onClick={() => onSubmit({ name, location: location || undefined, capacity, description: description || undefined, color, amenities: amenities.length ? amenities : undefined })}
                        disabled={!name.trim() || loading}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? "Creando..." : "Crear sala"}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ── Skeleton ── */
const RoomsSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="flex justify-between">
            <div className="space-y-2">
                <div className="skeleton h-7 w-32 rounded-lg" />
                <div className="skeleton h-4 w-56 rounded-lg" />
            </div>
            <div className="skeleton h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-700/30 bg-slate-800/30 p-5 space-y-3">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                    <div className="skeleton h-16 w-full rounded-xl" />
                </div>
            ))}
        </div>
    </div>
);

export default RoomsPage;
