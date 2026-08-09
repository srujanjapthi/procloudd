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
  createTestFile,
} from "@/test/fixtures.js";
import Directory from "@/models/directory.model.js";
import File from "@/models/file.model.js";
import * as FileService from "../file.service.js";
import * as DirectoryService from "@/modules/directory/directory.service.js";

vi.mock("@/services/storage.service.js", () => ({
  default: {
    buildKey: vi.fn(
      (userId: string, fileId: string) => `users/${userId}/${fileId}`
    ),
    getUploadUrl: vi.fn().mockResolvedValue("https://s3.example/upload"),
    getDownloadUrl: vi.fn().mockResolvedValue("https://s3.example/download"),
    getPreviewUrl: vi.fn().mockResolvedValue("https://s3.example/preview"),
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
  vi.mocked(Storage.headObject).mockReset();
  vi.mocked(Storage.copyObject).mockClear();
  vi.mocked(Storage.deleteObject).mockClear();
  vi.mocked(Storage.getUploadUrl).mockClear();
  vi.mocked(Storage.getDownloadUrl).mockClear();
  vi.mocked(Storage.getPreviewUrl).mockClear();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("requestUploadUrl", () => {
  it("returns a storage key and presigned URL", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();

    const result = await FileService.requestUploadUrl(user._id, {
      name: "photo.png",
      parentDirId: rootDirId.toString(),
      sizeInBytes: 1024,
      mimeType: "image/png",
    });

    expect(result.storageKey).toContain(`users/${user._id.toString()}/`);
    expect(result.uploadUrl).toBe("https://s3.example/upload");
    expect(Storage.getUploadUrl).toHaveBeenCalledWith(
      result.storageKey,
      "image/png"
    );
  });

  it("throws 404 for a parent directory the user does not own", async () => {
    const { doc: user } = await createTestUserWithRoot();

    await expect(
      FileService.requestUploadUrl(user._id, {
        name: "photo.png",
        parentDirId: new mongoose.Types.ObjectId().toString(),
        sizeInBytes: 1024,
        mimeType: "image/png",
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 400 when the declared size would exceed the storage quota", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();

    await expect(
      FileService.requestUploadUrl(user._id, {
        name: "huge.bin",
        parentDirId: rootDirId.toString(),
        sizeInBytes: user.storage.maxStorageInBytes + 1,
        mimeType: "application/octet-stream",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("confirmUpload", () => {
  it("creates the file using S3's real reported size, not the client's", async () => {
    vi.mocked(Storage.headObject).mockResolvedValue({ sizeInBytes: 999 });
    const { rootDirId, doc: user } = await createTestUserWithRoot();

    const file = await FileService.confirmUpload(user._id, {
      storageKey: "users/x/abc",
      name: "report.pdf",
      parentDirId: rootDirId.toString(),
      mimeType: "application/pdf",
    });

    expect(file.sizeInBytes).toBe(999);
    expect(file.baseName).toBe("report");
    expect(file.extension).toBe("pdf");
    expect(file.name).toBe("report.pdf");

    const newRoot = await Directory.findById(rootDirId).lean();
    expect(newRoot!.sizeInBytes).toBe(999);
  });

  it("throws 400 when the upload was never actually completed in S3", async () => {
    vi.mocked(Storage.headObject).mockResolvedValue(null);
    const { rootDirId, doc: user } = await createTestUserWithRoot();

    await expect(
      FileService.confirmUpload(user._id, {
        storageKey: "users/x/missing",
        name: "report.pdf",
        parentDirId: rootDirId.toString(),
        mimeType: "application/pdf",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects and deletes the S3 object when the real size exceeds quota, even if the declared size passed", async () => {
    vi.mocked(Storage.headObject).mockResolvedValue({
      sizeInBytes: 10 * 1024 * 1024 * 1024,
    });
    const { rootDirId, doc: user } = await createTestUserWithRoot();

    await expect(
      FileService.confirmUpload(user._id, {
        storageKey: "users/x/oversized",
        name: "huge.bin",
        parentDirId: rootDirId.toString(),
        mimeType: "application/octet-stream",
      })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(Storage.deleteObject).toHaveBeenCalledWith("users/x/oversized");
    const stored = await File.findOne({ storageKey: "users/x/oversized" });
    expect(stored).toBeNull();
  });
});

describe("getDownloadUrl", () => {
  it("returns a signed download URL", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const file = await createTestFile(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    const url = await FileService.getDownloadUrl(user._id, file._id);

    expect(url).toBe("https://s3.example/download");
    expect(Storage.getDownloadUrl).toHaveBeenCalledWith(
      file.storageKey,
      `${file.baseName}.${file.extension}`
    );
  });

  it("throws 404 for a file the user does not own", async () => {
    const { doc: user } = await createTestUserWithRoot();
    const { doc: otherUser } = await createTestUserWithRoot();
    const file = await createTestFile(otherUser._id);

    await expect(
      FileService.getDownloadUrl(user._id, file._id)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("getPreviewUrl", () => {
  it("returns a signed preview URL", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const file = await createTestFile(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    const url = await FileService.getPreviewUrl(user._id, file._id);

    expect(url).toBe("https://s3.example/preview");
    expect(Storage.getPreviewUrl).toHaveBeenCalledWith(
      file.storageKey,
      `${file.baseName}.${file.extension}`
    );
  });

  it("throws 404 for a file the user does not own", async () => {
    const { doc: user } = await createTestUserWithRoot();
    const { doc: otherUser } = await createTestUserWithRoot();
    const file = await createTestFile(otherUser._id);

    await expect(
      FileService.getPreviewUrl(user._id, file._id)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("renameFile", () => {
  it("renames a file", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const file = await createTestFile(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    const renamed = await FileService.renameFile(user._id, file._id, "renamed");

    expect(renamed.baseName).toBe("renamed");
    expect(renamed.name).toBe("renamed.txt");
  });
});

describe("setFileStarred", () => {
  it("stars and unstars a file", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const file = await createTestFile(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    const starred = await FileService.setFileStarred(user._id, file._id, true);
    expect(starred.starred).toBe(true);

    const unstarred = await FileService.setFileStarred(
      user._id,
      file._id,
      false
    );
    expect(unstarred.starred).toBe(false);
  });

  it("is idempotent when starring an already starred file", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const file = await createTestFile(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      starred: true,
    });

    const result = await FileService.setFileStarred(user._id, file._id, true);

    expect(result.starred).toBe(true);
  });

  it("throws 404 for a file the user does not own", async () => {
    const { doc: user } = await createTestUserWithRoot();
    const other = await createTestUserWithRoot();
    const file = await createTestFile(other.doc._id, {
      parentDirId: other.rootDirId,
      ancestorIds: [other.rootDirId],
    });

    await expect(
      FileService.setFileStarred(user._id, file._id, true)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 for a trashed file", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const file = await createTestFile(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      status: "trashed",
    });

    await expect(
      FileService.setFileStarred(user._id, file._id, true)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("listRecent", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const defaultQuery = { page: 1, limit: 20, days: 30 };

  async function setUpdatedDaysAgo(
    fileId: mongoose.Types.ObjectId,
    daysAgo: number
  ) {
    await File.updateOne(
      { _id: fileId },
      { $set: { updatedAt: new Date(Date.now() - daysAgo * DAY_MS) } },
      { timestamps: false }
    );
  }

  it("returns active files most recently updated first", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const oldest = await createTestFile(user._id, {
      baseName: "oldest",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const newest = await createTestFile(user._id, {
      baseName: "newest",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const middle = await createTestFile(user._id, {
      baseName: "middle",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    await setUpdatedDaysAgo(oldest._id, 20);
    await setUpdatedDaysAgo(middle._id, 10);
    await setUpdatedDaysAgo(newest._id, 1);

    const result = await FileService.listRecent(user._id, defaultQuery);

    expect(result.files.map((file) => file.baseName)).toEqual([
      "newest",
      "middle",
      "oldest",
    ]);
  });

  it("excludes files updated outside the requested window", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const inside = await createTestFile(user._id, {
      baseName: "inside",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const outside = await createTestFile(user._id, {
      baseName: "outside",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    await setUpdatedDaysAgo(inside._id, 3);
    await setUpdatedDaysAgo(outside._id, 45);

    const result = await FileService.listRecent(user._id, defaultQuery);

    expect(result.files.map((file) => file.baseName)).toEqual(["inside"]);
    expect(result.meta.totalItems).toBe(1);
  });

  it("widens the window when more days are requested", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const older = await createTestFile(user._id, {
      baseName: "older",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    await setUpdatedDaysAgo(older._id, 45);

    const narrow = await FileService.listRecent(user._id, defaultQuery);
    const wide = await FileService.listRecent(user._id, {
      ...defaultQuery,
      days: 90,
    });

    expect(narrow.files).toHaveLength(0);
    expect(wide.files.map((file) => file.baseName)).toEqual(["older"]);
  });

  it("excludes trashed files and other users' files", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const other = await createTestUserWithRoot();
    await createTestFile(user._id, {
      baseName: "trashed",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      status: "trashed",
    });
    await createTestFile(other.doc._id, {
      baseName: "theirs",
      parentDirId: other.rootDirId,
      ancestorIds: [other.rootDirId],
    });
    await createTestFile(user._id, {
      baseName: "mine",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    const result = await FileService.listRecent(user._id, defaultQuery);

    expect(result.files.map((file) => file.baseName)).toEqual(["mine"]);
    expect(result.meta.totalItems).toBe(1);
  });

  it("labels root-level files as My Drive and nested files by folder name", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const folder = await createTestDirectory(user._id, {
      name: "Reports",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const atRoot = await createTestFile(user._id, {
      baseName: "at-root",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const nested = await createTestFile(user._id, {
      baseName: "nested",
      parentDirId: folder._id,
      ancestorIds: [rootDirId, folder._id],
    });
    await setUpdatedDaysAgo(nested._id, 10);
    await setUpdatedDaysAgo(atRoot._id, 2);

    const result = await FileService.listRecent(user._id, defaultQuery);

    expect(result.files.map((file) => [file.baseName, file.location])).toEqual([
      ["at-root", "My Drive"],
      ["nested", "Reports"],
    ]);
  });

  it("paginates", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    for (let i = 1; i <= 3; i++) {
      const file = await createTestFile(user._id, {
        baseName: `file-${i}`,
        parentDirId: rootDirId,
        ancestorIds: [rootDirId],
      });
      await setUpdatedDaysAgo(file._id, 10 - i);
    }

    const firstPage = await FileService.listRecent(user._id, {
      ...defaultQuery,
      limit: 2,
    });
    const secondPage = await FileService.listRecent(user._id, {
      ...defaultQuery,
      page: 2,
      limit: 2,
    });

    expect(firstPage.files.map((file) => file.baseName)).toEqual([
      "file-3",
      "file-2",
    ]);
    expect(firstPage.meta).toEqual({
      page: 1,
      limit: 2,
      totalItems: 3,
      totalPages: 2,
    });
    expect(secondPage.files.map((file) => file.baseName)).toEqual(["file-1"]);
  });
});

describe("moveFile", () => {
  it("moves a file and adjusts sizes on the old and new ancestor chains", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await Directory.updateOne(
      { _id: rootDirId },
      { $set: { sizeInBytes: 200 } }
    );
    const folderA = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      sizeInBytes: 200,
    });
    const folderB = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const file = await createTestFile(user._id, {
      sizeInBytes: 200,
      parentDirId: folderA._id,
      ancestorIds: [rootDirId, folderA._id],
    });

    const moved = await FileService.moveFile(user._id, file._id, folderB._id);

    expect(moved.parentDirId).toBe(folderB._id.toString());
    const newA = await Directory.findById(folderA._id).lean();
    const newB = await Directory.findById(folderB._id).lean();
    expect(newA!.sizeInBytes).toBe(0);
    expect(newB!.sizeInBytes).toBe(200);
  });

  it("throws 404 when the destination directory doesn't exist", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const file = await createTestFile(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    await expect(
      FileService.moveFile(user._id, file._id, new mongoose.Types.ObjectId())
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("trashFile", () => {
  it("marks the file trashed, shrinks its parent folder, but leaves quota usage untouched", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await Directory.updateOne(
      { _id: rootDirId },
      { $set: { sizeInBytes: 300 } }
    );
    const folder = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      sizeInBytes: 300,
    });
    const file = await createTestFile(user._id, {
      sizeInBytes: 300,
      parentDirId: folder._id,
      ancestorIds: [rootDirId, folder._id],
    });

    await FileService.trashFile(user._id, file._id);

    const stored = await File.findById(file._id).lean();
    expect(stored!.status).toBe("trashed");
    expect(stored!.trashedAt).toBeDefined();
    const storedFolder = await Directory.findById(folder._id).lean();
    expect(storedFolder!.sizeInBytes).toBe(0);
    const root = await Directory.findById(rootDirId).lean();
    expect(root!.sizeInBytes).toBe(300);
  });

  it("throws 404 for a file that doesn't exist", async () => {
    const { doc: user } = await createTestUserWithRoot();

    await expect(
      FileService.trashFile(user._id, new mongoose.Types.ObjectId())
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("restoreFile", () => {
  it("restores a trashed file back under its still-active original parent", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const folder = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const file = await createTestFile(user._id, {
      parentDirId: folder._id,
      ancestorIds: [rootDirId, folder._id],
    });
    await FileService.trashFile(user._id, file._id);

    const restored = await FileService.restoreFile(user._id, file._id);

    expect(restored.parentDirId).toBe(folder._id.toString());
    const stored = await File.findById(file._id).lean();
    expect(stored!.status).toBe("active");
    expect(stored!.trashedAt).toBeUndefined();
    expect(stored!.ancestorIds.map((id) => id.toString())).toEqual([
      rootDirId.toString(),
      folder._id.toString(),
    ]);
  });

  it("falls back to the account root when the original parent is still trashed", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const folder = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const file = await createTestFile(user._id, {
      parentDirId: folder._id,
      ancestorIds: [rootDirId, folder._id],
    });
    await FileService.trashFile(user._id, file._id);
    await DirectoryService.trashDirectory(user._id, folder._id);

    const restored = await FileService.restoreFile(user._id, file._id);

    expect(restored.parentDirId).toBe(rootDirId.toString());
    const stored = await File.findById(file._id).lean();
    expect(stored!.ancestorIds.map((id) => id.toString())).toEqual([
      rootDirId.toString(),
    ]);
  });

  it("re-adds size to the parent folder on restore but leaves root untouched", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await Directory.updateOne(
      { _id: rootDirId },
      { $set: { sizeInBytes: 300 } }
    );
    const folder = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      sizeInBytes: 300,
    });
    const file = await createTestFile(user._id, {
      sizeInBytes: 300,
      parentDirId: folder._id,
      ancestorIds: [rootDirId, folder._id],
    });
    await FileService.trashFile(user._id, file._id);

    await FileService.restoreFile(user._id, file._id);

    const restoredFolder = await Directory.findById(folder._id).lean();
    expect(restoredFolder!.sizeInBytes).toBe(300);
    const root = await Directory.findById(rootDirId).lean();
    expect(root!.sizeInBytes).toBe(300);
  });

  it("throws 404 for a file that is not in trash", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const file = await createTestFile(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    await expect(
      FileService.restoreFile(user._id, file._id)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 for a file swept by a parent folder trash, with no independent trashedAt", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const folder = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const file = await createTestFile(user._id, {
      parentDirId: folder._id,
      ancestorIds: [rootDirId, folder._id],
    });
    await DirectoryService.trashDirectory(user._id, folder._id);

    await expect(
      FileService.restoreFile(user._id, file._id)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("hardDeleteFile", () => {
  it("permanently deletes a trashed file, its S3 object, and frees quota usage", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await Directory.updateOne(
      { _id: rootDirId },
      { $set: { sizeInBytes: 300 } }
    );
    const file = await createTestFile(user._id, {
      sizeInBytes: 300,
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      storageKey: "users/x/to-delete",
      status: "trashed",
    });
    await File.updateOne(
      { _id: file._id },
      { $set: { trashedAt: new Date() } }
    );

    await FileService.hardDeleteFile(user._id, file._id);

    expect(await File.findById(file._id).lean()).toBeNull();
    expect(Storage.deleteObject).toHaveBeenCalledWith("users/x/to-delete");
    const root = await Directory.findById(rootDirId).lean();
    expect(root!.sizeInBytes).toBe(0);
  });

  it("rejects hard-deleting a file that is not in trash", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const file = await createTestFile(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    await expect(
      FileService.hardDeleteFile(user._id, file._id)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("copyFile", () => {
  it("copies a file into the same folder by default, with a fresh S3 key", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const file = await createTestFile(user._id, {
      baseName: "original",
      sizeInBytes: 40,
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      storageKey: "users/x/source-key",
    });

    const copy = await FileService.copyFile(user._id, file._id, {});

    expect(copy.name).toBe("Copy of original.txt");
    expect(copy.parentDirId).toBe(rootDirId.toString());
    expect(Storage.copyObject).toHaveBeenCalledWith(
      "users/x/source-key",
      expect.stringContaining(`users/${user._id.toString()}/`)
    );

    const newRoot = await Directory.findById(rootDirId).lean();
    expect(newRoot!.sizeInBytes).toBe(40);
  });

  it("copies into a different destination folder when specified", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const destination = await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    const file = await createTestFile(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    const copy = await FileService.copyFile(user._id, file._id, {
      parentDirId: destination._id.toString(),
      name: "custom-name",
    });

    expect(copy.parentDirId).toBe(destination._id.toString());
    expect(copy.baseName).toBe("custom-name");
    expect(copy.name).toBe("custom-name.txt");
  });

  it("rejects copying when it would exceed the storage quota", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await Directory.updateOne(
      { _id: rootDirId },
      { $set: { sizeInBytes: user.storage.maxStorageInBytes } }
    );
    const file = await createTestFile(user._id, {
      sizeInBytes: 1,
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    await expect(
      FileService.copyFile(user._id, file._id, {})
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
