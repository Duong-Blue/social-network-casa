import apiClient, { BackendResponse } from '@/utils/helpers/api_helper';
import { SearchResult, SearchType } from '@/features/search/type/search.types';

export const searchService = {
  search: async (
    query: string,
    type: SearchType = 'all',
    page: number = 1,
    size: number = 20,
  ): Promise<BackendResponse<SearchResult>> => {
    const response = await apiClient.get<BackendResponse<SearchResult>>('/search', {
      params: { q: query, type, page, size },
    });
    return response.data;
  },
};
