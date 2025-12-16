import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, DollarSign, Briefcase, Building2, Eye, BookmarkPlus, Users, Edit, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

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

  const investorData = userData?.investorData || {};
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

  const investmentRange = investorData.investmentRange || "Not specified";
  const preferredStage = investorData.preferredStage || "Not specified";
  const investmentFocus = investorData.investmentFocus || [];
  const industries = investorData.industries || [];

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
                                  onClick={() => setLocation(`/opportunities/${opp.id}`)}
                                  data-testid={`button-view-opportunity-${opp.id}`}
                                >
                                  View
                                </Button>
                                <Button size="sm" variant="outline" data-testid={`button-save-${opp.id}`}>
                                  <BookmarkPlus className="w-4 h-4" />
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
                        {filteredBusinessOwners.map((owner, idx) => (
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
                                <Button size="sm" data-testid={`button-connect-${idx}`}>
                                  Connect
                                </Button>
                                <Button size="sm" variant="outline" data-testid={`button-view-${idx}`}>
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

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Investment Profile</CardTitle>
                    <CardDescription>Your investment preferences and focus areas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Investment Range</p>
                        <p className="text-sm text-muted-foreground">{investmentRange}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Preferred Stage</p>
                        <p className="text-sm text-muted-foreground">{preferredStage}</p>
                      </div>
                    </div>
                    
                    {investmentFocus.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Investment Focus</p>
                        <div className="flex flex-wrap gap-2">
                          {investmentFocus.map((focus: string, idx: number) => (
                            <Badge key={idx} variant="secondary" data-testid={`badge-focus-${idx}`}>{focus}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {industries.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Preferred Industries</p>
                        <div className="flex flex-wrap gap-2">
                          {industries.map((industry: string, idx: number) => (
                            <Badge key={idx} variant="secondary" data-testid={`badge-industry-${idx}`}>{industry}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button onClick={() => setLocation("/edit-profile")} data-testid="button-edit-investor-profile">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full" variant="outline" onClick={() => setActiveTab("opportunities")} data-testid="button-search-opportunities">
                      <Target className="w-4 h-4 mr-2" />
                      Search Opportunities
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => setActiveTab("business-owners")} data-testid="button-browse-businesses">
                      <Building2 className="w-4 h-4 mr-2" />
                      Browse Businesses
                    </Button>
                    <Button className="w-full" variant="outline" data-testid="button-saved-deals">
                      <BookmarkPlus className="w-4 h-4 mr-2" />
                      Saved Deals
                    </Button>
                    <Button className="w-full" variant="outline" data-testid="button-analytics">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { action: "New deal matched", time: "1 hour ago" },
                      { action: "Saved opportunity", time: "3 hours ago" },
                      { action: "Portfolio update available", time: "1 day ago" },
                      { action: "New sector report", time: "2 days ago" },
                    ].map((activity, idx) => (
                      <div key={idx} className="text-sm" data-testid={`activity-${idx}`}>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    ))}
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
