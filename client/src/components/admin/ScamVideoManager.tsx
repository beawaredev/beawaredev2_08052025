// /src/components/admin/ScamVideoManager.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api-interceptor"; // FIX: use interceptor used elsewhere
import { type ScamVideo, type ScamType } from "@shared/schema";
import { ScamVideoPlayer } from "@/components/ScamVideoPlayer";
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

// If you have an auth context, import it. This is used to populate `createdBy`.
// Make sure your context exposes a numeric `id` or a string `uid`.
import { useAuth } from "@/contexts/AuthContext";

// ---- Form schema for adding/editing a video (kept from your version) ----
const videoFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  youtubeUrl: z.string().url({ message: "Must be a valid YouTube URL" }),
  youtubeVideoId: z.string().optional(),
  scamType: z.enum(["phone", "email", "business"]),
  featured: z.boolean().default(false),
  consolidatedScamId: z.number().nullable().optional(),
});

type VideoFormValues = z.infer<typeof videoFormSchema>;

// ---- helpers ----
const getYouTubeId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com")) {
      return urlObj.searchParams.get("v");
    } else if (urlObj.hostname.includes("youtu.be")) {
      return urlObj.pathname.substring(1);
    }
  } catch {
    // ignore parse errors; validation handles it
  }
  return null;
};

export function ScamVideoManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Pull current user to populate `createdBy`. Fallback tries `uid`.
  const { user } = useAuth?.() || { user: undefined };
  const currentUserId = useMemo(() => {
    const n = Number(user?.id ?? user?.uid ?? 0);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [user]);

  const [editingVideo, setEditingVideo] = useState<ScamVideo | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<ScamVideo | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // ---- Fetch all videos ----
  const {
    data: videos = [],
    isLoading,
    isError,
  } = useQuery<ScamVideo[]>({
    queryKey: ["/api/scam-videos"],
    queryFn: async () => {
      const res = await apiRequest("/api/scam-videos");
      if (!res.ok && res.status !== 304) {
        throw new Error(`Failed to load videos (${res.status})`);
      }
      return res.status === 304 ? [] : res.json();
    },
  });

  // Categorized lists (unchanged)
  const phoneVideos = videos.filter((v) => v.scamType === "phone");
  const emailVideos = videos.filter((v) => v.scamType === "email");
  const businessVideos = videos.filter((v) => v.scamType === "business");
  const featuredVideos = videos.filter((v) => v.featured);

  // ---- Add video ----
  const addVideoMutation = useMutation({
    mutationFn: async (data: VideoFormValues) => {
      if (!currentUserId) {
        throw new Error(
          "Missing user id for createdBy. Ensure you are logged in and your AuthContext exposes a numeric id.",
        );
      }
      const youtubeVideoId =
        data.youtubeVideoId || getYouTubeId(data.youtubeUrl);
      if (!youtubeVideoId) {
        throw new Error(
          "Could not extract YouTube video ID from the provided URL.",
        );
      }

      // Map required backend fields:
      // - videoUrl (string)     ← from youtubeUrl
      // - createdBy (number)
      const payload = {
        title: data.title?.trim(),
        description: data.description?.trim(),
        scamType: data.scamType,
        featured: !!data.featured,
        consolidatedScamId: data.consolidatedScamId ?? null,

        // backend-required
        videoUrl: data.youtubeUrl.trim(),
        createdBy: currentUserId,

        // keep your extended fields too
        youtubeUrl: data.youtubeUrl.trim(),
        youtubeVideoId,
      };

      const response = await apiRequest("/api/scam-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Create failed (${response.status})`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scam-videos"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Video added successfully",
        description: "The educational video has been added.",
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

  // ---- Update video ----
  const updateVideoMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<VideoFormValues>;
    }) => {
      const youtubeVideoId =
        data.youtubeVideoId ||
        (data.youtubeUrl ? getYouTubeId(data.youtubeUrl) : undefined);
      if (data.youtubeUrl && !youtubeVideoId) {
        throw new Error(
          "Could not extract YouTube video ID from the provided URL.",
        );
      }

      // Preserve existing createdBy from server if your API returns it on GET,
      // but to be safe, also send current user if available.
      const payload = {
        ...(data.title != null ? { title: data.title?.trim() } : {}),
        ...(data.description != null
          ? { description: data.description?.trim() }
          : {}),
        ...(data.scamType != null ? { scamType: data.scamType } : {}),
        ...(data.featured != null ? { featured: !!data.featured } : {}),
        ...(data.consolidatedScamId !== undefined
          ? { consolidatedScamId: data.consolidatedScamId ?? null }
          : {}),

        ...(data.youtubeUrl != null
          ? {
              videoUrl: data.youtubeUrl.trim(),
              youtubeUrl: data.youtubeUrl.trim(),
            }
          : {}),
        ...(youtubeVideoId ? { youtubeVideoId } : {}),

        ...(currentUserId ? { createdBy: currentUserId } : {}),
      };

      const response = await apiRequest(`/api/scam-videos/${id}`, {
        method: "PUT", // FIX: align with backend expecting full object
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Update failed (${response.status})`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scam-videos"] });
      setIsEditDialogOpen(false);
      setEditingVideo(null);
      toast({
        title: "Video updated successfully",
        description: "The educational video has been updated.",
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

  // ---- Delete video ----
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/scam-videos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Delete failed (${res.status})`);
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scam-videos"] });
      setIsDeleteDialogOpen(false);
      setDeletingVideo(null);
      toast({
        title: "Video deleted successfully",
        description: "The educational video has been removed.",
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
            There was a problem loading the educational videos.
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
        <h2 className="text-2xl font-bold">Educational Videos</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Video
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Videos ({videos.length})</TabsTrigger>
          <TabsTrigger value="featured">
            Featured ({featuredVideos.length})
          </TabsTrigger>
          <TabsTrigger value="phone">Phone ({phoneVideos.length})</TabsTrigger>
          <TabsTrigger value="email">Email ({emailVideos.length})</TabsTrigger>
          <TabsTrigger value="business">
            Business ({businessVideos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <VideoList
            videos={videos}
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

        <TabsContent value="phone">
          <VideoList
            videos={phoneVideos}
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

        <TabsContent value="email">
          <VideoList
            videos={emailVideos}
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

        <TabsContent value="business">
          <VideoList
            videos={businessVideos}
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
            <DialogTitle>Add Educational Video</DialogTitle>
            <DialogDescription>
              Add a YouTube video to help users learn about scams and how to
              protect themselves.
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
            <DialogTitle>Edit Educational Video</DialogTitle>
            <DialogDescription>
              Update the details of this educational video.
            </DialogDescription>
          </DialogHeader>

          {editingVideo && (
            <VideoForm
              video={editingVideo}
              onSubmit={(data) => {
                const extractedVideoId = getYouTubeId(data.youtubeUrl);
                if (!extractedVideoId) {
                  toast({
                    title: "Invalid YouTube URL",
                    description:
                      "Could not extract a valid YouTube video ID from this URL. Please use a valid YouTube URL.",
                    variant: "destructive",
                  });
                  return;
                }
                updateVideoMutation.mutate({
                  id: editingVideo.id,
                  data: { ...data, youtubeVideoId: extractedVideoId },
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the video "{deletingVideo?.title}".
              This action cannot be undone.
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
  videos: ScamVideo[];
  onEdit: (video: ScamVideo) => void;
  onDelete: (video: ScamVideo) => void;
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
                      Type: <Badge variant="outline">{video.scamType}</Badge>
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
                  Added:{" "}
                  {video.addedAt
                    ? new Date(video.addedAt).toLocaleDateString()
                    : "—"}
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
                    href={video.youtubeUrl || video.videoUrl}
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
  video?: ScamVideo;
  onSubmit: (data: VideoFormValues) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: video
      ? {
          title: video.title || "",
          description: video.description || "",
          youtubeUrl: (video.youtubeUrl || video.videoUrl || "").toString(),
          scamType: (video.scamType as ScamType) || "phone",
          featured: !!video.featured,
          consolidatedScamId: video.consolidatedScamId ?? null,
        }
      : {
          title: "",
          description: "",
          youtubeUrl: "",
          scamType: "phone",
          featured: false,
          consolidatedScamId: null,
        },
  });

  const youtubeUrl = form.watch("youtubeUrl");
  const videoId = youtubeUrl ? getYouTubeId(youtubeUrl) : null;

  const onSubmitForm = (data: VideoFormValues) => {
    const extractedVideoId = getYouTubeId(data.youtubeUrl);
    if (extractedVideoId) {
      onSubmit({ ...data, youtubeVideoId: extractedVideoId });
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
                      placeholder="How to spot IRS phone scams"
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
              name="scamType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scam Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select scam type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="phone">Phone Scam</SelectItem>
                      <SelectItem value="email">Email Scam</SelectItem>
                      <SelectItem value="business">Business Scam</SelectItem>
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
                      Featured videos are displayed prominently on the scam
                      videos page
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
                      placeholder="Explain what users will learn from this video..."
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
