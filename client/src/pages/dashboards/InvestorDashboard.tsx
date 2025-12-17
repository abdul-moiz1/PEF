import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, DollarSign, Briefcase, Building2, Eye, Users, Edit, Search, X, MapPin, Calendar, Mail, Phone, Globe, UserCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

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

interface Opportunity {
  id: string;
  userId: string;
  type: string;
  title: string;
  description?: string;
  sector?: string;
  country?: string;
  city?: string;
  budgetOrSalary?: string;
  contactPreference?: string;
  status: string;
  approvalStatus: string;
  metadata?: {
    investmentAmount?: string;
    equity?: number;
    [key: string]: any;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function InvestorDashboard() {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRoles(currentUser?.uid);
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("opportunities");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedBusinessOwner, setSelectedBusinessOwner] = useState<BusinessOwnerProfile | null>(null);
  const { toast } = useToast();

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

  if (!hasRole("investor")) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 md:pt-28 pb-16 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You need to be an Investor to access this dashboard.</CardDescription>
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

  // Fetch investment opportunities
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
    enabled: !!currentUser && hasRole("investor"),
  });

  // Filter for investment opportunities
  const investmentOpportunities = opportunities.filter(
    (opp) => opp.type === "investment"
  );

  // Filter by status
  const statusFilteredOpportunities = investmentOpportunities.filter(opp => {
    if (statusFilter === "all") return opp.approvalStatus === "approved" && opp.status === "open";
    if (statusFilter === "open") return opp.status === "open" && opp.approvalStatus === "approved";
    if (statusFilter === "closed") return opp.status === "closed";
    return true;
  });

  // Filter by search
  const filteredOpportunities = statusFilteredOpportunities.filter(opp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return opp.title.toLowerCase().includes(query) || 
           (opp.sector?.toLowerCase().includes(query)) ||
           (opp.description?.toLowerCase().includes(query));
  });

  // Fetch business owners
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
      return response.json();
    },
    enabled: !!currentUser && hasRole("investor"),
  });

  // Filter business owners by search
  const filteredBusinessOwners = businessOwners.filter(owner => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (owner.user.displayName?.toLowerCase().includes(query)) ||
           (owner.user.email?.toLowerCase().includes(query)) ||
           (owner.businessOwnerData?.businessName?.toLowerCase().includes(query)) ||
           (owner.businessOwnerData?.industry?.toLowerCase().includes(query));
  });

  // Fetch sent connection requests to check if already connected
  const { data: sentRequests = [] } = useQuery<{ toUserId: string; status: string }[]>({
    queryKey: ["/api/connection-requests/sent", currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) throw new Error("Not authenticated");
      const token = await currentUser.getIdToken(true);
      const response = await fetch("/api/connection-requests/sent", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch connection requests");
      return response.json();
    },
    enabled: !!currentUser && hasRole("investor"),
  });

  // Connect mutation - send toUserId and targetType as required by the API
  const connectMutation = useMutation({
    mutationFn: async (data: { toUserId: string; targetType: string }) => {
      if (!currentUser) throw new Error("Not authenticated");
      const token = await currentUser.getIdToken(true);
      const response = await fetch("/api/connection-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send connection request");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Connection request sent", description: "The business owner will be notified" });
      queryClient.invalidateQueries({ queryKey: ["/api/connection-requests/sent"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to connect", description: error.message, variant: "destructive" });
    },
  });

  const getConnectionStatus = (userId: string) => {
    const request = sentRequests.find(r => r.toUserId === userId);
    return request?.status || null;
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold">Investor Dashboard</h1>
              <p className="text-muted-foreground">Discover and track investment opportunities</p>
            </div>
            <Button onClick={() => setLocation("/edit-profile")} data-testid="button-edit-profile">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="opportunities" data-testid="tab-opportunities">
              <Target className="w-4 h-4 mr-2" />
              Investment Opportunities
            </TabsTrigger>
            <TabsTrigger value="business-owners" data-testid="tab-business-owners">
              <Building2 className="w-4 h-4 mr-2" />
              Business Owners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle>Investment Opportunities</CardTitle>
                    <CardDescription>Businesses seeking investment in your focus areas</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                      {["all", "open", "closed"].map((status) => (
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
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search opportunities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                        data-testid="input-search-opportunities"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {opportunitiesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading opportunities...</p>
                  </div>
                ) : filteredOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No investment opportunities available</p>
                    <Button variant="outline" onClick={() => setLocation("/opportunities")} data-testid="button-browse-all">
                      Browse All Opportunities
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="table-opportunities">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Title</th>
                          <th className="text-left py-3 px-4 font-medium">Sector</th>
                          <th className="text-left py-3 px-4 font-medium">Location</th>
                          <th className="text-left py-3 px-4 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 font-medium">Posted</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOpportunities.map((opp) => (
                          <tr key={opp.id} className="border-b hover-elevate" data-testid={`row-opportunity-${opp.id}`}>
                            <td className="py-3 px-4">
                              <div className="font-medium">{opp.title}</div>
                              {opp.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">{opp.description}</div>
                              )}
                            </td>
                            <td className="py-3 px-4">{opp.sector || "N/A"}</td>
                            <td className="py-3 px-4">
                              {[opp.city, opp.country].filter(Boolean).join(", ") || "N/A"}
                            </td>
                            <td className="py-3 px-4">
                              {opp.metadata?.investmentAmount || opp.budgetOrSalary || "N/A"}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {format(new Date(opp.createdAt), "MMM d, yyyy")}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => setSelectedOpportunity(opp)}
                                  data-testid={`button-view-opportunity-${opp.id}`}
                                >
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
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle>Registered Business Owners</CardTitle>
                    <CardDescription>Connect with businesses seeking investment</CardDescription>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search business owners..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-business-owners"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {businessOwnersLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading business owners...</p>
                  </div>
                ) : filteredBusinessOwners.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No business owners found</p>
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
                          <th className="text-left py-3 px-4 font-medium">Revenue</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBusinessOwners.map((owner, idx) => {
                          const connectionStatus = getConnectionStatus(owner.user.id);
                          return (
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
                                {owner.businessOwnerData?.revenue || "N/A"}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-2">
                                  {connectionStatus === "pending" ? (
                                    <Badge variant="secondary" data-testid={`badge-pending-${idx}`}>
                                      Pending
                                    </Badge>
                                  ) : connectionStatus === "accepted" ? (
                                    <Badge variant="default" data-testid={`badge-connected-${idx}`}>
                                      <UserCheck className="w-3 h-3 mr-1" />
                                      Connected
                                    </Badge>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      onClick={() => connectMutation.mutate({ toUserId: owner.user.id, targetType: "businessOwner" })}
                                      disabled={connectMutation.isPending}
                                      data-testid={`button-connect-${idx}`}
                                    >
                                      Connect
                                    </Button>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setSelectedBusinessOwner(owner)}
                                    data-testid={`button-view-${idx}`}
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

        </Tabs>

        {/* Investment Opportunity Preview Dialog */}
        <Dialog open={!!selectedOpportunity} onOpenChange={(open) => !open && setSelectedOpportunity(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-opportunity-detail">
            {selectedOpportunity && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">{selectedOpportunity.title}</DialogTitle>
                  <DialogDescription>
                    <Badge variant="secondary" className="mt-2">{selectedOpportunity.type}</Badge>
                    {selectedOpportunity.status === "open" && (
                      <Badge variant="default" className="ml-2">Open</Badge>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {selectedOpportunity.description && (
                    <div>
                      <h4 className="font-medium mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground">{selectedOpportunity.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Sector</p>
                        <p className="text-sm font-medium">{selectedOpportunity.sector || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-sm font-medium">
                          {[selectedOpportunity.city, selectedOpportunity.country].filter(Boolean).join(", ") || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Investment Amount</p>
                        <p className="text-sm font-medium">
                          {selectedOpportunity.metadata?.investmentAmount || selectedOpportunity.budgetOrSalary || "N/A"}
                        </p>
                      </div>
                    </div>
                    {selectedOpportunity.metadata?.equity && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Equity Offered</p>
                          <p className="text-sm font-medium">{selectedOpportunity.metadata.equity}%</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Posted</p>
                        <p className="text-sm font-medium">{format(new Date(selectedOpportunity.createdAt), "MMMM d, yyyy")}</p>
                      </div>
                    </div>
                    {selectedOpportunity.contactPreference && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Contact Preference</p>
                          <p className="text-sm font-medium">{selectedOpportunity.contactPreference}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedOpportunity(null)} data-testid="button-close-opportunity">
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Business Owner Detail Dialog */}
        <Dialog open={!!selectedBusinessOwner} onOpenChange={(open) => !open && setSelectedBusinessOwner(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-business-owner-detail">
            {selectedBusinessOwner && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {selectedBusinessOwner.businessOwnerData?.businessName || selectedBusinessOwner.user.displayName || "Business Owner"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedBusinessOwner.businessOwnerData?.industry && (
                      <Badge variant="secondary" className="mt-2">{selectedBusinessOwner.businessOwnerData.industry}</Badge>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Contact Name</p>
                        <p className="text-sm font-medium">{selectedBusinessOwner.user.displayName || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{selectedBusinessOwner.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Business Type</p>
                        <p className="text-sm font-medium">{selectedBusinessOwner.businessOwnerData?.businessType || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Industry</p>
                        <p className="text-sm font-medium">{selectedBusinessOwner.businessOwnerData?.industry || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="text-sm font-medium">{selectedBusinessOwner.businessOwnerData?.revenue || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Employees</p>
                        <p className="text-sm font-medium">{selectedBusinessOwner.businessOwnerData?.employees || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Member Since</p>
                        <p className="text-sm font-medium">{format(new Date(selectedBusinessOwner.user.createdAt), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {(() => {
                      const status = getConnectionStatus(selectedBusinessOwner.user.id);
                      if (status === "pending") {
                        return <Badge variant="secondary">Connection Pending</Badge>;
                      } else if (status === "accepted") {
                        return (
                          <Badge variant="default">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        );
                      } else {
                        return (
                          <Button
                            onClick={() => {
                              connectMutation.mutate({ toUserId: selectedBusinessOwner.user.id, targetType: "businessOwner" });
                              setSelectedBusinessOwner(null);
                            }}
                            disabled={connectMutation.isPending}
                            data-testid="button-connect-from-dialog"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        );
                      }
                    })()}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
