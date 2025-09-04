import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ScamVideoPlayer } from "@/components/ScamVideoPlayer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  PlayCircle,
  AlertTriangle,
  Phone,
  Mail,
  Building2,
  TrendingUp,
  ArrowRight as ArrowRightIcon,
  Handshake as HandshakeIcon,
} from "lucide-react";

const CHECKLIST_ROUTE = "/secure-your-digital-presence";

// Types
interface ScamVideo {
  id: number;
  title: string;
  description: string;
  youtubeVideoId: string;
  youtubeUrl: string;
  scamType: "phone" | "email" | "business" | null;
  featured: boolean | null;
  addedAt: string;
}

export default function ScamVideos() {
  const [selectedVideo, setSelectedVideo] = useState<ScamVideo | null>(null);

  // Fetch all videos
  const { data: allVideos, isLoading } = useQuery<ScamVideo[]>({
    queryKey: ["/api/scam-videos"],
  });

  // Fetch featured videos
  const { data: featuredVideos, isLoading: isFeaturedLoading } = useQuery<
    ScamVideo[]
  >({
    queryKey: ["/api/scam-videos/featured"],
  });

  const handleVideoSelect = (video: ScamVideo) => {
    setSelectedVideo(video);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderSkeletons = () => {
    return Array(3)
      .fill(0)
      .map((_, i) => (
        <Card key={i} className="mb-4">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[180px] w-full mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-5/6" />
          </CardContent>
        </Card>
      ));
  };

  const renderVideoCards = (videos: ScamVideo[] = []) => {
    if (!videos || videos.length === 0) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium">No videos available</h3>
          <p className="text-muted-foreground">
            Check back later for educational content.
          </p>
        </div>
      );
    }

    return videos.map((video) => (
      <Card key={video.id} className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{video.title}</CardTitle>
          <CardDescription>
            Added {new Date(video.addedAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 rounded-md overflow-hidden">
            <AspectRatio ratio={16 / 9}>
              <div className="relative w-full h-full">
                <img
                  src={`https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors">
                  <PlayCircle className="h-16 w-16 text-white opacity-80" />
                </div>
              </div>
            </AspectRatio>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {video.description}
          </p>
          <Button
            onClick={() => handleVideoSelect(video)}
            className="w-full"
            variant="secondary"
          >
            Watch Video
          </Button>
        </CardContent>
      </Card>
    ));
  };

  const getScamTypeIcon = (type: string | null) => {
    switch (type) {
      case "phone":
        return <Phone className="h-4 w-4 mr-1" />;
      case "email":
        return <Mail className="h-4 w-4 mr-1" />;
      case "business":
        return <Building2 className="h-4 w-4 mr-1" />;
      default:
        return <AlertTriangle className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header — mirrored from Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Educational Videos</h1>
          <p className="text-muted-foreground mt-1">
            Learn how to identify and protect yourself from common scams.
          </p>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            <HandshakeIcon className="h-4 w-4 text-primary" />
            We research and partner with industry leaders to provide security at
            a cheaper price — unlocking your digital confidence.
          </p>
        </div>

        {/* Right-side CTA (same placement as Dashboard) */}
        <div className="mt-4 md:mt-0">
          <Link to={CHECKLIST_ROUTE}>
            <Button className="gap-1">
              Open Security Checklist
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Player + details */}
        <div className="lg:col-span-2">
          {selectedVideo ? (
            <div className="bg-card rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="w-full max-w-full">
                <ScamVideoPlayer
                  videoId={selectedVideo.youtubeVideoId}
                  title={selectedVideo.title}
                  size="large"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center mb-2">
                  {getScamTypeIcon(selectedVideo.scamType)}
                  <span className="text-sm text-muted-foreground">
                    {selectedVideo.scamType
                      ? `${selectedVideo.scamType.charAt(0).toUpperCase()}${selectedVideo.scamType.slice(
                          1,
                        )} Scam`
                      : "General Scam Information"}
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-2">
                  {selectedVideo.title}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {selectedVideo.description}
                </p>
                <div className="text-sm text-muted-foreground">
                  Added on{" "}
                  {new Date(selectedVideo.addedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : isLoading || isFeaturedLoading ? (
            <div className="bg-card rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="w-full">
                <AspectRatio ratio={16 / 9}>
                  <Skeleton className="h-full w-full" />
                </AspectRatio>
              </div>
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ) : featuredVideos && featuredVideos.length > 0 ? (
            <div className="bg-card rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="w-full max-w-full">
                <ScamVideoPlayer
                  videoId={featuredVideos[0].youtubeVideoId}
                  title={featuredVideos[0].title}
                  size="large"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center mb-2">
                  {getScamTypeIcon(featuredVideos[0].scamType)}
                  <span className="text-sm text-muted-foreground">
                    {featuredVideos[0].scamType
                      ? `${featuredVideos[0].scamType.charAt(0).toUpperCase()}${featuredVideos[0].scamType.slice(
                          1,
                        )} Scam`
                      : "General Scam Information"}
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-2">
                  {featuredVideos[0].title}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {featuredVideos[0].description}
                </p>
                <div className="text-sm text-muted-foreground">
                  Added on{" "}
                  {new Date(featuredVideos[0].addedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-sm overflow-hidden mb-6 p-8 text-center">
              <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
              <h3 className="text-xl font-medium mb-2">
                No featured videos available
              </h3>
              <p className="text-muted-foreground mb-4">
                Our team is working on adding educational content about the
                latest scams.
              </p>
            </div>
          )}

          <div className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  Why Watch These Videos?
                </CardTitle>
                <CardDescription>
                  Short, practical explainers to help you avoid the latest scam
                  tactics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Identify Scams
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      Learn the warning signs and red flags so you can spot
                      scams before they catch you off guard.
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Stay Updated
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      Keep up with evolving techniques so you’re always one step
                      ahead.
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Video list */}
        <div>
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle>All Videos</CardTitle>
              <CardDescription>
                Browse our collection of educational content
              </CardDescription>
              <Separator className="mt-2" />
            </CardHeader>
            <CardContent className="px-4 pt-0">
              {isLoading ? renderSkeletons() : renderVideoCards(allVideos)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
