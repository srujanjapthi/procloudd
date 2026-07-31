import { DRIVE_GRID_CLASSNAME } from "./DriveGrid";
import { DriveTileSkeleton } from "./DriveTileSkeleton";

const SKELETON_TILE_COUNT = 12;

export function DriveGridSkeleton() {
  return (
    <div className={DRIVE_GRID_CLASSNAME}>
      {Array.from({ length: SKELETON_TILE_COUNT }).map((_, index) => (
        <DriveTileSkeleton key={index} />
      ))}
    </div>
  );
}
