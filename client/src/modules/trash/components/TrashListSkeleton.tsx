import { DriveRowSkeleton } from "@/modules/drive/components/DriveRowSkeleton";
import { TrashColumnHeader } from "./TrashColumnHeader";

const SKELETON_ROW_COUNT = 8;

export function TrashListSkeleton() {
  return (
    <>
      <TrashColumnHeader />
      {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
        <DriveRowSkeleton key={index} />
      ))}
    </>
  );
}
