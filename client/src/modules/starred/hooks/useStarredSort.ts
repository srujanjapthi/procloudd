import { useState } from "react";

export type StarredSortBy = "name" | "updatedAt" | "sizeInBytes";
export type StarredSortOrder = "asc" | "desc";

export function useStarredSort() {
  const [sortBy, setSortBy] = useState<StarredSortBy>("updatedAt");
  const [sortOrder, setSortOrder] = useState<StarredSortOrder>("desc");

  function toggleSortOrder() {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  return { sortBy, setSortBy, sortOrder, toggleSortOrder };
}
