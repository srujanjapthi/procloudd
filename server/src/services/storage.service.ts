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
import AppConfig from "@/config/app.config.js";
import env from "@/config/env.config.js";

const client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const UPLOAD_URL_EXPIRY_SECONDS = AppConfig.storage.uploadUrlExpiryMs / 1000;
const DOWNLOAD_URL_EXPIRY_SECONDS =
  AppConfig.storage.downloadUrlExpiryMs / 1000;
const PREVIEW_URL_EXPIRY_SECONDS = AppConfig.storage.previewUrlExpiryMs / 1000;
const DELETE_OBJECTS_BATCH_SIZE = AppConfig.storage.deleteObjectsBatchSize;

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

  getPreviewUrl(key: string, filename: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      ResponseContentDisposition: `inline; filename="${filename}"`,
    });
    return getSignedUrl(client, command, {
      expiresIn: PREVIEW_URL_EXPIRY_SECONDS,
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
    for (let i = 0; i < keys.length; i += DELETE_OBJECTS_BATCH_SIZE) {
      const batch = keys.slice(i, i + DELETE_OBJECTS_BATCH_SIZE);
      await client.send(
        new DeleteObjectsCommand({
          Bucket: env.AWS_S3_BUCKET,
          Delete: { Objects: batch.map((Key) => ({ Key })) },
        })
      );
    }
  },
};

export default Storage;
