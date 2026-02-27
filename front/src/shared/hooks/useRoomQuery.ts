import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomService } from "../../features/rooms/roomService";
import type { CreateRoomDto, UpdateRoomDto, CreateReservationDto } from "../../features/rooms/types";

const ROOMS_KEY = ["rooms"] as const;
const RESERVATIONS_KEY = ["room-reservations"] as const;

// ── Queries ──

export const useRooms = () =>
    useQuery({
        queryKey: ROOMS_KEY,
        queryFn: () => roomService.getAll(),
        staleTime: 60_000,
    });

export const useRoom = (id: number) =>
    useQuery({
        queryKey: [...ROOMS_KEY, id],
        queryFn: () => roomService.getById(id),
        enabled: id > 0,
    });

export const useReservations = (date: string, roomId?: number) =>
    useQuery({
        queryKey: [...RESERVATIONS_KEY, date, roomId],
        queryFn: () => roomService.getReservations(date, roomId),
        staleTime: 30_000,
    });

// ── Mutations ──

export const useCreateRoom = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateRoomDto) => roomService.create(dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: ROOMS_KEY }),
    });
};

export const useUpdateRoom = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateRoomDto }) =>
            roomService.update(id, dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: ROOMS_KEY }),
    });
};

export const useDeleteRoom = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => roomService.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ROOMS_KEY }),
    });
};

export const useCreateReservation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateReservationDto) => roomService.createReservation(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ROOMS_KEY });
            qc.invalidateQueries({ queryKey: RESERVATIONS_KEY });
        },
    });
};

export const useDeleteReservation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => roomService.deleteReservation(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ROOMS_KEY });
            qc.invalidateQueries({ queryKey: RESERVATIONS_KEY });
        },
    });
};
