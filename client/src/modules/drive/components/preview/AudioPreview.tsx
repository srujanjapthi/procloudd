import { useState } from "react";
import { Music, VolumeX } from "lucide-react";
import { MediaControls, useMediaPlayer } from "@/lib/media-player";
import { PreviewFallback } from "./PreviewFallback";
import type { PreviewComponentProps } from "./previewRegistry";

export function AudioPreview({
  previewUrl,
  onDownload,
}: PreviewComponentProps) {
  const [hasError, setHasError] = useState(false);
  const [audioRef, player] = useMediaPlayer<HTMLAudioElement>();

  if (hasError) {
    return (
      <PreviewFallback
        icon={<VolumeX className="size-12 text-white/40" />}
        title="Couldn't play this audio"
        description="Something went wrong loading the preview. Try downloading it instead."
        onDownload={onDownload}
      />
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 px-6">
      <Music className="size-20 text-white/30" />
      <audio
        ref={audioRef}
        src={previewUrl}
        className="hidden"
        onError={() => setHasError(true)}
      />
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
  );
}
