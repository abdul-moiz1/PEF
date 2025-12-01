import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { updateUserData } from "@/lib/firestoreUtils";
import { User, Briefcase, Target, Building2, DollarSign } from "lucide-react";
import type { Country, City } from "@shared/schema";

export default function ProfileEdit() {
  const { currentUser, userData, refreshUserData } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: userData?.name || "",
    phone: userData?.phone || "",
    country: userData?.country || "",
    city: userData?.city || "",
    headline: userData?.headline || "",
    bio: userData?.bio || "",
    linkedinUrl: userData?.links?.linkedin || "",
    websiteUrl: userData?.links?.website || "",
    professionalData: {
      title: userData?.professionalData?.title || "",
      experience: userData?.professionalData?.experience || "",
      industry: userData?.professionalData?.industry || "",
      skills: userData?.professionalData?.skills?.join(", ") || "",
    },
    jobSeekerData: {
      targetRole: userData?.jobSeekerData?.targetRole || "",
      targetIndustry: userData?.jobSeekerData?.targetIndustry || "",
      expectedSalary: userData?.jobSeekerData?.expectedSalary || "",
      availability: userData?.jobSeekerData?.availability || "",
    },
    employerData: {
      companyName: userData?.employerData?.companyName || "",
      companySize: userData?.employerData?.companySize || "",
      industry: userData?.employerData?.industry || "",
      website: userData?.employerData?.website || "",
    },
    businessOwnerData: {
      businessName: userData?.businessOwnerData?.businessName || "",
      businessType: userData?.businessOwnerData?.businessType || "",
      industry: userData?.businessOwnerData?.industry || "",
      employees: userData?.businessOwnerData?.employees || "",
    },
    investorData: {
      investmentRange: userData?.investorData?.investmentRange || "",
      preferredStage: userData?.investorData?.preferredStage || "",
      investmentFocus: userData?.investorData?.investmentFocus?.join(", ") || "",
    },
  });

  // Fetch countries and cities from centralized API
  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/locations/countries"],
  });

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/locations/countries", formData.country, "cities"],
    enabled: !!formData.country,
  });

  const hasRole = (role: string) => {
    return userData?.roles?.[role as keyof typeof userData.roles] === true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        country: formData.country,
        city: formData.city,
        headline: formData.headline,
        bio: formData.bio,
        links: {
          linkedin: formData.linkedinUrl,
          website: formData.websiteUrl,
        },
      };

      if (hasRole("professional")) {
        updateData.professionalData = {
          title: formData.professionalData.title,
          experience: formData.professionalData.experience,
          industry: formData.professionalData.industry,
          skills: formData.professionalData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        };
      }

      if (hasRole("jobSeeker")) {
        updateData.jobSeekerData = {
          targetRole: formData.jobSeekerData.targetRole,
          targetIndustry: formData.jobSeekerData.targetIndustry,
          expectedSalary: formData.jobSeekerData.expectedSalary,
          availability: formData.jobSeekerData.availability,
        };
      }

      if (hasRole("employer")) {
        updateData.employerData = {
          companyName: formData.employerData.companyName,
          companySize: formData.employerData.companySize,
          industry: formData.employerData.industry,
          website: formData.employerData.website,
        };
      }

      if (hasRole("businessOwner")) {
        updateData.businessOwnerData = {
          businessName: formData.businessOwnerData.businessName,
          businessType: formData.businessOwnerData.businessType,
          industry: formData.businessOwnerData.industry,
          employees: formData.businessOwnerData.employees,
        };
      }

      if (hasRole("investor")) {
        updateData.investorData = {
          investmentRange: formData.investorData.investmentRange,
          preferredStage: formData.investorData.preferredStage,
          investmentFocus: formData.investorData.investmentFocus.split(",").map((s) => s.trim()).filter(Boolean),
        };
      }

      await updateUserData(currentUser.uid, updateData);
      await refreshUserData();

      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });

      setLocation("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 md:pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Edit Profile</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <User className="w-5 h-5" />
                    <h3>Basic Information</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      data-testid="input-name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) => setFormData({ ...formData, country: value, city: "" })}
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
                        value={formData.city}
                        onValueChange={(value) => setFormData({ ...formData, city: value })}
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
                        value={formData.phoneCode}
                        onValueChange={(value) => setFormData({ ...formData, phoneCode: value })}
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
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="1234567890"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headline">Professional Headline</Label>
                    <Input
                      id="headline"
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                      placeholder="e.g., Senior Software Engineer | Tech Enthusiast"
                      data-testid="input-headline"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      data-testid="input-bio"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn URL</Label>
                      <Input
                        id="linkedin"
                        type="url"
                        value={formData.linkedinUrl}
                        onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/yourprofile"
                        data-testid="input-linkedin"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website URL</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        data-testid="input-website"
                      />
                    </div>
                  </div>
                </div>

                {hasRole("professional") && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Briefcase className="w-5 h-5" />
                      <h3>Professional Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prof-title">Current Job Title</Label>
                        <Input
                          id="prof-title"
                          value={formData.professionalData.title}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              professionalData: { ...formData.professionalData, title: e.target.value },
                            })
                          }
                          data-testid="input-professional-title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="prof-industry">Industry</Label>
                        <Input
                          id="prof-industry"
                          value={formData.professionalData.industry}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              professionalData: { ...formData.professionalData, industry: e.target.value },
                            })
                          }
                          data-testid="input-professional-industry"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prof-experience">Years of Experience</Label>
                      <Input
                        id="prof-experience"
                        value={formData.professionalData.experience}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            professionalData: { ...formData.professionalData, experience: e.target.value },
                          })
                        }
                        data-testid="input-professional-experience"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prof-skills">Skills (comma-separated)</Label>
                      <Input
                        id="prof-skills"
                        value={formData.professionalData.skills}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            professionalData: { ...formData.professionalData, skills: e.target.value },
                          })
                        }
                        data-testid="input-professional-skills"
                      />
                    </div>
                  </div>
                )}

                {hasRole("jobSeeker") && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Target className="w-5 h-5" />
                      <h3>Job Seeker Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="js-role">Target Role</Label>
                        <Input
                          id="js-role"
                          value={formData.jobSeekerData.targetRole}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              jobSeekerData: { ...formData.jobSeekerData, targetRole: e.target.value },
                            })
                          }
                          data-testid="input-jobseeker-role"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="js-industry">Target Industry</Label>
                        <Input
                          id="js-industry"
                          value={formData.jobSeekerData.targetIndustry}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              jobSeekerData: { ...formData.jobSeekerData, targetIndustry: e.target.value },
                            })
                          }
                          data-testid="input-jobseeker-industry"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="js-salary">Expected Salary</Label>
                        <Input
                          id="js-salary"
                          value={formData.jobSeekerData.expectedSalary}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              jobSeekerData: { ...formData.jobSeekerData, expectedSalary: e.target.value },
                            })
                          }
                          data-testid="input-jobseeker-salary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="js-availability">Availability</Label>
                        <Input
                          id="js-availability"
                          value={formData.jobSeekerData.availability}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              jobSeekerData: { ...formData.jobSeekerData, availability: e.target.value },
                            })
                          }
                          data-testid="input-jobseeker-availability"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {hasRole("employer") && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Building2 className="w-5 h-5" />
                      <h3>Employer Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emp-company">Company Name</Label>
                        <Input
                          id="emp-company"
                          value={formData.employerData.companyName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              employerData: { ...formData.employerData, companyName: e.target.value },
                            })
                          }
                          data-testid="input-employer-company"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emp-size">Company Size</Label>
                        <Input
                          id="emp-size"
                          value={formData.employerData.companySize}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              employerData: { ...formData.employerData, companySize: e.target.value },
                            })
                          }
                          data-testid="input-employer-size"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emp-industry">Industry</Label>
                        <Input
                          id="emp-industry"
                          value={formData.employerData.industry}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              employerData: { ...formData.employerData, industry: e.target.value },
                            })
                          }
                          data-testid="input-employer-industry"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emp-website">Company Website</Label>
                        <Input
                          id="emp-website"
                          type="url"
                          value={formData.employerData.website}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              employerData: { ...formData.employerData, website: e.target.value },
                            })
                          }
                          data-testid="input-employer-website"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {hasRole("businessOwner") && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Building2 className="w-5 h-5" />
                      <h3>Business Owner Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bo-name">Business Name</Label>
                        <Input
                          id="bo-name"
                          value={formData.businessOwnerData.businessName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              businessOwnerData: { ...formData.businessOwnerData, businessName: e.target.value },
                            })
                          }
                          data-testid="input-business-name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bo-type">Business Type</Label>
                        <Input
                          id="bo-type"
                          value={formData.businessOwnerData.businessType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              businessOwnerData: { ...formData.businessOwnerData, businessType: e.target.value },
                            })
                          }
                          data-testid="input-business-type"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bo-industry">Industry</Label>
                        <Input
                          id="bo-industry"
                          value={formData.businessOwnerData.industry}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              businessOwnerData: { ...formData.businessOwnerData, industry: e.target.value },
                            })
                          }
                          data-testid="input-business-industry"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bo-employees">Number of Employees</Label>
                        <Input
                          id="bo-employees"
                          value={formData.businessOwnerData.employees}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              businessOwnerData: { ...formData.businessOwnerData, employees: e.target.value },
                            })
                          }
                          data-testid="input-business-employees"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {hasRole("investor") && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <DollarSign className="w-5 h-5" />
                      <h3>Investor Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inv-range">Investment Range</Label>
                        <Input
                          id="inv-range"
                          value={formData.investorData.investmentRange}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              investorData: { ...formData.investorData, investmentRange: e.target.value },
                            })
                          }
                          data-testid="input-investor-range"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="inv-stage">Preferred Stage</Label>
                        <Input
                          id="inv-stage"
                          value={formData.investorData.preferredStage}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              investorData: { ...formData.investorData, preferredStage: e.target.value },
                            })
                          }
                          data-testid="input-investor-stage"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inv-focus">Investment Focus (comma-separated)</Label>
                      <Input
                        id="inv-focus"
                        value={formData.investorData.investmentFocus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            investorData: { ...formData.investorData, investmentFocus: e.target.value },
                          })
                        }
                        data-testid="input-investor-focus"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/dashboard")}
                    disabled={loading}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1" data-testid="button-save">
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
