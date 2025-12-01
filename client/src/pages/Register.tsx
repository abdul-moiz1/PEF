import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { Briefcase, Search, Building2, Handshake, TrendingUp, ArrowRight, ArrowLeft, CheckCircle, Circle } from "lucide-react";
import { SiLinkedin } from "react-icons/si";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { checkEmailForJoinNow } from "@/lib/emailValidation";
import { transformRolesToPrefixed } from "@shared/roleUtils";

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

interface Country {
  id: string;
  code: string;
  name: string;
  phoneCode: string;
}

interface City {
  id: string;
  name: string;
}

const countryPhoneCodes: Record<string, string> = {
  "Afghanistan": "+93", "Albania": "+355", "Algeria": "+213", "Saudi Arabia": "+966", "Pakistan": "+92",
  "United Arab Emirates": "+971", "United Kingdom": "+44", "United States": "+1", "Canada": "+1",
  "Germany": "+49", "Italy": "+39", "India": "+91", "China": "+86", "Japan": "+81", "Australia": "+61"
};

const uniquePhoneCodes = [
  { code: "+1", label: "+1 (USA, Canada)" },
  { code: "+20", label: "+20 (Egypt)" },
  { code: "+27", label: "+27 (South Africa)" },
  { code: "+30", label: "+30 (Greece)" },
  { code: "+31", label: "+31 (Netherlands)" },
  { code: "+33", label: "+33 (France)" },
  { code: "+39", label: "+39 (Italy)" },
  { code: "+44", label: "+44 (UK)" },
  { code: "+49", label: "+49 (Germany)" },
  { code: "+61", label: "+61 (Australia)" },
  { code: "+81", label: "+81 (Japan)" },
  { code: "+86", label: "+86 (China)" },
  { code: "+91", label: "+91 (India)" },
  { code: "+92", label: "+92 (Pakistan)" },
  { code: "+966", label: "+966 (Saudi Arabia)" },
  { code: "+971", label: "+971 (UAE)" },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [linkedInProfile, setLinkedInProfile] = useState<any>(null);

  const [basicInfo, setBasicInfo] = useState({
    fullName: "",
    email: "",
    phoneCode: "+966",
    phone: "",
    country: "",
    city: "",
    languages: "",
    headline: "",
    bio: "",
    linkedinUrl: "",
    websiteUrl: "",
    portfolioUrl: "",
  });

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/locations/countries"],
  });

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/locations/countries", basicInfo.country, "cities"],
    enabled: !!basicInfo.country,
  });

  const selectedCountry = countries.find(c => c.id === basicInfo.country);

  const [selectedRoles, setSelectedRoles] = useState({
    professional: false,
    jobSeeker: false,
    employer: false,
    businessOwner: false,
    investor: false,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const linkedinSession = urlParams.get('linkedin_session');
    const linkedinError = urlParams.get('linkedin_error');

    if (linkedinSession) {
      const fetchLinkedInProfile = async () => {
        try {
          const response = await fetch(`/api/auth/linkedin/profile?session=${linkedinSession}`);
          if (!response.ok) {
            throw new Error('Failed to fetch LinkedIn profile');
          }
          
          const profile = await response.json();
          setLinkedInProfile(profile);
          
          setBasicInfo((prev) => ({
            ...prev,
            fullName: `${profile.firstName} ${profile.lastName}`.trim() || prev.fullName,
            email: profile.email || prev.email,
            headline: profile.headline || prev.headline,
            city: profile.location?.city || prev.city,
          }));

          toast({
            title: "LinkedIn Profile Imported!",
            description: "Your LinkedIn profile data has been loaded. Please review and complete the form.",
          });
        } catch (error) {
          console.error('Error fetching LinkedIn profile:', error);
          toast({
            title: "Error",
            description: "Failed to import LinkedIn data",
            variant: "destructive",
          });
        } finally {
          window.history.replaceState({}, '', window.location.pathname);
        }
      };

      fetchLinkedInProfile();
    }

    if (linkedinError) {
      toast({
        title: "LinkedIn Authorization Failed",
        description: linkedinError === 'user_cancelled_authorize' 
          ? "You cancelled the LinkedIn authorization." 
          : "Failed to connect to LinkedIn. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleRoleToggle = (roleId: keyof typeof selectedRoles) => {
    setSelectedRoles((prev) => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  const handleBasicInfoChange = (field: string, value: string) => {
    if (field === "country") {
      const phoneCode = countryPhoneCodes[value] || "+1";
      setBasicInfo((prev) => ({ ...prev, country: value, phoneCode }));
    } else {
      setBasicInfo((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleLinkedInAuth = async () => {
    setLinkedInLoading(true);
    try {
      const response = await fetch('/api/auth/linkedin');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate LinkedIn authorization');
      }
      
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error('LinkedIn auth error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect to LinkedIn. Please try again.",
        variant: "destructive",
      });
      setLinkedInLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!Object.values(selectedRoles).some((v) => v)) {
      toast({
        title: "Error",
        description: "Please select at least one role",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const emailToCheck = basicInfo.email.trim().toLowerCase();
      
      const emailCheck = await checkEmailForJoinNow(emailToCheck);
      if (emailCheck.exists) {
        toast({
          title: emailCheck.source === "users" ? "Account Already Exists" : "Already Registered",
          description: emailCheck.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Prepare data to save to Firestore
      const registrationData = {
        fullName: basicInfo.fullName.trim(),
        email: emailToCheck,
        phone: basicInfo.phone?.trim() ? `${basicInfo.phoneCode} ${basicInfo.phone.trim()}` : "",
        country: basicInfo.country,
        city: basicInfo.city?.trim() || "",
        languages: basicInfo.languages?.trim() ? basicInfo.languages.split(",").map(l => l.trim()).filter(Boolean) : [],
        headline: basicInfo.headline?.trim() || "",
        bio: basicInfo.bio?.trim() || "",
        linkedinUrl: basicInfo.linkedinUrl?.trim() || "",
        websiteUrl: basicInfo.websiteUrl?.trim() || "",
        portfolioUrl: basicInfo.portfolioUrl?.trim() || "",
        roles: transformRolesToPrefixed(selectedRoles),
        status: "pending",
        createdAt: Timestamp.now(),
      };

      // Save to Firestore "registrations" collection
      await addDoc(collection(db, "registrations"), registrationData);

      setSubmitted(true);
      toast({
        title: "Registration Submitted!",
        description: "Thank you for joining PEF. We will review your application and get back to you soon.",
      });

    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasSelectedRoles = Object.values(selectedRoles).some((v) => v);

  const validateBasicInfo = () => {
    if (!basicInfo.fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return false;
    }

    if (!basicInfo.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return false;
    }

    if (!basicInfo.country) {
      toast({
        title: "Validation Error",
        description: "Please select your country",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateBasicInfo()) {
      setStep(2);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-16 md:py-24 bg-gradient-to-br from-secondary/10 to-primary/5 flex items-center justify-center min-h-[80vh]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Thank You for Joining PEF!
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Your registration has been submitted successfully. Our team will review your application and contact you via email within 2-3 business days.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => setLocation("/")} size="lg" data-testid="button-home">
                Return to Home
              </Button>
              <Button onClick={() => setLocation("/about")} variant="outline" size="lg" data-testid="button-learn-more">
                Learn More About PEF
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16 md:py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-3xl">Join Professional Executive Forum</CardTitle>
              <p className="text-muted-foreground">
                Step {step} of 2: {step === 1 ? "Basic Information" : "Select Your Roles"}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          required
                          value={basicInfo.fullName}
                          onChange={(e) => handleBasicInfoChange("fullName", e.target.value)}
                          data-testid="input-full-name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={basicInfo.email}
                          onChange={(e) => handleBasicInfoChange("email", e.target.value)}
                          data-testid="input-email"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneCode">Phone Code</Label>
                        <Select
                          value={basicInfo.phoneCode}
                          onValueChange={(value) => handleBasicInfoChange("phoneCode", value)}
                        >
                          <SelectTrigger id="phoneCode" data-testid="select-phone-code">
                            <SelectValue />
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
                          value={basicInfo.phone}
                          onChange={(e) => handleBasicInfoChange("phone", e.target.value)}
                          placeholder="1234567890"
                          data-testid="input-phone"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Select
                          required
                          value={basicInfo.country}
                          onValueChange={(value) => {
                            const selectedCountry = countries.find(c => c.id === value);
                            const phoneCode = selectedCountry?.phoneCode || "+1";
                            setBasicInfo(prev => ({ ...prev, country: value, city: "", phoneCode }));
                          }}
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
                          value={basicInfo.city}
                          onValueChange={(value) => handleBasicInfoChange("city", value)}
                          disabled={!basicInfo.country || cities.length === 0}
                        >
                          <SelectTrigger id="city" data-testid="select-city">
                            <SelectValue placeholder={basicInfo.country ? "Select a city" : "Select a country first"} />
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

                    <div className="space-y-2">
                      <Label htmlFor="languages">Languages (comma separated)</Label>
                      <Input
                        id="languages"
                        value={basicInfo.languages}
                        onChange={(e) => handleBasicInfoChange("languages", e.target.value)}
                        placeholder="e.g., English, Arabic, Urdu"
                        data-testid="input-languages"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="headline">Professional Headline</Label>
                      <Input
                        id="headline"
                        value={basicInfo.headline}
                        onChange={(e) => handleBasicInfoChange("headline", e.target.value)}
                        placeholder="e.g., Senior Software Engineer | AI Enthusiast"
                        data-testid="input-headline"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio / About You</Label>
                      <Textarea
                        id="bio"
                        value={basicInfo.bio}
                        onChange={(e) => handleBasicInfoChange("bio", e.target.value)}
                        placeholder="Tell us about yourself, your experience, and what you're looking for..."
                        rows={4}
                        data-testid="input-bio"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold">Professional Links (Optional)</h3>
                        {linkedInProfile ? (
                          <div className="flex items-center gap-2">
                            {linkedInProfile.profilePicture && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={linkedInProfile.profilePicture} alt="LinkedIn Profile" />
                                <AvatarFallback>{linkedInProfile.firstName?.[0]}{linkedInProfile.lastName?.[0]}</AvatarFallback>
                              </Avatar>
                            )}
                            <span className="text-sm text-muted-foreground">
                              Imported from LinkedIn
                            </span>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleLinkedInAuth}
                            disabled={linkedInLoading}
                            data-testid="button-linkedin-import"
                          >
                            <SiLinkedin className="mr-2 h-4 w-4" />
                            {linkedInLoading ? "Connecting..." : "Import from LinkedIn"}
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                        <Input
                          id="linkedinUrl"
                          type="url"
                          value={basicInfo.linkedinUrl}
                          onChange={(e) => handleBasicInfoChange("linkedinUrl", e.target.value)}
                          placeholder="https://linkedin.com/in/yourprofile"
                          data-testid="input-linkedin"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="websiteUrl">Website URL</Label>
                        <Input
                          id="websiteUrl"
                          type="url"
                          value={basicInfo.websiteUrl}
                          onChange={(e) => handleBasicInfoChange("websiteUrl", e.target.value)}
                          placeholder="https://yourwebsite.com"
                          data-testid="input-website"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                        <Input
                          id="portfolioUrl"
                          type="url"
                          value={basicInfo.portfolioUrl}
                          onChange={(e) => handleBasicInfoChange("portfolioUrl", e.target.value)}
                          placeholder="https://yourportfolio.com"
                          data-testid="input-portfolio"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        size="lg"
                        data-testid="button-next"
                      >
                        Next <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Select Your Role(s) *</h3>
                      <p className="text-muted-foreground mb-6">
                        Choose one or more roles that best describe you. You can select multiple roles.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roles.map((role) => {
                        const Icon = role.icon;
                        const isSelected = selectedRoles[role.id as keyof typeof selectedRoles];
                        
                        return (
                          <Card
                            key={role.id}
                            className={`cursor-pointer transition-all hover-elevate ${
                              isSelected ? "border-primary border-2" : ""
                            }`}
                            onClick={() => handleRoleToggle(role.id as keyof typeof selectedRoles)}
                            data-testid={`role-card-${role.id}`}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                                  <Icon className="w-6 h-6 text-primary" />
                                </div>
                                {isSelected ? (
                                  <CheckCircle className="w-6 h-6 text-primary" />
                                ) : (
                                  <Circle className="w-6 h-6 text-muted-foreground" />
                                )}
                              </div>
                              <h4 className="text-lg font-bold mb-2">{role.title}</h4>
                              <p className="text-sm text-muted-foreground">{role.description}</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {!hasSelectedRoles && (
                      <p className="text-sm text-destructive">
                        Please select at least one role to continue
                      </p>
                    )}

                    <div className="flex justify-between gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        size="lg"
                        data-testid="button-back"
                      >
                        <ArrowLeft className="mr-2 w-4 h-4" /> Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading || !hasSelectedRoles}
                        size="lg"
                        data-testid="button-submit"
                      >
                        {loading ? "Submitting..." : "Submit Registration"}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
