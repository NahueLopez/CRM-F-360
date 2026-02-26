import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactService } from "../../features/contacts/contactService";

export const contactKeys = {
    all: ["contacts"] as const,
    paged: (params: Record<string, unknown>) => ["contacts", "paged", params] as const,
};

export const useContacts = () =>
    useQuery({ queryKey: contactKeys.all, queryFn: () => contactService.getAll() });

export const useCreateContact = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof contactService.create>[0]) => contactService.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: contactKeys.all }),
    });
};

export const useUpdateContact = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Parameters<typeof contactService.update>[1] }) =>
            contactService.update(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: contactKeys.all }),
    });
};

export const useDeleteContact = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => contactService.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: contactKeys.all }),
    });
};
