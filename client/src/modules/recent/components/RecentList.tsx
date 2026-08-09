import { DriveColumnHeader } from "@/modules/drive/components/DriveColumnHeader";
import { DriveRow } from "@/modules/drive/components/DriveRow";
import type { RecentFile } from "../types";

interface RecentListProps {
  files: RecentFile[];
  onPreviewFile: (fileId: string) => void;
}

export function RecentList({ files, onPreviewFile }: RecentListProps) {
  return (
    <>
      <DriveColumnHeader showLocation />

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
