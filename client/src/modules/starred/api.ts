import apiClient from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { StarredContents } from "./types";

export async function getStarred(
  page: number,
  sortBy: string,
  sortOrder: string
): Promise<StarredContents> {
  const response = await apiClient.get<
    ApiSuccessResponse<Omit<StarredContents, "meta">>
  >("/starred", { params: { page, sortBy, sortOrder } });
  return { ...response.data.data, meta: response.data.meta! };
}
