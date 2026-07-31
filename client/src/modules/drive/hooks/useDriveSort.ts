import { useState } from "react";

export type DriveSortBy = "name" | "createdAt" | "sizeInBytes";
export type DriveSortOrder = "asc" | "desc";

export function useDriveSort() {
  const [sortBy, setSortBy] = useState<DriveSortBy>("name");
  const [sortOrder, setSortOrder] = useState<DriveSortOrder>("asc");

  function toggleSortOrder() {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  return { sortBy, setSortBy, sortOrder, toggleSortOrder };
}
