import { useState } from "react";
import axios from "axios";
import { getApiErrorMessage } from "@/error/api.error";
import * as DriveApi from "../api";
import { useInvalidateFiles, useInvalidateStorageUsage } from "../queries";

export interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

interface PendingUpload extends UploadItem {
  file: File;
}

export function useFileUpload(dirId: string) {
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const invalidateFiles = useInvalidateFiles();
  const invalidateStorageUsage = useInvalidateStorageUsage();

  function updateUpload(id: string, patch: Partial<PendingUpload>) {
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === id ? { ...upload, ...patch } : upload
      )
    );
  }

  async function runUpload(upload: PendingUpload) {
    const { file } = upload;
    const mimeType = file.type || "application/octet-stream";

    try {
      const { storageKey, uploadUrl } = await DriveApi.requestUploadUrl({
        name: file.name,
        parentDirId: dirId,
        sizeInBytes: file.size,
        mimeType,
      });

      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": mimeType },
        onUploadProgress: (event) => {
          const progress = event.total
            ? Math.round((event.loaded / event.total) * 100)
            : 0;
          updateUpload(upload.id, { progress });
        },
      });

      await DriveApi.confirmUpload({
        storageKey,
        name: file.name,
        parentDirId: dirId,
        mimeType,
      });

      updateUpload(upload.id, { status: "done", progress: 100 });

      setTimeout(() => {
        setUploads((prev) => prev.filter((item) => item.id !== upload.id));
      }, 2000);
    } catch (error) {
      updateUpload(upload.id, {
        status: "error",
        error: getApiErrorMessage(error, "Upload failed"),
      });
    }
  }

  async function runBatch(batch: PendingUpload[]) {
    await Promise.all(batch.map(runUpload));
    invalidateFiles();
    invalidateStorageUsage();
  }

  function uploadFiles(files: FileList | File[]) {
    const newUploads: PendingUpload[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      progress: 0,
      status: "uploading",
    }));

    setUploads((prev) => [...prev, ...newUploads]);
    void runBatch(newUploads);
  }

  function retryUpload(id: string) {
    const upload = uploads.find((item) => item.id === id);
    if (!upload) {
      return;
    }
    updateUpload(id, { status: "uploading", progress: 0, error: undefined });
    void runBatch([upload]);
  }

  function dismissUpload(id: string) {
    setUploads((prev) => prev.filter((item) => item.id !== id));
  }

  return { uploads, uploadFiles, retryUpload, dismissUpload };
}
