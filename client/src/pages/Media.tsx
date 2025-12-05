import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, Video, Calendar, ExternalLink } from "lucide-react";
import { SiLinkedin } from "react-icons/si";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import type { Video as VideoType } from "@shared/schema";

const mediaCategories = [
  {
    icon: Video,
    title: "Video Content",
    description: "Interviews, presentations, and event highlights",
    color: "bg-purple-500",
  },
  {
    icon: Newspaper,
    title: "News & Press",
    description: "Latest announcements and media coverage",
    color: "bg-blue-500",
  },
  {
    icon: Calendar,
    title: "Events",
    description: "Conferences, webinars, and networking events",
    color: "bg-orange-500",
  },
];

export default function Media() {
  const [showAllVideos, setShowAllVideos] = useState(false);

  const { data: videos = [], isLoading } = useQuery<VideoType[]>({
    queryKey: ['/api/videos'],
  });

  // Only show visible videos on the Media page
  const visibleVideos = videos.filter(v => {
    const videoData = v as any; // Temporary until Firestore types are updated
    return videoData.visible ?? true; // Default to visible if field is missing
  });
  const featuredVideos = visibleVideos.filter(v => v.featured);
  const regularVideos = visibleVideos.filter(v => !v.featured);
  const displayedVideos = showAllVideos ? regularVideos : regularVideos.slice(0, 3);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="relative py-24 md:py-32 bg-gradient-to-br from-primary to-[hsl(213,58%,35%)] text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              Media Center
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Explore videos, interviews, and multimedia content from PEF
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading videos...</p>
              </div>
            ) : (
              <>
                {featuredVideos.length > 0 && (
                  <div className="mb-16">
                    <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-center">
                      Featured Videos
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
                      {featuredVideos.map((video) => (
                        <Card key={video.id} className="border-2 border-primary" data-testid={`card-featured-video-${video.id}`}>
                          <CardContent className="p-0">
                            <YouTubeEmbed videoId={video.youtubeId} title={video.title} />
                            <div className="p-6">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge variant="secondary" data-testid="badge-video-category">
                                  Featured Content
                                </Badge>
                                <Badge className="bg-red-600 hover:bg-red-700" data-testid="badge-youtube">
                                  <Video className="w-3 h-3 mr-1" />
                                  YouTube
                                </Badge>
                              </div>
                              <h3 className="text-2xl font-bold mb-2" data-testid={`text-video-title-${video.id}`}>
                                {video.title}
                              </h3>
                              {video.description && (
                                <p className="text-muted-foreground mb-4" data-testid={`text-video-description-${video.id}`}>
                                  {video.description}
                                </p>
                              )}
                              <a 
                                href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
                                data-testid={`link-watch-youtube-${video.id}`}
                              >
                                Watch on YouTube
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {regularVideos.length > 0 && (
                  <div className="mb-16">
                    <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-center">
                      All Videos
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedVideos.map((video) => (
                        <Card key={video.id} className="hover:border-primary/30 transition-all hover-elevate" data-testid={`card-video-${video.id}`}>
                          <CardContent className="p-0">
                            <YouTubeEmbed videoId={video.youtubeId} title={video.title} />
                            <div className="p-4">
                              <h3 className="font-bold mb-2 line-clamp-2" data-testid={`text-video-title-${video.id}`}>
                                {video.title}
                              </h3>
                              {video.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-video-description-${video.id}`}>
                                  {video.description}
                                </p>
                              )}
                              <a 
                                href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                                data-testid={`link-watch-youtube-${video.id}`}
                              >
                                Watch on YouTube
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {regularVideos.length > 3 && (
                      <div className="text-center mt-8">
                        <Button 
                          variant="outline" 
                          size="lg"
                          onClick={() => setShowAllVideos(!showAllVideos)}
                          data-testid="button-see-more"
                        >
                          {showAllVideos ? "Show Less" : `See More (${regularVideos.length - 3} more videos)`}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {videos.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No videos available yet.</p>
                    <p className="text-sm text-muted-foreground">Check back soon for new content!</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-center">
              Media Categories
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
              {mediaCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card key={category.title} className="hover:border-primary/30 transition-all hover-elevate text-center" data-testid={`card-category-${category.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    <CardContent className="p-8">
                      <div className={`w-20 h-20 ${category.color} rounded-full flex items-center justify-center mb-4 mx-auto`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                      <p className="text-muted-foreground">{category.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Stay Connected
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Follow us on social media for the latest updates, videos, and opportunities
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://www.linkedin.com/groups/15770115/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="min-h-12 gap-2" data-testid="button-linkedin">
                  <SiLinkedin className="w-5 h-5" />
                  Join our LinkedIn Group
                </Button>
              </a>
              <a
                href="https://youtube.com/@professionalexecutiveforum?si=bnOpAY1uvIx24KmX"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="min-h-12 gap-2" data-testid="button-youtube">
                  <Video className="w-5 h-5" />
                  Subscribe on YouTube
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
