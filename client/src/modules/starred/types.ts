import type { PaginationMeta } from "@/types/api";
import type { DirectoryProfile, FileProfile } from "@/modules/drive/types";

export interface StarredDirectory extends DirectoryProfile {
  location: string;
}

export interface StarredFile extends FileProfile {
  location: string;
}

export interface StarredContents {
  directories: StarredDirectory[];
  files: StarredFile[];
  meta: PaginationMeta;
}
