export type StorageCategory =
  "Images" | "Videos" | "Audio" | "Documents" | "Archives" | "Code" | "Other";

const CATEGORY_EXTENSIONS: Record<
  Exclude<StorageCategory, "Other">,
  string[]
> = {
  Images: [
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
    "ai",
    "psd",
    "indd",
    "eps",
    "sketch",
    "fig",
    "xd",
  ],
  Videos: [
    "mp4",
    "mov",
    "avi",
    "mkv",
    "webm",
    "flv",
    "wmv",
    "m4v",
    "mpeg",
    "mpg",
    "3gp",
  ],
  Audio: [
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
  Documents: [
    "pdf",
    "doc",
    "docx",
    "txt",
    "rtf",
    "md",
    "odt",
    "pages",
    "epub",
    "mobi",
    "log",
    "ppt",
    "pptx",
    "odp",
    "key",
    "xls",
    "xlsx",
    "csv",
    "ods",
    "numbers",
  ],
  Archives: ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso", "img"],
  Code: [
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
    "ps1",
    "bat",
    "sql",
    "yml",
    "yaml",
    "toml",
    "ini",
    "conf",
    "env",
    "xml",
    "lua",
    "json",
    "json5",
  ],
};

const EXTENSION_TO_CATEGORY = new Map<string, StorageCategory>();
for (const [category, extensions] of Object.entries(CATEGORY_EXTENSIONS)) {
  for (const extension of extensions) {
    EXTENSION_TO_CATEGORY.set(extension, category as StorageCategory);
  }
}

export function getStorageCategory(extension: string): StorageCategory {
  return EXTENSION_TO_CATEGORY.get(extension.toLowerCase()) ?? "Other";
}

export const STORAGE_CATEGORY_COLORS: Record<StorageCategory, string> = {
  Images: "bg-blue-500",
  Videos: "bg-purple-500",
  Audio: "bg-amber-500",
  Documents: "bg-sky-600",
  Archives: "bg-yellow-600",
  Code: "bg-emerald-500",
  Other: "bg-slate-400",
};
