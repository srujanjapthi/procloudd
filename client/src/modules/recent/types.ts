import type { PaginationMeta } from "@/types/api";
import type { FileProfile } from "@/modules/drive/types";

export interface RecentFile extends FileProfile {
  location: string;
}

export interface RecentContents {
  files: RecentFile[];
  meta: PaginationMeta;
}
