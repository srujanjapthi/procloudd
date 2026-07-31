import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { connectTestDb, disconnectTestDb, clearTestDb } from "@/test/db.js";
import {
  createTestUserWithRoot,
  createTestDirectory,
} from "@/test/fixtures.js";
import Directory from "@/models/directory.model.js";
import File from "@/models/file.model.js";
import * as DirectoryService from "@/modules/directory/directory.service.js";
import * as FileService from "@/modules/file/file.service.js";
import * as TrashService from "../trash.service.js";

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
  userId: Parameters<typeof createTestDirectory>[0],
  overrides: {
    baseName?: string;
    parentDirId: Parameters<typeof createTestDirectory>[0];
    ancestorIds: Parameters<typeof createTestDirectory>[0][];
  }
) {
  const doc = await File.create({
    baseName: overrides.baseName ?? "file",
    sizeInBytes: 10,
    extension: "txt",
    mimeType: "text/plain",
    parentDirId: overrides.parentDirId,
    ancestorIds: overrides.ancestorIds,
    userId,
    storageKey: "users/x/y",
  });
  return doc.toObject();
}

describe("listTrash", () => {
  it("returns only trash roots, excluding swept descendants and active items", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const active = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const trashedFolder = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const sweptChild = await createTestDirectory(user._id, {
      parentDirId: trashedFolder._id,
      ancestorIds: [rootDirId, trashedFolder._id],
    });
    const trashedFile = await createTestFile(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    void active;
    void sweptChild;

    await DirectoryService.trashDirectory(user._id, trashedFolder._id);
    await FileService.trashFile(user._id, trashedFile._id);

    const result = await TrashService.listTrash(user._id, {
      page: 1,
      limit: 20,
      sortOrder: "desc",
      sortBy: "trashedAt",
    });

    expect(result.directories.map((d) => d.id)).toEqual([
      trashedFolder._id.toString(),
    ]);
    expect(result.files.map((f) => f.id)).toEqual([trashedFile._id.toString()]);
    expect(result.meta.totalItems).toBe(2);
  });

  it("splits a combined page across trash-root directories and files", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();

    await Directory.create(
      Array.from({ length: 3 }, (_, i) => ({
        name: `dir-${i + 1}`,
        userId: user._id,
        parentDirId: rootDirId,
        ancestorIds: [rootDirId],
        status: "trashed" as const,
        trashedAt: new Date(2024, 0, i + 1),
      }))
    );
    await File.create(
      Array.from({ length: 3 }, (_, i) => ({
        baseName: `file-${i + 1}`,
        sizeInBytes: 1,
        extension: "txt",
        mimeType: "text/plain",
        parentDirId: rootDirId,
        ancestorIds: [rootDirId],
        userId: user._id,
        storageKey: `users/x/${i}`,
        status: "trashed" as const,
        trashedAt: new Date(2024, 0, i + 1),
      }))
    );

    const result = await TrashService.listTrash(user._id, {
      page: 1,
      limit: 4,
      sortOrder: "asc",
      sortBy: "name",
    });

    expect(result.directories).toHaveLength(3);
    expect(result.files).toHaveLength(1);
    expect(result.meta).toEqual({
      page: 1,
      limit: 4,
      totalItems: 6,
      totalPages: 2,
    });
  });

  it("sorts by trashedAt descending by default", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const older = await createTestDirectory(user._id, {
      name: "older",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const newer = await createTestDirectory(user._id, {
      name: "newer",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    await Directory.updateOne(
      { _id: older._id },
      { $set: { status: "trashed", trashedAt: new Date("2024-01-01") } }
    );
    await Directory.updateOne(
      { _id: newer._id },
      { $set: { status: "trashed", trashedAt: new Date("2024-06-01") } }
    );

    const result = await TrashService.listTrash(user._id, {
      page: 1,
      limit: 20,
      sortOrder: "desc",
      sortBy: "trashedAt",
    });

    expect(result.directories.map((d) => d.name)).toEqual(["newer", "older"]);
  });
});

describe("emptyTrash", () => {
  it("permanently deletes every trash root and leaves active items alone", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const active = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const trashedFolder = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const trashedFile = await createTestFile(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    await DirectoryService.trashDirectory(user._id, trashedFolder._id);
    await FileService.trashFile(user._id, trashedFile._id);

    await TrashService.emptyTrash(user._id);

    expect(await Directory.findById(trashedFolder._id).lean()).toBeNull();
    expect(await File.findById(trashedFile._id).lean()).toBeNull();
    expect(await Directory.findById(active._id).lean()).not.toBeNull();
  });

  it("doesn't fail on a trash root nested inside another trash root", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const a = await createTestDirectory(user._id, {
      name: "A",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const b = await createTestDirectory(user._id, {
      name: "B",
      parentDirId: a._id,
      ancestorIds: [rootDirId, a._id],
    });
    const c = await createTestDirectory(user._id, {
      name: "C",
      parentDirId: b._id,
      ancestorIds: [rootDirId, a._id, b._id],
    });

    await DirectoryService.trashDirectory(user._id, c._id);
    await DirectoryService.trashDirectory(user._id, a._id);

    await TrashService.emptyTrash(user._id);

    expect(await Directory.findById(a._id).lean()).toBeNull();
    expect(await Directory.findById(b._id).lean()).toBeNull();
    expect(await Directory.findById(c._id).lean()).toBeNull();
  });
});
