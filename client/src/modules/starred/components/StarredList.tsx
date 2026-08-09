import { DriveColumnHeader } from "@/modules/drive/components/DriveColumnHeader";
import { DriveRow } from "@/modules/drive/components/DriveRow";
import type { StarredDirectory, StarredFile } from "../types";

interface StarredListProps {
  directories: StarredDirectory[];
  files: StarredFile[];
  onPreviewFile: (fileId: string) => void;
}

export function StarredList({
  directories,
  files,
  onPreviewFile,
}: StarredListProps) {
  return (
    <>
      <DriveColumnHeader showLocation />

      {directories.map((dir) => (
        <DriveRow
          key={dir.id}
          item={{ type: "directory", id: dir.id, name: dir.name }}
          sizeInBytes={dir.sizeInBytes}
          createdAt={dir.createdAt}
          updatedAt={dir.updatedAt}
          starred={dir.starred}
          dirId={dir.parentDirId ?? ""}
          folderName={dir.location}
          location={dir.location}
          onPreviewFile={onPreviewFile}
        />
      ))}

      {files.map((file) => (
        <DriveRow
          key={file.id}
          item={{ type: "file", id: file.id, name: file.name }}
          baseName={file.baseName}
          extension={file.extension}
          sizeInBytes={file.sizeInBytes}
          createdAt={file.createdAt}
          updatedAt={file.updatedAt}
          starred={file.starred}
          dirId={file.parentDirId}
          folderName={file.location}
          location={file.location}
          onPreviewFile={onPreviewFile}
        />
      ))}
    </>
  );
}
