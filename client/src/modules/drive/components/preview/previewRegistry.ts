import type { ComponentType } from "react";
import { ImagePreview } from "./ImagePreview";
import { VideoPreview } from "./VideoPreview";
import { AudioPreview } from "./AudioPreview";
import { PdfPreview } from "./PdfPreview";
import { TextPreview } from "./TextPreview";
import { UnsupportedPreview } from "./UnsupportedPreview";

export type PreviewKind =
  "image" | "video" | "audio" | "pdf" | "text" | "unsupported";

export interface PreviewComponentProps {
  previewUrl: string;
  fileName: string;
  extension: string;
  sizeInBytes: number;
  onDownload: () => void;
}

const KIND_EXTENSIONS: Record<Exclude<PreviewKind, "unsupported">, string[]> = {
  image: [
    "png",
    "jpg",
    "jpeg",
    "gif",
    "svg",
    "webp",
    "avif",
    "bmp",
    "tiff",
    "ico",
    "heic",
  ],
  video: [
    "mp4",
    "webm",
    "mov",
    "avi",
    "mkv",
    "m4v",
    "mpeg",
    "mpg",
    "3gp",
    "flv",
    "wmv",
  ],
  audio: [
    "mp3",
    "wav",
    "flac",
    "aac",
    "ogg",
    "opus",
    "m4a",
    "wma",
    "mid",
    "midi",
  ],
  pdf: ["pdf"],
  text: [
    "txt",
    "md",
    "csv",
    "json",
    "json5",
    "log",
    "xml",
    "yml",
    "yaml",
    "ini",
    "conf",
    "env",
    "js",
    "jsx",
    "ts",
    "tsx",
    "py",
    "java",
    "kt",
    "swift",
    "rs",
    "dart",
    "vue",
    "c",
    "cpp",
    "cs",
    "go",
    "rb",
    "php",
    "html",
    "css",
    "scss",
    "sh",
    "sql",
  ],
};

const EXTENSION_TO_KIND = new Map<string, PreviewKind>();
for (const [kind, extensions] of Object.entries(KIND_EXTENSIONS)) {
  for (const extension of extensions) {
    EXTENSION_TO_KIND.set(extension, kind as PreviewKind);
  }
}

export function getPreviewKind(extension: string): PreviewKind {
  return EXTENSION_TO_KIND.get(extension.toLowerCase()) ?? "unsupported";
}

export const PREVIEW_COMPONENTS: Record<
  PreviewKind,
  ComponentType<PreviewComponentProps>
> = {
  image: ImagePreview,
  video: VideoPreview,
  audio: AudioPreview,
  pdf: PdfPreview,
  text: TextPreview,
  unsupported: UnsupportedPreview,
};
