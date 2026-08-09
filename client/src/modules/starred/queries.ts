import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { STARRED_QUERY_KEY } from "@/modules/drive/queries";
import * as StarredApi from "./api";
import type { StarredSortBy, StarredSortOrder } from "./hooks/useStarredSort";

export function useStarredQuery(
  sortBy: StarredSortBy,
  sortOrder: StarredSortOrder
) {
  return useInfiniteQuery({
    queryKey: [...STARRED_QUERY_KEY, sortBy, sortOrder],
    queryFn: ({ pageParam }) =>
      StarredApi.getStarred(pageParam, sortBy, sortOrder),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    placeholderData: keepPreviousData,
  });
}
