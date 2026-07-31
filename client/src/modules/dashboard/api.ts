import apiClient from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { StorageOverview } from "./types";

export async function getStorageOverview(): Promise<StorageOverview> {
  const response =
    await apiClient.get<ApiSuccessResponse<StorageOverview>>("/stats/storage");
  return response.data.data;
}
