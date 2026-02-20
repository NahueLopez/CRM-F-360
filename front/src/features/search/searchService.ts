import { api } from "../../shared/api/apiClient";
import type { SearchResult } from "./types";

export const searchService = {
    search: (query: string) => api.get<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`),
};
