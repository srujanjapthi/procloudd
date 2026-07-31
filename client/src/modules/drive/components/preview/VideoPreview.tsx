import { useState } from "react";
import { VideoOff } from "lucide-react";
import { MediaControls, useMediaPlayer } from "@/lib/media-player";
import { PreviewFallback } from "./PreviewFallback";
import type { PreviewComponentProps } from "./previewRegistry";

export function VideoPreview({
  previewUrl,
  onDownload,
}: PreviewComponentProps) {
  const [hasError, setHasError] = useState(false);
  const [videoRef, player] = useMediaPlayer<HTMLVideoElement>();

  if (hasError) {
    return (
      <PreviewFallback
        icon={<VideoOff className="size-12 text-white/40" />}
        title="Couldn't play this video"
        description="Your browser may not support this video format. Try downloading it instead."
        onDownload={onDownload}
      />
    );
  }

  return (
    <div className="flex size-full flex-col items-center justify-center gap-3">
      <video
        ref={videoRef}
        src={previewUrl}
        className="min-h-0 max-w-full flex-1 rounded-lg object-contain"
        onError={() => setHasError(true)}
        onClick={player.togglePlay}
      />
      <div className="w-full max-w-2xl shrink-0">
        <MediaControls
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          volume={player.volume}
          muted={player.muted}
          onTogglePlay={player.togglePlay}
          onSeek={player.seek}
          onVolumeChange={player.setVolume}
          onToggleMute={player.toggleMute}
        />
      </div>
    </div>
  );
}
