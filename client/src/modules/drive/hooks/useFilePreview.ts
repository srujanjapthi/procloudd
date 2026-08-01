import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router";
import { toast } from "react-hot-toast";
import { getApiErrorMessage } from "@/error/api.error";
import { triggerDownload } from "@/lib/trigger-download.util";
import * as DriveApi from "../api";
import { useFilePreviewUrlQuery } from "../queries";
import type { FileProfile } from "../types";

const PREVIEW_PARAM = "preview";

export function useFilePreview(
  files: FileProfile[],
  isFilesLoading: boolean,
  hasMoreFiles: boolean
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const previewFileId = searchParams.get(PREVIEW_PARAM);
  const currentIndex = previewFileId
    ? files.findIndex((file) => file.id === previewFileId)
    : -1;
  const currentFile = currentIndex !== -1 ? files[currentIndex] : null;

  const {
    data: previewUrl,
    isLoading: isLoadingUrl,
    isError: hasUrlError,
  } = useFilePreviewUrlQuery(currentFile?.id ?? null);

  function openPreview(fileId: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(PREVIEW_PARAM, fileId);
      return next;
    });
  }

  function goTo(fileId: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(PREVIEW_PARAM, fileId);
        return next;
      },
      { replace: true }
    );
  }

  const close = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PREVIEW_PARAM);
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  useEffect(() => {
    if (!previewFileId || isFilesLoading || hasMoreFiles) {
      return;
    }
    const stillExists = files.some((file) => file.id === previewFileId);
    if (!stillExists) {
      close();
    }
  }, [previewFileId, files, isFilesLoading, hasMoreFiles, close]);

  function next() {
    if (currentIndex !== -1 && currentIndex < files.length - 1) {
      goTo(files[currentIndex + 1].id);
    }
  }

  function prev() {
    if (currentIndex > 0) {
      goTo(files[currentIndex - 1].id);
    }
  }

  async function downloadCurrent() {
    if (!currentFile) {
      return;
    }
    try {
      const url = await DriveApi.getFileDownloadUrl(currentFile.id);
      triggerDownload(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return {
    currentFile,
    previewUrl,
    isLoadingUrl,
    hasUrlError,
    hasNext: currentIndex !== -1 && currentIndex < files.length - 1,
    hasPrev: currentIndex > 0,
    openPreview,
    close,
    next,
    prev,
    downloadCurrent,
  };
}
