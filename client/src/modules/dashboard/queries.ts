import { useQuery } from "@tanstack/react-query";
import * as DashboardApi from "./api";

export const STORAGE_OVERVIEW_QUERY_KEY = ["dashboard", "storageOverview"];

export function useStorageOverviewQuery() {
  return useQuery({
    queryKey: STORAGE_OVERVIEW_QUERY_KEY,
    queryFn: DashboardApi.getStorageOverview,
  });
}
