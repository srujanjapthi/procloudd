import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import mongoose from "mongoose";
import { connectTestDb, disconnectTestDb, clearTestDb } from "@/test/db.js";
import {
  createTestUserWithRoot,
  createTestDirectory,
} from "@/test/fixtures.js";
import File from "@/models/file.model.js";
import Directory from "@/models/directory.model.js";
import * as StatsService from "../stats.service.js";

vi.mock("@/services/storage.service.js", () => ({
  default: {
    deleteObject: vi.fn().mockResolvedValue(undefined),
    deleteObjects: vi.fn().mockResolvedValue(undefined),
  },
}));

beforeAll(async () => {
  await connectTestDb();
}, 60_000);

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

async function createTestFile(
  userId: mongoose.Types.ObjectId,
  overrides: {
    baseName?: string;
    extension: string;
    sizeInBytes: number;
    parentDirId: mongoose.Types.ObjectId;
    status?: "active" | "trashed";
  }
) {
  const doc = await File.create({
    baseName: overrides.baseName ?? "file",
    sizeInBytes: overrides.sizeInBytes,
    extension: overrides.extension,
    mimeType: "application/octet-stream",
    parentDirId: overrides.parentDirId,
    ancestorIds: [overrides.parentDirId],
    userId,
    storageKey: "users/x/y",
    status: overrides.status ?? "active",
  });
  return doc.toObject();
}

describe("getStorageOverview", () => {
  it("aggregates active file sizes by extension, excluding trashed files", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await createTestFile(user._id, {
      extension: "png",
      sizeInBytes: 100,
      parentDirId: rootDirId,
    });
    await createTestFile(user._id, {
      extension: "png",
      sizeInBytes: 50,
      parentDirId: rootDirId,
    });
    await createTestFile(user._id, {
      extension: "mp4",
      sizeInBytes: 300,
      parentDirId: rootDirId,
    });
    await createTestFile(user._id, {
      extension: "png",
      sizeInBytes: 999,
      parentDirId: rootDirId,
      status: "trashed",
    });

    const result = await StatsService.getStorageOverview(user._id);

    const byExtension = new Map(
      result.byExtension.map((entry) => [entry.extension, entry])
    );
    expect(byExtension.get("png")).toEqual({
      extension: "png",
      sizeInBytes: 150,
      count: 2,
    });
    expect(byExtension.get("mp4")).toEqual({
      extension: "mp4",
      sizeInBytes: 300,
      count: 1,
    });
  });

  it("returns the largest active files, sorted descending, excluding trashed files", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await createTestFile(user._id, {
      baseName: "small",
      extension: "txt",
      sizeInBytes: 10,
      parentDirId: rootDirId,
    });
    await createTestFile(user._id, {
      baseName: "big",
      extension: "zip",
      sizeInBytes: 1000,
      parentDirId: rootDirId,
    });
    await createTestFile(user._id, {
      baseName: "biggest-but-trashed",
      extension: "zip",
      sizeInBytes: 9999,
      parentDirId: rootDirId,
      status: "trashed",
    });

    const result = await StatsService.getStorageOverview(user._id);

    expect(result.largestFiles[0]!.baseName).toBe("big");
    expect(result.largestFiles.map((f) => f.baseName)).not.toContain(
      "biggest-but-trashed"
    );
  });

  it("returns empty results for a user with no files", async () => {
    const { doc: user } = await createTestUserWithRoot();

    const result = await StatsService.getStorageOverview(user._id);

    expect(result.byExtension).toEqual([]);
    expect(result.largestFiles).toEqual([]);
    expect(result.fileCount).toBe(0);
    expect(result.directoryCount).toBe(0);
    expect(result.trashedItemCount).toBe(0);
  });

  it("counts active files, active folders (excluding root), and trashed roots", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await createTestFile(user._id, {
      extension: "png",
      sizeInBytes: 10,
      parentDirId: rootDirId,
    });
    await createTestFile(user._id, {
      extension: "mp4",
      sizeInBytes: 20,
      parentDirId: rootDirId,
    });
    await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const trashedFolder = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    await Directory.updateOne(
      { _id: trashedFolder._id },
      { $set: { status: "trashed", trashedAt: new Date() } }
    );
    await createTestFile(user._id, {
      extension: "txt",
      sizeInBytes: 5,
      parentDirId: rootDirId,
      status: "trashed",
    });
    await File.updateOne(
      { userId: user._id, extension: "txt" },
      { $set: { trashedAt: new Date() } }
    );

    const result = await StatsService.getStorageOverview(user._id);

    expect(result.fileCount).toBe(2);
    expect(result.directoryCount).toBe(1);
    expect(result.trashedItemCount).toBe(2);
  });
});
