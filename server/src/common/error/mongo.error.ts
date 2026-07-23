import mongoose from "mongoose";

export function isDuplicateKey(error: unknown): boolean {
  return (
    error instanceof mongoose.mongo.MongoServerError && error.code === 11000
  );
}
