import { api } from "../lib/apiClient";
import type { SearchResult } from "../types/searchResult";

export const searchService = {
    search: (query: string) => api.get<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`),
};
