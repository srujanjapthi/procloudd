import { FolderOpen, Upload, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onUploadClick: () => void;
  onCreateFolderClick: () => void;
}

export function EmptyState({
  onUploadClick,
  onCreateFolderClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <FolderOpen className="text-muted-foreground size-10" />
      <div>
        <p className="font-medium">This folder is empty</p>
        <p className="text-muted-foreground text-sm">
          Upload files or create a folder to get started.
        </p>
      </div>
      <div className="mt-2 flex gap-2">
        <Button variant="outline" size="sm" onClick={onCreateFolderClick}>
          <FolderPlus />
          New folder
        </Button>
        <Button size="sm" onClick={onUploadClick}>
          <Upload />
          Upload
        </Button>
      </div>
    </div>
  );
}
