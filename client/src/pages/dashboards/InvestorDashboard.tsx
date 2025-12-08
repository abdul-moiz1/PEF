import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, DollarSign, Briefcase, Building2, Eye, BookmarkPlus } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

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
  industry?: string;
  location?: string;
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

  // ✅ FIX: Safe fallback for investorData - never undefined
  const investorData = userData?.investorData || {};
  
  // ✅ FIX: Combined loading state - wait for both auth and roles
  const isLoading = authLoading || rolesLoading;

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

  // Safe access to investorData fields with fallbacks
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

  // Filter for investment opportunities that are approved and open
  const investmentOpportunities = opportunities.filter(
    (opp) => opp.type === "investment" && opp.approvalStatus === "approved" && opp.status === "open"
  );

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

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Investor Dashboard</h1>
          <p className="text-muted-foreground">Discover and track investment opportunities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Business Owners</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businessOwnersLoading ? "..." : businessOwners.length}</div>
              <p className="text-xs text-muted-foreground">Registered on platform</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{opportunitiesLoading ? "..." : investmentOpportunities.length}</div>
              <p className="text-xs text-muted-foreground">Investment opportunities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investment Range</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{investmentRange.split(" - ")[0] || "N/A"}</div>
              <p className="text-xs text-muted-foreground">{investmentRange}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preferred Stage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{preferredStage === "Not specified" ? "N/A" : preferredStage}</div>
              <p className="text-xs text-muted-foreground">Investment stage</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Investment Opportunities</CardTitle>
                  <Button variant="outline" size="sm" data-testid="button-browse-all">
                    Browse All
                  </Button>
                </div>
                <CardDescription>Businesses seeking investment in your focus areas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {opportunitiesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading opportunities...</p>
                  </div>
                ) : investmentOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No investment opportunities available yet</p>
                    <p className="text-sm text-muted-foreground">Check back soon for new opportunities from business owners</p>
                  </div>
                ) : (
                  investmentOpportunities.map((opp) => (
                    <div key={opp.id} className="p-4 rounded-md border hover-elevate">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1">{opp.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{opp.industry || "Not specified"}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{opp.status}</Badge>
                        </div>
                      </div>
                      {opp.description && (
                        <p className="text-sm mb-3 line-clamp-2">{opp.description}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 text-sm">
                        {opp.metadata?.investmentAmount && (
                          <div>
                            <p className="text-muted-foreground">Amount Seeking</p>
                            <p className="font-medium">{opp.metadata.investmentAmount}</p>
                          </div>
                        )}
                        {opp.metadata?.equity && (
                          <div>
                            <p className="text-muted-foreground">Equity Offered</p>
                            <p className="font-medium">{opp.metadata.equity}%</p>
                          </div>
                        )}
                        {opp.location && (
                          <div>
                            <p className="text-muted-foreground">Location</p>
                            <p className="font-medium">{opp.location}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" data-testid={`button-view-deal-${opp.id}`}>View Details</Button>
                        <Button size="sm" variant="outline" data-testid={`button-save-deal-${opp.id}`}>
                          <BookmarkPlus className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" data-testid={`button-contact-${opp.id}`}>
                          Contact
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registered Business Owners</CardTitle>
                <CardDescription>Connect with businesses seeking investment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {businessOwnersLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading business owners...</p>
                  </div>
                ) : businessOwners.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No business owners registered yet</p>
                    <p className="text-sm text-muted-foreground">Check back soon for new businesses</p>
                  </div>
                ) : (
                  businessOwners.slice(0, 5).map((owner, idx) => (
                    <div key={owner.user.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{owner.user.displayName || owner.user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {owner.businessOwnerData?.businessName || "Business Owner"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" data-testid={`button-view-business-${idx}`}>
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                {!businessOwnersLoading && businessOwners.length > 5 && (
                  <Button variant="outline" className="w-full" size="sm" data-testid="button-view-all-businesses">
                    View All {businessOwners.length} Business Owners
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Investment Range</p>
                  <p className="text-sm text-muted-foreground">{investmentRange}</p>
                </div>
                {investmentFocus.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Investment Focus</p>
                    <div className="flex flex-wrap gap-1">
                      {investmentFocus.map((focus, idx) => (
                        <Badge key={idx} variant="secondary">{focus}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {industries.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Preferred Industries</p>
                    <div className="flex flex-wrap gap-1">
                      {industries.map((industry, idx) => (
                        <Badge key={idx} variant="secondary">{industry}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium mb-1">Investment Stage</p>
                  <p className="text-sm text-muted-foreground">{preferredStage}</p>
                </div>
                <Button className="w-full" variant="outline" size="sm" onClick={() => setLocation("/edit-profile")} data-testid="button-edit-investor-profile">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline" data-testid="button-search-opportunities">
                  <Target className="w-4 h-4 mr-2" />
                  Search Opportunities
                </Button>
                <Button className="w-full" variant="outline" data-testid="button-view-portfolio">
                  <Briefcase className="w-4 h-4 mr-2" />
                  View Full Portfolio
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
    </div>
  );
}
