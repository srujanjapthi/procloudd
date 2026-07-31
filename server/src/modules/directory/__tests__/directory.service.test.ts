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
import Directory from "@/models/directory.model.js";
import File from "@/models/file.model.js";
import * as DirectoryService from "../directory.service.js";

vi.mock("@/services/storage.service.js", () => ({
  default: {
    buildKey: vi.fn(
      (userId: string, fileId: string) => `users/${userId}/${fileId}`
    ),
    getUploadUrl: vi.fn(),
    getDownloadUrl: vi.fn(),
    headObject: vi.fn(),
    copyObject: vi.fn().mockResolvedValue(undefined),
    deleteObject: vi.fn().mockResolvedValue(undefined),
    deleteObjects: vi.fn().mockResolvedValue(undefined),
  },
}));

const { default: Storage } = await import("@/services/storage.service.js");

beforeAll(async () => {
  await connectTestDb();
}, 60_000);

afterEach(async () => {
  await clearTestDb();
  vi.mocked(Storage.copyObject).mockClear();
  vi.mocked(Storage.deleteObjects).mockClear();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("createDirectory", () => {
  it("creates a folder under an existing directory", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();

    const dir = await DirectoryService.createDirectory(user._id, {
      name: "Documents",
      parentDirId: rootDirId.toString(),
    });

    expect(dir.name).toBe("Documents");
    expect(dir.parentDirId).toBe(rootDirId.toString());

    const stored = await Directory.findById(dir.id).lean();
    expect(stored!.ancestorIds.map((id) => id.toString())).toEqual([
      rootDirId.toString(),
    ]);
  });

  it("throws 404 when the parent directory does not exist", async () => {
    const { doc: user } = await createTestUserWithRoot();

    await expect(
      DirectoryService.createDirectory(user._id, {
        name: "Documents",
        parentDirId: new mongoose.Types.ObjectId().toString(),
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 when the parent belongs to another user", async () => {
    const { doc: user } = await createTestUserWithRoot();
    const { rootDirId: otherRoot } = await createTestUserWithRoot();

    await expect(
      DirectoryService.createDirectory(user._id, {
        name: "Documents",
        parentDirId: otherRoot.toString(),
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("listContents", () => {
  it("returns active subdirectories and paginated active files", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await createTestDirectory(user._id, {
      name: "B",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    await createTestDirectory(user._id, {
      name: "A",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    await createTestDirectory(user._id, {
      name: "Trashed",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      status: "trashed",
    });
    await File.create({
      baseName: "note",
      sizeInBytes: 10,
      extension: "txt",
      mimeType: "text/plain",
      parentDirId: rootDirId,
      ancestorIds: [],
      userId: user._id,
      storageKey: "users/x/y",
    });

    const result = await DirectoryService.listContents(user._id, rootDirId, {
      page: 1,
      limit: 20,
      sortOrder: "desc",
      sortBy: "name",
    });

    expect(result.directories.map((d) => d.name)).toEqual(["B", "A"]);
    expect(result.files).toHaveLength(1);
    expect(result.meta.totalItems).toBe(3);
  });

  it("splits a combined page across directories and files in a stable order", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();

    await Directory.create(
      Array.from({ length: 35 }, (_, i) => ({
        name: `dir-${String(i + 1).padStart(2, "0")}`,
        userId: user._id,
        parentDirId: rootDirId,
        ancestorIds: [rootDirId],
      }))
    );
    await File.create(
      Array.from({ length: 40 }, (_, i) => ({
        baseName: `file-${String(i + 1).padStart(2, "0")}`,
        sizeInBytes: 1,
        extension: "txt",
        mimeType: "text/plain",
        parentDirId: rootDirId,
        ancestorIds: [rootDirId],
        userId: user._id,
        storageKey: `users/x/${i}`,
      }))
    );

    const baseQuery = {
      limit: 20,
      sortOrder: "asc" as const,
      sortBy: "name" as const,
    };

    const page1 = await DirectoryService.listContents(user._id, rootDirId, {
      ...baseQuery,
      page: 1,
    });
    expect(page1.directories).toHaveLength(20);
    expect(page1.files).toHaveLength(0);
    expect(page1.directories[0]!.name).toBe("dir-01");
    expect(page1.directories[19]!.name).toBe("dir-20");
    expect(page1.meta).toEqual({
      page: 1,
      limit: 20,
      totalItems: 75,
      totalPages: 4,
    });

    const page2 = await DirectoryService.listContents(user._id, rootDirId, {
      ...baseQuery,
      page: 2,
    });
    expect(page2.directories).toHaveLength(15);
    expect(page2.directories[0]!.name).toBe("dir-21");
    expect(page2.directories[14]!.name).toBe("dir-35");
    expect(page2.files).toHaveLength(5);
    expect(page2.files[0]!.name).toBe("file-01.txt");
    expect(page2.files[4]!.name).toBe("file-05.txt");

    const page3 = await DirectoryService.listContents(user._id, rootDirId, {
      ...baseQuery,
      page: 3,
    });
    expect(page3.directories).toHaveLength(0);
    expect(page3.files).toHaveLength(20);
    expect(page3.files[0]!.name).toBe("file-06.txt");
    expect(page3.files[19]!.name).toBe("file-25.txt");

    const page4 = await DirectoryService.listContents(user._id, rootDirId, {
      ...baseQuery,
      page: 4,
    });
    expect(page4.directories).toHaveLength(0);
    expect(page4.files).toHaveLength(15);
    expect(page4.files[0]!.name).toBe("file-26.txt");
    expect(page4.files[14]!.name).toBe("file-40.txt");
  });

  it("never duplicates or skips items across pages when many share the same sort value", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();

    await File.create(
      Array.from({ length: 25 }, (_, i) => ({
        baseName: "duplicate",
        sizeInBytes: 1,
        extension: "txt",
        mimeType: "text/plain",
        parentDirId: rootDirId,
        ancestorIds: [rootDirId],
        userId: user._id,
        storageKey: `users/x/tie-${i}`,
      }))
    );

    const baseQuery = {
      limit: 20,
      sortOrder: "asc" as const,
      sortBy: "name" as const,
    };

    const page1 = await DirectoryService.listContents(user._id, rootDirId, {
      ...baseQuery,
      page: 1,
    });
    const page2 = await DirectoryService.listContents(user._id, rootDirId, {
      ...baseQuery,
      page: 2,
    });

    expect(page1.files).toHaveLength(20);
    expect(page2.files).toHaveLength(5);

    const allIds = [...page1.files, ...page2.files].map((f) => f.id);
    expect(new Set(allIds).size).toBe(25);
  });

  it("throws 404 for a directory the user does not own", async () => {
    const { doc: user } = await createTestUserWithRoot();
    const { rootDirId: otherRoot } = await createTestUserWithRoot();

    await expect(
      DirectoryService.listContents(user._id, otherRoot, {
        page: 1,
        limit: 20,
        sortOrder: "desc",
        sortBy: "name",
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("renameDirectory", () => {
  it("renames a folder", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const dir = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    const renamed = await DirectoryService.renameDirectory(
      user._id,
      dir._id,
      "New Name"
    );

    expect(renamed.name).toBe("New Name");
  });

  it("rejects renaming the root directory", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();

    await expect(
      DirectoryService.renameDirectory(user._id, rootDirId, "New Name")
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("moveDirectory", () => {
  it("moves a folder and cascades ancestorIds to descendants", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const folderA = await createTestDirectory(user._id, {
      name: "A",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const folderB = await createTestDirectory(user._id, {
      name: "B",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const nested = await createTestDirectory(user._id, {
      name: "Nested",
      parentDirId: folderA._id,
      ancestorIds: [rootDirId, folderA._id],
    });

    await DirectoryService.moveDirectory(user._id, folderA._id, folderB._id);

    const movedA = await Directory.findById(folderA._id).lean();
    expect(movedA!.parentDirId!.toString()).toBe(folderB._id.toString());
    expect(movedA!.ancestorIds.map((id) => id.toString())).toEqual([
      rootDirId.toString(),
      folderB._id.toString(),
    ]);

    const movedNested = await Directory.findById(nested._id).lean();
    expect(movedNested!.ancestorIds.map((id) => id.toString())).toEqual([
      rootDirId.toString(),
      folderB._id.toString(),
      folderA._id.toString(),
    ]);
  });

  it("adjusts sizes on the old and new ancestor chains", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const folderA = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      sizeInBytes: 500,
    });
    const folderB = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    await Directory.updateOne(
      { _id: rootDirId },
      { $set: { sizeInBytes: 500 } }
    );

    await DirectoryService.moveDirectory(user._id, folderA._id, folderB._id);

    const newRoot = await Directory.findById(rootDirId).lean();
    const newB = await Directory.findById(folderB._id).lean();
    expect(newRoot!.sizeInBytes).toBe(500);
    expect(newB!.sizeInBytes).toBe(500);
  });

  it("rejects moving the root directory", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const folder = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    await expect(
      DirectoryService.moveDirectory(user._id, rootDirId, folder._id)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects moving a directory into itself", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const folder = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    await expect(
      DirectoryService.moveDirectory(user._id, folder._id, folder._id)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects moving a directory into its own descendant", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const parent = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const child = await createTestDirectory(user._id, {
      parentDirId: parent._id,
      ancestorIds: [rootDirId, parent._id],
    });

    await expect(
      DirectoryService.moveDirectory(user._id, parent._id, child._id)
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("trashDirectory", () => {
  it("marks the folder trashed with trashedAt, and cascades to active descendants without trashedAt", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const parent = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const child = await createTestDirectory(user._id, {
      parentDirId: parent._id,
      ancestorIds: [rootDirId, parent._id],
    });
    const file = await File.create({
      baseName: "a",
      sizeInBytes: 1,
      extension: "txt",
      mimeType: "text/plain",
      parentDirId: parent._id,
      ancestorIds: [rootDirId, parent._id],
      userId: user._id,
      storageKey: "users/x/y",
    });

    await DirectoryService.trashDirectory(user._id, parent._id);

    const storedParent = await Directory.findById(parent._id).lean();
    expect(storedParent!.status).toBe("trashed");
    expect(storedParent!.trashedAt).toBeDefined();

    const storedChild = await Directory.findById(child._id).lean();
    expect(storedChild!.status).toBe("trashed");
    expect(storedChild!.trashedAt).toBeUndefined();

    const storedFile = await File.findById(file._id).lean();
    expect(storedFile!.status).toBe("trashed");
    expect(storedFile!.trashedAt).toBeUndefined();
  });

  it("does not cascade onto a descendant that was already independently trashed", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const parent = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const independentlyTrashed = await createTestDirectory(user._id, {
      parentDirId: parent._id,
      ancestorIds: [rootDirId, parent._id],
      status: "trashed",
    });
    await Directory.updateOne(
      { _id: independentlyTrashed._id },
      { $set: { trashedAt: new Date("2020-01-01") } }
    );

    await DirectoryService.trashDirectory(user._id, parent._id);

    const stored = await Directory.findById(independentlyTrashed._id).lean();
    expect(stored!.trashedAt!.toISOString()).toBe(
      new Date("2020-01-01").toISOString()
    );
  });

  it("rejects trashing the root directory", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();

    await expect(
      DirectoryService.trashDirectory(user._id, rootDirId)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("shrinks its parent folder but leaves quota usage untouched", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await Directory.updateOne(
      { _id: rootDirId },
      { $set: { sizeInBytes: 100 } }
    );
    const grandparent = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      sizeInBytes: 100,
    });
    const parent = await createTestDirectory(user._id, {
      parentDirId: grandparent._id,
      ancestorIds: [rootDirId, grandparent._id],
      sizeInBytes: 100,
    });

    await DirectoryService.trashDirectory(user._id, parent._id);

    const storedGrandparent = await Directory.findById(grandparent._id).lean();
    expect(storedGrandparent!.sizeInBytes).toBe(0);
    const root = await Directory.findById(rootDirId).lean();
    expect(root!.sizeInBytes).toBe(100);
  });
});

describe("restoreDirectory", () => {
  it("restores a trashed folder back under its still-active original parent", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const parent = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const child = await createTestDirectory(user._id, {
      parentDirId: parent._id,
      ancestorIds: [rootDirId, parent._id],
    });
    await DirectoryService.trashDirectory(user._id, child._id);

    const restored = await DirectoryService.restoreDirectory(
      user._id,
      child._id
    );

    expect(restored.parentDirId).toBe(parent._id.toString());
    const stored = await Directory.findById(child._id).lean();
    expect(stored!.status).toBe("active");
    expect(stored!.trashedAt).toBeUndefined();
    expect(stored!.ancestorIds.map((id) => id.toString())).toEqual([
      rootDirId.toString(),
      parent._id.toString(),
    ]);
  });

  it("restores swept descendants but keeps an independently-trashed subtree trashed", async () => {
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
    const d = await createTestDirectory(user._id, {
      name: "D",
      parentDirId: c._id,
      ancestorIds: [rootDirId, a._id, b._id, c._id],
    });

    await DirectoryService.trashDirectory(user._id, c._id);
    await DirectoryService.trashDirectory(user._id, a._id);

    await DirectoryService.restoreDirectory(user._id, a._id);

    const storedA = await Directory.findById(a._id).lean();
    expect(storedA!.status).toBe("active");
    const storedB = await Directory.findById(b._id).lean();
    expect(storedB!.status).toBe("active");
    expect(storedB!.parentDirId!.toString()).toBe(a._id.toString());
    const storedC = await Directory.findById(c._id).lean();
    expect(storedC!.status).toBe("trashed");
    expect(storedC!.trashedAt).toBeDefined();
    const storedD = await Directory.findById(d._id).lean();
    expect(storedD!.status).toBe("trashed");
  });

  it("falls back to the account root when the original parent is still trashed", async () => {
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
    const d = await createTestDirectory(user._id, {
      name: "D",
      parentDirId: c._id,
      ancestorIds: [rootDirId, a._id, b._id, c._id],
    });

    await DirectoryService.trashDirectory(user._id, c._id);
    await DirectoryService.trashDirectory(user._id, a._id);

    const restored = await DirectoryService.restoreDirectory(user._id, c._id);

    expect(restored.parentDirId).toBe(rootDirId.toString());
    const storedC = await Directory.findById(c._id).lean();
    expect(storedC!.ancestorIds.map((id) => id.toString())).toEqual([
      rootDirId.toString(),
    ]);
    const storedD = await Directory.findById(d._id).lean();
    expect(storedD!.status).toBe("active");
    expect(storedD!.ancestorIds.map((id) => id.toString())).toEqual([
      rootDirId.toString(),
      c._id.toString(),
    ]);
  });

  it("reattaches under the original parent if it is restored first", async () => {
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

    await DirectoryService.restoreDirectory(user._id, a._id);
    const restoredC = await DirectoryService.restoreDirectory(user._id, c._id);

    expect(restoredC.parentDirId).toBe(b._id.toString());
    const storedC = await Directory.findById(c._id).lean();
    expect(storedC!.ancestorIds.map((id) => id.toString())).toEqual([
      rootDirId.toString(),
      a._id.toString(),
      b._id.toString(),
    ]);
  });

  it("re-adds size to ancestors on restore but leaves root untouched", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await Directory.updateOne(
      { _id: rootDirId },
      { $set: { sizeInBytes: 100 } }
    );
    const parent = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      sizeInBytes: 100,
    });
    const child = await createTestDirectory(user._id, {
      parentDirId: parent._id,
      ancestorIds: [rootDirId, parent._id],
      sizeInBytes: 100,
    });

    await DirectoryService.trashDirectory(user._id, child._id);
    const afterTrash = await Directory.findById(parent._id).lean();
    expect(afterTrash!.sizeInBytes).toBe(0);

    await DirectoryService.restoreDirectory(user._id, child._id);

    const afterRestore = await Directory.findById(parent._id).lean();
    expect(afterRestore!.sizeInBytes).toBe(100);
    const root = await Directory.findById(rootDirId).lean();
    expect(root!.sizeInBytes).toBe(100);
  });

  it("throws 404 for a folder that is not in trash", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const active = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    await expect(
      DirectoryService.restoreDirectory(user._id, active._id)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 for a swept descendant that has no independent trashedAt", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const parent = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const child = await createTestDirectory(user._id, {
      parentDirId: parent._id,
      ancestorIds: [rootDirId, parent._id],
    });
    await DirectoryService.trashDirectory(user._id, parent._id);

    await expect(
      DirectoryService.restoreDirectory(user._id, child._id)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("hardDeleteDirectory", () => {
  it("permanently deletes a trashed folder, its descendants, and their S3 objects, and frees quota usage", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await Directory.updateOne(
      { _id: rootDirId },
      { $set: { sizeInBytes: 100 } }
    );
    const parent = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      sizeInBytes: 100,
      status: "trashed",
    });
    await Directory.updateOne(
      { _id: parent._id },
      { $set: { trashedAt: new Date() } }
    );
    const child = await createTestDirectory(user._id, {
      parentDirId: parent._id,
      ancestorIds: [rootDirId, parent._id],
      status: "trashed",
    });
    const file = await File.create({
      baseName: "a",
      sizeInBytes: 100,
      extension: "txt",
      mimeType: "text/plain",
      parentDirId: parent._id,
      ancestorIds: [rootDirId, parent._id],
      userId: user._id,
      storageKey: "users/x/gone",
      status: "trashed",
    });

    await DirectoryService.hardDeleteDirectory(user._id, parent._id);

    expect(await Directory.findById(parent._id).lean()).toBeNull();
    expect(await Directory.findById(child._id).lean()).toBeNull();
    expect(await File.findById(file._id).lean()).toBeNull();
    expect(Storage.deleteObjects).toHaveBeenCalledWith(["users/x/gone"]);

    const newRoot = await Directory.findById(rootDirId).lean();
    expect(newRoot!.sizeInBytes).toBe(0);
  });

  it("rejects hard-deleting a folder that is not in trash", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const active = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    await expect(
      DirectoryService.hardDeleteDirectory(user._id, active._id)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("duplicateDirectory", () => {
  it("deep-duplicates a folder, its subfolders, and files, with fresh S3 keys", async () => {
    vi.mocked(Storage.copyObject).mockResolvedValue(undefined);
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const source = await createTestDirectory(user._id, {
      name: "Source",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      sizeInBytes: 50,
    });
    const nested = await createTestDirectory(user._id, {
      name: "Nested",
      parentDirId: source._id,
      ancestorIds: [rootDirId, source._id],
      sizeInBytes: 50,
    });
    const file = await File.create({
      baseName: "a",
      sizeInBytes: 50,
      extension: "txt",
      mimeType: "text/plain",
      parentDirId: nested._id,
      ancestorIds: [rootDirId, source._id, nested._id],
      userId: user._id,
      storageKey: "users/x/original",
    });

    const duplicate = await DirectoryService.duplicateDirectory(
      user._id,
      source._id,
      {}
    );

    expect(duplicate.name).toBe("Copy of Source");
    expect(Storage.copyObject).toHaveBeenCalledWith(
      "users/x/original",
      expect.stringContaining(`users/${user._id.toString()}/`)
    );

    const newNested = await Directory.findOne({
      userId: user._id,
      name: "Nested",
      _id: { $ne: nested._id },
    }).lean();
    expect(newNested).not.toBeNull();
    expect(newNested!.ancestorIds.map((id) => id.toString())).toEqual([
      rootDirId.toString(),
      duplicate.id,
    ]);

    const newFile = await File.findOne({
      userId: user._id,
      baseName: "a",
      _id: { $ne: file._id },
    }).lean();
    expect(newFile).not.toBeNull();
    expect(newFile!.storageKey).not.toBe(file.storageKey);
    expect(newFile!.ancestorIds.map((id) => id.toString())).toEqual([
      rootDirId.toString(),
      duplicate.id,
      newNested!._id.toString(),
    ]);
  });

  it("rejects duplicating when it would exceed the storage quota", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await Directory.updateOne(
      { _id: rootDirId },
      { $set: { sizeInBytes: user.storage.maxStorageInBytes } }
    );
    const source = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      sizeInBytes: 1,
    });

    await expect(
      DirectoryService.duplicateDirectory(user._id, source._id, {})
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects duplicating the root directory", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();

    await expect(
      DirectoryService.duplicateDirectory(user._id, rootDirId, {})
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
