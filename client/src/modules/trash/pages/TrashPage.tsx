import {
  ArrowUpDown,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useLoadMoreOnScroll } from "@/modules/drive/hooks/useLoadMoreOnScroll";
import { useTrashPage } from "../hooks/useTrashPage";
import type { TrashSortBy } from "../hooks/useTrashSort";
import { TrashList } from "../components/TrashList";
import { TrashListSkeleton } from "../components/TrashListSkeleton";
import { TrashEmptyState } from "../components/TrashEmptyState";

export default function TrashPage() {
  const {
    directories,
    files,
    isLoading,
    isFetching,
    isError,
    isEmpty,
    totalItems,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSortOrder,
  } = useTrashPage();

  const isRefetching = isFetching && !isLoading;

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
          <h1 className="text-lg font-semibold">Trash</h1>
          {!isLoading && !isEmpty && totalItems !== undefined && (
            <span className="text-muted-foreground text-xs">
              · {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" aria-label="Sort" />}
            >
              <ArrowUpDown />
              <span className="hidden md:inline">Sort</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={sortBy}
                onValueChange={(value) => setSortBy(value as TrashSortBy)}
              >
                <DropdownMenuRadioItem value="trashedAt">
                  Date trashed
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="sizeInBytes">
                  Size
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={
                    sortOrder === "asc" ? "Sort ascending" : "Sort descending"
                  }
                  onClick={toggleSortOrder}
                />
              }
            >
              {sortOrder === "asc" ? (
                <ArrowUpNarrowWide />
              ) : (
                <ArrowDownNarrowWide />
              )}
            </TooltipTrigger>
            <TooltipContent>
              {sortOrder === "asc" ? "Sort ascending" : "Sort descending"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col">
          <TrashListSkeleton />
        </div>
      )}

      {isError && (
        <p className="text-destructive text-sm">
          Couldn&apos;t load trash. Try reloading the page.
        </p>
      )}

      {isEmpty && <TrashEmptyState />}

      {!isLoading && !isError && !isEmpty && (
        <div
          className={cn(
            "flex flex-col transition-opacity",
            isRefetching && "opacity-50"
          )}
        >
          <TrashList directories={directories} files={files} />
          {loadMoreSentinel}
        </div>
      )}
    </div>
  );
}
