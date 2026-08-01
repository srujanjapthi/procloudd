import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const VOLUME_STEP = 0.05;

export interface MediaPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook and its matching MediaControls UI are intentionally kept in one file
export function useMediaPlayer<T extends HTMLMediaElement>(): readonly [
  React.RefObject<T | null>,
  MediaPlayerState,
] {
  const mediaRef = useRef<T>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    function handleTimeUpdate() {
      setCurrentTime(media!.currentTime);
    }
    function handleLoadedMetadata() {
      setDuration(media!.duration);
    }
    function handlePlay() {
      setIsPlaying(true);
    }
    function handlePause() {
      setIsPlaying(false);
    }
    function handleVolumeChange() {
      setVolumeState(media!.volume);
      setMuted(media!.muted);
    }

    media.addEventListener("timeupdate", handleTimeUpdate);
    media.addEventListener("loadedmetadata", handleLoadedMetadata);
    media.addEventListener("play", handlePlay);
    media.addEventListener("pause", handlePause);
    media.addEventListener("ended", handlePause);
    media.addEventListener("volumechange", handleVolumeChange);

    return () => {
      media.removeEventListener("timeupdate", handleTimeUpdate);
      media.removeEventListener("loadedmetadata", handleLoadedMetadata);
      media.removeEventListener("play", handlePlay);
      media.removeEventListener("pause", handlePause);
      media.removeEventListener("ended", handlePause);
      media.removeEventListener("volumechange", handleVolumeChange);
    };
  }, []);

  function togglePlay() {
    const media = mediaRef.current;
    if (!media) return;
    if (media.paused) {
      void media.play();
    } else {
      media.pause();
    }
  }

  function seek(time: number) {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = time;
    setCurrentTime(time);
  }

  function setVolume(value: number) {
    const media = mediaRef.current;
    if (!media) return;
    const clamped = Math.min(1, Math.max(0, value));
    media.volume = clamped;
    if (clamped > 0 && media.muted) {
      media.muted = false;
    }
  }

  function toggleMute() {
    const media = mediaRef.current;
    if (!media) return;
    media.muted = !media.muted;
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      const media = mediaRef.current;
      if (!media) return;
      event.preventDefault();
      const delta = event.key === "ArrowUp" ? VOLUME_STEP : -VOLUME_STEP;
      setVolume(media.volume + delta);
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  const state: MediaPlayerState = {
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
  };

  return [mediaRef, state] as const;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${secs}`
    : `${minutes}:${secs}`;
}

const CONTROL_BUTTON_CLASSNAME =
  "text-white hover:bg-white/10 hover:text-white";
const SLIDER_CLASSNAME =
  "[&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-thumb]]:bg-white";

interface MediaControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

export function MediaControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
}: MediaControlsProps) {
  const VolumeIcon =
    muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex w-full items-center gap-3 rounded-lg bg-black/40 px-4 py-2.5 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={isPlaying ? "Pause" : "Play"}
        className={CONTROL_BUTTON_CLASSNAME}
        onClick={onTogglePlay}
      >
        {isPlaying ? (
          <Pause className="fill-current" />
        ) : (
          <Play className="fill-current" />
        )}
      </Button>

      <span className="w-10 shrink-0 text-right text-xs text-white/60 tabular-nums">
        {formatTime(currentTime)}
      </span>

      <Slider
        value={[currentTime]}
        min={0}
        max={duration || 0}
        step={0.1}
        onValueChange={(next) => onSeek(Array.isArray(next) ? next[0] : next)}
        className={cn("flex-1", SLIDER_CLASSNAME)}
      />

      <span className="w-10 shrink-0 text-xs text-white/60 tabular-nums">
        {formatTime(duration)}
      </span>

      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Volume"
              className={cn(CONTROL_BUTTON_CLASSNAME, "shrink-0")}
            />
          }
        >
          <VolumeIcon />
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          sideOffset={8}
          className="w-auto border-none bg-black/90 p-3 shadow-lg ring-0 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3">
            <Slider
              value={[muted ? 0 : volume]}
              min={0}
              max={1}
              step={0.01}
              orientation="vertical"
              onValueChange={(next) =>
                onVolumeChange(Array.isArray(next) ? next[0] : next)
              }
              className={cn("h-40", SLIDER_CLASSNAME)}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={muted ? "Unmute" : "Mute"}
              className={cn(CONTROL_BUTTON_CLASSNAME, "shrink-0")}
              onClick={onToggleMute}
            >
              <VolumeIcon />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
