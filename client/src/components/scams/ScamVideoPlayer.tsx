import React, { useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { PlayIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScamVideoPlayerProps {
  videoId: string;
  title?: string;
  autoPlay?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function ScamVideoPlayer({ 
  videoId, 
  title, 
  autoPlay = false,
  size = 'medium'
}: ScamVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  
  // YouTube iframe URL with parameters
  const youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? '1' : '0'}&rel=0&modestbranding=1`;
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handlePlay = () => {
    setIsPlaying(true);
  };

  // Use a container with proper aspect ratio for YouTube videos (16:9)
  return (
    <div className="w-full">
      <AspectRatio ratio={16 / 9}>
        <div className="relative w-full h-full">
          {!isPlaying ? (
            // Thumbnail view with play button
            <div className="w-full h-full relative cursor-pointer group" onClick={handlePlay}>
              <img 
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
                alt={title || "YouTube video thumbnail"} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                <Button variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-black/60 hover:bg-black/80 text-white">
                  <PlayIcon className="h-8 w-8" />
                </Button>
              </div>
            </div>
          ) : (
            // Iframe with loading state
            <div className="w-full h-full">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <iframe
                src={youtubeEmbedUrl}
                title={title || "YouTube video player"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                onLoad={handleLoad}
              />
            </div>
          )}
        </div>
      </AspectRatio>
    </div>
  );
}