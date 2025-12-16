import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, MapPin, Calendar, FileText, Edit, ChevronDown, ChevronUp, Mail, Building, DollarSign, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Opportunity, Application } from "@shared/schema";
import { format } from "date-fns";
import { useState } from "react";
import { getUserData } from "@/lib/firestoreUtils";
import type { FirestoreUser } from "@shared/firestoreTypes";

type ApplicationWithOpportunity = Application & { opportunity: Opportunity };

export default function JobSeekerDashboard() {
  const { currentUser, loading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRoles(currentUser?.uid);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Opportunity | null>(null);
  const [employerData, setEmployerData] = useState<FirestoreUser | null>(null);
  const [loadingEmployer, setLoadingEmployer] = useState(false);

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

  const toggleJobDetails = (jobId: string) => {
    setExpandedJob(expandedJob === jobId ? null : jobId);
  };

  const handleViewFullDetails = async (opp: Opportunity) => {
    setSelectedJob(opp);
    setLoadingEmployer(true);
    try {
      if (opp.userId) {
        const employer = await getUserData(opp.userId);
        setEmployerData(employer);
      } else {
        setEmployerData(null);
      }
    } catch (error) {
      console.error("Error loading employer data:", error);
      setEmployerData(null);
    } finally {
      setLoadingEmployer(false);
    }
  };

  const handleCloseDialog = () => {
    setSelectedJob(null);
    setEmployerData(null);
  };

  const getJobDetails = (opp: Opportunity) => {
    const details = opp.details as Record<string, unknown> || {};
    return {
      requirements: Array.isArray(details.requirements) ? details.requirements as string[] : [],
      skills: Array.isArray(details.skills) ? details.skills as string[] : [],
      benefits: Array.isArray(details.benefits) ? details.benefits as string[] : [],
      employmentType: typeof details.employmentType === 'string' ? details.employmentType : null,
      salaryMin: typeof details.salaryMin === 'number' ? details.salaryMin : null,
      salaryMax: typeof details.salaryMax === 'number' ? details.salaryMax : null,
      salaryCurrency: typeof details.salaryCurrency === 'string' ? details.salaryCurrency : 'USD',
    };
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold">Job Seeker Dashboard</h1>
              <p className="text-muted-foreground">Find your next career opportunity</p>
            </div>
            <Button onClick={() => setLocation("/edit-profile")} data-testid="button-edit-profile">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="jobs" data-testid="tab-jobs">
              <Briefcase className="w-4 h-4 mr-2" />
              Job Vacancies
            </TabsTrigger>
            <TabsTrigger value="applications" data-testid="tab-applications">
              <FileText className="w-4 h-4 mr-2" />
              My Applications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle>Available Job Opportunities</CardTitle>
                    <CardDescription>Browse and apply to jobs posted by employers</CardDescription>
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
                    <p className="text-muted-foreground">
                      {searchQuery ? "No jobs found matching your search" : "No job opportunities available"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOpportunities.map((opp) => {
                      const isExpanded = expandedJob === opp.id;
                      const location = [opp.city, opp.country].filter(Boolean).join(", ");
                      const application = applicationMap.get(opp.id);
                      const hasApplied = !!application;
                      
                      return (
                        <div 
                          key={opp.id} 
                          className="border rounded-md overflow-hidden"
                          data-testid={`card-job-${opp.id}`}
                        >
                          <div 
                            className="p-4 cursor-pointer hover-elevate"
                            onClick={() => toggleJobDetails(opp.id)}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg">{opp.title}</h3>
                                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  {opp.sector && (
                                    <span className="flex items-center gap-1">
                                      <Briefcase className="w-4 h-4" />
                                      {opp.sector}
                                    </span>
                                  )}
                                  {location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {location}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {format(new Date(opp.createdAt), "MMM d, yyyy")}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="default">{opp.type}</Badge>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t pt-4 bg-muted/30">
                              {opp.description && (
                                <div className="mb-4">
                                  <h4 className="font-medium mb-2">Description</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{opp.description}</p>
                                </div>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Contact Email</p>
                                    <span className="text-sm">View full details to contact</span>
                                  </div>
                                </div>
                                
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewFullDetails(opp);
                                  }}
                                  data-testid={`button-view-details-${opp.id}`}
                                >
                                  View Full Details
                                </Button>

                                {hasApplied ? (
                                  <Badge variant={getStatusBadgeVariant(application.status)}>
                                    {getStatusLabel(application.status)}
                                  </Badge>
                                ) : (
                                  <Button
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      applyMutation.mutate(opp.id);
                                    }}
                                    disabled={applyMutation.isPending}
                                    data-testid={`button-apply-${opp.id}`}
                                  >
                                    Apply Now
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading applications...</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No applications yet. Start applying to jobs!</p>
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
                        {applications.map((app) => (
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
                                onClick={() => app.opportunity && handleViewFullDetails(app.opportunity)}
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
        </Tabs>
      </main>
      <Footer />

      <Dialog open={!!selectedJob} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-xl">{selectedJob.title}</DialogTitle>
                  <Badge variant="default">{selectedJob.type}</Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {(() => {
                  const location = [selectedJob.city, selectedJob.country].filter(Boolean).join(", ");
                  const details = getJobDetails(selectedJob);
                  const application = applicationMap.get(selectedJob.id);
                  const hasApplied = !!application;
                  
                  return (
                    <>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {selectedJob.sector && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{selectedJob.sector}</span>
                          </div>
                        )}
                        {details.employmentType && (
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            <span className="capitalize">{details.employmentType.replace("-", " ")}</span>
                          </div>
                        )}
                        {location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Posted {format(new Date(selectedJob.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </div>

                      {(details.salaryMin || details.salaryMax) && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {details.salaryCurrency} {details.salaryMin?.toLocaleString()}
                            {details.salaryMax && ` - ${details.salaryMax.toLocaleString()}`}
                          </span>
                        </div>
                      )}

                      <Separator />

                      {selectedJob.description && (
                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
                        </div>
                      )}

                      {details.requirements.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Requirements</h4>
                          <ul className="space-y-2">
                            {details.requirements.map((req, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {details.skills.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {details.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {details.benefits.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Benefits</h4>
                          <ul className="space-y-2">
                            {details.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-3">Contact Information</h4>
                        {loadingEmployer ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span>Loading contact details...</span>
                          </div>
                        ) : employerData ? (
                          <div className="bg-muted/50 rounded-md p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{employerData.employerData?.companyName || employerData.fullName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <a 
                                href={`mailto:${employerData.email}`} 
                                className="text-primary hover:underline"
                                data-testid="link-employer-email"
                              >
                                {employerData.email}
                              </a>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Contact information not available</p>
                        )}
                      </div>

                      <Separator />

                      <div className="flex justify-end gap-2">
                        {hasApplied ? (
                          <Badge variant={getStatusBadgeVariant(application.status)} className="text-sm py-2 px-4">
                            {getStatusLabel(application.status)}
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => {
                              applyMutation.mutate(selectedJob.id);
                              handleCloseDialog();
                            }}
                            disabled={applyMutation.isPending}
                            data-testid="button-apply-dialog"
                          >
                            Apply Now
                          </Button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
