import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { RECENT_QUERY_KEY } from "@/modules/drive/queries";
import * as RecentApi from "./api";

export function useRecentQuery(days: number) {
  return useInfiniteQuery({
    queryKey: [...RECENT_QUERY_KEY, days],
    queryFn: ({ pageParam }) => RecentApi.getRecent(pageParam, days),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    placeholderData: keepPreviousData,
  });
}
