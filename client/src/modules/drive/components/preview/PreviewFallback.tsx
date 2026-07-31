import type { ReactNode } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewFallbackProps {
  icon: ReactNode;
  title: string;
  description: string;
  onDownload: () => void;
}

export function PreviewFallback({
  icon,
  title,
  description,
  onDownload,
}: PreviewFallbackProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 text-center">
      {icon}
      <div>
        <p className="text-base font-medium text-white">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-white/60">{description}</p>
      </div>
      <Button className="mt-2" onClick={onDownload}>
        <Download />
        Download
      </Button>
    </div>
  );
}
