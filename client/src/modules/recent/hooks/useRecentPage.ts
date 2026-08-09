import { useFilePreview } from "@/modules/drive/hooks/useFilePreview";
import { useRecentQuery } from "../queries";
import { useRecentWindow } from "./useRecentWindow";

export function useRecentPage() {
  const { windowDays, setWindowDays } = useRecentWindow();

  const {
    data,
    isLoading,
    isPlaceholderData,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRecentQuery(windowDays);

  const firstPage = data?.pages[0];
  const files = data?.pages.flatMap((page) => page.files) ?? [];
  const filePreview = useFilePreview(files, isLoading, Boolean(hasNextPage));

  return {
    files,
    isLoading,
    isPlaceholderData,
    isError,
    isEmpty: !isLoading && !isError && files.length === 0,
    totalItems: firstPage?.meta.totalItems,
    hasNextPage,
    isFetchingNextPage,
    loadMore: fetchNextPage,
    windowDays,
    setWindowDays,
    ...filePreview,
  };
}
