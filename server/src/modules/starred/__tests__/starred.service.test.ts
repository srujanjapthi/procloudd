import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { connectTestDb, disconnectTestDb, clearTestDb } from "@/test/db.js";
import {
  createTestUserWithRoot,
  createTestDirectory,
  createTestFile,
} from "@/test/fixtures.js";
import * as StarredService from "../starred.service.js";
import type { ListStarredQuery } from "../starred.validator.js";

beforeAll(async () => {
  await connectTestDb();
}, 60_000);

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

const baseQuery: ListStarredQuery = {
  page: 1,
  limit: 20,
  sortOrder: "asc",
  sortBy: "name",
};

describe("listStarred", () => {
  it("returns starred directories and files, excluding unstarred ones", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const starredDir = await createTestDirectory(user._id, {
      name: "starred-dir",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      starred: true,
    });
    const starredFile = await createTestFile(user._id, {
      baseName: "starred-file",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      starred: true,
    });
    await createTestDirectory(user._id, {
      name: "plain-dir",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    await createTestFile(user._id, {
      baseName: "plain-file",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });

    const result = await StarredService.listStarred(user._id, baseQuery);

    expect(result.directories.map((dir) => dir.id)).toEqual([
      starredDir._id.toString(),
    ]);
    expect(result.files.map((file) => file.id)).toEqual([
      starredFile._id.toString(),
    ]);
    expect(result.meta.totalItems).toBe(2);
  });

  it("excludes starred items that have been trashed", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    await createTestDirectory(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      starred: true,
      status: "trashed",
    });
    await createTestFile(user._id, {
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      starred: true,
      status: "trashed",
    });

    const result = await StarredService.listStarred(user._id, baseQuery);

    expect(result.directories).toHaveLength(0);
    expect(result.files).toHaveLength(0);
    expect(result.meta.totalItems).toBe(0);
  });

  it("does not return another user's starred items", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const other = await createTestUserWithRoot();
    await createTestFile(other.doc._id, {
      baseName: "theirs",
      parentDirId: other.rootDirId,
      ancestorIds: [other.rootDirId],
      starred: true,
    });
    const own = await createTestFile(user._id, {
      baseName: "mine",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      starred: true,
    });

    const result = await StarredService.listStarred(user._id, baseQuery);

    expect(result.files.map((file) => file.id)).toEqual([own._id.toString()]);
    expect(result.meta.totalItems).toBe(1);
  });

  it("labels root-level items as My Drive and nested items by their folder name", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    const folder = await createTestDirectory(user._id, {
      name: "Reports",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
    });
    await createTestFile(user._id, {
      baseName: "a-at-root",
      parentDirId: rootDirId,
      ancestorIds: [rootDirId],
      starred: true,
    });
    await createTestFile(user._id, {
      baseName: "b-nested",
      parentDirId: folder._id,
      ancestorIds: [rootDirId, folder._id],
      starred: true,
    });

    const result = await StarredService.listStarred(user._id, baseQuery);

    expect(result.files.map((file) => [file.baseName, file.location])).toEqual([
      ["a-at-root", "My Drive"],
      ["b-nested", "Reports"],
    ]);
  });

  it("splits a page across directories first, then files", async () => {
    const { rootDirId, doc: user } = await createTestUserWithRoot();
    for (let i = 1; i <= 3; i++) {
      await createTestDirectory(user._id, {
        name: `dir-${i}`,
        parentDirId: rootDirId,
        ancestorIds: [rootDirId],
        starred: true,
      });
      await createTestFile(user._id, {
        baseName: `file-${i}`,
        parentDirId: rootDirId,
        ancestorIds: [rootDirId],
        starred: true,
      });
    }

    const firstPage = await StarredService.listStarred(user._id, {
      ...baseQuery,
      limit: 4,
    });
    const secondPage = await StarredService.listStarred(user._id, {
      ...baseQuery,
      page: 2,
      limit: 4,
    });

    expect(firstPage.directories.map((dir) => dir.name)).toEqual([
      "dir-1",
      "dir-2",
      "dir-3",
    ]);
    expect(firstPage.files.map((file) => file.baseName)).toEqual(["file-1"]);
    expect(firstPage.meta).toEqual({
      page: 1,
      limit: 4,
      totalItems: 6,
      totalPages: 2,
    });

    expect(secondPage.directories).toHaveLength(0);
    expect(secondPage.files.map((file) => file.baseName)).toEqual([
      "file-2",
      "file-3",
    ]);
  });
});
