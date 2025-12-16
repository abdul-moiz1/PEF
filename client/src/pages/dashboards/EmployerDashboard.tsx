import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Briefcase, Trash2, Edit } from "lucide-react";
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
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete job");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Job Deleted", description: "The job posting has been successfully removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setDeleteJobId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete job posting.", variant: "destructive" });
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
              <Button onClick={() => setLocation("/")} data-testid="button-go-home">Go Home</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const companyName = employerData.companyName || "Not specified";


  const getStatusBadge = (status: string) => {
    if (status === "approved") return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100";
    if (status === "rejected") return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100";
    return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100";
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold">Employer Dashboard</h1>
              <p className="text-muted-foreground">{companyName !== "Not specified" ? companyName : "Manage your job postings and find talent"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setLocation("/edit-profile")} data-testid="button-edit-profile">
                <Edit className="w-4 h-4 mr-2" />Edit Profile
              </Button>
              <Button onClick={() => setShowPostJobDialog(true)} data-testid="button-post-job">
                <Plus className="w-4 h-4 mr-2" />Post New Job
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="jobs" data-testid="tab-jobs">
              <Briefcase className="w-4 h-4 mr-2" />Posted Jobs
            </TabsTrigger>
            <TabsTrigger value="talent" data-testid="tab-talent">
              <Users className="w-4 h-4 mr-2" />Browse Talent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Job Postings</CardTitle>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="text-center py-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-sm text-muted-foreground">Loading jobs...</p></div>
                ) : myJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No jobs found</h3>
                    <Button onClick={() => setShowPostJobDialog(true)} data-testid="button-post-job-cta"><Plus className="w-4 h-4 mr-2" />Post Job</Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Job Title</th>
                          <th className="text-left p-3 font-medium">Location</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myJobs.map((job, idx) => (
                          <tr key={job.id} className="border-b hover:bg-muted/50" data-testid={`row-job-${idx}`}>
                            <td className="p-3"><p className="font-medium">{job.title}</p><p className="text-sm text-muted-foreground">{job.sector || "General"}</p></td>
                            <td className="p-3 text-sm">{job.city ? `${job.city}, ` : ""}{job.country}</td>
                            <td className="p-3"><Badge className={getStatusBadge(job.approvalStatus || "pending")}>{job.approvalStatus === "approved" ? "Approved" : job.approvalStatus === "rejected" ? "Rejected" : "Pending"}</Badge></td>
                            <td className="p-3"><Button size="icon" variant="ghost" onClick={() => setDeleteJobId(job.id)} data-testid={`button-delete-${idx}`}><Trash2 className="w-4 h-4 text-destructive" /></Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="talent"><TalentBrowser /></TabsContent>
        </Tabs>
      </main>
      <Footer />
      <PostJobDialog open={showPostJobDialog} onOpenChange={setShowPostJobDialog} />
      <AlertDialog open={!!deleteJobId} onOpenChange={(open) => !open && setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Job Posting?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteJobId && deleteJobMutation.mutate(deleteJobId)} className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete">{deleteJobMutation.isPending ? "Deleting..." : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
