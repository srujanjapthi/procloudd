import apiClient from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  DirectoryProfile,
  DirectoryContents,
  FileProfile,
  CreateDirectoryInput,
  DuplicateDirectoryInput,
  RequestUploadUrlInput,
  RequestUploadUrlResult,
  ConfirmUploadInput,
  CopyFileInput,
} from "./types";

export async function createDirectory(
  input: CreateDirectoryInput
): Promise<DirectoryProfile> {
  const response = await apiClient.post<ApiSuccessResponse<DirectoryProfile>>(
    "/directories",
    input
  );
  return response.data.data;
}

export async function getDirectoryContents(
  dirId: string,
  page: number,
  sortBy: string,
  sortOrder: string
): Promise<DirectoryContents> {
  const response = await apiClient.get<
    ApiSuccessResponse<Omit<DirectoryContents, "meta">>
  >(`/directories/${dirId}/contents`, {
    params: { page, sortBy, sortOrder },
  });
  return { ...response.data.data, meta: response.data.meta! };
}

export async function renameDirectory(
  dirId: string,
  name: string
): Promise<DirectoryProfile> {
  const response = await apiClient.patch<ApiSuccessResponse<DirectoryProfile>>(
    `/directories/${dirId}`,
    { name }
  );
  return response.data.data;
}

export async function moveDirectory(
  dirId: string,
  parentDirId: string
): Promise<DirectoryProfile> {
  const response = await apiClient.patch<ApiSuccessResponse<DirectoryProfile>>(
    `/directories/${dirId}/move`,
    { parentDirId }
  );
  return response.data.data;
}

export async function duplicateDirectory(
  dirId: string,
  input: DuplicateDirectoryInput
): Promise<DirectoryProfile> {
  const response = await apiClient.post<ApiSuccessResponse<DirectoryProfile>>(
    `/directories/${dirId}/duplicate`,
    input
  );
  return response.data.data;
}

export async function trashDirectory(dirId: string): Promise<void> {
  await apiClient.delete<ApiSuccessResponse<null>>(`/directories/${dirId}`);
}

export async function restoreDirectory(
  dirId: string
): Promise<DirectoryProfile> {
  const response = await apiClient.patch<ApiSuccessResponse<DirectoryProfile>>(
    `/directories/${dirId}/restore`
  );
  return response.data.data;
}

export async function hardDeleteDirectory(dirId: string): Promise<void> {
  await apiClient.delete<ApiSuccessResponse<null>>(
    `/directories/${dirId}/permanent`
  );
}

export async function requestUploadUrl(
  input: RequestUploadUrlInput
): Promise<RequestUploadUrlResult> {
  const response = await apiClient.post<
    ApiSuccessResponse<RequestUploadUrlResult>
  >("/files/upload-url", input);
  return response.data.data;
}

export async function confirmUpload(
  input: ConfirmUploadInput
): Promise<FileProfile> {
  const response = await apiClient.post<ApiSuccessResponse<FileProfile>>(
    "/files",
    input
  );
  return response.data.data;
}

export async function getFileDownloadUrl(fileId: string): Promise<string> {
  const response = await apiClient.get<
    ApiSuccessResponse<{ downloadUrl: string }>
  >(`/files/${fileId}/download-url`);
  return response.data.data.downloadUrl;
}

export async function renameFile(
  fileId: string,
  name: string
): Promise<FileProfile> {
  const response = await apiClient.patch<ApiSuccessResponse<FileProfile>>(
    `/files/${fileId}`,
    { name }
  );
  return response.data.data;
}

export async function moveFile(
  fileId: string,
  parentDirId: string
): Promise<FileProfile> {
  const response = await apiClient.patch<ApiSuccessResponse<FileProfile>>(
    `/files/${fileId}/move`,
    { parentDirId }
  );
  return response.data.data;
}

export async function copyFile(
  fileId: string,
  input: CopyFileInput
): Promise<FileProfile> {
  const response = await apiClient.post<ApiSuccessResponse<FileProfile>>(
    `/files/${fileId}/copy`,
    input
  );
  return response.data.data;
}

export async function trashFile(fileId: string): Promise<void> {
  await apiClient.delete<ApiSuccessResponse<null>>(`/files/${fileId}`);
}

export async function restoreFile(fileId: string): Promise<FileProfile> {
  const response = await apiClient.patch<ApiSuccessResponse<FileProfile>>(
    `/files/${fileId}/restore`
  );
  return response.data.data;
}

export async function hardDeleteFile(fileId: string): Promise<void> {
  await apiClient.delete<ApiSuccessResponse<null>>(
    `/files/${fileId}/permanent`
  );
}
