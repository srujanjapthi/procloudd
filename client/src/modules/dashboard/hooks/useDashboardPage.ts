import { useAuth } from "@/modules/auth/context/AuthContext";
import { useStorageOverviewQuery } from "../queries";
import {
  getStorageCategory,
  type StorageCategory,
} from "../utils/storage-category.util";

export interface CategoryBreakdown {
  category: StorageCategory;
  sizeInBytes: number;
}

function buildCategoryBreakdown(
  byExtension: { extension: string; sizeInBytes: number }[]
): CategoryBreakdown[] {
  const sizeByCategory = new Map<StorageCategory, number>();
  for (const entry of byExtension) {
    const category = getStorageCategory(entry.extension);
    sizeByCategory.set(
      category,
      (sizeByCategory.get(category) ?? 0) + entry.sizeInBytes
    );
  }
  return Array.from(sizeByCategory.entries())
    .map(([category, sizeInBytes]) => ({ category, sizeInBytes }))
    .sort((a, b) => b.sizeInBytes - a.sizeInBytes);
}

export function useDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useStorageOverviewQuery();

  const usedBytes = user?.storage.usedBytes ?? 0;
  const maxStorageInBytes = user?.storage.maxStorageInBytes ?? 0;
  const usedPercent =
    maxStorageInBytes > 0
      ? Math.min(100, Math.round((usedBytes / maxStorageInBytes) * 100))
      : 0;

  return {
    firstName: user?.name.firstName,
    usedBytes,
    maxStorageInBytes,
    usedPercent,
    fileCount: data?.fileCount ?? 0,
    directoryCount: data?.directoryCount ?? 0,
    trashedItemCount: data?.trashedItemCount ?? 0,
    categoryBreakdown: data ? buildCategoryBreakdown(data.byExtension) : [],
    largestFiles: data?.largestFiles ?? [],
    isLoading,
    isError,
  };
}
