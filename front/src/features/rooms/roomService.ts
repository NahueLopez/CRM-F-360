import { api } from "../../shared/api/apiClient";
import type {
    Room,
    RoomReservation,
    CreateRoomDto,
    UpdateRoomDto,
    CreateReservationDto,
} from "./types";

const BASE = "/rooms";

export const roomService = {
    // ── Rooms ──
    getAll: () => api.get<Room[]>(BASE),

    getById: (id: number) => api.get<Room>(`${BASE}/${id}`),

    create: (dto: CreateRoomDto) => api.post<Room>(BASE, dto),

    update: (id: number, dto: UpdateRoomDto) => api.put(`${BASE}/${id}`, dto),

    delete: (id: number) => api.delete(`${BASE}/${id}`),

    // ── Reservations ──
    getReservations: (date: string, roomId?: number) => {
        const params = new URLSearchParams({ date });
        if (roomId) params.set("roomId", String(roomId));
        return api.get<RoomReservation[]>(`${BASE}/reservations?${params}`);
    },

    createReservation: (dto: CreateReservationDto) =>
        api.post<RoomReservation>(`${BASE}/reservations`, dto),

    deleteReservation: (id: number) =>
        api.delete(`${BASE}/reservations/${id}`),
};
