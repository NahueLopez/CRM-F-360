import { QueryClient, QueryClientProvider, type Mutation } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Global mutation error handler — shows toast on failed mutations
const onMutationError = (error: Error, _variables: unknown, _context: unknown, mutation: Mutation) => {
    // Skip if the mutation has its own onError
    if (mutation.options.onError) return;
    console.error("[React Query] Mutation failed:", error.message);
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60_000,        // 1 min cache
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
});

// Set global mutation cache callbacks
queryClient.getMutationCache().config = {
    onError: onMutationError as any,
};

export { queryClient };

export const QueryProvider = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);
