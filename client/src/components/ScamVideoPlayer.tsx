import React, { useMemo, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { PlayIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type PlayerSize = "small" | "medium" | "large";

interface ScamVideoPlayerProps {
  videoUrl?: string; // full URL (YouTube/Vimeo/.mp4)
  videoId?: string; // optional back-compat (YouTube ID)
  title?: string;
  thumbnailUrl?: string;
  autoPlay?: boolean;
  size?: PlayerSize;
}

type Provider = "youtube" | "vimeo" | "file" | "unknown";

function extractYouTubeId(input: string): string | null {
  if (/^[a-zA-Z0-9_-]{10,14}$/.test(input)) return input;
  try {
    const u = new URL(input);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/");
      const maybe = parts.pop() || "";
      if (maybe && maybe !== "embed") return maybe;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      if (id) return id;
    }
  } catch {}
  return null;
}

function detectProvider(urlOrId: string): Provider {
  const yt = extractYouTubeId(urlOrId);
  if (yt) return "youtube";
  try {
    const u = new URL(urlOrId);
    if (u.hostname.includes("vimeo.com")) return "vimeo";
    if (/\.(mp4|webm|ogg)$/i.test(u.pathname)) return "file";
  } catch {}
  return "unknown";
}

export function ScamVideoPlayer({
  videoUrl,
  videoId,
  title,
  thumbnailUrl,
  autoPlay = false,
  size = "medium",
}: ScamVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const source = useMemo(() => videoUrl ?? videoId ?? "", [videoUrl, videoId]);
  const provider = useMemo<Provider>(() => detectProvider(source), [source]);
  const youtubeId = useMemo(
    () => (provider === "youtube" ? extractYouTubeId(source) : null),
    [provider, source],
  );

  const embedUrl = useMemo(() => {
    switch (provider) {
      case "youtube": {
        const id = youtubeId!;
        const params = new URLSearchParams({
          autoplay: isPlaying ? "1" : "0",
          rel: "0",
          modestbranding: "1",
        });
        return `https://www.youtube.com/embed/${id}?${params.toString()}`;
      }
      case "vimeo": {
        try {
          const u = new URL(source);
          const id = u.pathname.split("/").filter(Boolean).pop();
          const params = new URLSearchParams({
            autoplay: isPlaying ? "1" : "0",
            title: "0",
            byline: "0",
            portrait: "0",
            dnt: "1",
          });
          return id
            ? `https://player.vimeo.com/video/${id}?${params.toString()}`
            : null;
        } catch {
          return null;
        }
      }
      default:
        return null;
    }
  }, [provider, source, youtubeId, isPlaying]);

  const derivedThumb = useMemo(() => {
    if (thumbnailUrl) return thumbnailUrl;
    if (provider === "youtube" && youtubeId)
      return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    return undefined;
  }, [thumbnailUrl, provider, youtubeId]);

  return (
    <div
      className={
        { small: "w-full max-w-xl", medium: "w-full", large: "w-full" }[size]
      }
    >
      <AspectRatio ratio={16 / 9}>
        <div className="relative w-full h-full">
          {!isPlaying ? (
            <div
              className="w-full h-full relative cursor-pointer group rounded-lg overflow-hidden"
              onClick={() => setIsPlaying(true)}
            >
              {derivedThumb ? (
                <img
                  src={derivedThumb}
                  alt={title || "Video thumbnail"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-sm text-muted-foreground">
                    Click to play
                  </span>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-16 w-16 rounded-full bg-black/60 hover:bg-black/80 text-white"
                  aria-label="Play video"
                >
                  <PlayIcon className="h-8 w-8" />
                </Button>
              </div>
            </div>
          ) : provider === "file" ? (
            <div className="w-full h-full">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <video
                className="w-full h-full"
                controls
                autoPlay
                playsInline
                onLoadedData={() => setIsLoading(false)}
                src={source}
              />
            </div>
          ) : embedUrl ? (
            <div className="w-full h-full">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <iframe
                src={embedUrl}
                title={title || "Video player"}
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
                onLoad={() => setIsLoading(false)}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
              <p className="text-sm text-muted-foreground text-center px-4">
                Unsupported or invalid video source.
                <br />
                Provide a full videoUrl (YouTube, Vimeo, or direct .mp4).
              </p>
            </div>
          )}
        </div>
      </AspectRatio>
    </div>
  );
}

export default ScamVideoPlayer;
