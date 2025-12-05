import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Briefcase,
  Search,
  Building2,
  Handshake,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Video,
  Plus,
  Pencil,
  Trash2,
  Star,
  Download,
  Globe,
  MoreHorizontal,
  ChevronRight,
  Image,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  ArrowRight,
  LayoutDashboard,
  Database,
  FileText,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { auth } from "@/lib/firebase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import type { Opportunity, Country } from "@shared/schema";

interface UserData {
  uid: string;
  name: string;
  email: string;
  status: string;
  createdAt: Date;
  roles?: {
    isProfessional?: boolean;
    isJobSeeker?: boolean;
    isEmployer?: boolean;
    isBusinessOwner?: boolean;
    isInvestor?: boolean;
    isAdmin?: boolean;
  };
  profile?: {
    country?: string;
    city?: string;
    headline?: string;
  };
}

interface Stats {
  totalUsers: number;
  professionals: number;
  jobSeekers: number;
  employers: number;
  businessOwners: number;
  investors: number;
  admins: number;
}


const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function AdminDashboard() {
  const { currentUser, userData } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [statusTab, setStatusTab] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadCountry, setDownloadCountry] = useState<string>("all");

  const { data: opportunities = [], isLoading: opportunitiesLoading } = useQuery<Opportunity[]>({
    queryKey: ['/api/opportunities'],
    enabled: !!currentUser && !!userData?.roles?.admin,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!currentUser && !!userData?.roles?.admin,
  });

  const { data: stats = null, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!currentUser && !!userData?.roles?.admin,
  });

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/locations/countries"],
  });

  const loading = usersLoading || statsLoading;

  const bulkApproveUsersMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      await Promise.all(
        userIds.map((userId) =>
          apiRequest("POST", `/api/admin/users/${userId}/status`, { status: "approved" })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedUsers(new Set());
      toast({
        title: "Success",
        description: `${selectedUsers.size} user(s) approved successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve selected users",
        variant: "destructive",
      });
    },
  });

  const bulkRejectUsersMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      await Promise.all(
        userIds.map((userId) =>
          apiRequest("POST", `/api/admin/users/${userId}/status`, { status: "rejected" })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedUsers(new Set());
      toast({
        title: "Success",
        description: `${selectedUsers.size} user(s) rejected successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject selected users",
        variant: "destructive",
      });
    },
  });

  const handleBulkApprove = () => {
    if (selectedUsers.size === 0) return;
    bulkApproveUsersMutation.mutate(Array.from(selectedUsers));
  };

  const handleBulkReject = () => {
    if (selectedUsers.size === 0) return;
    bulkRejectUsersMutation.mutate(Array.from(selectedUsers));
  };

  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);

  const getCountryDisplayName = (countryName: string) => {
    const country = countries.find(c => c.name === countryName);
    return country?.displayName || countryName;
  };

  const handleDownloadCSV = async (selectedCountry: string) => {
    try {
      setIsDownloadingCSV(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("No auth token");
      }
      const queryParams = new URLSearchParams();
      if (selectedCountry !== "all") {
        queryParams.set("country", selectedCountry);
      }
      const url = `/api/admin/users/download-csv${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to download");
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const countryName = selectedCountry !== "all" ? getCountryDisplayName(selectedCountry) : "";
      const countryLabel = countryName ? `-${countryName.replace(/\s+/g, "-")}` : "";
      a.download = `users-export${countryLabel}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      setDownloadDialogOpen(false);
      toast({
        title: "Success",
        description: `User data exported successfully${countryName ? ` (${countryName})` : " (All Countries)"}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export user data",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  const pendingUsers = users.filter((u) => u.status === "pending");
  const approvedUsers = users.filter((u) => u.status === "approved");
  const rejectedUsers = users.filter((u) => u.status === "rejected");

  const filterUsers = (userList: UserData[]) => {
    let filtered = userList;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
      );
    }
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => {
        switch (roleFilter) {
          case "professional":
            return u.roles?.isProfessional;
          case "jobSeeker":
            return u.roles?.isJobSeeker;
          case "employer":
            return u.roles?.isEmployer;
          case "businessOwner":
            return u.roles?.isBusinessOwner;
          case "investor":
            return u.roles?.isInvestor;
          case "admin":
            return u.roles?.isAdmin;
          default:
            return true;
        }
      });
    }
    if (countryFilter !== "all") {
      filtered = filtered.filter((u) => {
        const userCountry = u.profile?.country;
        return userCountry && userCountry === countryFilter;
      });
    }
    return filtered;
  };

  const handleUpdateRoles = async (userId: string, roles: any) => {
    try {
      await apiRequest("POST", `/api/admin/users/${userId}/roles`, { roles });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User roles updated successfully",
      });
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user roles",
        variant: "destructive",
      });
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAllUsers = (userList: UserData[], selectAll: boolean) => {
    if (selectAll) {
      setSelectedUsers(new Set(userList.map((u) => u.uid)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const roleChartData = stats ? [
    { name: "Professionals", value: stats.professionals, fill: CHART_COLORS[0] },
    { name: "Job Seekers", value: stats.jobSeekers, fill: CHART_COLORS[1] },
    { name: "Employers", value: stats.employers, fill: CHART_COLORS[2] },
    { name: "Business Owners", value: stats.businessOwners, fill: CHART_COLORS[3] },
    { name: "Investors", value: stats.investors, fill: CHART_COLORS[4] },
  ].filter(d => d.value > 0) : [];

  const statusChartData = [
    { name: "Approved", value: approvedUsers.length, fill: "hsl(142 76% 36%)" },
    { name: "Pending", value: pendingUsers.length, fill: "hsl(48 96% 53%)" },
    { name: "Rejected", value: rejectedUsers.length, fill: "hsl(0 84% 60%)" },
  ];

  const chartConfig = {
    professionals: { label: "Professionals", color: CHART_COLORS[0] },
    jobSeekers: { label: "Job Seekers", color: CHART_COLORS[1] },
    employers: { label: "Employers", color: CHART_COLORS[2] },
    businessOwners: { label: "Business Owners", color: CHART_COLORS[3] },
    investors: { label: "Investors", color: CHART_COLORS[4] },
  };

  const pagesManagementCards = [
    { title: "Leadership", description: "Team members shown on site", icon: Users, path: "/admin/leadership", color: "text-blue-500" },
    { title: "Gallery", description: "Event images & media", icon: Image, path: "/admin/gallery", color: "text-purple-500" },
    { title: "Media", description: "Videos & YouTube content", icon: Video, path: "/admin/media", color: "text-pink-500" },
    { title: "Locations", description: "Countries & cities data", icon: Globe, path: "/admin/locations", color: "text-cyan-500" },
  ];

  const dataSourceCards = [
    { title: "Applications", description: "Member registrations", icon: UserCheck, path: "/admin/membership", color: "text-orange-500" },
    { title: "Opportunities", description: "Job listings & postings", icon: Briefcase, path: "/admin/opportunities", color: "text-green-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage users, content, and platform settings</p>
            </div>
          </div>
        </div>

        {/* Hero Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="relative overflow-visible" data-testid="stat-total-users">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  {loading ? (
                    <div className="h-9 w-16 bg-muted animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-3xl font-bold mt-1">{stats?.totalUsers ?? 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {loading ? "..." : `${approvedUsers.length} approved`}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-500/20">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-visible" data-testid="stat-opportunities">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Opportunities</p>
                  {opportunitiesLoading ? (
                    <div className="h-9 w-16 bg-muted animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-3xl font-bold mt-1">{opportunities.length}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Active listings
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10 dark:bg-green-500/20">
                  <Briefcase className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-visible" data-testid="stat-applications">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Applications</p>
                  {loading ? (
                    <div className="h-9 w-16 bg-muted animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-3xl font-bold mt-1">{stats?.totalApplications ?? 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Member Regitrations</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 dark:bg-purple-500/20">
                  <FileText className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card data-testid="chart-user-status">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <div>
                <CardTitle className="text-base font-semibold">User Status</CardTitle>
                <CardDescription>Approval breakdown</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[220px] flex items-center justify-center">
                  <div className="w-full space-y-3">
                    <div className="h-6 w-full bg-muted animate-pulse rounded" />
                    <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-6 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusChartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
                    {statusChartData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-sm font-medium">{item.value}</span>
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="chart-user-roles">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <div>
                <CardTitle className="text-base font-semibold">User Roles</CardTitle>
                <CardDescription>Distribution by role type</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[220px] flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-muted animate-pulse" />
                </div>
              ) : roleChartData.length > 0 ? (
                <>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={roleChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={2}
                          stroke="hsl(var(--background))"
                        >
                          {roleChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-popover border rounded-lg shadow-lg px-3 py-2" data-testid="tooltip-role-chart">
                                  <p className="text-sm font-medium">{data.name}</p>
                                  <p className="text-sm text-muted-foreground">{data.value} users</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 pt-4 border-t">
                    {roleChartData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  No role data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Content Management */}
          <Card data-testid="section-content-management">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Content Management</CardTitle>
                  <CardDescription>For controlling public-facing site content</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {pagesManagementCards.map((card) => (
                <div
                  key={card.title}
                  className="flex items-center gap-4 p-3 rounded-lg hover-elevate cursor-pointer group"
                  onClick={() => setLocation(card.path)}
                  data-testid={`card-pages-${card.title.toLowerCase()}`}
                >
                  <div className={`p-2.5 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{card.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card data-testid="section-data-management">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Data Management</CardTitle>
                  <CardDescription>For managing application data and backend datasets</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {dataSourceCards.map((card) => (
                <div
                  key={card.title}
                  className="flex items-center gap-4 p-3 rounded-lg hover-elevate cursor-pointer group"
                  onClick={() => setLocation(card.path)}
                  data-testid={`card-data-${card.title.toLowerCase()}`}
                >
                  <div className={`p-2.5 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{card.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3 items-center flex-wrap">
                    <div className="relative w-[180px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                        data-testid="input-search-users"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[130px]" data-testid="select-role-filter">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="jobSeeker">Job Seeker</SelectItem>
                        <SelectItem value="employer">Employer</SelectItem>
                        <SelectItem value="businessOwner">Business Owner</SelectItem>
                        <SelectItem value="investor">Investor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={countryFilter} onValueChange={setCountryFilter}>
                      <SelectTrigger className="w-[140px]" data-testid="select-country-filter">
                        <SelectValue placeholder="All Countries" />
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
                    <div className="flex gap-2 items-center ml-auto">
                      {selectedUsers.size > 0 && (
                        <>
                          <span className="text-sm text-muted-foreground flex items-center">
                            {selectedUsers.size} selected
                          </span>
                          {(() => {
                            const selectedUsersList = users.filter(u => selectedUsers.has(u.uid));
                            const allApproved = selectedUsersList.every(u => u.status === "approved");
                            const allRejected = selectedUsersList.every(u => u.status === "rejected");
                            return (
                              <>
                                {!allApproved && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkApprove}
                                    disabled={bulkApproveUsersMutation.isPending}
                                    data-testid="button-bulk-approve"
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                                    Approve Selected
                                  </Button>
                                )}
                                {!allRejected && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkReject}
                                    disabled={bulkRejectUsersMutation.isPending}
                                    className="text-destructive"
                                    data-testid="button-bulk-reject"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject Selected
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDownloadDialogOpen(true)}
                            disabled={isDownloadingCSV}
                            data-testid="button-open-download-dialog"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Export to CSV</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs value={statusTab} onValueChange={setStatusTab}>
                  <TabsList className="mb-4" data-testid="tabs-user-status">
                    <TabsTrigger value="all" data-testid="tab-all-users">
                      All ({users.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending" data-testid="tab-pending-users">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      Pending ({pendingUsers.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved" data-testid="tab-approved-users">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approved ({approvedUsers.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" data-testid="tab-rejected-users">
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Rejected ({rejectedUsers.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    {filterUsers(users).length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        {searchQuery || roleFilter !== "all" || countryFilter !== "all" ? "No users found" : "No users yet"}
                      </div>
                    ) : (
                      <UsersTable
                        users={filterUsers(users)}
                        onUserClick={setSelectedUser}
                        selectedUsers={selectedUsers}
                        onSelectUser={handleSelectUser}
                        onSelectAll={(selectAll) => handleSelectAllUsers(filterUsers(users), selectAll)}
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="pending">
                    {filterUsers(pendingUsers).length === 0 ? (
                      <div className="py-12 text-center">
                        <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {searchQuery || roleFilter !== "all" || countryFilter !== "all" ? "No users found" : "No pending users"}
                        </p>
                      </div>
                    ) : (
                      <UsersTable
                        users={filterUsers(pendingUsers)}
                        onUserClick={setSelectedUser}
                        selectedUsers={selectedUsers}
                        onSelectUser={handleSelectUser}
                        onSelectAll={(selectAll) => handleSelectAllUsers(filterUsers(pendingUsers), selectAll)}
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="approved">
                    {filterUsers(approvedUsers).length === 0 ? (
                      <div className="py-12 text-center">
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {searchQuery || roleFilter !== "all" || countryFilter !== "all" ? "No users found" : "No approved users"}
                        </p>
                      </div>
                    ) : (
                      <UsersTable
                        users={filterUsers(approvedUsers)}
                        onUserClick={setSelectedUser}
                        selectedUsers={selectedUsers}
                        onSelectUser={handleSelectUser}
                        onSelectAll={(selectAll) => handleSelectAllUsers(filterUsers(approvedUsers), selectAll)}
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="rejected">
                    {filterUsers(rejectedUsers).length === 0 ? (
                      <div className="py-12 text-center">
                        <XCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {searchQuery || roleFilter !== "all" || countryFilter !== "all" ? "No users found" : "No rejected users"}
                        </p>
                      </div>
                    ) : (
                      <UsersTable
                        users={filterUsers(rejectedUsers)}
                        onUserClick={setSelectedUser}
                        selectedUsers={selectedUsers}
                        onSelectUser={handleSelectUser}
                        onSelectAll={(selectAll) => handleSelectAllUsers(filterUsers(rejectedUsers), selectAll)}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      {selectedUser && (
        <UserManagementDialog
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdateRoles={(roles) => handleUpdateRoles(selectedUser.uid, roles)}
        />
      )}
      <Dialog open={downloadDialogOpen} onOpenChange={(open) => {
        setDownloadDialogOpen(open);
        if (!open) setDownloadCountry("all");
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download Users CSV</DialogTitle>
            <DialogDescription>Select a country to filter the export, or download all users.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label htmlFor="download-country">Country</Label>
            <Select value={downloadCountry} onValueChange={setDownloadCountry}>
              <SelectTrigger id="download-country" data-testid="select-download-country">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.name}>
                    {country.displayName ?? country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDownloadDialogOpen(false)} data-testid="button-cancel-download">
              Cancel
            </Button>
            <Button
              onClick={() => handleDownloadCSV(downloadCountry)}
              disabled={isDownloadingCSV}
              data-testid="button-confirm-download"
            >
              {isDownloadingCSV ? "Downloading..." : "Download"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UsersTable({
  users,
  onUserClick,
  selectedUsers,
  onSelectUser,
  onSelectAll,
}: {
  users: UserData[];
  onUserClick: (user: UserData) => void;
  selectedUsers: Set<string>;
  onSelectUser: (userId: string) => void;
  onSelectAll: (selectAll: boolean) => void;
}) {
  const allSelected = users.length > 0 && users.every((u) => selectedUsers.has(u.uid));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="p-3 w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(checked === true)}
                data-testid="checkbox-select-all-users"
                aria-label="Select all users"
              />
            </th>
            <th className="text-left p-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">User</th>
            <th className="text-left p-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Status</th>
            <th className="text-left p-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Roles</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.uid}
              onClick={() => onUserClick(user)}
              className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onUserClick(user);
                }
              }}
              data-testid={`row-user-${user.uid}`}
            >
              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedUsers.has(user.uid)}
                  onCheckedChange={() => onSelectUser(user.uid)}
                  data-testid={`checkbox-user-${user.uid}`}
                  aria-label={`Select ${user.name}`}
                />
              </td>
              <td className="p-3">
                <div>
                  <div className="font-medium text-sm" data-testid={`text-user-name-${user.uid}`}>
                    {user.name}
                  </div>
                  <div className="text-xs text-muted-foreground" data-testid={`text-user-email-${user.uid}`}>
                    {user.email}
                  </div>
                </div>
              </td>
              <td className="p-3">
                <div data-testid={`badge-user-status-${user.uid}`}>
                  {getStatusBadge(user.status)}
                </div>
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  {user.roles?.isProfessional && (
                    <Badge variant="outline" className="text-xs">Pro</Badge>
                  )}
                  {user.roles?.isJobSeeker && (
                    <Badge variant="outline" className="text-xs">Seeker</Badge>
                  )}
                  {user.roles?.isEmployer && (
                    <Badge variant="outline" className="text-xs">Employer</Badge>
                  )}
                  {user.roles?.isBusinessOwner && (
                    <Badge variant="outline" className="text-xs">Business</Badge>
                  )}
                  {user.roles?.isInvestor && (
                    <Badge variant="outline" className="text-xs">Investor</Badge>
                  )}
                  {user.roles?.isAdmin && (
                    <Badge className="text-xs bg-primary">Admin</Badge>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserManagementDialog({
  user,
  onClose,
  onUpdateRoles,
}: {
  user: UserData;
  onClose: () => void;
  onUpdateRoles: (roles: any) => void;
}) {
  const { toast } = useToast();
  const [roles, setRoles] = useState({
    professional: user.roles?.isProfessional || false,
    jobSeeker: user.roles?.isJobSeeker || false,
    employer: user.roles?.isEmployer || false,
    businessOwner: user.roles?.isBusinessOwner || false,
    investor: user.roles?.isInvestor || false,
    admin: user.roles?.isAdmin || false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: "approved" | "rejected") => {
      const response = await apiRequest(
        "POST",
        `/api/admin/users/${user.uid}/status`,
        { status }
      );
      return await response.json();
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: `User ${status === "approved" ? "approved" : "rejected"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to update user status";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="dialog-user-management">
        <DialogHeader>
          <DialogTitle>Manage User</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1 mt-2">
              <div className="font-medium text-foreground">{user.name}</div>
              <div className="text-sm">{user.email}</div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Profile</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2.5 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground mb-0.5">Country</p>
                <p className="font-medium">{user.profile?.country || "—"}</p>
              </div>
              <div className="p-2.5 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground mb-0.5">City</p>
                <p className="font-medium">{user.profile?.city || "—"}</p>
              </div>
              <div className="col-span-2 p-2.5 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground mb-0.5">Headline</p>
                <p className="font-medium">{user.profile?.headline || "—"}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Roles</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "professional", label: "Professional", icon: Briefcase },
                { id: "jobSeeker", label: "Job Seeker", icon: Search },
                { id: "employer", label: "Employer", icon: Building2 },
                { id: "businessOwner", label: "Business Owner", icon: Handshake },
                { id: "investor", label: "Investor", icon: TrendingUp },
                { id: "admin", label: "Admin", icon: Shield },
              ].map(({ id, label, icon: Icon }) => (
                <div key={id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                  <Checkbox
                    id={id}
                    checked={roles[id as keyof typeof roles]}
                    onCheckedChange={(checked) =>
                      setRoles({ ...roles, [id]: checked as boolean })
                    }
                    data-testid={`checkbox-role-${id.toLowerCase()}`}
                  />
                  <Label htmlFor={id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            {user.status === "pending" && (
              <>
                <Button
                  onClick={() => updateStatusMutation.mutate("approved")}
                  disabled={updateStatusMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                  data-testid="button-approve-user"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  onClick={() => updateStatusMutation.mutate("rejected")}
                  disabled={updateStatusMutation.isPending}
                  variant="destructive"
                  size="sm"
                  data-testid="button-reject-user"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {user.status === "rejected" && (
              <Button
                onClick={() => updateStatusMutation.mutate("approved")}
                disabled={updateStatusMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
                data-testid="button-approve-user"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Approve
              </Button>
            )}
            {user.status === "approved" && (
              <Button
                onClick={() => updateStatusMutation.mutate("rejected")}
                disabled={updateStatusMutation.isPending}
                variant="destructive"
                size="sm"
                data-testid="button-reject-user"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" size="sm" data-testid="button-cancel-user">
              Cancel
            </Button>
            <Button onClick={() => onUpdateRoles(roles)} size="sm" data-testid="button-save-roles">
              Save Roles
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function extractYouTubeId(input: string): string {
  const trimmed = input.trim();
  
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return trimmed;
}

function generateYouTubeThumbnail(videoId: string): string {
  if (!videoId || videoId.length !== 11) return "";
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

function VideoFormDialog({
  open,
  onClose,
  video,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  video: VideoType | null;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<VideoFormData>({
    title: video?.title || "",
    description: video?.description || "",
    youtubeId: video?.youtubeId || "",
    thumbnailUrl: video?.thumbnailUrl || "",
    publishedAt: video?.publishedAt 
      ? (typeof video.publishedAt === 'string' ? video.publishedAt : new Date(video.publishedAt).toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0],
    featured: video?.featured || false,
    visible: video?.visible ?? true,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        title: video?.title || "",
        description: video?.description || "",
        youtubeId: video?.youtubeId || "",
        thumbnailUrl: video?.thumbnailUrl || "",
        publishedAt: video?.publishedAt 
          ? (typeof video.publishedAt === 'string' ? video.publishedAt : new Date(video.publishedAt).toISOString().split('T')[0])
          : new Date().toISOString().split('T')[0],
        featured: video?.featured || false,
        visible: video?.visible ?? true,
      });
    }
  }, [open, video]);

  const createVideoMutation = useMutation({
    mutationFn: async (data: VideoFormData) => {
      const payload = {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
      };
      return apiRequest('POST', '/api/videos', payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video added successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add video",
        variant: "destructive",
      });
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: async (data: VideoFormData) => {
      const payload = {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
      };
      return apiRequest('PATCH', `/api/videos/${video?.id}`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video updated successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update video",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (video) {
      updateVideoMutation.mutate(formData);
    } else {
      createVideoMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="dialog-video-form">
        <DialogHeader>
          <DialogTitle>{video ? "Edit Video" : "Add Video"}</DialogTitle>
          <DialogDescription>
            {video ? "Update video details" : "Add a new video to the library"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              data-testid="input-video-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              data-testid="input-video-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtubeId">YouTube URL or ID</Label>
            <Input
              id="youtubeId"
              value={formData.youtubeId}
              onChange={(e) => {
                const extractedId = extractYouTubeId(e.target.value);
                const autoThumbnail = generateYouTubeThumbnail(extractedId);
                setFormData({ 
                  ...formData, 
                  youtubeId: extractedId,
                  thumbnailUrl: autoThumbnail || formData.thumbnailUrl
                });
              }}
              placeholder="Paste URL or video ID"
              required
              data-testid="input-video-youtubeid"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
            <Input
              id="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              placeholder="Auto-generated from YouTube"
              data-testid="input-video-thumbnail"
            />
            {formData.thumbnailUrl && (
              <div className="mt-2 border rounded-md overflow-hidden aspect-video">
                <img 
                  src={formData.thumbnailUrl} 
                  alt="Thumbnail preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="publishedAt">Publish Date</Label>
            <Input
              id="publishedAt"
              type="date"
              value={formData.publishedAt}
              onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
              data-testid="input-video-publishedat"
            />
          </div>

          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="visible"
                checked={formData.visible}
                onCheckedChange={(checked) => setFormData({ ...formData, visible: checked })}
                data-testid="switch-video-visible"
              />
              <Label htmlFor="visible" className="cursor-pointer text-sm">Visible</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                data-testid="switch-video-featured"
              />
              <Label htmlFor="featured" className="cursor-pointer text-sm">Featured</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-video">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createVideoMutation.isPending || updateVideoMutation.isPending}
              data-testid="button-save-video"
            >
              {createVideoMutation.isPending || updateVideoMutation.isPending ? "Saving..." : video ? "Update" : "Add Video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteVideoDialog({
  videoId,
  onClose,
  onSuccess,
}: {
  videoId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/videos/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (videoId) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  return (
    <Dialog open={!!videoId} onOpenChange={onClose}>
      <DialogContent className="max-w-sm" data-testid="dialog-delete-video">
        <DialogHeader>
          <DialogTitle>Delete Video</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-delete">
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteVideoMutation.isPending}
            data-testid="button-confirm-delete"
          >
            {deleteVideoMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
