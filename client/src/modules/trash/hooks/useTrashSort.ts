import { useState } from "react";

export type TrashSortBy = "name" | "trashedAt" | "sizeInBytes";
export type TrashSortOrder = "asc" | "desc";

export function useTrashSort() {
  const [sortBy, setSortBy] = useState<TrashSortBy>("trashedAt");
  const [sortOrder, setSortOrder] = useState<TrashSortOrder>("desc");

  function toggleSortOrder() {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  return { sortBy, setSortBy, sortOrder, toggleSortOrder };
}
