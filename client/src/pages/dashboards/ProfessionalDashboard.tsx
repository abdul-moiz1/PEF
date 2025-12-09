import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Award, Building2, TrendingUp, Users, Edit, Plus, Eye, Network, Target, Search, FileText } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Opportunity } from "@shared/schema";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: string;
  appliedAt: Date | string;
  job?: {
    title: string;
    company: string;
    location?: string;
  };
}

export default function ProfessionalDashboard() {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRoles(currentUser?.uid);
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("opportunities");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Fetch applications for the professional
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications", "my", currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) throw new Error("Not authenticated");
      const token = await currentUser.getIdToken(true);
      const response = await fetch("/api/applications?myApplications=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
    enabled: !isLoading && hasRole("professional") && !!currentUser,
  });

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

  const getOpportunitySkills = (opp: Opportunity): string[] => {
    if (!opp.details || typeof opp.details !== 'object') return [];
    const details = opp.details as Record<string, unknown>;
    if (!Array.isArray(details.skills)) return [];
    return details.skills.filter((skill): skill is string => typeof skill === 'string');
  };

  const calculateMatchScore = (opp: Opportunity) => {
    let score = 0;
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
    if (industry && opp.sector) {
      if (opp.sector.toLowerCase().includes(industry.toLowerCase()) ||
          industry.toLowerCase().includes(opp.sector.toLowerCase())) {
        score += 2;
      }
    }
    return score;
  };

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

  // Filter opportunities - jobs from employers
  const jobOpportunities = opportunities
    .filter(opp => opp.status === "open" && opp.approvalStatus === "approved" && opp.type === "job")
    .map(opp => ({ ...opp, matchScore: calculateMatchScore(opp) }))
    .sort((a, b) => b.matchScore - a.matchScore);

  // Filter opportunities by search
  const filteredOpportunities = jobOpportunities.filter(opp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return opp.title.toLowerCase().includes(query) || 
           (opp.sector?.toLowerCase().includes(query)) ||
           (opp.description?.toLowerCase().includes(query));
  });

  // Filter applications by status
  const filteredApplications = applications.filter(app => {
    if (statusFilter === "all") return true;
    return app.status.toLowerCase() === statusFilter.toLowerCase();
  });

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "accepted":
        return "default";
      case "pending":
      case "applied":
        return "secondary";
      case "rejected":
        return "destructive";
      case "interview":
        return "outline";
      default:
        return "secondary";
    }
  };

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
              <CardTitle className="text-sm font-medium">Available Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-jobs-count">{jobOpportunities.length}</div>
              <p className="text-xs text-muted-foreground">From employers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-applications-count">{applications.length}</div>
              <p className="text-xs text-muted-foreground">Submitted</p>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="opportunities" data-testid="tab-opportunities">
              <Briefcase className="w-4 h-4 mr-2" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="applications" data-testid="tab-applications">
              <FileText className="w-4 h-4 mr-2" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">
              <Users className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle>Available Job Opportunities</CardTitle>
                    <CardDescription>Jobs posted by employers matching your skills</CardDescription>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-jobs"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {opportunitiesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading jobs...</p>
                  </div>
                ) : filteredOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No job opportunities available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="table-opportunities">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Job Title</th>
                          <th className="text-left py-3 px-4 font-medium">Sector</th>
                          <th className="text-left py-3 px-4 font-medium">Location</th>
                          <th className="text-left py-3 px-4 font-medium">Posted</th>
                          <th className="text-left py-3 px-4 font-medium">Match</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOpportunities.map((opp) => {
                          const matchingSkills = getMatchingSkills(opp);
                          const hasMatch = matchingSkills.length > 0;
                          return (
                            <tr key={opp.id} className="border-b hover-elevate" data-testid={`row-job-${opp.id}`}>
                              <td className="py-3 px-4">
                                <div className="font-medium">{opp.title}</div>
                                <div className="text-sm text-muted-foreground">{opp.type}</div>
                              </td>
                              <td className="py-3 px-4">{opp.sector || "N/A"}</td>
                              <td className="py-3 px-4">
                                {[opp.city, opp.country].filter(Boolean).join(", ") || "N/A"}
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {format(new Date(opp.createdAt), "MMM d, yyyy")}
                              </td>
                              <td className="py-3 px-4">
                                {hasMatch ? (
                                  <Badge variant="default" data-testid={`badge-match-${opp.id}`}>Match</Badge>
                                ) : (
                                  <Badge variant="secondary">No Match</Badge>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <Button 
                                  size="sm" 
                                  onClick={() => setLocation(`/opportunities/${opp.id}`)}
                                  data-testid={`button-view-job-${opp.id}`}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle>My Applications</CardTitle>
                    <CardDescription>Track the status of your job applications</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["all", "applied", "pending", "interview", "approved", "rejected"].map((status) => (
                      <Button
                        key={status}
                        variant={statusFilter === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(status)}
                        data-testid={`filter-${status}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading applications...</p>
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      {statusFilter === "all" ? "No applications yet" : `No ${statusFilter} applications`}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setActiveTab("opportunities")}
                      data-testid="button-browse-jobs"
                    >
                      Browse Jobs
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="table-applications">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Job Title</th>
                          <th className="text-left py-3 px-4 font-medium">Company</th>
                          <th className="text-left py-3 px-4 font-medium">Applied Date</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((app) => (
                          <tr key={app.id} className="border-b hover-elevate" data-testid={`row-application-${app.id}`}>
                            <td className="py-3 px-4 font-medium">{app.job?.title || "Unknown Job"}</td>
                            <td className="py-3 px-4">{app.job?.company || "Unknown"}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {format(new Date(app.appliedAt), "MMM d, yyyy")}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={getStatusBadgeVariant(app.status)} data-testid={`badge-status-${app.id}`}>
                                {app.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setLocation(`/jobs/${app.jobId}`)}
                                data-testid={`button-view-application-${app.id}`}
                              >
                                View Job
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
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
                          {skills.map((skill: string, idx: number) => (
                            <Badge key={idx} variant="secondary" data-testid={`badge-skill-${idx}`}>{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {certifications.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Certifications</h3>
                        <div className="space-y-2">
                          {certifications.map((cert: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2" data-testid={`cert-${idx}`}>
                              <Award className="w-4 h-4 text-primary" />
                              <span className="text-sm">{cert}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button onClick={() => setLocation("/edit-profile")} data-testid="button-edit-full-profile">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Full Profile
                    </Button>
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
                      onClick={() => setActiveTab("opportunities")} 
                      data-testid="button-browse-opportunities-action"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Browse Jobs
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
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
