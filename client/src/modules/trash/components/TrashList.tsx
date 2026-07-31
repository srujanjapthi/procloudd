import type { DirectoryProfile, FileProfile } from "@/modules/drive/types";
import { TrashColumnHeader } from "./TrashColumnHeader";
import { TrashRow } from "./TrashRow";

interface TrashListProps {
  directories: DirectoryProfile[];
  files: FileProfile[];
}

export function TrashList({ directories, files }: TrashListProps) {
  return (
    <>
      <TrashColumnHeader />

      {directories.map((dir) => (
        <TrashRow
          key={dir.id}
          item={{ type: "directory", id: dir.id, name: dir.name }}
          sizeInBytes={dir.sizeInBytes}
          trashedAt={dir.trashedAt ?? dir.updatedAt}
        />
      ))}

      {files.map((file) => (
        <TrashRow
          key={file.id}
          item={{ type: "file", id: file.id, name: file.name }}
          extension={file.extension}
          sizeInBytes={file.sizeInBytes}
          trashedAt={file.trashedAt ?? file.updatedAt}
        />
      ))}
    </>
  );
}
