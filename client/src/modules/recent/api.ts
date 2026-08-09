import apiClient from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { RecentContents } from "./types";

export async function getRecent(
  page: number,
  days: number
): Promise<RecentContents> {
  const response = await apiClient.get<
    ApiSuccessResponse<Omit<RecentContents, "meta">>
  >("/files/recent", { params: { page, days } });
  return { ...response.data.data, meta: response.data.meta! };
}
