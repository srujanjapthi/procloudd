import mongoose from "mongoose";
import type { ClientSession } from "mongoose";

export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => fn(session));
  } finally {
    await session.endSession();
  }
}

export function isValidId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}
