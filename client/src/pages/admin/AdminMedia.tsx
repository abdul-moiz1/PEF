import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Video,
  Plus,
  Pencil,
  Trash2,
  Star,
  ChevronLeft,
  MoreHorizontal,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Video as VideoType } from "@shared/schema";

interface VideoFormData {
  title: string;
  description: string;
  youtubeId: string;
  thumbnailUrl: string;
  publishedAt: string;
  featured: boolean;
  visible: boolean;
}

export default function AdminMedia() {
  const { currentUser, userData } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());

  const { data: videos = [], refetch: refetchVideos } = useQuery<VideoType[]>({
    queryKey: ['/api/videos'],
  });

  const bulkUpdateVideosMutation = useMutation({
    mutationFn: async ({ videoIds, visible }: { videoIds: string[]; visible: boolean }) => {
      await Promise.all(
        videoIds.map((videoId) =>
          apiRequest("PATCH", `/api/videos/${videoId}`, { visible })
        )
      );
    },
    onSuccess: (_, { visible }) => {
      refetchVideos();
      setSelectedVideos(new Set());
      toast({
        title: "Success",
        description: `${selectedVideos.size} video(s) ${visible ? "shown" : "hidden"} successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update selected videos",
        variant: "destructive",
      });
    },
  });

  const handleOpenVideoDialog = (video?: VideoType) => {
    setEditingVideo(video || null);
    setVideoDialogOpen(true);
  };

  const handleCloseVideoDialog = () => {
    setEditingVideo(null);
    setVideoDialogOpen(false);
  };

  const handleSelectVideo = (videoId: string) => {
    setSelectedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const handleSelectAllVideos = (selectAll: boolean | "indeterminate") => {
    if (selectAll === true) {
      setSelectedVideos(new Set(videos.map((v) => v.id)));
    } else {
      setSelectedVideos(new Set());
    }
  };

  const handleBulkShow = () => {
    bulkUpdateVideosMutation.mutate({ videoIds: Array.from(selectedVideos), visible: true });
  };

  const handleBulkHide = () => {
    bulkUpdateVideosMutation.mutate({ videoIds: Array.from(selectedVideos), visible: false });
  };

  if (!currentUser || !userData?.roles?.admin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/admin")}
            className="mb-4"
            data-testid="button-back-to-admin"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/10">
              <Video className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Media Management</h1>
              <p className="text-sm text-muted-foreground">Manage videos displayed on the site</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">Video Library</CardTitle>
                {videos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedVideos.size === videos.length && videos.length > 0}
                      onCheckedChange={handleSelectAllVideos}
                      data-testid="checkbox-select-all-videos"
                      aria-label="Select all videos"
                    />
                    <span className="text-sm text-muted-foreground">Select All</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {selectedVideos.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {selectedVideos.size} selected
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleBulkShow} data-testid="button-bulk-show">
                        <Eye className="w-4 h-4 mr-2" />
                        Show Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBulkHide} data-testid="button-bulk-hide">
                        <EyeOff className="w-4 h-4 mr-2" />
                        Hide Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button onClick={() => handleOpenVideoDialog()} size="sm" data-testid="button-add-video">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Video
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {videos.length === 0 ? (
              <div className="py-12 text-center">
                <Video className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-1">No videos yet</p>
                <p className="text-sm text-muted-foreground">Add your first video to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <div 
                    key={video.id} 
                    className="group relative rounded-lg border overflow-hidden bg-card"
                    data-testid={`card-admin-video-${video.id}`}
                  >
                    <div className="relative aspect-video">
                      <YouTubeEmbed videoId={video.youtubeId} title={video.title} />
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedVideos.has(video.id)}
                          onCheckedChange={() => handleSelectVideo(video.id)}
                          data-testid={`checkbox-video-${video.id}`}
                          aria-label={`Select ${video.title}`}
                          className="bg-white/90 backdrop-blur-sm"
                        />
                      </div>
                      <div className="absolute top-2 right-2 z-10 flex gap-1">
                        {video.featured && (
                          <Badge 
                            className="bg-amber-500/90 backdrop-blur-sm text-white"
                            data-testid={`badge-featured-${video.id}`}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {!video.visible && (
                          <Badge variant="secondary" className="backdrop-blur-sm">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Hidden
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate" data-testid={`text-admin-video-title-${video.id}`}>
                            {video.title}
                          </h3>
                          {video.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5" data-testid={`text-admin-video-description-${video.id}`}>
                              {video.description}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenVideoDialog(video)} data-testid={`button-edit-video-${video.id}`}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteVideoId(video.id)} 
                              className="text-destructive"
                              data-testid={`button-delete-video-${video.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />

      <VideoFormDialog
        open={videoDialogOpen}
        onClose={handleCloseVideoDialog}
        video={editingVideo}
        onSuccess={() => {
          refetchVideos();
          handleCloseVideoDialog();
        }}
      />
      <DeleteVideoDialog
        videoId={deleteVideoId}
        onClose={() => setDeleteVideoId(null)}
        onSuccess={() => {
          refetchVideos();
          setDeleteVideoId(null);
        }}
      />
    </div>
  );
}

function extractYouTubeId(input: string): string {
  const trimmed = input.trim();
  
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return trimmed;
}

function generateYouTubeThumbnail(videoId: string): string {
  if (!videoId || videoId.length !== 11) return "";
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

function VideoFormDialog({
  open,
  onClose,
  video,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  video: VideoType | null;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<VideoFormData>({
    title: video?.title || "",
    description: video?.description || "",
    youtubeId: video?.youtubeId || "",
    thumbnailUrl: video?.thumbnailUrl || "",
    publishedAt: video?.publishedAt 
      ? (typeof video.publishedAt === 'string' ? video.publishedAt : new Date(video.publishedAt).toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0],
    featured: video?.featured || false,
    visible: video?.visible ?? true,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        title: video?.title || "",
        description: video?.description || "",
        youtubeId: video?.youtubeId || "",
        thumbnailUrl: video?.thumbnailUrl || "",
        publishedAt: video?.publishedAt 
          ? (typeof video.publishedAt === 'string' ? video.publishedAt : new Date(video.publishedAt).toISOString().split('T')[0])
          : new Date().toISOString().split('T')[0],
        featured: video?.featured || false,
        visible: video?.visible ?? true,
      });
    }
  }, [open, video]);

  const createVideoMutation = useMutation({
    mutationFn: async (data: VideoFormData) => {
      const payload = {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
      };
      return apiRequest('POST', '/api/videos', payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video added successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add video",
        variant: "destructive",
      });
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: async (data: VideoFormData) => {
      const payload = {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
      };
      return apiRequest('PATCH', `/api/videos/${video?.id}`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video updated successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update video",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (video) {
      updateVideoMutation.mutate(formData);
    } else {
      createVideoMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="dialog-video-form">
        <DialogHeader>
          <DialogTitle>{video ? "Edit Video" : "Add Video"}</DialogTitle>
          <DialogDescription>
            {video ? "Update video details" : "Add a new video to the library"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              data-testid="input-video-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              data-testid="input-video-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtubeId">YouTube URL or ID</Label>
            <Input
              id="youtubeId"
              value={formData.youtubeId}
              onChange={(e) => {
                const extractedId = extractYouTubeId(e.target.value);
                const autoThumbnail = generateYouTubeThumbnail(extractedId);
                setFormData({ 
                  ...formData, 
                  youtubeId: extractedId,
                  thumbnailUrl: autoThumbnail || formData.thumbnailUrl
                });
              }}
              placeholder="Paste URL or video ID"
              required
              data-testid="input-video-youtubeid"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
            <Input
              id="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              placeholder="Auto-generated from YouTube"
              data-testid="input-video-thumbnail"
            />
            {formData.thumbnailUrl && (
              <div className="mt-2 border rounded-md overflow-hidden aspect-video">
                <img 
                  src={formData.thumbnailUrl} 
                  alt="Thumbnail preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="publishedAt">Publish Date</Label>
            <Input
              id="publishedAt"
              type="date"
              value={formData.publishedAt}
              onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
              data-testid="input-video-publishedat"
            />
          </div>

          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="visible"
                checked={formData.visible}
                onCheckedChange={(checked) => setFormData({ ...formData, visible: checked })}
                data-testid="switch-video-visible"
              />
              <Label htmlFor="visible" className="cursor-pointer text-sm">Visible</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                data-testid="switch-video-featured"
              />
              <Label htmlFor="featured" className="cursor-pointer text-sm">Featured</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-video">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createVideoMutation.isPending || updateVideoMutation.isPending}
              data-testid="button-save-video"
            >
              {createVideoMutation.isPending || updateVideoMutation.isPending ? "Saving..." : video ? "Update" : "Add Video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteVideoDialog({
  videoId,
  onClose,
  onSuccess,
}: {
  videoId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/videos/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (videoId) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  return (
    <Dialog open={!!videoId} onOpenChange={onClose}>
      <DialogContent className="max-w-sm" data-testid="dialog-delete-video">
        <DialogHeader>
          <DialogTitle>Delete Video</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-delete">
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteVideoMutation.isPending}
            data-testid="button-confirm-delete"
          >
            {deleteVideoMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
