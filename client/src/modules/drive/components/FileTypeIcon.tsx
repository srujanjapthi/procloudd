import {
  File,
  FileArchive,
  FileAudio,
  FileAxis3D,
  FileCode,
  FileCog,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileType,
  FileVideo,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconStyle {
  icon: LucideIcon;
  colorClassName: string;
}

function getIconStyle(extension: string): IconStyle {
  switch (extension) {
    case "json":
    case "json5":
    case "db":
    case "sqlite":
    case "sqlite3":
      return { icon: FileJson, colorClassName: "text-emerald-500" };

    case "pdf":
      return { icon: FileText, colorClassName: "text-red-500" };

    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "webp":
    case "avif":
    case "bmp":
    case "tiff":
    case "ico":
    case "heic":
      return { icon: FileImage, colorClassName: "text-blue-500" };

    case "ai":
    case "psd":
    case "indd":
    case "eps":
    case "sketch":
    case "fig":
    case "xd":
      return { icon: FileImage, colorClassName: "text-fuchsia-500" };

    case "mp4":
    case "mov":
    case "avi":
    case "mkv":
    case "webm":
    case "flv":
    case "wmv":
    case "m4v":
    case "mpeg":
    case "mpg":
    case "3gp":
      return { icon: FileVideo, colorClassName: "text-purple-500" };

    case "mp3":
    case "wav":
    case "flac":
    case "aac":
    case "ogg":
    case "opus":
    case "m4a":
    case "wma":
    case "mid":
    case "midi":
      return { icon: FileAudio, colorClassName: "text-amber-500" };

    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
    case "bz2":
    case "xz":
    case "iso":
    case "img":
      return { icon: FileArchive, colorClassName: "text-yellow-600" };

    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "py":
    case "java":
    case "kt":
    case "swift":
    case "rs":
    case "dart":
    case "vue":
    case "c":
    case "cpp":
    case "cs":
    case "go":
    case "rb":
    case "php":
    case "html":
    case "css":
    case "scss":
    case "sh":
    case "ps1":
    case "bat":
    case "sql":
    case "yml":
    case "yaml":
    case "toml":
    case "ini":
    case "conf":
    case "env":
    case "xml":
    case "lua":
      return { icon: FileCode, colorClassName: "text-emerald-500" };

    case "ttf":
    case "otf":
    case "woff":
    case "woff2":
    case "eot":
      return { icon: FileType, colorClassName: "text-indigo-500" };

    case "exe":
    case "dll":
    case "msi":
    case "dmg":
    case "apk":
    case "deb":
    case "rpm":
    case "bin":
    case "app":
    case "jar":
      return { icon: FileCog, colorClassName: "text-slate-500" };

    case "dwg":
    case "dxf":
    case "obj":
    case "stl":
    case "fbx":
    case "blend":
    case "3ds":
    case "3mf":
      return { icon: FileAxis3D, colorClassName: "text-cyan-600" };

    case "xls":
    case "xlsx":
    case "csv":
    case "ods":
    case "numbers":
      return { icon: FileSpreadsheet, colorClassName: "text-green-600" };

    case "ppt":
    case "pptx":
    case "odp":
    case "key":
      return { icon: FileText, colorClassName: "text-orange-500" };

    case "doc":
    case "docx":
    case "txt":
    case "rtf":
    case "md":
    case "odt":
    case "pages":
    case "epub":
    case "mobi":
    case "log":
      return { icon: FileText, colorClassName: "text-sky-600" };

    default:
      return { icon: File, colorClassName: "text-muted-foreground" };
  }
}

interface FileTypeIconProps {
  extension: string;
  className?: string;
}

export function FileTypeIcon({
  extension,
  className = "size-5",
}: FileTypeIconProps) {
  const { icon: Icon, colorClassName } = getIconStyle(extension.toLowerCase());

  return <Icon className={cn("shrink-0", colorClassName, className)} />;
}
