import type { Types } from "mongoose";
import * as StatsRepository from "./stats.repository.js";
import * as DirectoryRepository from "@/modules/directory/directory.repository.js";
import * as FileRepository from "@/modules/file/file.repository.js";
import { toFileProfile } from "@/modules/file/file.service.js";
import AppConfig from "@/config/app.config.js";
import type { StorageOverview } from "./stats.interface.js";

export async function getStorageOverview(
  userId: Types.ObjectId
): Promise<StorageOverview> {
  const [
    byExtension,
    largestFiles,
    directoryCount,
    trashedDirectoryCount,
    trashedFileCount,
  ] = await Promise.all([
    StatsRepository.aggregateSizeByExtension(userId),
    StatsRepository.findLargestActiveFiles(
      userId,
      AppConfig.stats.largestFilesLimit
    ),
    StatsRepository.countActiveDirectories(userId),
    DirectoryRepository.countTrashRootDirectories(userId),
    FileRepository.countTrashRootFiles(userId),
  ]);

  const fileCount = byExtension.reduce((sum, entry) => sum + entry.count, 0);

  return {
    fileCount,
    directoryCount,
    trashedItemCount: trashedDirectoryCount + trashedFileCount,
    byExtension,
    largestFiles: largestFiles.map(toFileProfile),
  };
}
