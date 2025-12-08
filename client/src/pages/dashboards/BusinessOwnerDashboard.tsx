import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Handshake, TrendingUp, DollarSign, Globe, Building2, Target, MapPin, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import PostOpportunityDialog from "@/components/PostOpportunityDialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

interface Opportunity {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  sector?: string | null;
  country?: string | null;
  city?: string | null;
  budgetOrSalary?: string | null;
  contactPreference?: string | null;
  status: string;
  approvalStatus: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface InvestorProfile {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    approvalStatus: string;
    createdAt: Date | string;
  };
  investorData: {
    investmentRange?: string;
    preferredStage?: string;
    investmentFocus?: string[];
    industries?: string[];
  };
}

export default function BusinessOwnerDashboard() {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRoles(currentUser?.uid);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState<string | null>(null);

  // ✅ FIX: Safe fallback for businessOwnerData - never undefined
  const businessOwnerData = userData?.businessOwnerData || {};
  
  // ✅ FIX: Combined loading state - wait for both auth and roles
  const isLoading = authLoading || rolesLoading;

  // Fetch user's posted opportunities
  const { data: myOpportunities = [] } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities", "mine", currentUser?.uid],
    enabled: !!currentUser && hasRole("businessOwner"),
    queryFn: async () => {
      if (!currentUser) return [];
      const token = await currentUser.getIdToken(true);
      const response = await fetch("/api/opportunities?myOpportunities=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
  });

  // Fetch registered investors
  const { data: investors = [], isLoading: investorsLoading } = useQuery<InvestorProfile[]>({
    queryKey: ["/api/investors", currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) throw new Error("Not authenticated");
      const token = await currentUser.getIdToken(true);
      const response = await fetch("/api/investors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch investors");
      return response.json();
    },
    enabled: !!currentUser && hasRole("businessOwner"),
  });

  // Fetch available investment opportunities posted by others
  const { data: investmentOpportunities = [], isLoading: investmentsLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities", "investment", currentUser?.uid],
    enabled: !!currentUser && hasRole("businessOwner"),
    queryFn: async () => {
      if (!currentUser) throw new Error("Not authenticated");
      const token = await currentUser.getIdToken(true);
      const params = new URLSearchParams({ type: "investment" });
      const response = await fetch(`/api/opportunities?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch investment opportunities");
      const data = await response.json();
      // Filter out user's own opportunities
      return data.filter((opp: Opportunity) => opp.userId !== currentUser.uid);
    },
  });

  // Mutation to toggle opportunity status (open/closed)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      if (!currentUser) throw new Error("Not authenticated");
      
      const response = await apiRequest("PATCH", `/api/opportunities/${id}`, { status: newStatus });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"], exact: false });
      toast({
        title: "Success!",
        description: "Opportunity status updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update opportunity status",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete opportunity
  const deleteOpportunityMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!currentUser) throw new Error("Not authenticated");
      
      const response = await apiRequest("DELETE", `/api/opportunities/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"], exact: false });
      toast({
        title: "Success!",
        description: "Opportunity deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setOpportunityToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete opportunity",
        variant: "destructive",
      });
    },
  });

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "open" ? "closed" : "open";
    toggleStatusMutation.mutate({ id, newStatus });
  };

  const handleDeleteClick = (id: string) => {
    setOpportunityToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (opportunityToDelete) {
      deleteOpportunityMutation.mutate(opportunityToDelete);
    }
  };

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
  if (!hasRole("businessOwner")) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 md:pt-28 pb-16 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You need to be a Business Owner to access this dashboard.</CardDescription>
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

  // Safe access to businessOwnerData fields with fallbacks
  const businessName = businessOwnerData.businessName || "Not specified";
  const businessType = businessOwnerData.businessType || "Not specified";
  const industry = businessOwnerData.industry || "Not specified";
  const revenue = businessOwnerData.revenue || "Not disclosed";
  const employees = businessOwnerData.employees || "Not specified";

  // Calculate stats from real data
  const activeOpportunities = myOpportunities.filter(opp => opp.status === "open").length;
  const investmentCount = myOpportunities.filter(opp => opp.type === "investment").length;
  const partnershipCount = myOpportunities.filter(opp => opp.type === "partnership").length;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold">Business Owner Dashboard</h1>
            <PostOpportunityDialog />
          </div>
          <p className="text-muted-foreground">Manage your business and find growth opportunities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeOpportunities}</div>
              <p className="text-xs text-muted-foreground">{partnershipCount} partnerships, {investmentCount} investments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered Investors</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{investorsLoading ? "..." : investors.length}</div>
              <p className="text-xs text-muted-foreground">Available on platform</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myOpportunities.length}</div>
              <p className="text-xs text-muted-foreground">Posted by you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Business Profile</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{industry.split(" ")[0]}</div>
              <p className="text-xs text-muted-foreground">{industry}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>Your business information and goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Business Name</p>
                    <p className="text-sm text-muted-foreground">{businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Business Type</p>
                    <p className="text-sm text-muted-foreground">{businessType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Industry</p>
                    <p className="text-sm text-muted-foreground">{industry}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Revenue Range</p>
                    <p className="text-sm text-muted-foreground">{revenue}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Employees</p>
                    <p className="text-sm text-muted-foreground">{employees}</p>
                  </div>
                </div>
                <Button className="w-full md:w-auto" variant="outline" onClick={() => setLocation("/edit-profile")} data-testid="button-edit-business-profile">
                  Edit Business Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Posted Opportunities</CardTitle>
                <CardDescription>Opportunities you've posted for investment, partnerships, and collaboration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {myOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven't posted any opportunities yet.
                    </p>
                    <PostOpportunityDialog />
                  </div>
                ) : (
                  myOpportunities.map((opp) => {
                    const typeColors = {
                      investment: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100",
                      partnership: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100",
                      collaboration: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100",
                    };
                    
                    const statusIcons = {
                      pending: <Clock className="w-3 h-3" />,
                      approved: <CheckCircle className="w-3 h-3" />,
                      rejected: <XCircle className="w-3 h-3" />,
                    };
                    
                    const approvalColors = {
                      pending: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100",
                      approved: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100",
                      rejected: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100",
                    };

                    return (
                      <div key={opp.id} className="p-4 rounded-md border hover-elevate" data-testid={`opportunity-${opp.id}`}>
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-2" data-testid={`text-opportunity-title-${opp.id}`}>
                              {opp.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge className={typeColors[opp.type as keyof typeof typeColors] || "bg-gray-100 dark:bg-gray-800"} data-testid={`badge-type-${opp.id}`}>
                                {opp.type}
                              </Badge>
                              <Badge className={approvalColors[opp.approvalStatus as keyof typeof approvalColors]} data-testid={`badge-approval-${opp.id}`}>
                                <span className="mr-1">{statusIcons[opp.approvalStatus as keyof typeof statusIcons]}</span>
                                {opp.approvalStatus}
                              </Badge>
                              <Badge variant={opp.status === "open" ? "default" : "secondary"} data-testid={`badge-status-${opp.id}`}>
                                {opp.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {opp.description}
                            </p>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              {(opp.country || opp.city) && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{[opp.city, opp.country].filter(Boolean).join(", ")}</span>
                                </div>
                              )}
                              {opp.budgetOrSalary && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  <span>{opp.budgetOrSalary}</span>
                                </div>
                              )}
                              {opp.sector && (
                                <Badge variant="outline" className="text-xs">
                                  {opp.sector}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>Posted {format(new Date(opp.createdAt), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              data-testid={`button-close-opportunity-${opp.id}`}
                              onClick={() => handleToggleStatus(opp.id, opp.status)}
                              disabled={toggleStatusMutation.isPending}
                            >
                              {opp.status === "open" ? "Close" : "Reopen"}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              data-testid={`button-delete-opportunity-${opp.id}`}
                              onClick={() => handleDeleteClick(opp.id)}
                              disabled={deleteOpportunityMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registered Investors</CardTitle>
                <CardDescription>Connect with investors seeking opportunities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {investorsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading investors...</p>
                  </div>
                ) : investors.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No investors registered yet</p>
                    <p className="text-sm text-muted-foreground">Check back soon for new investors</p>
                  </div>
                ) : (
                  investors.slice(0, 5).map((investor, idx) => (
                    <div key={investor.user.id} className="p-4 rounded-md border hover-elevate">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1">{investor.user.displayName || investor.user.email}</h3>
                          {investor.investorData?.investmentFocus && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {Array.isArray(investor.investorData.investmentFocus) 
                                ? investor.investorData.investmentFocus.join(", ") 
                                : investor.investorData.investmentFocus}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                        {investor.investorData?.investmentRange && (
                          <div>
                            <p className="text-muted-foreground">Investment Range</p>
                            <p className="font-medium">{investor.investorData.investmentRange}</p>
                          </div>
                        )}
                        {investor.investorData?.preferredStage && (
                          <div>
                            <p className="text-muted-foreground">Stage</p>
                            <p className="font-medium">{investor.investorData.preferredStage}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" data-testid={`button-connect-investor-${idx}`}>Connect</Button>
                        <Button size="sm" variant="outline" data-testid={`button-view-investor-${idx}`}>
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                {!investorsLoading && investors.length > 5 && (
                  <Button variant="outline" className="w-full" size="sm" data-testid="button-view-all-investors">
                    View All {investors.length} Investors
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Investment Opportunities</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setLocation("/opportunities")}
                    data-testid="button-view-all-investments"
                  >
                    View All
                  </Button>
                </div>
                <CardDescription>Explore investment opportunities from other business owners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {investmentsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading investment opportunities...</p>
                  </div>
                ) : investmentOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No investment opportunities available</p>
                    <p className="text-sm text-muted-foreground">Check back soon for new opportunities</p>
                  </div>
                ) : (
                  investmentOpportunities.slice(0, 5).map((opp) => (
                    <div 
                      key={opp.id} 
                      className="p-4 rounded-md border hover-elevate"
                      data-testid={`card-investment-${opp.id}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1">{opp.title}</h3>
                          {opp.sector && (
                            <p className="text-sm text-muted-foreground mb-1">{opp.sector}</p>
                          )}
                        </div>
                        <Badge variant="secondary" data-testid={`badge-status-${opp.id}`}>
                          {opp.status === "open" ? "Open" : "Closed"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {opp.description}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap gap-3 text-muted-foreground">
                          {(opp.city || opp.country) && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {[opp.city, opp.country].filter(Boolean).join(", ")}
                            </div>
                          )}
                          {opp.budgetOrSalary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {opp.budgetOrSalary}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(opp.createdAt), "MMM d, yyyy")}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => setLocation(`/opportunities/${opp.id}`)}
                          data-testid={`button-view-investment-${opp.id}`}
                        >
                          View Details
                        </Button>
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
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline" data-testid="button-seek-investment">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Seek Investment
                </Button>
                <Button className="w-full" variant="outline" data-testid="button-find-partners">
                  <Handshake className="w-4 h-4 mr-2" />
                  Find Partners
                </Button>
                <Button className="w-full" variant="outline" data-testid="button-expansion-plan">
                  <Globe className="w-4 h-4 mr-2" />
                  Plan Expansion
                </Button>
                <Button className="w-full" variant="outline" onClick={() => setLocation("/edit-profile")} data-testid="button-update-business">
                  <Building2 className="w-4 h-4 mr-2" />
                  Update Business Info
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expansion Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Target Countries</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary">UAE</Badge>
                    <Badge variant="secondary">Qatar</Badge>
                    <Badge variant="secondary">Kuwait</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Expansion Timeline</p>
                  <p className="text-sm text-muted-foreground">12-18 months</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Priority</p>
                  <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100">
                    High
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { action: "Investor viewed profile", time: "1 hour ago" },
                  { action: "New partnership inquiry", time: "3 hours ago" },
                  { action: "Business profile updated", time: "2 days ago" },
                  { action: "Investment opportunity posted", time: "1 week ago" },
                ].map((activity, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Opportunity?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your opportunity and remove it from public view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
