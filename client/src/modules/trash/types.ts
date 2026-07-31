import type { PaginationMeta } from "@/types/api";
import type { DirectoryProfile, FileProfile } from "@/modules/drive/types";

export interface TrashContents {
  directories: DirectoryProfile[];
  files: FileProfile[];
  meta: PaginationMeta;
}
