import { DriveColumnHeader } from "./DriveColumnHeader";
import { DriveRowSkeleton } from "./DriveRowSkeleton";

const SKELETON_ROW_COUNT = 8;

export function DriveListSkeleton() {
  return (
    <>
      <DriveColumnHeader />
      {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
        <DriveRowSkeleton key={index} />
      ))}
    </>
  );
}
