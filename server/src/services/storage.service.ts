import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as Duration from "@/common/lib/duration.util.js";
import env from "@/config/env.config.js";

const client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const UPLOAD_URL_EXPIRY_SECONDS = Duration.toMs("5m") / 1000;
const DOWNLOAD_URL_EXPIRY_SECONDS = Duration.toMs("5m") / 1000;

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.name === "NotFound";
}

const Storage = {
  buildKey(userId: string, fileId: string): string {
    return `users/${userId}/${fileId}`;
  },

  getUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(client, command, {
      expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
    });
  },

  getDownloadUrl(key: string, filename: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    });
    return getSignedUrl(client, command, {
      expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS,
    });
  },

  async headObject(key: string): Promise<{ sizeInBytes: number } | null> {
    try {
      const result = await client.send(
        new HeadObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key })
      );
      return { sizeInBytes: result.ContentLength ?? 0 };
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  },

  async copyObject(fromKey: string, toKey: string): Promise<void> {
    await client.send(
      new CopyObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        CopySource: `${env.AWS_S3_BUCKET}/${fromKey}`,
        Key: toKey,
      })
    );
  },

  async deleteObject(key: string): Promise<void> {
    await client.send(
      new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key })
    );
  },

  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }
    await client.send(
      new DeleteObjectsCommand({
        Bucket: env.AWS_S3_BUCKET,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      })
    );
  },
};

export default Storage;
