import type { FileProfile } from "@/modules/file/file.interface.js";

export interface ExtensionBreakdown {
  extension: string;
  sizeInBytes: number;
  count: number;
}

export interface StorageOverview {
  fileCount: number;
  directoryCount: number;
  trashedItemCount: number;
  byExtension: ExtensionBreakdown[];
  largestFiles: FileProfile[];
}
