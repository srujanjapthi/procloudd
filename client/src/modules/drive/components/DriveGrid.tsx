import { DriveTile } from "./DriveTile";
import type { DirectoryProfile, FileProfile } from "../types";

interface DriveGridProps {
  directories: DirectoryProfile[];
  files: FileProfile[];
  dirId: string;
  folderName: string;
  onPreviewFile: (fileId: string) => void;
}

export const DRIVE_GRID_CLASSNAME =
  "grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-1";

export function DriveGrid({
  directories,
  files,
  dirId,
  folderName,
  onPreviewFile,
}: DriveGridProps) {
  return (
    <div className={DRIVE_GRID_CLASSNAME}>
      {directories.map((dir) => (
        <DriveTile
          key={dir.id}
          item={{ type: "directory", id: dir.id, name: dir.name }}
          sizeInBytes={dir.sizeInBytes}
          createdAt={dir.createdAt}
          updatedAt={dir.updatedAt}
          dirId={dirId}
          folderName={folderName}
          onPreviewFile={onPreviewFile}
        />
      ))}

      {files.map((file) => (
        <DriveTile
          key={file.id}
          item={{ type: "file", id: file.id, name: file.name }}
          baseName={file.baseName}
          extension={file.extension}
          sizeInBytes={file.sizeInBytes}
          createdAt={file.createdAt}
          updatedAt={file.updatedAt}
          dirId={dirId}
          folderName={folderName}
          onPreviewFile={onPreviewFile}
        />
      ))}
    </div>
  );
}
