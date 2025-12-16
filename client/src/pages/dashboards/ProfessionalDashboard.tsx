import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Search, Mail, MapPin, Calendar, ChevronDown, ChevronUp, Edit } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Opportunity } from "@shared/schema";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

export default function ProfessionalDashboard() {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRoles(currentUser?.uid);
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

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

  // Filter opportunities - jobs from employers
  const jobOpportunities = opportunities
    .filter(opp => opp.status === "open" && opp.approvalStatus === "approved" && opp.type === "job");

  // Filter opportunities by search
  const filteredOpportunities = jobOpportunities.filter(opp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return opp.title.toLowerCase().includes(query) || 
           (opp.sector?.toLowerCase().includes(query)) ||
           (opp.description?.toLowerCase().includes(query));
  });

  const getJobEmail = (opp: Opportunity): string | null => {
    // Check top-level email fields first
    const oppAny = opp as Record<string, unknown>;
    if (typeof oppAny.email === 'string' && oppAny.email) return oppAny.email;
    if (typeof oppAny.contactEmail === 'string' && oppAny.contactEmail) return oppAny.contactEmail;
    
    // Check details object for various email field names
    if (opp.details && typeof opp.details === 'object') {
      const details = opp.details as Record<string, unknown>;
      if (typeof details.contactEmail === 'string' && details.contactEmail) return details.contactEmail;
      if (typeof details.email === 'string' && details.email) return details.email;
      if (typeof details.contact === 'string' && details.contact?.includes('@')) return details.contact;
    }
    
    return null;
  };

  const toggleJobDetails = (jobId: string) => {
    setExpandedJob(expandedJob === jobId ? null : jobId);
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
                <p className="text-muted-foreground">No job opportunities available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOpportunities.map((opp) => {
                  const email = getJobEmail(opp);
                  const isExpanded = expandedJob === opp.id;
                  const location = [opp.city, opp.country].filter(Boolean).join(", ");
                  
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
                            <Badge variant="secondary">{opp.type}</Badge>
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
                              <Mail className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Contact Email</p>
                                {email ? (
                                  <a 
                                    href={`mailto:${email}`} 
                                    className="text-sm font-medium text-primary hover:underline"
                                    data-testid={`link-email-${opp.id}`}
                                  >
                                    {email}
                                  </a>
                                ) : (
                                  <span className="text-sm text-muted-foreground" data-testid={`text-no-email-${opp.id}`}>
                                    View full details to contact
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <Button 
                              onClick={() => setLocation(`/opportunities/${opp.id}`)}
                              data-testid={`button-view-details-${opp.id}`}
                            >
                              View Full Details
                            </Button>
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
      </main>
      <Footer />
    </div>
  );
}
