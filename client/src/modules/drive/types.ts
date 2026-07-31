import type { PaginationMeta } from "@/types/api";

export interface DirectoryProfile {
  id: string;
  name: string;
  parentDirId: string | null;
  sizeInBytes: number;
  starred: boolean;
  trashedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileProfile {
  id: string;
  name: string;
  baseName: string;
  extension: string;
  sizeInBytes: number;
  mimeType: string;
  parentDirId: string;
  starred: boolean;
  trashedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BreadcrumbEntry {
  id: string;
  name: string;
}

export interface DirectoryContents {
  breadcrumb: BreadcrumbEntry[];
  directories: DirectoryProfile[];
  files: FileProfile[];
  meta: PaginationMeta;
}

export interface CreateDirectoryInput {
  name: string;
  parentDirId: string;
}

export interface DuplicateDirectoryInput {
  name?: string;
  parentDirId?: string;
}

export interface RequestUploadUrlInput {
  name: string;
  parentDirId: string;
  sizeInBytes: number;
  mimeType: string;
}

export interface RequestUploadUrlResult {
  storageKey: string;
  uploadUrl: string;
}

export interface ConfirmUploadInput {
  storageKey: string;
  name: string;
  parentDirId: string;
  mimeType: string;
  checksum?: string;
}

export interface CopyFileInput {
  name?: string;
  parentDirId?: string;
}
