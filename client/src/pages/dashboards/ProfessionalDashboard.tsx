import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Award, Building2, TrendingUp, Users, Edit, Plus, Eye, Network, Target } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { OnboardingCard } from "@/components/OnboardingCard";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Opportunity } from "@shared/schema";
import { format } from "date-fns";

export default function ProfessionalDashboard() {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRoles(currentUser?.uid);
  const [, setLocation] = useLocation();

  const professionalData = userData?.professionalData || {};
  const isLoading = authLoading || rolesLoading;

  const { data: opportunities = [], isLoading: opportunitiesLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities", currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) throw new Error("Not authenticated");
      const token = await currentUser.getIdToken(true);
      const response = await fetch("/api/opportunities", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
    enabled: !isLoading && hasRole("professional") && !!currentUser,
  });

  // ✅ FIX: Show loading spinner while Firestore is fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check role access only after loading is complete
  if (!hasRole("professional")) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 md:pt-28 pb-16 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You need to be a Professional to access this dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/")} data-testid="button-go-home">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const currentJobTitle = professionalData.title || userData?.name || "Professional";
  const currentEmployer = professionalData.experience || "Independent Professional";
  const skills = professionalData.skills || [];
  const certifications = professionalData.certifications || [];
  const industry = professionalData.industry || "";

  // Helper to safely extract skills from opportunity details
  const getOpportunitySkills = (opp: Opportunity): string[] => {
    if (!opp.details || typeof opp.details !== 'object') return [];
    const details = opp.details as Record<string, unknown>;
    if (!Array.isArray(details.skills)) return [];
    return details.skills.filter((skill): skill is string => typeof skill === 'string');
  };

  // Helper to calculate skill match score
  const calculateMatchScore = (opp: Opportunity) => {
    let score = 0;
    
    // Match by skills
    if (skills.length > 0) {
      const oppSkills = getOpportunitySkills(opp);
      if (oppSkills.length > 0) {
        const matchedSkills = skills.filter((skill: string) => 
          oppSkills.some((oppSkill: string) => 
            oppSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(oppSkill.toLowerCase())
          )
        );
        score += matchedSkills.length * 3;
      }
    }
    
    // Match by sector/industry
    if (industry && opp.sector) {
      if (opp.sector.toLowerCase().includes(industry.toLowerCase()) ||
          industry.toLowerCase().includes(opp.sector.toLowerCase())) {
        score += 2;
      }
    }
    
    return score;
  };

  // Get matching skills for an opportunity
  const getMatchingSkills = (opp: Opportunity): string[] => {
    if (!skills.length) return [];
    const oppSkills = getOpportunitySkills(opp);
    if (oppSkills.length === 0) return [];
    
    return skills.filter((skill: string) => 
      oppSkills.some((oppSkill: string) => 
        oppSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(oppSkill.toLowerCase())
      )
    );
  };

  const relevantOpportunities = opportunities
    .filter(opp => opp.status === "open" && opp.approvalStatus === "approved")
    .map(opp => ({ ...opp, matchScore: calculateMatchScore(opp) }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  const profileCompleteness = () => {
    let score = 0;
    if (userData?.name) score += 20;
    if (userData?.headline) score += 15;
    if (userData?.bio) score += 15;
    if (skills.length > 0) score += 20;
    if (certifications.length > 0) score += 15;
    if (userData?.links?.linkedin) score += 15;
    return score;
  };

  const completeness = profileCompleteness();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold">Professional Dashboard</h1>
              <p className="text-muted-foreground">Network, showcase your skills, and boost your career visibility</p>
            </div>
            <Button onClick={() => setLocation("/edit-profile")} data-testid="button-edit-profile">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <OnboardingCard roleType="professional" />
        </div>

        {completeness < 100 && (
          <Card className="mb-6 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Complete Your Profile</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {completeness}% complete - Add more details to increase your visibility
                  </p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => setLocation("/edit-profile")} 
                  data-testid="button-complete-profile"
                >
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Visibility</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-profile-completeness">{completeness}%</div>
              <p className="text-xs text-muted-foreground">
                {completeness === 100 ? "Fully optimized!" : "Keep improving"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Reach</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-network-reach">Active</div>
              <p className="text-xs text-muted-foreground">Visible to employers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-opportunities-count">{relevantOpportunities.length}</div>
              <p className="text-xs text-muted-foreground">Available now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skills Listed</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-skills-count">{skills.length}</div>
              <p className="text-xs text-muted-foreground">
                {skills.length === 0 ? "Add skills" : "Showcasing expertise"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Profile</CardTitle>
                <CardDescription>Your professional information and experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Current Position</h3>
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">{currentJobTitle}</p>
                      <p className="text-sm text-muted-foreground">{currentEmployer}</p>
                    </div>
                  </div>
                </div>

                {skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Skills & Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" data-testid={`badge-skill-${idx}`}>{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {certifications.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Certifications</h3>
                    <div className="space-y-2">
                      {certifications.map((cert, idx) => (
                        <div key={idx} className="flex items-center gap-2" data-testid={`cert-${idx}`}>
                          <Award className="w-4 h-4 text-primary" />
                          <span className="text-sm">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Opportunities For You</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setLocation("/opportunities")}
                    data-testid="button-view-all-opportunities"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {opportunitiesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading opportunities...</p>
                  </div>
                ) : relevantOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No opportunities available at the moment</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setLocation("/opportunities")}
                      data-testid="button-browse-opportunities"
                    >
                      Browse All Opportunities
                    </Button>
                  </div>
                ) : (
                  relevantOpportunities.map((opp) => {
                    const matchingSkills = getMatchingSkills(opp);
                    const hasMatch = matchingSkills.length > 0 || 
                                     (industry && opp.sector && 
                                      (opp.sector.toLowerCase().includes(industry.toLowerCase()) ||
                                       industry.toLowerCase().includes(opp.sector.toLowerCase())));
                    
                    return (
                      <div 
                        key={opp.id} 
                        className={`p-4 rounded-md border hover-elevate ${hasMatch ? 'border-primary/30 bg-primary/5' : ''}`}
                        data-testid={`card-opportunity-${opp.id}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{opp.title}</p>
                              {hasMatch && (
                                <Badge variant="default" className="text-xs" data-testid={`badge-match-${opp.id}`}>
                                  Match
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{opp.sector || "Various Sectors"}</p>
                          </div>
                          <Badge variant="secondary" data-testid={`badge-type-${opp.id}`}>
                            {opp.type.charAt(0).toUpperCase() + opp.type.slice(1)}
                          </Badge>
                        </div>
                        
                        {matchingSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {matchingSkills.slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs" data-testid={`badge-matched-skill-${opp.id}-${idx}`}>
                                {skill}
                              </Badge>
                            ))}
                            {matchingSkills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{matchingSkills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                          {(opp.city || opp.country) && (
                            <span>{[opp.city, opp.country].filter(Boolean).join(", ")}</span>
                          )}
                          <span>•</span>
                          <span>{format(new Date(opp.createdAt), "MMM d, yyyy")}</span>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant={hasMatch ? "default" : "outline"}
                          onClick={() => setLocation(`/opportunities/${opp.id}`)}
                          data-testid={`button-view-opportunity-${opp.id}`}
                        >
                          View Details
                        </Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Boost your professional presence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => setLocation("/edit-profile")} 
                  data-testid="button-update-profile"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => setLocation("/opportunities")} 
                  data-testid="button-browse-opportunities-action"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Browse Opportunities
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => setLocation("/edit-profile")}
                  data-testid="button-showcase-skills"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Showcase Skills
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setLocation("/opportunities")}
                  data-testid="button-network"
                >
                  <Network className="w-4 h-4 mr-2" />
                  Network & Connect
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-3">
                  {skills.length === 0 && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="font-medium mb-1">Add Your Skills</p>
                      <p className="text-xs text-muted-foreground">
                        Showcase your expertise to attract opportunities
                      </p>
                    </div>
                  )}
                  {!userData?.headline && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="font-medium mb-1">Write a Headline</p>
                      <p className="text-xs text-muted-foreground">
                        Capture attention with a strong professional headline
                      </p>
                    </div>
                  )}
                  {!userData?.bio && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="font-medium mb-1">Add Your Bio</p>
                      <p className="text-xs text-muted-foreground">
                        Tell your professional story to stand out
                      </p>
                    </div>
                  )}
                  {!userData?.links?.linkedin && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="font-medium mb-1">Connect LinkedIn</p>
                      <p className="text-xs text-muted-foreground">
                        Link your LinkedIn profile for better visibility
                      </p>
                    </div>
                  )}
                  {completeness === 100 && (
                    <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                      <p className="font-medium text-green-800 dark:text-green-100 mb-1">
                        Profile Complete!
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-200">
                        Your profile is optimized for maximum visibility
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
