import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { type ScamVideo } from "@shared/schema";
import { ScamVideoPlayer } from "@/components/scams/ScamVideoPlayer";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, ExternalLink } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type VideoType = "educational" | "awareness" | "alerting" | "tutorial";

// Allow legacy items (that still have scamType) to be displayed
type VideoItem = ScamVideo & {
  videoType?: VideoType;
  scamType?: string; // legacy
};

// Map legacy scamType → new generic video type (override here as you like)
const legacyTypeToVideoType = (legacy?: string): VideoType => {
  switch ((legacy || "").toLowerCase()) {
    case "phone":
    case "email":
    case "business":
      return "awareness";
    default:
      return "awareness";
  }
};

// Form schema for adding/editing a video (generic types)
const videoFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  youtubeUrl: z.string().url({ message: "Must be a valid YouTube URL" }),
  youtubeVideoId: z.string().optional(),
  videoType: z.enum(["educational", "awareness", "alerting", "tutorial"]),
  featured: z.boolean().default(false),
  // keeping this optional field for now to avoid breaking existing API
  consolidatedScamId: z.number().nullable().optional(),
});

type VideoFormValues = z.infer<typeof videoFormSchema>;

export function ScamVideoManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<VideoItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch all videos
  const {
    data: videos,
    isLoading,
    isError,
  } = useQuery<VideoItem[]>({
    queryKey: ["/api/scam-videos"],
  });

  const normalizedVideos = useMemo<VideoItem[]>(
    () =>
      (videos || []).map((v) => ({
        ...v,
        videoType:
          (v.videoType as VideoType) ?? legacyTypeToVideoType(v.scamType),
      })),
    [videos],
  );

  // Add video mutation
  const addVideoMutation = useMutation({
    mutationFn: async (data: VideoFormValues) => {
      const response = await apiRequest("/scam-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // send new field; backend can accept both during transition if needed
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scam-videos"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Video added",
        description: "Your video has been added to the library.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add video",
        description:
          error?.message || "An error occurred while adding the video.",
        variant: "destructive",
      });
    },
  });

  // Update video mutation
  const updateVideoMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<VideoFormValues>;
    }) => {
      const response = await apiRequest(`/scam-videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scam-videos"] });
      setIsEditDialogOpen(false);
      setEditingVideo(null);
      toast({
        title: "Video updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update video",
        description:
          error?.message || "An error occurred while updating the video.",
        variant: "destructive",
      });
    },
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/scam-videos/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scam-videos"] });
      setIsDeleteDialogOpen(false);
      setDeletingVideo(null);
      toast({
        title: "Video deleted",
        description: "The video has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete video",
        description:
          error?.message || "An error occurred while deleting the video.",
        variant: "destructive",
      });
    },
  });

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("youtube.com")) {
        return urlObj.searchParams.get("v");
      } else if (urlObj.hostname.includes("youtu.be")) {
        return urlObj.pathname.substring(1);
      }
    } catch (error) {
      // noop
    }
    return null;
  };

  // Filter videos by type
  const featuredVideos = normalizedVideos.filter((v) => v.featured);
  const educationalVideos = normalizedVideos.filter(
    (v) => v.videoType === "educational",
  );
  const awarenessVideos = normalizedVideos.filter(
    (v) => v.videoType === "awareness",
  );
  const alertingVideos = normalizedVideos.filter(
    (v) => v.videoType === "alerting",
  );
  const tutorialVideos = normalizedVideos.filter(
    (v) => v.videoType === "tutorial",
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle>Error Loading Videos</CardTitle>
          <CardDescription>
            There was a problem loading the videos.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["/api/scam-videos"] })
            }
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Video Library</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Video
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({normalizedVideos.length})</TabsTrigger>
          <TabsTrigger value="featured">
            Featured ({featuredVideos.length})
          </TabsTrigger>
          <TabsTrigger value="educational">
            Educational ({educationalVideos.length})
          </TabsTrigger>
          <TabsTrigger value="awareness">
            Awareness ({awarenessVideos.length})
          </TabsTrigger>
          <TabsTrigger value="alerting">
            Alerting ({alertingVideos.length})
          </TabsTrigger>
          <TabsTrigger value="tutorial">
            Tutorial ({tutorialVideos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <VideoList
            videos={normalizedVideos}
            onEdit={(video) => {
              setEditingVideo(video);
              setIsEditDialogOpen(true);
            }}
            onDelete={(video) => {
              setDeletingVideo(video);
              setIsDeleteDialogOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="featured">
          <VideoList
            videos={featuredVideos}
            onEdit={(video) => {
              setEditingVideo(video);
              setIsEditDialogOpen(true);
            }}
            onDelete={(video) => {
              setDeletingVideo(video);
              setIsDeleteDialogOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="educational">
          <VideoList
            videos={educationalVideos}
            onEdit={(video) => {
              setEditingVideo(video);
              setIsEditDialogOpen(true);
            }}
            onDelete={(video) => {
              setDeletingVideo(video);
              setIsDeleteDialogOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="awareness">
          <VideoList
            videos={awarenessVideos}
            onEdit={(video) => {
              setEditingVideo(video);
              setIsEditDialogOpen(true);
            }}
            onDelete={(video) => {
              setDeletingVideo(video);
              setIsDeleteDialogOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="alerting">
          <VideoList
            videos={alertingVideos}
            onEdit={(video) => {
              setEditingVideo(video);
              setIsEditDialogOpen(true);
            }}
            onDelete={(video) => {
              setDeletingVideo(video);
              setIsDeleteDialogOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="tutorial">
          <VideoList
            videos={tutorialVideos}
            onEdit={(video) => {
              setEditingVideo(video);
              setIsEditDialogOpen(true);
            }}
            onDelete={(video) => {
              setDeletingVideo(video);
              setIsDeleteDialogOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Add Video Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Video</DialogTitle>
            <DialogDescription>
              Add a YouTube video to help users learn and stay safe.
            </DialogDescription>
          </DialogHeader>

          <VideoForm
            onSubmit={(data) => addVideoMutation.mutate(data)}
            isSubmitting={addVideoMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Video Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
            <DialogDescription>
              Update the details of this video.
            </DialogDescription>
          </DialogHeader>

          {editingVideo && (
            <VideoForm
              video={editingVideo}
              onSubmit={(data) => {
                updateVideoMutation.mutate({
                  id: editingVideo.id,
                  data,
                });
              }}
              isSubmitting={updateVideoMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingVideo?.title}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingVideo && deleteVideoMutation.mutate(deletingVideo.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteVideoMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function VideoList({
  videos,
  onEdit,
  onDelete,
}: {
  videos: VideoItem[];
  onEdit: (video: VideoItem) => void;
  onDelete: (video: VideoItem) => void;
}) {
  if (videos.length === 0) {
    return (
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle>No Videos Found</CardTitle>
          <CardDescription>
            There are no videos in this category. Add a new video using the "Add
            Video" button.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <Card key={video.id} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 lg:w-1/4">
              <div className="aspect-video">
                <ScamVideoPlayer videoId={video.youtubeVideoId} />
              </div>
            </div>
            <div className="flex-1">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      {video.title}
                      {video.featured && (
                        <Badge className="ml-2" variant="secondary">
                          Featured
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Type:{" "}
                      <Badge variant="outline">
                        {video.videoType ??
                          legacyTypeToVideoType(video.scamType)}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(video)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => onDelete(video)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {video.description}
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  Added: {new Date(video.addedAt || "").toLocaleDateString()}
                  {video.updatedAt && video.updatedAt !== video.addedAt && (
                    <span className="ml-2">
                      · Updated:{" "}
                      {new Date(video.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" /> Watch on YouTube
                  </a>
                </Button>
              </CardFooter>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function VideoForm({
  video,
  onSubmit,
  isSubmitting,
}: {
  video?: VideoItem;
  onSubmit: (data: VideoFormValues) => void;
  isSubmitting: boolean;
}) {
  const defaultType: VideoType =
    video?.videoType ?? legacyTypeToVideoType(video?.scamType);

  const form = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: video
      ? {
          title: video.title,
          description: video.description,
          youtubeUrl: video.youtubeUrl,
          videoType: defaultType,
          featured: video.featured || false,
          consolidatedScamId: (video as any).consolidatedScamId ?? null,
        }
      : {
          title: "",
          description: "",
          youtubeUrl: "",
          videoType: "educational",
          featured: false,
          consolidatedScamId: null,
        },
  });

  const youtubeUrl = form.watch("youtubeUrl");
  const videoId = youtubeUrl ? getYouTubeId(youtubeUrl) : null;

  // Include youtubeVideoId on submit
  const onSubmitForm = (data: VideoFormValues) => {
    const extractedVideoId = getYouTubeId(data.youtubeUrl);
    if (extractedVideoId) {
      onSubmit({
        ...data,
        youtubeVideoId: extractedVideoId,
      });
    } else {
      form.setError("youtubeUrl", {
        type: "manual",
        message:
          "Could not extract YouTube video ID from this URL. Please use a valid YouTube URL.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Example: How VPNs Protect You"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="youtubeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the full YouTube video URL
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="videoType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select video type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="awareness">Awareness</SelectItem>
                      <SelectItem value="alerting">Alerting</SelectItem>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Featured Video</FormLabel>
                    <FormDescription>
                      Featured videos are displayed prominently in the library.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what users will learn..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Video Preview</h3>
            {videoId ? (
              <div className="aspect-video overflow-hidden rounded-md border">
                <ScamVideoPlayer videoId={videoId} />
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center rounded-md border bg-muted">
                <p className="text-muted-foreground">
                  Enter a valid YouTube URL to see preview
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : video ? "Update Video" : "Add Video"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function getYouTubeId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com")) {
      return urlObj.searchParams.get("v");
    } else if (urlObj.hostname.includes("youtu.be")) {
      return urlObj.pathname.substring(1);
    }
  } catch (error) {
    // noop
  }
  return null;
}
