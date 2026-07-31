import type { Types } from "mongoose";
import File from "@/models/file.model.js";
import Directory from "@/models/directory.model.js";
import type { ExtensionBreakdown } from "./stats.interface.js";

export async function aggregateSizeByExtension(
  userId: Types.ObjectId
): Promise<ExtensionBreakdown[]> {
  const results = await File.aggregate<{
    _id: string;
    sizeInBytes: number;
    count: number;
  }>([
    { $match: { userId, status: "active" } },
    {
      $group: {
        _id: "$extension",
        sizeInBytes: { $sum: "$sizeInBytes" },
        count: { $sum: 1 },
      },
    },
  ]);

  return results.map((result) => ({
    extension: result._id,
    sizeInBytes: result.sizeInBytes,
    count: result.count,
  }));
}

export function findLargestActiveFiles(userId: Types.ObjectId, limit: number) {
  return File.find({ userId, status: "active" })
    .sort({ sizeInBytes: -1 })
    .limit(limit)
    .lean();
}

export function countActiveDirectories(userId: Types.ObjectId) {
  return Directory.countDocuments({
    userId,
    status: "active",
    parentDirId: { $ne: null },
  });
}
