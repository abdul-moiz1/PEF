import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Briefcase, MapPin, DollarSign, Clock, FileText, CheckCircle2, User } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Opportunity, Application } from "@shared/schema";
import { format } from "date-fns";
import { useState } from "react";

type JobDetails = {
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  experienceRequired?: string;
  skills?: string[];
  benefits?: string[];
  applicationEmail?: string;
};

type ApplicationWithOpportunity = Application & { opportunity: Opportunity };

export default function JobSeekerDashboard() {
  const { currentUser, loading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRoles(currentUser?.uid);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [applicationFilter, setApplicationFilter] = useState<string>("all");

  const isLoading = authLoading || rolesLoading;

  const { data: opportunities = [], isLoading: opportunitiesLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities", "job", currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) throw new Error("Not authenticated");
      const token = await currentUser.getIdToken(true);
      const params = new URLSearchParams({ type: "job" });
      const response = await fetch(`/api/opportunities?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
    enabled: !isLoading && hasRole("jobSeeker") && !!currentUser,
  });

  const { data: applications = [], isLoading: applicationsLoading } = useQuery<ApplicationWithOpportunity[]>({
    queryKey: ["/api/applications/me", currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) throw new Error("Not authenticated");
      const token = await currentUser.getIdToken(true);
      const response = await fetch("/api/applications/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
    enabled: !isLoading && hasRole("jobSeeker") && !!currentUser,
  });

  const applyMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      return apiRequest("POST", "/api/applications", { 
        opportunityId,
        status: "applied",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"], exact: false });
      toast({
        title: "Success",
        description: "Your application has been submitted!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    },
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

  if (!hasRole("jobSeeker")) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 md:pt-28 pb-16 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You need to be a Job Seeker to access this dashboard.</CardDescription>
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

  const applicationMap = new Map(
    applications.map(app => [app.opportunityId, app])
  );

  const filteredOpportunities = opportunities.filter(opp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      opp.title.toLowerCase().includes(query) ||
      opp.description.toLowerCase().includes(query) ||
      (opp.country && opp.country.toLowerCase().includes(query)) ||
      (opp.city && opp.city.toLowerCase().includes(query)) ||
      (opp.sector && opp.sector.toLowerCase().includes(query))
    );
  });

  const filteredApplications = applications.filter(app => {
    if (applicationFilter === "all") return true;
    return app.status === applicationFilter;
  });

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "applied":
        return "secondary";
      case "under_review":
        return "default";
      case "interview":
        return "default";
      case "offer":
        return "default";
      case "rejected":
        return "destructive";
      case "withdrawn":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "applied":
        return "Applied";
      case "under_review":
        return "Under Review";
      case "interview":
        return "Interview";
      case "offer":
        return "Offer Received";
      case "rejected":
        return "Rejected";
      case "withdrawn":
        return "Withdrawn";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Job Seeker Dashboard</h1>
          <p className="text-muted-foreground">Find your next career opportunity</p>
        </div>

        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="jobs" data-testid="tab-jobs">
              <Briefcase className="w-4 h-4 mr-2" />
              Job Vacancies
            </TabsTrigger>
            <TabsTrigger value="applications" data-testid="tab-applications">
              <FileText className="w-4 h-4 mr-2" />
              My Applications
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="w-4 h-4 mr-2" />
              My Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Available Job Vacancies</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3 py-1 text-sm border rounded-md min-h-8"
                      data-testid="input-search-jobs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation("/opportunities")}
                      data-testid="button-view-all"
                    >
                      View All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {opportunitiesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading jobs...</p>
                  </div>
                ) : filteredOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchQuery ? "No jobs found matching your search" : "No jobs available"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Job Title</th>
                          <th className="text-left p-3 font-medium">Sector</th>
                          <th className="text-left p-3 font-medium">Location</th>
                          <th className="text-left p-3 font-medium">Posted</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOpportunities.map((job) => {
                          const application = applicationMap.get(job.id);
                          const hasApplied = !!application;
                          return (
                            <tr key={job.id} className="border-b hover:bg-muted/50" data-testid={`row-job-${job.id}`}>
                              <td className="p-3">
                                <div>
                                  <p className="font-medium">{job.title}</p>
                                  <p className="text-sm text-muted-foreground line-clamp-1">{job.description}</p>
                                </div>
                              </td>
                              <td className="p-3 text-sm">{job.sector || "-"}</td>
                              <td className="p-3 text-sm">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {[job.city, job.country].filter(Boolean).join(", ") || "-"}
                                </div>
                              </td>
                              <td className="p-3 text-sm">{format(new Date(job.createdAt), "MMM d, yyyy")}</td>
                              <td className="p-3">
                                {hasApplied ? (
                                  <Badge variant={getStatusBadgeVariant(application.status)}>
                                    {getStatusLabel(application.status)}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Open</Badge>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-2">
                                  {hasApplied ? (
                                    <Button size="sm" variant="secondary" disabled data-testid={`button-applied-${job.id}`}>
                                      Applied
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => applyMutation.mutate(job.id)}
                                      disabled={applyMutation.isPending}
                                      data-testid={`button-apply-${job.id}`}
                                    >
                                      Apply
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setLocation(`/opportunities/${job.id}`)}
                                    data-testid={`button-details-${job.id}`}
                                  >
                                    View
                                  </Button>
                                </div>
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>My Applications</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={applicationFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setApplicationFilter("all")}
                      data-testid="filter-all"
                    >
                      All ({applications.length})
                    </Button>
                    <Button
                      variant={applicationFilter === "applied" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setApplicationFilter("applied")}
                      data-testid="filter-applied"
                    >
                      Applied ({statusCounts.applied || 0})
                    </Button>
                    <Button
                      variant={applicationFilter === "under_review" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setApplicationFilter("under_review")}
                      data-testid="filter-pending"
                    >
                      Pending ({statusCounts.under_review || 0})
                    </Button>
                    <Button
                      variant={applicationFilter === "interview" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setApplicationFilter("interview")}
                      data-testid="filter-interview"
                    >
                      Interview ({statusCounts.interview || 0})
                    </Button>
                    <Button
                      variant={applicationFilter === "offer" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setApplicationFilter("offer")}
                      data-testid="filter-approved"
                    >
                      Approved ({statusCounts.offer || 0})
                    </Button>
                    <Button
                      variant={applicationFilter === "rejected" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setApplicationFilter("rejected")}
                      data-testid="filter-rejected"
                    >
                      Rejected ({statusCounts.rejected || 0})
                    </Button>
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
                    <p className="text-muted-foreground">
                      {applicationFilter === "all" ? "No applications yet. Start applying to jobs!" : `No ${applicationFilter.replace("_", " ")} applications`}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Job Title</th>
                          <th className="text-left p-3 font-medium">Company/Sector</th>
                          <th className="text-left p-3 font-medium">Applied Date</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((app) => (
                          <tr key={app.id} className="border-b hover:bg-muted/50" data-testid={`row-application-${app.id}`}>
                            <td className="p-3">
                              <p className="font-medium">{app.opportunity?.title || "Unknown Job"}</p>
                            </td>
                            <td className="p-3 text-sm">{app.opportunity?.sector || "-"}</td>
                            <td className="p-3 text-sm">{format(new Date(app.appliedAt), "MMM d, yyyy")}</td>
                            <td className="p-3">
                              <Badge variant={getStatusBadgeVariant(app.status)}>
                                {getStatusLabel(app.status)}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setLocation(`/opportunities/${app.opportunityId}`)}
                                data-testid={`button-view-job-${app.id}`}
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
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Your confidential job seeker profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Application Stats</p>
                    <div className="space-y-2">
                      {[
                        { label: "Applied", count: statusCounts.applied || 0 },
                        { label: "Under Review", count: statusCounts.under_review || 0 },
                        { label: "Interview", count: statusCounts.interview || 0 },
                        { label: "Offer", count: statusCounts.offer || 0 },
                        { label: "Rejected", count: statusCounts.rejected || 0 },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-md bg-muted"
                        >
                          <span className="text-sm">{item.label}</span>
                          <span className="text-sm font-semibold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Quick Actions</p>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setLocation("/edit-profile")}
                      data-testid="button-edit-profile"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setLocation("/opportunities")}
                      data-testid="button-browse-all"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Browse All Jobs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
