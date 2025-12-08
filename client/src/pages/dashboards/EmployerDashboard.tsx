import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Briefcase, TrendingUp, Eye, FileText, Trash2 } from "lucide-react";
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
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PostJobDialog from "@/components/PostJobDialog";
import TalentBrowser from "@/components/TalentBrowser";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Opportunity } from "@shared/schema";

export default function EmployerDashboard() {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRoles(currentUser?.uid);
  const [, setLocation] = useLocation();
  const [showPostJobDialog, setShowPostJobDialog] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myJobs = [], isLoading: jobsLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities", "my-jobs", currentUser?.uid],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken(true);
      const response = await fetch("/api/opportunities?myOpportunities=true&type=job", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
    enabled: !!currentUser,
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/opportunities/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete job");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Deleted",
        description: "The job posting has been successfully removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setDeleteJobId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job posting.",
        variant: "destructive",
      });
      setDeleteJobId(null);
    },
  });

  const employerData = userData?.employerData || {};
  const isLoading = authLoading || rolesLoading;

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

  if (!hasRole("employer")) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 md:pt-28 pb-16 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You need to be an Employer to access this dashboard.</CardDescription>
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

  const companyName = employerData.companyName || "Not specified";
  const industry = employerData.industry || "Not specified";
  const companySize = employerData.companySize || "Not specified";

  const activeJobs = myJobs.filter(job => job.approvalStatus === "approved" && job.status === "open");
  const approvedJobs = myJobs.filter(job => job.approvalStatus === "approved" && job.status === "open");
  const pendingJobs = myJobs.filter(job => job.approvalStatus === "pending");

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold">Employer Dashboard</h1>
            <Button onClick={() => setShowPostJobDialog(true)} data-testid="button-post-job">
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          </div>
          <p className="text-muted-foreground">Manage your job postings and find talent</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeJobs.length}</div>
              <p className="text-xs text-muted-foreground">{pendingJobs.length} pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Jobs</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedJobs.length}</div>
              <p className="text-xs text-muted-foreground">Live on opportunities page</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Postings</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myJobs.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Browse Talent</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-1" 
                onClick={() => {
                  const talentSection = document.getElementById("talent-section");
                  talentSection?.scrollIntoView({ behavior: "smooth" });
                }}
                data-testid="button-view-talent"
              >
                View Candidates
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Job Postings</CardTitle>
                <CardDescription>
                  {jobsLoading ? "Loading..." : `${myJobs.length} total jobs posted`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading your jobs...</p>
                  </div>
                ) : myJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No jobs posted yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start by posting your first job opening
                    </p>
                    <Button onClick={() => setShowPostJobDialog(true)} data-testid="button-post-job-cta">
                      <Plus className="w-4 h-4 mr-2" />
                      Post Job
                    </Button>
                  </div>
                ) : (
                  <>
                    {myJobs.map((job, idx) => (
                      <div key={job.id} className="p-4 rounded-md border hover-elevate" data-testid={`job-card-${idx}`}>
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1" data-testid={`job-title-${idx}`}>{job.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {job.city ? `${job.city}, ` : ""}{job.country}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge 
                              className={
                                job.approvalStatus === "approved" 
                                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                                  : job.approvalStatus === "rejected"
                                  ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
                                  : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100"
                              }
                              data-testid={`job-status-${idx}`}
                            >
                              {job.approvalStatus === "approved" 
                                ? "Approved" 
                                : job.approvalStatus === "rejected"
                                ? "Rejected"
                                : "Pending Approval"}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteJobId(job.id)}
                              disabled={deleteJobMutation.isPending}
                              data-testid={`button-delete-job-${idx}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {job.description}
                        </p>
                        {job.budgetOrSalary && (
                          <p className="text-sm font-medium mb-2" data-testid={`job-salary-${idx}`}>{job.budgetOrSalary}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {job.sector || "General"}
                          </Badge>
                          {job.status === "open" ? (
                            <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                              Open
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Closed
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => setShowPostJobDialog(true)} 
                        className="w-full"
                        data-testid="button-post-job-cta"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Post Job
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Company Name</p>
                  <p className="text-sm text-muted-foreground">{companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Industry</p>
                  <p className="text-sm text-muted-foreground">{industry}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Company Size</p>
                  <p className="text-sm text-muted-foreground">{companySize}</p>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLocation("/edit-profile")} 
                  data-testid="button-edit-company"
                >
                  Edit Profile
                </Button>
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
                  data-testid="button-view-all-opportunities"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View All Opportunities
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    const talentSection = document.getElementById("talent-section");
                    talentSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  data-testid="button-search-candidates"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Search Candidates
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div id="talent-section" className="mt-8">
          <TalentBrowser />
        </div>
      </main>
      <Footer />
      
      <PostJobDialog open={showPostJobDialog} onOpenChange={setShowPostJobDialog} />
      
      <AlertDialog open={!!deleteJobId} onOpenChange={(open) => !open && setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Posting?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job posting? This action cannot be undone and the job will be removed from the opportunities page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteJobId && deleteJobMutation.mutate(deleteJobId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteJobMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
