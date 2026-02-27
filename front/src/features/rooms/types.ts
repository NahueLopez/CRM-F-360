export interface Room {
    id: number;
    name: string;
    location: string | null;
    capacity: number;
    amenities: string[];
    description: string | null;
    color: string | null;
    isActive: boolean;
    createdAt: string;
    isOccupied: boolean;
    currentReservationTitle: string | null;
}

export interface RoomReservation {
    id: number;
    roomId: number;
    roomName: string;
    roomColor: string | null;
    userId: number;
    userName: string;
    title: string;
    startTime: string;
    endTime: string;
    notes: string | null;
    createdAt: string;
}

export interface CreateRoomDto {
    name: string;
    location?: string;
    capacity: number;
    amenities?: string[];
    description?: string;
    color?: string;
}

export interface UpdateRoomDto extends CreateRoomDto {
    isActive: boolean;
}

export interface CreateReservationDto {
    roomId: number;
    title: string;
    startTime: string;
    endTime: string;
    notes?: string;
}
