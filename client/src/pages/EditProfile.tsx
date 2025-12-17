import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Briefcase, Search, Building2, Handshake, TrendingUp, Save, Loader2, Clock, CheckCircle2, XCircle, Upload, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Country, City, RoleUpgradeRequest } from "@shared/schema";

const roles = [
  {
    id: "professional",
    icon: Briefcase,
    title: "Professional",
    description: "Network, showcase skills, and gain career visibility",
  },
  {
    id: "jobSeeker",
    icon: Search,
    title: "Job Seeker",
    description: "Actively looking for jobs locally or internationally",
  },
  {
    id: "employer",
    icon: Building2,
    title: "Employer",
    description: "Post job openings and find qualified candidates",
  },
  {
    id: "businessOwner",
    icon: Handshake,
    title: "Business Owner",
    description: "Seek partnerships, expansion support, and investors",
  },
  {
    id: "investor",
    icon: TrendingUp,
    title: "Investor",
    description: "Invest in startups, SMEs, and market opportunities",
  },
];

function EditProfileContent() {
  const [, setLocation] = useLocation();
  const { currentUser, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Basic profile data
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    country: "",
    city: "",
    phoneCode: "",
    phone: "",
    languages: [] as string[],
    headline: "",
    bio: "",
    links: {
      linkedin: "",
      website: "",
      portfolio: "",
    },
  });

  // Fetch countries and cities from centralized API
  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/locations/countries"],
  });

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/locations/countries", profileData.country, "cities"],
    enabled: !!profileData.country,
  });

  // Roles
  const [selectedRoles, setSelectedRoles] = useState({
    professional: false,
    jobSeeker: false,
    employer: false,
    businessOwner: false,
    investor: false,
  });
  
  // Track admin status separately - this should never be modified by user
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Role upgrade request state
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestingRole, setRequestingRole] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofDescription, setProofDescription] = useState("");
  
  // Fetch user's existing role upgrade requests
  const { data: myRoleRequests = [] } = useQuery<RoleUpgradeRequest[]>({
    queryKey: ["/api/role-upgrade-requests"],
    enabled: !!currentUser,
  });
  
  // Mutation for creating role upgrade request
  const createRequestMutation = useMutation({
    mutationFn: async (data: { requestedRole: string; proofUrl?: string; proofDescription?: string }) => {
      return apiRequest("POST", "/api/role-upgrade-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-upgrade-requests"] });
      setIsRequestDialogOpen(false);
      setRequestingRole(null);
      setProofUrl("");
      setProofDescription("");
      toast({
        title: "Request Submitted",
        description: "Your role upgrade request has been submitted for admin review.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      });
    },
  });

  // Role-specific data - matching signup form fields
  const [professionalData, setProfessionalData] = useState({
    currentJobTitle: "",
    educationLevel: "",
    field: "",
    subField: "",
    experienceLevel: "",
    skills: [] as string[],
  });

  const [jobSeekerData, setJobSeekerData] = useState({
    educationLevel: "",
    field: "",
    subField: "",
    yearsOfExperience: "",
    skills: [] as string[],
  });

  const [employerData, setEmployerData] = useState({
    companyName: "",
    companyWebsite: "",
    companySize: "",
    field: "",
    jobPostingPermissions: false,
  });

  const [businessOwnerData, setBusinessOwnerData] = useState({
    businessName: "",
    businessDescription: "",
    businessSector: "",
    businessStage: "",
    investmentRequired: "",
    partnershipsNeeded: "",
  });

  const [investorData, setInvestorData] = useState({
    investmentSectors: [] as string[],
    investmentRange: "",
    preferredStage: "",
  });

  // Load user data from Firestore
  useEffect(() => {
    async function loadUserData() {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();

          // Load basic profile data
          setProfileData({
            name: data.name || "",
            email: data.email || currentUser.email || "",
            country: data.country || "",
            city: data.city || "",
            phoneCode: data.phoneCode || "",
            phone: data.phone || "",
            languages: data.languages || [],
            headline: data.headline || "",
            bio: data.bio || "",
            links: {
              linkedin: data.links?.linkedin || "",
              website: data.links?.website || "",
              portfolio: data.links?.portfolio || "",
            },
          });

          // Load roles
          if (data.roles) {
            // Check if user is admin - admin gets all roles automatically
            const userIsAdmin = data.roles.admin || data.roles.isAdmin || false;
            setIsAdmin(userIsAdmin);
            
            if (userIsAdmin) {
              // Admin users get all roles automatically
              setSelectedRoles({
                professional: true,
                jobSeeker: true,
                employer: true,
                businessOwner: true,
                investor: true,
              });
            } else {
              setSelectedRoles({
                professional: data.roles.professional || data.roles.isProfessional || false,
                jobSeeker: data.roles.jobSeeker || data.roles.isJobSeeker || false,
                employer: data.roles.employer || data.roles.isEmployer || false,
                businessOwner: data.roles.businessOwner || data.roles.isBusinessOwner || false,
                investor: data.roles.investor || data.roles.isInvestor || false,
              });
            }
          }

          // Load role-specific data - matching signup form fields
          if (data.professionalData) {
            setProfessionalData({
              currentJobTitle: data.professionalData.currentJobTitle || data.professionalData.title || "",
              educationLevel: data.professionalData.educationLevel || "",
              field: data.professionalData.field || "",
              subField: data.professionalData.subField || "",
              experienceLevel: data.professionalData.experienceLevel || data.professionalData.experience || "",
              skills: data.professionalData.skills || [],
            });
          }

          if (data.jobSeekerData) {
            setJobSeekerData({
              educationLevel: data.jobSeekerData.educationLevel || "",
              field: data.jobSeekerData.field || "",
              subField: data.jobSeekerData.subField || "",
              yearsOfExperience: data.jobSeekerData.yearsOfExperience || "",
              skills: data.jobSeekerData.skills || [],
            });
          }

          if (data.employerData) {
            setEmployerData({
              companyName: data.employerData.companyName || "",
              companyWebsite: data.employerData.companyWebsite || data.employerData.website || "",
              companySize: data.employerData.companySize || "",
              field: data.employerData.field || data.employerData.industry || "",
              jobPostingPermissions: data.employerData.jobPostingPermissions || false,
            });
          }

          if (data.businessOwnerData) {
            setBusinessOwnerData({
              businessName: data.businessOwnerData.businessName || "",
              businessDescription: data.businessOwnerData.businessDescription || "",
              businessSector: data.businessOwnerData.businessSector || data.businessOwnerData.industry || "",
              businessStage: data.businessOwnerData.businessStage || "",
              investmentRequired: data.businessOwnerData.investmentRequired || "",
              partnershipsNeeded: data.businessOwnerData.partnershipsNeeded || "",
            });
          }

          if (data.investorData) {
            setInvestorData({
              investmentSectors: data.investorData.investmentSectors || data.investorData.investmentFocus || [],
              investmentRange: data.investorData.investmentRange || "",
              preferredStage: data.investorData.preferredStage || "",
            });
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast({
          title: "Error",
          description: "Failed to load your profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [currentUser?.uid, toast]);

  const handleSave = async () => {
    if (!currentUser?.uid) return;

    try {
      setSaving(true);
      const userRef = doc(db, "users", currentUser.uid);

      // Note: Roles are NOT saved here. Role changes require admin approval via upgrade requests.
      // Only profile information and role-specific data is saved.
      await updateDoc(userRef, {
        name: profileData.name,
        country: profileData.country,
        city: profileData.city,
        languages: profileData.languages,
        headline: profileData.headline,
        bio: profileData.bio,
        links: profileData.links,
        professionalData,
        jobSeekerData,
        employerData,
        businessOwnerData,
        investorData,
        lastUpdated: new Date(),
      });

      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
      });

      // Refresh user data in AuthContext to update dashboards
      // Don't block navigation if refresh fails - the data is already saved
      try {
        await refreshUserData();
      } catch (refreshError) {
        console.error("Failed to refresh user data after profile update:", refreshError);
        // Continue anyway - the data is saved, dashboard will refresh on next load
      }

      setLocation("/dashboard");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
        <p className="text-muted-foreground">Update your information and settings</p>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic" data-testid="tab-basic">Basic Info</TabsTrigger>
          <TabsTrigger value="roles" data-testid="tab-roles">Roles</TabsTrigger>
          <TabsTrigger value="role-details" data-testid="tab-role-details">Role Details</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    data-testid="input-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    disabled
                    value={profileData.email}
                    data-testid="input-email"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    required
                    value={profileData.country}
                    onValueChange={(value) => setProfileData({ ...profileData, country: value, city: "" })}
                  >
                    <SelectTrigger id="country" data-testid="select-country">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Select
                    value={profileData.city}
                    onValueChange={(value) => setProfileData({ ...profileData, city: value })}
                  >
                    <SelectTrigger id="city" data-testid="select-city">
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneCode">Phone Code</Label>
                  <Select
                    value={profileData.phoneCode}
                    onValueChange={(value) => setProfileData({ ...profileData, phoneCode: value })}
                  >
                    <SelectTrigger id="phoneCode" data-testid="select-phone-code">
                      <SelectValue placeholder="Select code" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries
                        .filter((c) => c.phoneCode && c.phoneCode.trim())
                        .reduce((acc: { code: string }[], country) => {
                          const existing = acc.find((item) => item.code === country.phoneCode);
                          if (!existing && country.phoneCode) {
                            acc.push({ code: country.phoneCode });
                          }
                          return acc;
                        }, [])
                        .sort((a, b) => {
                          const aNum = parseInt(a.code.slice(1));
                          const bNum = parseInt(b.code.slice(1));
                          return aNum - bNum;
                        })
                        .map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            {item.code}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="1234567890"
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="languages">Languages (comma-separated)</Label>
                <Input
                  id="languages"
                  placeholder="English, Arabic, Urdu"
                  value={profileData.languages.join(", ")}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      languages: e.target.value.split(",").map((l) => l.trim()).filter((l) => l),
                    })
                  }
                  data-testid="input-languages"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Professional Headline</Label>
                <Input
                  id="headline"
                  placeholder="e.g., Senior Software Engineer | Tech Entrepreneur"
                  value={profileData.headline}
                  onChange={(e) => setProfileData({ ...profileData, headline: e.target.value })}
                  data-testid="input-headline"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Brief description about yourself..."
                  rows={4}
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  data-testid="input-bio"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/yourname"
                    value={profileData.links.linkedin}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        links: { ...profileData.links, linkedin: e.target.value },
                      })
                    }
                    data-testid="input-linkedin"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={profileData.links.website}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        links: { ...profileData.links, website: e.target.value },
                      })
                    }
                    data-testid="input-website"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio URL</Label>
                  <Input
                    id="portfolio"
                    type="url"
                    placeholder="https://portfolio.com"
                    value={profileData.links.portfolio}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        links: { ...profileData.links, portfolio: e.target.value },
                      })
                    }
                    data-testid="input-portfolio"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Current Roles</CardTitle>
              <CardDescription>
                {isAdmin 
                  ? "As an admin, you have access to all roles automatically" 
                  : "Your active roles are shown below. To add a new role, submit a request for admin approval."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAdmin && (
                <div className="mb-4 p-4 bg-primary/10 rounded-md border border-primary/20">
                  <p className="text-sm text-foreground">
                    <strong>Admin Access:</strong> You have full access to all roles and their features.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRoles[role.id as keyof typeof selectedRoles];
                  const pendingRequest = myRoleRequests.find(
                    (r) => r.requestedRole === role.id && r.status === "pending"
                  );

                  return (
                    <Card
                      key={role.id}
                      className={`transition-all border-2 ${
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : pendingRequest 
                            ? "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10"
                            : "border-border"
                      }`}
                      data-testid={`card-role-${role.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          {isSelected ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : pendingRequest ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          ) : null}
                        </div>
                        <h4 className="font-bold mb-2">{role.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                        
                        {!isAdmin && !isSelected && !pendingRequest && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setRequestingRole(role.id);
                              setIsRequestDialogOpen(true);
                            }}
                            data-testid={`button-request-${role.id}`}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Request This Role
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Pending Role Requests */}
          {myRoleRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Role Requests</CardTitle>
                <CardDescription>Track the status of your role upgrade requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myRoleRequests.map((request) => {
                    const roleInfo = roles.find((r) => r.id === request.requestedRole);
                    return (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                        data-testid={`request-item-${request.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{roleInfo?.title || request.requestedRole}</span>
                          {request.status === "pending" && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending Review
                            </Badge>
                          )}
                          {request.status === "approved" && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {request.status === "rejected" && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400">
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                        </div>
                        {request.adminNotes && (
                          <p className="text-sm text-muted-foreground">{request.adminNotes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Role Request Dialog */}
          <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Role Upgrade</DialogTitle>
                <DialogDescription>
                  Submit a request to add the "{roles.find((r) => r.id === requestingRole)?.title}" role to your profile.
                  An admin will review your request.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="proofDescription">Description</Label>
                  <Textarea
                    id="proofDescription"
                    value={proofDescription}
                    onChange={(e) => setProofDescription(e.target.value)}
                    placeholder="Briefly explain why you need this role and describe the uploaded document..."
                    data-testid="textarea-proof-description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)} data-testid="button-cancel-request">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (requestingRole) {
                      createRequestMutation.mutate({
                        requestedRole: requestingRole,
                        proofUrl: proofUrl || undefined,
                        proofDescription: proofDescription || undefined,
                      });
                    }
                  }}
                  disabled={createRequestMutation.isPending}
                  data-testid="button-submit-request"
                >
                  {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="role-details" className="space-y-6">
          {selectedRoles.professional && (
            <Card>
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
                <CardDescription>Information about your professional background</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prof-title">Current Job Title</Label>
                    <Input
                      id="prof-title"
                      placeholder="e.g., Senior Software Engineer"
                      value={professionalData.currentJobTitle}
                      onChange={(e) =>
                        setProfessionalData({ ...professionalData, currentJobTitle: e.target.value })
                      }
                      data-testid="input-prof-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prof-education">Education Level</Label>
                    <Select
                      value={professionalData.educationLevel}
                      onValueChange={(value) =>
                        setProfessionalData({ ...professionalData, educationLevel: value })
                      }
                    >
                      <SelectTrigger data-testid="select-prof-education">
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high_school">High School</SelectItem>
                        <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prof-field">Professional Field</Label>
                    <Input
                      id="prof-field"
                      placeholder="e.g., Engineering, Finance"
                      value={professionalData.field}
                      onChange={(e) =>
                        setProfessionalData({ ...professionalData, field: e.target.value })
                      }
                      data-testid="input-prof-field"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prof-subfield">Specialization</Label>
                    <Input
                      id="prof-subfield"
                      placeholder="e.g., Software Development"
                      value={professionalData.subField}
                      onChange={(e) =>
                        setProfessionalData({ ...professionalData, subField: e.target.value })
                      }
                      data-testid="input-prof-subfield"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prof-experience">Experience Level</Label>
                    <Select
                      value={professionalData.experienceLevel}
                      onValueChange={(value) =>
                        setProfessionalData({ ...professionalData, experienceLevel: value })
                      }
                    >
                      <SelectTrigger data-testid="select-prof-experience">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                        <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                        <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                        <SelectItem value="expert">Expert (10+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prof-skills">Skills (comma-separated)</Label>
                  <Input
                    id="prof-skills"
                    placeholder="React, Node.js, TypeScript"
                    value={professionalData.skills.join(", ")}
                    onChange={(e) =>
                      setProfessionalData({
                        ...professionalData,
                        skills: e.target.value.split(",").map((s) => s.trim()).filter((s) => s),
                      })
                    }
                    data-testid="input-prof-skills"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedRoles.jobSeeker && (
            <Card>
              <CardHeader>
                <CardTitle>Job Seeker Details</CardTitle>
                <CardDescription>Your qualifications and what you're looking for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-education">Education Level</Label>
                    <Select
                      value={jobSeekerData.educationLevel}
                      onValueChange={(value) =>
                        setJobSeekerData({ ...jobSeekerData, educationLevel: value })
                      }
                    >
                      <SelectTrigger data-testid="select-job-education">
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high_school">High School</SelectItem>
                        <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job-field">Professional Field</Label>
                    <Input
                      id="job-field"
                      placeholder="e.g., Engineering, Finance"
                      value={jobSeekerData.field}
                      onChange={(e) =>
                        setJobSeekerData({ ...jobSeekerData, field: e.target.value })
                      }
                      data-testid="input-job-field"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job-subfield">Specialization</Label>
                    <Input
                      id="job-subfield"
                      placeholder="e.g., Software Development"
                      value={jobSeekerData.subField}
                      onChange={(e) =>
                        setJobSeekerData({ ...jobSeekerData, subField: e.target.value })
                      }
                      data-testid="input-job-subfield"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job-experience">Years of Experience</Label>
                    <Select
                      value={jobSeekerData.yearsOfExperience}
                      onValueChange={(value) =>
                        setJobSeekerData({ ...jobSeekerData, yearsOfExperience: value })
                      }
                    >
                      <SelectTrigger data-testid="select-job-experience">
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-2">0-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job-skills">Skills (comma-separated)</Label>
                  <Input
                    id="job-skills"
                    placeholder="React, Node.js, TypeScript"
                    value={jobSeekerData.skills.join(", ")}
                    onChange={(e) =>
                      setJobSeekerData({
                        ...jobSeekerData,
                        skills: e.target.value.split(",").map((s) => s.trim()).filter((s) => s),
                      })
                    }
                    data-testid="input-job-skills"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedRoles.employer && (
            <Card>
              <CardHeader>
                <CardTitle>Employer Details</CardTitle>
                <CardDescription>Information about your company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emp-company">Company Name</Label>
                    <Input
                      id="emp-company"
                      placeholder="Your company name"
                      value={employerData.companyName}
                      onChange={(e) =>
                        setEmployerData({ ...employerData, companyName: e.target.value })
                      }
                      data-testid="input-emp-company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emp-website">Company Website</Label>
                    <Input
                      id="emp-website"
                      placeholder="https://yourcompany.com"
                      value={employerData.companyWebsite}
                      onChange={(e) =>
                        setEmployerData({ ...employerData, companyWebsite: e.target.value })
                      }
                      data-testid="input-emp-website"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emp-size">Company Size</Label>
                    <Select
                      value={employerData.companySize}
                      onValueChange={(value) =>
                        setEmployerData({ ...employerData, companySize: value })
                      }
                    >
                      <SelectTrigger data-testid="select-emp-size">
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="500+">500+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emp-field">Industry</Label>
                    <Input
                      id="emp-field"
                      placeholder="e.g., Technology, Finance"
                      value={employerData.field}
                      onChange={(e) =>
                        setEmployerData({ ...employerData, field: e.target.value })
                      }
                      data-testid="input-emp-field"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emp-posting"
                    checked={employerData.jobPostingPermissions}
                    onCheckedChange={(checked) =>
                      setEmployerData({ ...employerData, jobPostingPermissions: checked === true })
                    }
                    data-testid="checkbox-emp-posting"
                  />
                  <Label htmlFor="emp-posting">I want to post job listings</Label>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedRoles.businessOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Business Owner Details</CardTitle>
                <CardDescription>Information about your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="biz-name">Business Name</Label>
                    <Input
                      id="biz-name"
                      placeholder="Your business name"
                      value={businessOwnerData.businessName}
                      onChange={(e) =>
                        setBusinessOwnerData({ ...businessOwnerData, businessName: e.target.value })
                      }
                      data-testid="input-biz-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="biz-sector">Business Sector</Label>
                    <Input
                      id="biz-sector"
                      placeholder="e.g., Technology, Retail"
                      value={businessOwnerData.businessSector}
                      onChange={(e) =>
                        setBusinessOwnerData({ ...businessOwnerData, businessSector: e.target.value })
                      }
                      data-testid="input-biz-sector"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="biz-stage">Business Stage</Label>
                    <Select
                      value={businessOwnerData.businessStage}
                      onValueChange={(value) =>
                        setBusinessOwnerData({ ...businessOwnerData, businessStage: value })
                      }
                    >
                      <SelectTrigger data-testid="select-biz-stage">
                        <SelectValue placeholder="Select business stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="idea">Idea Stage</SelectItem>
                        <SelectItem value="startup">Startup</SelectItem>
                        <SelectItem value="growth">Growth Stage</SelectItem>
                        <SelectItem value="established">Established</SelectItem>
                        <SelectItem value="expansion">Expansion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="biz-investment">Investment Required</Label>
                    <Select
                      value={businessOwnerData.investmentRequired}
                      onValueChange={(value) =>
                        setBusinessOwnerData({ ...businessOwnerData, investmentRequired: value })
                      }
                    >
                      <SelectTrigger data-testid="select-biz-investment">
                        <SelectValue placeholder="Select investment need" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Not seeking investment</SelectItem>
                        <SelectItem value="yes_small">Yes - Under $100K</SelectItem>
                        <SelectItem value="yes_medium">Yes - $100K-$500K</SelectItem>
                        <SelectItem value="yes_large">Yes - Over $500K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="biz-partnerships">Partnerships Needed</Label>
                    <Select
                      value={businessOwnerData.partnershipsNeeded}
                      onValueChange={(value) =>
                        setBusinessOwnerData({ ...businessOwnerData, partnershipsNeeded: value })
                      }
                    >
                      <SelectTrigger data-testid="select-biz-partnerships">
                        <SelectValue placeholder="Select partnership need" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Not seeking partnerships</SelectItem>
                        <SelectItem value="yes_strategic">Strategic Partners</SelectItem>
                        <SelectItem value="yes_distribution">Distribution Partners</SelectItem>
                        <SelectItem value="yes_technology">Technology Partners</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biz-description">Business Description</Label>
                  <Textarea
                    id="biz-description"
                    placeholder="Describe your business..."
                    value={businessOwnerData.businessDescription}
                    onChange={(e) =>
                      setBusinessOwnerData({ ...businessOwnerData, businessDescription: e.target.value })
                    }
                    data-testid="textarea-biz-description"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedRoles.investor && (
            <Card>
              <CardHeader>
                <CardTitle>Investor Details</CardTitle>
                <CardDescription>Your investment preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inv-range">Investment Range</Label>
                    <Select
                      value={investorData.investmentRange}
                      onValueChange={(value) =>
                        setInvestorData({ ...investorData, investmentRange: value })
                      }
                    >
                      <SelectTrigger data-testid="select-inv-range">
                        <SelectValue placeholder="Select investment range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_50k">Under $50K</SelectItem>
                        <SelectItem value="50k_100k">$50K - $100K</SelectItem>
                        <SelectItem value="100k_500k">$100K - $500K</SelectItem>
                        <SelectItem value="500k_1m">$500K - $1M</SelectItem>
                        <SelectItem value="over_1m">Over $1M</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inv-stage">Preferred Business Stage</Label>
                    <Select
                      value={investorData.preferredStage}
                      onValueChange={(value) =>
                        setInvestorData({ ...investorData, preferredStage: value })
                      }
                    >
                      <SelectTrigger data-testid="select-inv-stage">
                        <SelectValue placeholder="Select preferred stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="idea">Idea Stage</SelectItem>
                        <SelectItem value="seed">Seed Stage</SelectItem>
                        <SelectItem value="early">Early Stage</SelectItem>
                        <SelectItem value="growth">Growth Stage</SelectItem>
                        <SelectItem value="any">Any Stage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inv-sectors">Investment Sectors (comma-separated)</Label>
                  <Input
                    id="inv-sectors"
                    placeholder="e.g., Technology, Healthcare, Fintech"
                    value={investorData.investmentSectors.join(", ")}
                    onChange={(e) =>
                      setInvestorData({
                        ...investorData,
                        investmentSectors: e.target.value
                          .split(",")
                          .map((f) => f.trim())
                          .filter((f) => f),
                      })
                    }
                    data-testid="input-inv-sectors"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {!Object.values(selectedRoles).some((v) => v) && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Select at least one role in the "Roles" tab to configure role-specific details
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setLocation("/dashboard")}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} size="lg" data-testid="button-save">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function EditProfile() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <EditProfileContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
