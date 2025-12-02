import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowLeft, Search, ExternalLink, Mail, Phone, MapPin, Briefcase, CheckCircle2, XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { MembershipApplication, Country } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

function ApplicationsTable({
  applications,
  searchQuery,
  countryFilter,
  onSelectApplication,
  getStatusBadge,
}: {
  applications: MembershipApplication[];
  searchQuery: string;
  countryFilter: string;
  onSelectApplication: (app: MembershipApplication) => void;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">
            {searchQuery || countryFilter !== "all" ? "No applications found" : "No applications in this category"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Name</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Email</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Country</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr
                key={app.id}
                onClick={() => onSelectApplication(app)}
                className="border-b last:border-0 hover-elevate cursor-pointer"
                data-testid={`row-application-${app.id}`}
              >
                <td className="p-4">
                  <div className="font-medium" data-testid={`text-app-name-${app.id}`}>
                    {app.fullName}
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-muted-foreground" data-testid={`text-app-email-${app.id}`}>
                    {app.email}
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm" data-testid={`text-app-country-${app.id}`}>
                    {app.country}
                  </div>
                </td>
                <td className="p-4">
                  <div data-testid={`badge-app-status-${app.id}`}>
                    {getStatusBadge(app.status)}
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(app.createdAt), "MMM dd, yyyy")}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function AdminMembership() {
  const { currentUser, userData } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<MembershipApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("pending");

  const { data: applications = [], isLoading } = useQuery<MembershipApplication[]>({
    queryKey: ["/api/membership-applications"],
  });

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/locations/countries"],
  });

  if (!currentUser || !userData?.roles?.admin) {
    setLocation("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading membership applications...</p>
        </div>
      </div>
    );
  }

  const filterApplications = (apps: MembershipApplication[]) => {
    let filtered = apps;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          (app.fullName || "").toLowerCase().includes(query) ||
          (app.email || "").toLowerCase().includes(query) ||
          (app.country || "").toLowerCase().includes(query)
      );
    }
    if (countryFilter !== "all") {
      filtered = filtered.filter((app) => {
        const appCountry = app.country;
        return appCountry && appCountry === countryFilter;
      });
    }
    return filtered;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingApplications = applications.filter((a) => a.status === "pending");
  const approvedApplications = applications.filter((a) => a.status === "approved");
  const rejectedApplications = applications.filter((a) => a.status === "rejected");

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin")}
            className="mb-4"
            data-testid="button-back-to-admin"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Membership Applications</h1>
          </div>
          <p className="text-muted-foreground">Review and manage membership applications</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{pendingApplications.length}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{approvedApplications.length}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{rejectedApplications.length}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-applications"
              />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full sm:w-[160px]" data-testid="select-country-filter">
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.name}>
                    {country.displayName || country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6" data-testid="tabs-application-status">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({approvedApplications.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({rejectedApplications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <ApplicationsTable
              applications={filterApplications(pendingApplications)}
              searchQuery={searchQuery}
              countryFilter={countryFilter}
              onSelectApplication={setSelectedApplication}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>

          <TabsContent value="approved">
            <ApplicationsTable
              applications={filterApplications(approvedApplications)}
              searchQuery={searchQuery}
              countryFilter={countryFilter}
              onSelectApplication={setSelectedApplication}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>

          <TabsContent value="rejected">
            <ApplicationsTable
              applications={filterApplications(rejectedApplications)}
              searchQuery={searchQuery}
              countryFilter={countryFilter}
              onSelectApplication={setSelectedApplication}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      {selectedApplication && (
        <ApplicationDetailsDialog
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
        />
      )}
    </div>
  );
}

function ApplicationDetailsDialog({
  application,
  onClose,
}: {
  application: MembershipApplication;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const roles = application.roles as any;
  
  const updateStatusMutation = useMutation({
    mutationFn: async (status: "approved" | "rejected") => {
      const response = await apiRequest(
        "PATCH",
        `/api/membership-applications/${application.id}`,
        { status }
      );
      return await response.json();
    },
    onSuccess: (_, status) => {
      // Invalidate both membership applications and admin dashboard queries
      queryClient.invalidateQueries({ queryKey: ["/api/membership-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: `Application ${status === "approved" ? "approved" : "rejected"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to update application";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4">
            <span>{application.fullName}</span>
            {getStatusBadge(application.status)}
          </DialogTitle>
          <DialogDescription>
            Submitted on {format(new Date(application.createdAt), "MMMM dd, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{application.email}</span>
              </div>
              {application.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{application.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {application.city ? `${application.city}, ` : ""}{application.country}
                </span>
              </div>
            </div>
          </div>

          {application.headline && (
            <div>
              <h3 className="font-semibold mb-2">Headline</h3>
              <p className="text-sm text-muted-foreground">{application.headline}</p>
            </div>
          )}

          {application.bio && (
            <div>
              <h3 className="font-semibold mb-2">Bio</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{application.bio}</p>
            </div>
          )}

          {application.languages && application.languages.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {application.languages.map((lang, index) => (
                  <Badge key={index} variant="outline">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {roles && (
            <div>
              <h3 className="font-semibold mb-2">Selected Roles</h3>
              <div className="flex flex-wrap gap-2">
                {roles.professional && <Badge variant="outline"><Briefcase className="w-3 h-3 mr-1" /> Professional</Badge>}
                {roles.jobSeeker && <Badge variant="outline"><Search className="w-3 h-3 mr-1" /> Job Seeker</Badge>}
                {roles.employer && <Badge variant="outline">Employer</Badge>}
                {roles.businessOwner && <Badge variant="outline">Business Owner</Badge>}
                {roles.investor && <Badge variant="outline">Investor</Badge>}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Links</h3>
            <div className="space-y-2">
              {application.linkedinUrl && (
                <a
                  href={application.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  LinkedIn Profile
                </a>
              )}
              {application.websiteUrl && (
                <a
                  href={application.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Website
                </a>
              )}
              {application.portfolioUrl && (
                <a
                  href={application.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Portfolio
                </a>
              )}
            </div>
          </div>
        </div>
        
        {application.status === "pending" && (
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => updateStatusMutation.mutate("rejected")}
              disabled={updateStatusMutation.isPending}
              data-testid="button-reject-application"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              variant="default"
              onClick={() => updateStatusMutation.mutate("approved")}
              disabled={updateStatusMutation.isPending}
              data-testid="button-approve-application"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
