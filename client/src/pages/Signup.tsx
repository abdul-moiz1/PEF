import { useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { checkEmailForCreateAccount } from "@/lib/emailValidation";
import { Briefcase, Search, Building2, Handshake, TrendingUp, ArrowRight, ArrowLeft, CheckCircle, Circle, Eye, EyeOff, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  const [accountInfo, setAccountInfo] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [basicInfo, setBasicInfo] = useState({
    fullName: "",
    phoneCode: "+966",
    phone: "",
    country: "Saudi Arabia",
    city: "",
    languages: "",
    headline: "",
    bio: "",
    linkedinUrl: "",
    websiteUrl: "",
    portfolioUrl: "",
  });

  const [selectedRoles, setSelectedRoles] = useState({
    professional: false,
    jobSeeker: false,
    employer: false,
    businessOwner: false,
    investor: false,
  });

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/locations/countries"],
  });

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/locations/countries", basicInfo.country, "cities"],
    enabled: !!basicInfo.country,
  });

  const handleRoleToggle = (roleId: keyof typeof selectedRoles) => {
    setSelectedRoles((prev) => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  const handleAccountInfoChange = (field: string, value: string) => {
    setAccountInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleBasicInfoChange = (field: string, value: string) => {
    if (field === "country") {
      const selectedCountry = countries.find((c) => c.id === value);
      const phoneCode = selectedCountry?.phoneCode || "+1";
      setBasicInfo((prev) => ({ ...prev, country: value, phoneCode }));
    } else {
      setBasicInfo((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Get unique phone codes from countries for the dropdown
  const uniquePhoneCodes = countries
    .filter((c) => c.phoneCode && c.phoneCode.trim())
    .reduce((acc: { code: string; label: string }[], country) => {
      const existing = acc.find((item) => item.code === country.phoneCode);
      if (!existing) {
        acc.push({
          code: country.phoneCode,
          label: `${country.phoneCode}`,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => {
      const aNum = parseInt(a.code.slice(1));
      const bNum = parseInt(b.code.slice(1));
      return aNum - bNum;
    });

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
    
    // Show progress toast
    toast({
      title: "Creating your account...",
      description: "Please wait while we set up your profile.",
    });

    try {
      // Prepare profile data
      const profileData = {
        phone: basicInfo.phone?.trim() ? `${basicInfo.phoneCode} ${basicInfo.phone.trim()}` : null,
        country: basicInfo.country || null,
        city: basicInfo.city?.trim() || null,
        languages: basicInfo.languages?.trim() ? basicInfo.languages.split(",").map(l => l.trim()).filter(Boolean) : null,
        headline: basicInfo.headline?.trim() || null,
        bio: basicInfo.bio?.trim() || null,
        linkedinUrl: basicInfo.linkedinUrl?.trim() || null,
        websiteUrl: basicInfo.websiteUrl?.trim() || null,
        portfolioUrl: basicInfo.portfolioUrl?.trim() || null,
      };

      console.log("Submitting registration form...");

      // Call register from AuthContext
      await register(
        accountInfo.email,
        accountInfo.password,
        basicInfo.fullName.trim(),
        selectedRoles,
        profileData
      );

      console.log("Registration successful, showing success message");

      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account before logging in.",
      });

      setLocation("/login");

    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "An error occurred. Please try again.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please login instead.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log("Registration form submission complete, clearing loading state");
      setLoading(false);
    }
  };

  const hasSelectedRoles = Object.values(selectedRoles).some((v) => v);

  const validateAccountInfo = () => {
    if (!accountInfo.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return false;
    }

    if (!accountInfo.password) {
      toast({
        title: "Validation Error",
        description: "Please enter a password",
        variant: "destructive",
      });
      return false;
    }

    if (accountInfo.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return false;
    }

    if (accountInfo.password !== accountInfo.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateBasicInfo = () => {
    if (!basicInfo.fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your full name",
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

  const handleNextFromStep1 = async () => {
    if (!validateAccountInfo()) {
      return;
    }

    setLoading(true);
    try {
      const emailCheck = await checkEmailForCreateAccount(accountInfo.email.trim().toLowerCase());
      
      if (emailCheck.exists && emailCheck.source === "users") {
        toast({
          title: "Account Already Exists",
          description: emailCheck.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (emailCheck.source === "registrations" && emailCheck.data) {
        setIsReturningUser(true);
        
        const data = emailCheck.data;
        setBasicInfo((prev) => ({
          ...prev,
          fullName: data.fullName || "",
          phone: data.phone?.replace(/^\+\d+\s*/, "") || "",
          phoneCode: data.phone?.match(/^\+\d+/)?.[0] || prev.phoneCode,
          country: data.country || prev.country,
          city: data.city || "",
          languages: Array.isArray(data.languages) ? data.languages.join(", ") : "",
          headline: data.headline || "",
          bio: data.bio || "",
          linkedinUrl: data.linkedinUrl || "",
          websiteUrl: data.websiteUrl || "",
          portfolioUrl: data.portfolioUrl || "",
        }));

        if (data.roles) {
          setSelectedRoles((prev) => ({
            ...prev,
            professional: data.roles.professional || false,
            jobSeeker: data.roles.jobSeeker || false,
            employer: data.roles.employer || false,
            businessOwner: data.roles.businessOwner || false,
            investor: data.roles.investor || false,
          }));
        }
        
        toast({
          title: "Welcome Back!",
          description: "Your information has been pre-filled. Review and complete your profile to create your account.",
        });
      }

      setStep(2);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNextFromStep2 = () => {
    if (validateBasicInfo()) {
      setStep(3);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16 md:py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-3xl">Create Your PEF Account</CardTitle>
              <p className="text-muted-foreground">
                Step {step} of 3: {step === 1 ? "Account Details" : step === 2 ? "Personal Information" : "Select Your Roles"}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={accountInfo.email}
                        onChange={(e) => handleAccountInfoChange("email", e.target.value)}
                        data-testid="input-signup-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative flex items-center">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={accountInfo.password}
                          onChange={(e) => handleAccountInfoChange("password", e.target.value)}
                          className="pr-10"
                          data-testid="input-signup-password"
                        />
                        <button
                          type="button"
                          className="absolute right-0 top-0 h-full px-3 flex items-center justify-center hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 6 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <div className="relative flex items-center">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={accountInfo.confirmPassword}
                          onChange={(e) => handleAccountInfoChange("confirmPassword", e.target.value)}
                          className="pr-10"
                          data-testid="input-signup-confirm-password"
                        />
                        <button
                          type="button"
                          className="absolute right-0 top-0 h-full px-3 flex items-center justify-center hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          data-testid="button-toggle-confirm-password"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleNextFromStep1}
                        size="lg"
                        data-testid="button-next-step-1"
                      >
                        Next <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    {isReturningUser && (
                      <Alert className="bg-primary/10 border-primary/20">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertDescription className="text-primary">
                          Great to see you again! We've pre-filled your information from your earlier submission. 
                          Review the details below and add anything missing to complete your account.
                        </AlertDescription>
                      </Alert>
                    )}
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
                        <Label htmlFor="country">Country *</Label>
                        <Select
                          required
                          value={basicInfo.country}
                          onValueChange={(value) => handleBasicInfoChange("country", value)}
                        >
                          <SelectTrigger id="country" data-testid="select-country">
                            <SelectValue />
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
                            {uniquePhoneCodes.map((item) => (
                              <SelectItem key={item.code} value={item.code}>
                                {item.label}
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

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={basicInfo.city}
                        onChange={(e) => handleBasicInfoChange("city", e.target.value)}
                        placeholder="e.g., Riyadh"
                        data-testid="input-city"
                      />
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
                      <h3 className="text-lg font-semibold">Professional Links (Optional)</h3>
                      
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

                    <div className="flex justify-between gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        size="lg"
                        data-testid="button-back-step-2"
                      >
                        <ArrowLeft className="mr-2 w-4 h-4" /> Back
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNextFromStep2}
                        size="lg"
                        data-testid="button-next-step-2"
                      >
                        Next <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
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
                        onClick={() => setStep(2)}
                        size="lg"
                        data-testid="button-back-step-3"
                      >
                        <ArrowLeft className="mr-2 w-4 h-4" /> Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading || !hasSelectedRoles}
                        size="lg"
                        data-testid="button-submit-signup"
                      >
                        {loading ? "Creating Account..." : "Create Account"}
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
