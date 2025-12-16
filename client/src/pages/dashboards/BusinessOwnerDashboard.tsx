import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Handshake, DollarSign, Target, Users, Edit, MapPin, Calendar, Briefcase, Mail } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

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

interface BusinessOwnerProfile {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    approvalStatus: string;
    createdAt: Date | string;
  };
  businessOwnerData: {
    businessName?: string;
    businessType?: string;
    industry?: string;
    revenue?: string;
    employees?: string;
  };
}

export default function BusinessOwnerDashboard() {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRoles(currentUser?.uid);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("opportunities");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const handleViewOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setViewDialogOpen(true);
  };

  const isLoading = authLoading || rolesLoading;

  // Fetch user's posted opportunities
  const { data: myOpportunities = [], isLoading: myOpportunitiesLoading } = useQuery<Opportunity[]>({
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

  // Fetch other business owners
  const { data: businessOwners = [], isLoading: businessOwnersLoading } = useQuery<BusinessOwnerProfile[]>({
    queryKey: ["/api/business-owners", currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) throw new Error("Not authenticated");
      const token = await currentUser.getIdToken(true);
      const response = await fetch("/api/business-owners", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch business owners");
      const data = await response.json();
      // Filter out current user
      return data.filter((bo: BusinessOwnerProfile) => bo.user.id !== currentUser.uid);
    },
    enabled: !!currentUser && hasRole("businessOwner"),
  });

  // Fetch available investment/partnership opportunities posted by others
  const { data: partnershipOpportunities = [], isLoading: partnershipsLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities", "partnership", currentUser?.uid],
    enabled: !!currentUser && hasRole("businessOwner"),
    queryFn: async () => {
      if (!currentUser) throw new Error("Not authenticated");
      const token = await currentUser.getIdToken(true);
      const response = await fetch(`/api/opportunities`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      const data = await response.json();
      // Filter for partnership/investment opportunities from others
      return data.filter((opp: Opportunity) => 
        opp.userId !== currentUser.uid && 
        (opp.type === "partnership" || opp.type === "investment") &&
        opp.approvalStatus === "approved" &&
        opp.status === "open"
      );
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


  const getApprovalBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold">Business Owner Dashboard</h1>
              <p className="text-muted-foreground">Manage your business and find growth opportunities</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PostOpportunityDialog />
              <Button variant="outline" onClick={() => setLocation("/edit-profile")} data-testid="button-edit-profile">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="opportunities" data-testid="tab-opportunities">
              <Target className="w-4 h-4 mr-2" />
              My Opportunities
            </TabsTrigger>
            <TabsTrigger value="investors" data-testid="tab-investors">
              <DollarSign className="w-4 h-4 mr-2" />
              Investors
            </TabsTrigger>
            <TabsTrigger value="business-owners" data-testid="tab-business-owners">
              <Users className="w-4 h-4 mr-2" />
              Business Owners
            </TabsTrigger>
            <TabsTrigger value="partnerships" data-testid="tab-partnerships">
              <Handshake className="w-4 h-4 mr-2" />
              Opportunities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Posted Opportunities</CardTitle>
                <CardDescription>Investment, partnership, and collaboration opportunities you've posted</CardDescription>
              </CardHeader>
              <CardContent>
                {myOpportunitiesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading opportunities...</p>
                  </div>
                ) : myOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No opportunities posted yet
                    </p>
                    <PostOpportunityDialog />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="table-my-opportunities">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Title</th>
                          <th className="text-left py-3 px-4 font-medium">Type</th>
                          <th className="text-left py-3 px-4 font-medium">Sector</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Approval</th>
                          <th className="text-left py-3 px-4 font-medium">Posted</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myOpportunities.map((opp) => (
                          <tr key={opp.id} className="border-b hover-elevate" data-testid={`row-opportunity-${opp.id}`}>
                            <td className="py-3 px-4 font-medium">{opp.title}</td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary">{opp.type}</Badge>
                            </td>
                            <td className="py-3 px-4">{opp.sector || "N/A"}</td>
                            <td className="py-3 px-4">
                              <Badge variant={opp.status === "open" ? "default" : "secondary"}>
                                {opp.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={getApprovalBadgeVariant(opp.approvalStatus)}>
                                {opp.approvalStatus}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {format(new Date(opp.createdAt), "MMM d, yyyy")}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleToggleStatus(opp.id, opp.status)}
                                  disabled={toggleStatusMutation.isPending}
                                  data-testid={`button-toggle-${opp.id}`}
                                >
                                  {opp.status === "open" ? "Close" : "Reopen"}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeleteClick(opp.id)}
                                  disabled={deleteOpportunityMutation.isPending}
                                  data-testid={`button-delete-${opp.id}`}
                                >
                                  Delete
                                </Button>
                              </div>
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

          <TabsContent value="investors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registered Investors</CardTitle>
                <CardDescription>Connect with investors seeking opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                {investorsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading investors...</p>
                  </div>
                ) : investors.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No investors registered yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="table-investors">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Name</th>
                          <th className="text-left py-3 px-4 font-medium">Investment Range</th>
                          <th className="text-left py-3 px-4 font-medium">Stage</th>
                          <th className="text-left py-3 px-4 font-medium">Focus</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investors.map((investor, idx) => (
                          <tr key={investor.user.id} className="border-b hover-elevate" data-testid={`row-investor-${idx}`}>
                            <td className="py-3 px-4 font-medium">
                              {investor.user.displayName || investor.user.email}
                            </td>
                            <td className="py-3 px-4">
                              {investor.investorData?.investmentRange || "N/A"}
                            </td>
                            <td className="py-3 px-4">
                              {investor.investorData?.preferredStage || "N/A"}
                            </td>
                            <td className="py-3 px-4">
                              {investor.investorData?.investmentFocus?.slice(0, 2).join(", ") || "N/A"}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" data-testid={`button-connect-investor-${idx}`}>
                                  Connect
                                </Button>
                                <Button size="sm" variant="outline" data-testid={`button-view-investor-${idx}`}>
                                  View
                                </Button>
                              </div>
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

          <TabsContent value="business-owners" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Other Business Owners</CardTitle>
                <CardDescription>Network with other business owners for collaboration</CardDescription>
              </CardHeader>
              <CardContent>
                {businessOwnersLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading business owners...</p>
                  </div>
                ) : businessOwners.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No other business owners registered yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="table-business-owners">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Name</th>
                          <th className="text-left py-3 px-4 font-medium">Business</th>
                          <th className="text-left py-3 px-4 font-medium">Industry</th>
                          <th className="text-left py-3 px-4 font-medium">Type</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {businessOwners.map((owner, idx) => (
                          <tr key={owner.user.id} className="border-b hover-elevate" data-testid={`row-business-owner-${idx}`}>
                            <td className="py-3 px-4 font-medium">
                              {owner.user.displayName || owner.user.email}
                            </td>
                            <td className="py-3 px-4">
                              {owner.businessOwnerData?.businessName || "N/A"}
                            </td>
                            <td className="py-3 px-4">
                              {owner.businessOwnerData?.industry || "N/A"}
                            </td>
                            <td className="py-3 px-4">
                              {owner.businessOwnerData?.businessType || "N/A"}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" data-testid={`button-connect-owner-${idx}`}>
                                  Connect
                                </Button>
                                <Button size="sm" variant="outline" data-testid={`button-view-owner-${idx}`}>
                                  View
                                </Button>
                              </div>
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

          <TabsContent value="partnerships" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Partnership & Investment Opportunities</CardTitle>
                <CardDescription>Explore opportunities posted by other business owners</CardDescription>
              </CardHeader>
              <CardContent>
                {partnershipsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading opportunities...</p>
                  </div>
                ) : partnershipOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <Handshake className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No partnership opportunities available</p>
                    <Button variant="outline" onClick={() => setLocation("/opportunities")} data-testid="button-browse-all">
                      Browse All Opportunities
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="table-partnerships">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Title</th>
                          <th className="text-left py-3 px-4 font-medium">Type</th>
                          <th className="text-left py-3 px-4 font-medium">Sector</th>
                          <th className="text-left py-3 px-4 font-medium">Location</th>
                          <th className="text-left py-3 px-4 font-medium">Budget</th>
                          <th className="text-left py-3 px-4 font-medium">Posted</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partnershipOpportunities.map((opp) => (
                          <tr key={opp.id} className="border-b hover-elevate" data-testid={`row-partnership-${opp.id}`}>
                            <td className="py-3 px-4 font-medium">{opp.title}</td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary">{opp.type}</Badge>
                            </td>
                            <td className="py-3 px-4">{opp.sector || "N/A"}</td>
                            <td className="py-3 px-4">
                              {[opp.city, opp.country].filter(Boolean).join(", ") || "N/A"}
                            </td>
                            <td className="py-3 px-4">{opp.budgetOrSalary || "N/A"}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {format(new Date(opp.createdAt), "MMM d, yyyy")}
                            </td>
                            <td className="py-3 px-4">
                              <Button 
                                size="sm" 
                                onClick={() => handleViewOpportunity(opp)}
                                data-testid={`button-view-partnership-${opp.id}`}
                              >
                                View
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this opportunity? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-view-opportunity">
          {selectedOpportunity && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl" data-testid="text-opportunity-title">
                  {selectedOpportunity.title}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" data-testid="badge-opportunity-type">
                    {selectedOpportunity.type}
                  </Badge>
                  <Badge variant={selectedOpportunity.status === "open" ? "default" : "secondary"} data-testid="badge-opportunity-status">
                    {selectedOpportunity.status}
                  </Badge>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm" data-testid="text-opportunity-description">
                    {selectedOpportunity.description}
                  </p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedOpportunity.sector && (
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Sector</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-opportunity-sector">
                          {selectedOpportunity.sector}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {(selectedOpportunity.city || selectedOpportunity.country) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-opportunity-location">
                          {[selectedOpportunity.city, selectedOpportunity.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedOpportunity.budgetOrSalary && (
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Budget</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-opportunity-budget">
                          {selectedOpportunity.budgetOrSalary}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedOpportunity.contactPreference && (
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Contact Preference</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-opportunity-contact">
                          {selectedOpportunity.contactPreference}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Posted</p>
                      <p className="text-sm text-muted-foreground" data-testid="text-opportunity-date">
                        {format(new Date(selectedOpportunity.createdAt), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setViewDialogOpen(false)}
                  data-testid="button-close-dialog"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
