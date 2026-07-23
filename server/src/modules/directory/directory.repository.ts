import type { ClientSession, Types } from "mongoose";
import Directory from "@/models/directory.model.js";

export async function createRoot(
  userId: Types.ObjectId,
  session: ClientSession
) {
  const [directory] = await Directory.create(
    [{ name: "root", userId, parentDirId: null, ancestorIds: [] }],
    { session }
  );
  return directory!;
}
