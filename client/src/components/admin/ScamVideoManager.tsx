// /src/components/admin/ScamVideoManager.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/api-interceptor";
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

import { useAuth } from "@/contexts/AuthContext";

/** ------------------------------------------------------------------
 * URL Normalization + Validation helpers
 * ------------------------------------------------------------------ */
function extractYouTubeId(input?: string | null): string | null {
  if (!input) return null;
  // bare ID
  if (/^[a-zA-Z0-9_-]{10,14}$/.test(input)) return input;
  try {
    const u = new URL(input);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/");
      const maybe = parts.pop() || "";
      if (parts.includes("embed") || parts.includes("shorts"))
        return maybe || null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      if (id) return id;
    }
  } catch {}
  return null;
}

function extractVimeoId(input?: string | null): string | null {
  if (!input) return null;
  // bare numeric ID
  if (/^\d{6,}$/.test(input)) return input;
  try {
    const u = new URL(input);
    if (u.hostname.includes("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts.pop();
      if (id && /^\d+$/.test(id)) return id;
    }
  } catch {}
  return null;
}

/** Convert raw input (ID or URL) into a canonical playable URL */
function normalizeVideoUrl(input: string): string | null {
  if (!input) return null;
  const s = input.trim();

  // direct mp4 allowed
  if (/^https?:\/\/.+\.mp4($|\?)/i.test(s)) return s;

  // Try YT / Vimeo
  const ytId = extractYouTubeId(s);
  if (ytId) return `https://www.youtube.com/watch?v=${ytId}`;
  const vmId = extractVimeoId(s);
  if (vmId) return `https://vimeo.com/${vmId}`;

  // If generic http(s) URL, let the player try
  if (/^https?:\/\//i.test(s)) return s;

  return null;
}

function isPlayable(url?: string | null): boolean {
  if (!url) return false;
  return /(youtube\.com|youtu\.be|vimeo\.com)|\.mp4($|\?)/i.test(url);
}

/** ------------------------------------------------------------------
 * Form schema (expanded to allow YouTube/Vimeo/.mp4 or raw ID)
 * ------------------------------------------------------------------ */
const videoFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  // accept any non-empty string; we'll normalize/validate ourselves
  videoInput: z.string().min(3, { message: "Provide a valid URL or ID" }),
  scamType: z.enum(["phone", "email", "business"]),
  featured: z.boolean().default(false),
  consolidatedScamId: z.number().nullable().optional(),
});

type VideoFormValues = z.infer<typeof videoFormSchema>;

/** ------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------ */
export function ScamVideoManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  // Fetch all videos
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

  // Categorized lists
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
      const normalizedUrl = normalizeVideoUrl(data.videoInput);
      if (!normalizedUrl || !isPlayable(normalizedUrl)) {
        throw new Error(
          "Unsupported or invalid video source. Provide a YouTube/Vimeo link or ID, or a direct .mp4 URL.",
        );
      }

      const payload: any = {
        title: data.title.trim(),
        description: data.description.trim(),
        scamType: data.scamType,
        featured: !!data.featured,
        consolidatedScamId: data.consolidatedScamId ?? null,
        videoUrl: normalizedUrl,
        createdBy: currentUserId,
      };

      // Keep YouTube ID for legacy consumers, if applicable
      const ytId = extractYouTubeId(normalizedUrl);
      if (ytId) {
        payload.youtubeUrl = normalizedUrl;
        payload.youtubeVideoId = ytId;
      }

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
      const payload: any = {};

      if (data.title != null) payload.title = data.title.trim();
      if (data.description != null)
        payload.description = data.description.trim();
      if (data.scamType != null) payload.scamType = data.scamType;
      if (data.featured != null) payload.featured = !!data.featured;
      if (data.consolidatedScamId !== undefined)
        payload.consolidatedScamId = data.consolidatedScamId ?? null;

      if (data.videoInput != null) {
        const normalizedUrl = normalizeVideoUrl(data.videoInput);
        if (!normalizedUrl || !isPlayable(normalizedUrl)) {
          throw new Error(
            "Unsupported or invalid video source. Provide a YouTube/Vimeo link or ID, or a direct .mp4 URL.",
          );
        }
        payload.videoUrl = normalizedUrl;

        const ytId = extractYouTubeId(normalizedUrl);
        if (ytId) {
          payload.youtubeUrl = normalizedUrl;
          payload.youtubeVideoId = ytId;
        } else {
          // If switching to Vimeo/mp4, clear YouTube-specific fields to avoid confusion
          payload.youtubeUrl = null;
          payload.youtubeVideoId = null;
        }
      }

      if (currentUserId) payload.createdBy = currentUserId;

      const response = await apiRequest(`/api/scam-videos/${id}`, {
        method: "PUT",
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
              Add a YouTube, Vimeo, or .mp4 video to help users learn about
              scams and how to protect themselves.
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
              onSubmit={(data) =>
                updateVideoMutation.mutate({ id: editingVideo.id, data })
              }
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

/** ------------------------------------------------------------------
 * VideoList: uses ScamVideoPlayer with normalized videoUrl
 * ------------------------------------------------------------------ */
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
      {videos.map((video) => {
        const normalized = normalizeVideoUrl(
          (video.youtubeUrl as string) || (video.videoUrl as string) || "",
        );
        const playableUrl = normalized || (video.videoUrl as string) || "";
        return (
          <Card key={video.id} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 lg:w-1/4">
                <div className="aspect-video">
                  {/* Use videoUrl so the player can decide YouTube/Vimeo/mp4 */}
                  <ScamVideoPlayer videoUrl={playableUrl} title={video.title} />
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
                      href={
                        (video.youtubeUrl as string) ||
                        (video.videoUrl as string) ||
                        playableUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" /> Watch Source
                    </a>
                  </Button>
                </CardFooter>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/** ------------------------------------------------------------------
 * VideoForm: zod-driven form; shows live preview using normalized input
 * ------------------------------------------------------------------ */
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
          videoInput:
            (video.youtubeUrl as string) || (video.videoUrl as string) || "",
          scamType: (video.scamType as ScamType) || "phone",
          featured: !!video.featured,
          consolidatedScamId: (video.consolidatedScamId as number) ?? null,
        }
      : {
          title: "",
          description: "",
          videoInput: "",
          scamType: "phone",
          featured: false,
          consolidatedScamId: null,
        },
  });

  const rawInput = form.watch("videoInput");
  const normalizedUrl = normalizeVideoUrl(rawInput || "");

  const onSubmitForm = (data: VideoFormValues) => {
    const url = normalizeVideoUrl(data.videoInput);
    if (!url || !isPlayable(url)) {
      form.setError("videoInput", {
        type: "manual",
        message:
          "Unsupported or invalid video source. Provide a YouTube/Vimeo link or ID, or a direct .mp4 URL.",
      });
      return;
    }
    onSubmit(data);
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
              name="videoInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL or ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="YouTube/Vimeo URL or ID, or direct .mp4 URL"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Examples:{" "}
                    <code>https://www.youtube.com/watch?v=abc123</code>,{" "}
                    <code>abc123</code>, <code>https://vimeo.com/12345678</code>
                    , <code>https://cdn.example.com/video.mp4</code>
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
            <h3 className="text-lg font-medium">Live Preview</h3>
            {normalizedUrl ? (
              <div className="aspect-video overflow-hidden rounded-md border">
                <ScamVideoPlayer videoUrl={normalizedUrl} />
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center rounded-md border bg-muted">
                <p className="text-muted-foreground">
                  Enter a supported URL or ID to see preview
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
