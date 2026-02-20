export interface Conversation {
    id: number;
    name: string | null;
    isGroup: boolean;
    lastMessageAt: string;
    lastMessageContent: string | null;
    lastMessageSenderName: string | null;
    unreadCount: number;
    participants: Participant[];
}

export interface Participant {
    userId: number;
    fullName: string;
    lastReadAt: string | null;
}

export interface ChatMessage {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    content: string;
    sentAt: string;
}
