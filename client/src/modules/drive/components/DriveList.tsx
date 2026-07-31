import { DriveColumnHeader } from "./DriveColumnHeader";
import { DriveRow } from "./DriveRow";
import type { DirectoryProfile, FileProfile } from "../types";

interface DriveListProps {
  directories: DirectoryProfile[];
  files: FileProfile[];
  dirId: string;
  folderName: string;
  onPreviewFile: (fileId: string) => void;
}

export function DriveList({
  directories,
  files,
  dirId,
  folderName,
  onPreviewFile,
}: DriveListProps) {
  return (
    <>
      <DriveColumnHeader />

      {directories.map((dir) => (
        <DriveRow
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
        <DriveRow
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
    </>
  );
}
