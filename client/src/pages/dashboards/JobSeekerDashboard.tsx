import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Briefcase, MapPin, DollarSign, Clock, FileText, CheckCircle2 } from "lucide-react";
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

  const recentApplications = applications
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .slice(0, 5);

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-applications">
                {applications.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {statusCounts.under_review || 0} under review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-interviews">
                {statusCounts.interview || 0}
              </div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Jobs</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-available-jobs">
                {opportunities.length}
              </div>
              <p className="text-xs text-muted-foreground">Open positions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-offers">
                {statusCounts.offer || 0}
              </div>
              <p className="text-xs text-muted-foreground">Pending decision</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Available Jobs</CardTitle>
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
                  filteredOpportunities.slice(0, 6).map((job) => {
                    const application = applicationMap.get(job.id);
                    const hasApplied = !!application;
                    // Safe type guard for details
                    const details = (job.details && typeof job.details === 'object') ? job.details as JobDetails : null;

                    return (
                      <div
                        key={job.id}
                        className="p-4 rounded-md border hover-elevate"
                        data-testid={`card-job-${job.id}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                            {job.sector && <p className="text-muted-foreground mb-2">{job.sector}</p>}
                          </div>
                          {hasApplied && (
                            <Badge
                              variant={getStatusBadgeVariant(application.status)}
                              data-testid={`badge-status-${job.id}`}
                            >
                              {getStatusLabel(application.status)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {job.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          {(job.city || job.country) && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {[job.city, job.country].filter(Boolean).join(", ")}
                            </div>
                          )}
                          {details?.employmentType && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {details.employmentType}
                            </div>
                          )}
                          {details?.salaryMin && details?.salaryMax && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {details.salaryCurrency || "$"}
                              {details.salaryMin.toLocaleString()} -{" "}
                              {details.salaryMax.toLocaleString()}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(job.createdAt), "MMM d, yyyy")}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {hasApplied ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled
                              data-testid={`button-applied-${job.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Applied
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => applyMutation.mutate(job.id)}
                              disabled={applyMutation.isPending}
                              data-testid={`button-apply-${job.id}`}
                            >
                              {applyMutation.isPending ? "Applying..." : "Apply Now"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setLocation(`/opportunities/${job.id}`)}
                            data-testid={`button-details-${job.id}`}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {applicationsLoading ? (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : recentApplications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No applications yet. Start applying to jobs above!
                  </p>
                ) : (
                  recentApplications.map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md border"
                      data-testid={`card-application-${app.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{app.opportunity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.opportunity.sector || "Job Opportunity"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(app.status)}>
                          {getStatusLabel(app.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(app.appliedAt), "MMM d")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setLocation("/opportunities")}
                  data-testid="button-browse-all"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Browse All Jobs
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setLocation("/edit-profile")}
                  data-testid="button-edit-profile"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
