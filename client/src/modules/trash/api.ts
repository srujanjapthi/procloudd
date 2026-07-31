import apiClient from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { TrashContents } from "./types";

export async function getTrash(
  page: number,
  sortBy: string,
  sortOrder: string
): Promise<TrashContents> {
  const response = await apiClient.get<
    ApiSuccessResponse<Omit<TrashContents, "meta">>
  >("/trash", { params: { page, sortBy, sortOrder } });
  return { ...response.data.data, meta: response.data.meta! };
}
