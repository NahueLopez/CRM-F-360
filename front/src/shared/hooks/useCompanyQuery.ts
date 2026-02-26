import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "../../features/companies/companyService";
import type { Company } from "../../features/companies/types";

export const companyKeys = {
    all: ["companies"] as const,
    detail: (id: number) => ["companies", id] as const,
};

export const useCompanies = () =>
    useQuery({ queryKey: companyKeys.all, queryFn: () => companyService.getAll() });

export const useCreateCompany = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Company>) => companyService.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: companyKeys.all }),
    });
};

export const useUpdateCompany = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Company> }) =>
            companyService.update(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: companyKeys.all }),
    });
};

export const useDeleteCompany = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => companyService.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: companyKeys.all }),
    });
};
