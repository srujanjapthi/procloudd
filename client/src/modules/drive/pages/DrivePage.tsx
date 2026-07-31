import { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FolderPlus,
  Loader2,
  List,
  LayoutGrid,
  ArrowUpDown,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
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
import { useDrivePage } from "../hooks/useDrivePage";
import { useFileUpload } from "../hooks/useFileUpload";
import { useDriveViewMode } from "../hooks/useDriveViewMode";
import { useLoadMoreOnScroll } from "../hooks/useLoadMoreOnScroll";
import type { DriveSortBy } from "../hooks/useDriveSort";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { DriveList } from "../components/DriveList";
import { DriveListSkeleton } from "../components/DriveListSkeleton";
import { DriveGrid } from "../components/DriveGrid";
import { DriveGridSkeleton } from "../components/DriveGridSkeleton";
import { UploadTray } from "../components/UploadTray";
import { EmptyState } from "../components/EmptyState";
import { CreateFolderDialog } from "../components/CreateFolderDialog";

export default function DrivePage() {
  const {
    dirId,
    breadcrumb,
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
  } = useDrivePage();
  const { uploads, uploadFiles, retryUpload, dismissUpload } =
    useFileUpload(dirId);
  const { viewMode, setViewMode } = useDriveViewMode();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: uploadFiles,
    noClick: true,
    noKeyboard: true,
    disabled: !dirId,
  });

  const folderName =
    breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 1].name : "My Drive";
  const isNavigatingFolder = isFetching && !isLoading;

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
    <div {...getRootProps()} className="relative flex flex-1 flex-col">
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="border-primary bg-primary/5 pointer-events-none absolute inset-0 z-30 m-2 flex items-center justify-center rounded-xl border-2 border-dashed">
          <p className="text-primary font-medium">Drop files to upload</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 transition-opacity",
            isNavigatingFolder && "opacity-50"
          )}
        >
          <Breadcrumbs entries={breadcrumb} />
          {!isLoading && !isEmpty && totalItems !== undefined && (
            <span className="text-muted-foreground text-xs">
              · {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon-sm"
                    aria-label="List view"
                    aria-pressed={viewMode === "list"}
                    onClick={() => setViewMode("list")}
                  />
                }
              >
                <List />
              </TooltipTrigger>
              <TooltipContent>List view</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon-sm"
                    aria-label="Grid view"
                    aria-pressed={viewMode === "grid"}
                    onClick={() => setViewMode("grid")}
                  />
                }
              >
                <LayoutGrid />
              </TooltipTrigger>
              <TooltipContent>Grid view</TooltipContent>
            </Tooltip>
          </div>
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
                onValueChange={(value) => setSortBy(value as DriveSortBy)}
              >
                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="createdAt">
                  Date created
                </DropdownMenuRadioItem>
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
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="New folder"
                  onClick={() => setIsCreateFolderOpen(true)}
                />
              }
            >
              <FolderPlus />
              <span className="hidden md:inline">New folder</span>
            </TooltipTrigger>
            <TooltipContent>New folder</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={<Button size="sm" aria-label="Upload" onClick={open} />}
            >
              <Upload />
              <span className="hidden md:inline">Upload</span>
            </TooltipTrigger>
            <TooltipContent>Upload</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {isLoading && viewMode === "list" && (
        <div className="flex flex-col">
          <DriveListSkeleton />
        </div>
      )}

      {isLoading && viewMode === "grid" && <DriveGridSkeleton />}

      {isError && (
        <p className="text-destructive text-sm">
          Couldn&apos;t load this folder. Try reloading the page.
        </p>
      )}

      {isEmpty && (
        <EmptyState
          onUploadClick={open}
          onCreateFolderClick={() => setIsCreateFolderOpen(true)}
        />
      )}

      {!isLoading && !isError && !isEmpty && viewMode === "list" && (
        <div
          className={cn(
            "flex flex-col transition-opacity",
            isNavigatingFolder && "opacity-50"
          )}
        >
          <DriveList
            directories={directories}
            files={files}
            dirId={dirId}
            folderName={folderName}
          />
          {loadMoreSentinel}
        </div>
      )}

      {!isLoading && !isError && !isEmpty && viewMode === "grid" && (
        <div
          className={cn(
            "flex flex-col gap-3 transition-opacity",
            isNavigatingFolder && "opacity-50"
          )}
        >
          <DriveGrid
            directories={directories}
            files={files}
            dirId={dirId}
            folderName={folderName}
          />
          {loadMoreSentinel}
        </div>
      )}

      <UploadTray
        uploads={uploads}
        onRetry={retryUpload}
        onDismiss={dismissUpload}
      />

      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        parentDirId={dirId}
      />
    </div>
  );
}
