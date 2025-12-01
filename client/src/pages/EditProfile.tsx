import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Briefcase, Search, Building2, Handshake, TrendingUp, Save, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Country, City } from "@shared/schema";

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

  // Role-specific data
  const [professionalData, setProfessionalData] = useState({
    title: "",
    experience: "",
    skills: [] as string[],
    certifications: [] as string[],
  });

  const [jobSeekerData, setJobSeekerData] = useState({
    desiredRole: "",
    desiredLocation: "",
    desiredSalary: "",
    availability: "",
  });

  const [employerData, setEmployerData] = useState({
    companyName: "",
    industry: "",
    companySize: "",
    location: "",
  });

  const [businessOwnerData, setBusinessOwnerData] = useState({
    businessName: "",
    businessType: "",
    industry: "",
    revenue: "",
    employees: "",
  });

  const [investorData, setInvestorData] = useState({
    investmentRange: "",
    preferredStage: "",
    investmentFocus: [] as string[],
    industries: [] as string[],
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
            setSelectedRoles({
              professional: data.roles.professional || data.roles.isProfessional || false,
              jobSeeker: data.roles.jobSeeker || data.roles.isJobSeeker || false,
              employer: data.roles.employer || data.roles.isEmployer || false,
              businessOwner: data.roles.businessOwner || data.roles.isBusinessOwner || false,
              investor: data.roles.investor || data.roles.isInvestor || false,
            });
          }

          // Load role-specific data
          if (data.professionalData) {
            setProfessionalData({
              title: data.professionalData.title || "",
              experience: data.professionalData.experience || "",
              skills: data.professionalData.skills || [],
              certifications: data.professionalData.certifications || [],
            });
          }

          if (data.jobSeekerData) {
            setJobSeekerData({
              desiredRole: data.jobSeekerData.desiredRole || "",
              desiredLocation: data.jobSeekerData.desiredLocation || "",
              desiredSalary: data.jobSeekerData.desiredSalary || "",
              availability: data.jobSeekerData.availability || "",
            });
          }

          if (data.employerData) {
            setEmployerData({
              companyName: data.employerData.companyName || "",
              industry: data.employerData.industry || "",
              companySize: data.employerData.companySize || "",
              location: data.employerData.location || "",
            });
          }

          if (data.businessOwnerData) {
            setBusinessOwnerData({
              businessName: data.businessOwnerData.businessName || "",
              businessType: data.businessOwnerData.businessType || "",
              industry: data.businessOwnerData.industry || "",
              revenue: data.businessOwnerData.revenue || "",
              employees: data.businessOwnerData.employees || "",
            });
          }

          if (data.investorData) {
            setInvestorData({
              investmentRange: data.investorData.investmentRange || "",
              preferredStage: data.investorData.preferredStage || "",
              investmentFocus: data.investorData.investmentFocus || [],
              industries: data.investorData.industries || [],
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

    if (!Object.values(selectedRoles).some((v) => v)) {
      toast({
        title: "Error",
        description: "Please select at least one role",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const userRef = doc(db, "users", currentUser.uid);

      await updateDoc(userRef, {
        name: profileData.name,
        country: profileData.country,
        city: profileData.city,
        languages: profileData.languages,
        headline: profileData.headline,
        bio: profileData.bio,
        links: profileData.links,
        roles: selectedRoles,
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

  const handleRoleToggle = (roleId: keyof typeof selectedRoles) => {
    setSelectedRoles((prev) => ({ ...prev, [roleId]: !prev[roleId] }));
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
                          if (!existing) {
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
              <CardTitle>Your Roles</CardTitle>
              <CardDescription>Select the roles that apply to you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRoles[role.id as keyof typeof selectedRoles];

                  return (
                    <Card
                      key={role.id}
                      className={`cursor-pointer transition-all border-2 hover-elevate ${
                        isSelected ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => handleRoleToggle(role.id as keyof typeof selectedRoles)}
                      data-testid={`card-role-${role.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <Checkbox
                            checked={isSelected}
                            data-testid={`checkbox-${role.id}`}
                            className="pointer-events-none"
                          />
                        </div>
                        <h4 className="font-bold mb-2">{role.title}</h4>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {!Object.values(selectedRoles).some((v) => v) && (
                <p className="text-center text-destructive text-sm mt-4">
                  Please select at least one role
                </p>
              )}
            </CardContent>
          </Card>
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
                    <Label htmlFor="prof-title">Job Title</Label>
                    <Input
                      id="prof-title"
                      placeholder="e.g., Senior Software Engineer"
                      value={professionalData.title}
                      onChange={(e) =>
                        setProfessionalData({ ...professionalData, title: e.target.value })
                      }
                      data-testid="input-prof-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prof-experience">Experience</Label>
                    <Input
                      id="prof-experience"
                      placeholder="e.g., 5+ years in software development"
                      value={professionalData.experience}
                      onChange={(e) =>
                        setProfessionalData({ ...professionalData, experience: e.target.value })
                      }
                      data-testid="input-prof-experience"
                    />
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

                <div className="space-y-2">
                  <Label htmlFor="prof-certifications">Certifications (comma-separated)</Label>
                  <Input
                    id="prof-certifications"
                    placeholder="AWS Certified, PMP"
                    value={professionalData.certifications.join(", ")}
                    onChange={(e) =>
                      setProfessionalData({
                        ...professionalData,
                        certifications: e.target.value
                          .split(",")
                          .map((c) => c.trim())
                          .filter((c) => c),
                      })
                    }
                    data-testid="input-prof-certifications"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedRoles.jobSeeker && (
            <Card>
              <CardHeader>
                <CardTitle>Job Seeker Details</CardTitle>
                <CardDescription>What you're looking for in your next role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-desired-role">Desired Role</Label>
                    <Input
                      id="job-desired-role"
                      placeholder="e.g., Full Stack Developer"
                      value={jobSeekerData.desiredRole}
                      onChange={(e) =>
                        setJobSeekerData({ ...jobSeekerData, desiredRole: e.target.value })
                      }
                      data-testid="input-job-desired-role"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job-location">Desired Location</Label>
                    <Input
                      id="job-location"
                      placeholder="e.g., Remote, Dubai, Riyadh"
                      value={jobSeekerData.desiredLocation}
                      onChange={(e) =>
                        setJobSeekerData({ ...jobSeekerData, desiredLocation: e.target.value })
                      }
                      data-testid="input-job-location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job-salary">Desired Salary Range</Label>
                    <Input
                      id="job-salary"
                      placeholder="e.g., $80,000 - $120,000"
                      value={jobSeekerData.desiredSalary}
                      onChange={(e) =>
                        setJobSeekerData({ ...jobSeekerData, desiredSalary: e.target.value })
                      }
                      data-testid="input-job-salary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job-availability">Availability</Label>
                    <Input
                      id="job-availability"
                      placeholder="e.g., Immediate, 2 weeks notice"
                      value={jobSeekerData.availability}
                      onChange={(e) =>
                        setJobSeekerData({ ...jobSeekerData, availability: e.target.value })
                      }
                      data-testid="input-job-availability"
                    />
                  </div>
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
                    <Label htmlFor="emp-industry">Industry</Label>
                    <Input
                      id="emp-industry"
                      placeholder="e.g., Technology, Finance"
                      value={employerData.industry}
                      onChange={(e) =>
                        setEmployerData({ ...employerData, industry: e.target.value })
                      }
                      data-testid="input-emp-industry"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emp-size">Company Size</Label>
                    <Input
                      id="emp-size"
                      placeholder="e.g., 50-200 employees"
                      value={employerData.companySize}
                      onChange={(e) =>
                        setEmployerData({ ...employerData, companySize: e.target.value })
                      }
                      data-testid="input-emp-size"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emp-location">Location</Label>
                    <Input
                      id="emp-location"
                      placeholder="e.g., Riyadh, Saudi Arabia"
                      value={employerData.location}
                      onChange={(e) =>
                        setEmployerData({ ...employerData, location: e.target.value })
                      }
                      data-testid="input-emp-location"
                    />
                  </div>
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
                    <Label htmlFor="biz-type">Business Type</Label>
                    <Input
                      id="biz-type"
                      placeholder="e.g., LLC, Corporation"
                      value={businessOwnerData.businessType}
                      onChange={(e) =>
                        setBusinessOwnerData({ ...businessOwnerData, businessType: e.target.value })
                      }
                      data-testid="input-biz-type"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="biz-industry">Industry</Label>
                    <Input
                      id="biz-industry"
                      placeholder="e.g., E-commerce, Manufacturing"
                      value={businessOwnerData.industry}
                      onChange={(e) =>
                        setBusinessOwnerData({ ...businessOwnerData, industry: e.target.value })
                      }
                      data-testid="input-biz-industry"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="biz-revenue">Revenue Range</Label>
                    <Input
                      id="biz-revenue"
                      placeholder="e.g., $1M - $5M"
                      value={businessOwnerData.revenue}
                      onChange={(e) =>
                        setBusinessOwnerData({ ...businessOwnerData, revenue: e.target.value })
                      }
                      data-testid="input-biz-revenue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="biz-employees">Number of Employees</Label>
                    <Input
                      id="biz-employees"
                      placeholder="e.g., 10-50"
                      value={businessOwnerData.employees}
                      onChange={(e) =>
                        setBusinessOwnerData({ ...businessOwnerData, employees: e.target.value })
                      }
                      data-testid="input-biz-employees"
                    />
                  </div>
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
                    <Input
                      id="inv-range"
                      placeholder="e.g., $50K - $500K"
                      value={investorData.investmentRange}
                      onChange={(e) =>
                        setInvestorData({ ...investorData, investmentRange: e.target.value })
                      }
                      data-testid="input-inv-range"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inv-stage">Preferred Stage</Label>
                    <Input
                      id="inv-stage"
                      placeholder="e.g., Seed, Series A"
                      value={investorData.preferredStage}
                      onChange={(e) =>
                        setInvestorData({ ...investorData, preferredStage: e.target.value })
                      }
                      data-testid="input-inv-stage"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inv-focus">Investment Focus (comma-separated)</Label>
                  <Input
                    id="inv-focus"
                    placeholder="e.g., Technology, Healthcare, Fintech"
                    value={investorData.investmentFocus.join(", ")}
                    onChange={(e) =>
                      setInvestorData({
                        ...investorData,
                        investmentFocus: e.target.value
                          .split(",")
                          .map((f) => f.trim())
                          .filter((f) => f),
                      })
                    }
                    data-testid="input-inv-focus"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inv-industries">Preferred Industries (comma-separated)</Label>
                  <Input
                    id="inv-industries"
                    placeholder="e.g., SaaS, AI, Renewable Energy"
                    value={investorData.industries.join(", ")}
                    onChange={(e) =>
                      setInvestorData({
                        ...investorData,
                        industries: e.target.value
                          .split(",")
                          .map((i) => i.trim())
                          .filter((i) => i),
                      })
                    }
                    data-testid="input-inv-industries"
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
