import { CalendarRange, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import APP_CONFIG from "@/constants/config";
import { useLoadMoreOnScroll } from "@/modules/drive/hooks/useLoadMoreOnScroll";
import { DriveListSkeleton } from "@/modules/drive/components/DriveListSkeleton";
import { FilePreviewOverlay } from "@/modules/drive/components/preview/FilePreviewOverlay";
import { useRecentPage } from "../hooks/useRecentPage";
import { RecentList } from "../components/RecentList";
import { RecentEmptyState } from "../components/RecentEmptyState";

export default function RecentPage() {
  const {
    files,
    isLoading,
    isPlaceholderData,
    isError,
    isEmpty,
    totalItems,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    windowDays,
    setWindowDays,
    currentFile,
    previewUrl,
    isLoadingUrl,
    hasUrlError,
    hasNext,
    hasPrev,
    openPreview,
    close: closePreview,
    next: nextPreview,
    prev: prevPreview,
    downloadCurrent,
  } = useRecentPage();

  const sentinelRef = useLoadMoreOnScroll(
    loadMore,
    hasNextPage && !isFetchingNextPage
  );

  const loadMoreSentinel = hasNextPage && (
    <div ref={sentinelRef} className="flex justify-center py-4">
      {isFetchingNextPage && (
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
      )}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">Recent</h1>
          {!isLoading && !isEmpty && totalItems !== undefined && (
            <span className="text-muted-foreground text-xs">
              · {totalItems} {totalItems === 1 ? "file" : "files"}
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" aria-label="Time range" />
            }
          >
            <CalendarRange />
            <span>
              {APP_CONFIG.recent.windowOptions.find(
                (option) => option.days === windowDays
              )?.label ?? `Last ${windowDays} days`}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={String(windowDays)}
              onValueChange={(value) => setWindowDays(Number(value))}
            >
              {APP_CONFIG.recent.windowOptions.map((option) => (
                <DropdownMenuRadioItem
                  key={option.days}
                  value={String(option.days)}
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading && (
        <div className="flex flex-col">
          <DriveListSkeleton />
        </div>
      )}

      {isError && (
        <p className="text-destructive text-sm">
          Couldn&apos;t load recent files. Try reloading the page.
        </p>
      )}

      {isEmpty && <RecentEmptyState />}

      {!isLoading && !isError && !isEmpty && (
        <div
          className={cn(
            "flex flex-col transition-opacity",
            isPlaceholderData && "opacity-50"
          )}
        >
          <RecentList files={files} onPreviewFile={openPreview} />
          {loadMoreSentinel}
        </div>
      )}

      <FilePreviewOverlay
        file={currentFile}
        previewUrl={previewUrl}
        isLoadingUrl={isLoadingUrl}
        hasUrlError={hasUrlError}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onClose={closePreview}
        onNext={nextPreview}
        onPrev={prevPreview}
        onDownload={downloadCurrent}
      />
    </div>
  );
}
