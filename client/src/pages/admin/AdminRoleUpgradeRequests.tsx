import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  FileText,
  ExternalLink,
  User,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Shield,
  Building,
  Globe,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RoleUpgradeRequest } from "@shared/schema";
import { format, isValid } from "date-fns";
import { auth } from "@/lib/firebase";

function safeFormatDate(dateValue: string | Date | null | undefined, formatString: string): string | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (!isValid(date)) return null;
  return format(date, formatString);
}

const ROLE_LABELS: Record<string, string> = {
  professional: "Professional",
  jobSeeker: "Job Seeker",
  employer: "Employer",
  businessOwner: "Business Owner",
  investor: "Investor",
  admin: "Admin",
};

interface UserDetails {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    approvalStatus: string;
    createdAt: string;
    profile?: {
      fullName?: string;
      country?: string;
      city?: string;
      phone?: string;
      headline?: string;
      bio?: string;
      linkedinUrl?: string;
    };
  };
  roles: {
    professional: boolean;
    jobSeeker: boolean;
    employer: boolean;
    businessOwner: boolean;
    investor: boolean;
    admin: boolean;
  } | null;
}

export default function AdminRoleUpgradeRequests() {
  const { currentUser, userData } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<RoleUpgradeRequest | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [userPreviewOpen, setUserPreviewOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery<RoleUpgradeRequest[]>({
    queryKey: ["/api/admin/role-upgrade-requests"],
    enabled: !!currentUser && !!userData?.roles?.admin,
  });

  const { data: allUsers = [] } = useQuery<Array<{ uid: string; email: string; displayName?: string; profile?: { fullName?: string } }>>({
    queryKey: ["/api/admin/users"],
    enabled: !!currentUser && !!userData?.roles?.admin,
  });

  const { data: userDetails, isLoading: userDetailsLoading } = useQuery<UserDetails>({
    queryKey: ["/api/admin/users", selectedUserId],
    enabled: !!selectedUserId && userPreviewOpen,
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/users/${selectedUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch user details");
      return response.json();
    },
  });

  const getUserDisplayName = (userId: string) => {
    const user = allUsers.find(u => u.uid === userId);
    if (user?.profile?.fullName) return user.profile.fullName;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return userId.substring(0, 8) + "...";
  };

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/role-upgrade-requests/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-upgrade-requests"] });
      toast({
        title: "Request Approved",
        description: "The role upgrade request has been approved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return apiRequest("POST", `/api/admin/role-upgrade-requests/${id}/reject`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-upgrade-requests"] });
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectNotes("");
      toast({
        title: "Request Rejected",
        description: "The role upgrade request has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (request: RoleUpgradeRequest) => {
    approveMutation.mutate(request.id);
  };

  const handleOpenRejectDialog = (request: RoleUpgradeRequest) => {
    setSelectedRequest(request);
    setRejectNotes("");
    setIsRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    rejectMutation.mutate({ id: selectedRequest.id, notes: rejectNotes });
  };

  const handleOpenUserPreview = (userId: string) => {
    setSelectedUserId(userId);
    setUserPreviewOpen(true);
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getActiveRoles = (roles: UserDetails["roles"]) => {
    if (!roles) return [];
    return Object.entries(roles)
      .filter(([_, active]) => active)
      .map(([role]) => ROLE_LABELS[role] || role);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  if (!currentUser || !userData?.roles?.admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const RequestCard = ({ request }: { request: RoleUpgradeRequest }) => (
    <Card key={request.id} data-testid={`request-card-${request.id}`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                className="flex items-center font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                onClick={() => handleOpenUserPreview(request.userId)}
                data-testid={`button-user-preview-${request.id}`}
              >
                <User className="h-4 w-4 mr-1" />
                {getUserDisplayName(request.userId)}
              </button>
              {getStatusBadge(request.status)}
            </div>
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <span>Requested Role: </span>
              <Badge>{ROLE_LABELS[request.requestedRole] || request.requestedRole}</Badge>
            </div>
            {request.proofDescription && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm text-muted-foreground">{request.proofDescription}</span>
              </div>
            )}
            {request.proofUrl && (
              <a
                href={request.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
                data-testid={`link-proof-${request.id}`}
              >
                <ExternalLink className="h-3 w-3" />
                View Proof Document
              </a>
            )}
            <p className="text-xs text-muted-foreground">
              Submitted: {safeFormatDate(request.createdAt, "PPp") || "Unknown"}
            </p>
            {request.reviewedAt && safeFormatDate(request.reviewedAt, "PPp") && (
              <p className="text-xs text-muted-foreground">
                Reviewed: {safeFormatDate(request.reviewedAt, "PPp")}
              </p>
            )}
            {request.adminNotes && (
              <div className="bg-muted p-2 rounded-md mt-2">
                <p className="text-sm font-medium">Admin Notes:</p>
                <p className="text-sm text-muted-foreground">{request.adminNotes}</p>
              </div>
            )}
          </div>
          {request.status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleApprove(request)}
                disabled={approveMutation.isPending}
                data-testid={`button-approve-${request.id}`}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleOpenRejectDialog(request)}
                data-testid={`button-reject-${request.id}`}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Role Upgrade Requests</h1>
            <p className="text-muted-foreground">Review and manage user role upgrade requests</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-pending-count">{pendingRequests.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-approved-count">{approvedRequests.length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-rejected-count">{rejectedRequests.length}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No pending requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approvedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No approved requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {approvedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {rejectedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No rejected requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rejectedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Request</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting this role upgrade request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectNotes">Rejection Notes (Optional)</Label>
                <Textarea
                  id="rejectNotes"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  data-testid="textarea-reject-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} data-testid="button-cancel-reject">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                data-testid="button-confirm-reject"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={userPreviewOpen} onOpenChange={setUserPreviewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Details
              </DialogTitle>
              <DialogDescription>
                Complete profile information for this user
              </DialogDescription>
            </DialogHeader>
            
            {userDetailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : userDetails ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getInitials(userDetails.user.profile?.fullName || userDetails.user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {userDetails.user.profile?.fullName || userDetails.user.displayName || "Unknown User"}
                    </h3>
                    <p className="text-sm text-muted-foreground">{userDetails.user.email}</p>
                    <Badge 
                      variant="outline" 
                      className={
                        userDetails.user.approvalStatus === "approved" 
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400"
                          : userDetails.user.approvalStatus === "rejected"
                          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
                      }
                    >
                      {userDetails.user.approvalStatus}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  {userDetails.user.profile?.headline && (
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm font-medium">Headline</p>
                        <p className="text-sm text-muted-foreground">{userDetails.user.profile.headline}</p>
                      </div>
                    </div>
                  )}

                  {(userDetails.user.profile?.country || userDetails.user.profile?.city) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">
                          {[userDetails.user.profile.city, userDetails.user.profile.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {userDetails.user.profile?.phone && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{userDetails.user.profile.phone}</p>
                      </div>
                    </div>
                  )}

                  {userDetails.user.profile?.linkedinUrl && (
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm font-medium">LinkedIn</p>
                        <a 
                          href={userDetails.user.profile.linkedinUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Profile
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(userDetails.user.createdAt), "PPP")}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Active Roles</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getActiveRoles(userDetails.roles).length > 0 ? (
                      getActiveRoles(userDetails.roles).map((role) => (
                        <Badge key={role} variant="secondary">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No active roles</p>
                    )}
                  </div>
                </div>

                {userDetails.user.profile?.bio && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-1">Bio</p>
                      <p className="text-sm text-muted-foreground">{userDetails.user.profile.bio}</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Failed to load user details</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setUserPreviewOpen(false)} data-testid="button-close-preview">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
