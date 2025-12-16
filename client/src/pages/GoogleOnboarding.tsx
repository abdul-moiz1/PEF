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
import { useAuth } from "@/contexts/AuthContext";
import { updateUserData } from "@/lib/firestoreUtils";
import { Briefcase, Search, Building2, Handshake, TrendingUp, ArrowRight, ArrowLeft, CheckCircle, Circle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";
import { toFirestoreRoles } from "@shared/roleUtils";

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

const roleLabels: Record<string, string> = {
  jobSeeker: "Job Seeker",
  professional: "Professional",
  employer: "Employer",
  businessOwner: "Business Owner",
  investor: "Investor",
};

const educationLevels = [
  "High School",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD / Doctorate",
  "Professional Certificate",
  "Vocational Training",
  "Self-taught / Bootcamp",
];

const experienceLevels = [
  "Entry Level (0-2 years)",
  "Junior (2-4 years)",
  "Mid-Level (4-7 years)",
  "Senior (7-10 years)",
  "Expert (10+ years)",
  "Executive (15+ years)",
];

const businessStages = [
  "Idea Stage",
  "Pre-seed / Validation",
  "Seed",
  "Early Growth",
  "Scaling",
  "Mature / Established",
];

const investmentRanges = [
  "Under $50,000",
  "$50,000 - $100,000",
  "$100,000 - $500,000",
  "$500,000 - $1M",
  "$1M - $5M",
  "$5M - $10M",
  "$10M+",
];

const companySizes = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees",
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

interface FieldConfig {
  id: string;
  name: string;
  parentId: string | null;
  isMainField: boolean;
  enabled: boolean;
}

export default function GoogleOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentUser, userData, refreshUserData } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentRoleFormIndex, setCurrentRoleFormIndex] = useState(0);

  const [basicInfo, setBasicInfo] = useState({
    fullName: "",
    phoneCode: "+966",
    phone: "",
    country: "",
    city: "",
    languages: "",
    headline: "",
    bio: "",
    linkedinUrl: "",
    websiteUrl: "",
  });

  const [selectedRoles, setSelectedRoles] = useState({
    professional: false,
    jobSeeker: false,
    employer: false,
    businessOwner: false,
    investor: false,
  });

  const [roleFormData, setRoleFormData] = useState<Record<string, Record<string, string>>>({
    professional: {
      currentJobTitle: "",
      educationLevel: "",
      field: "",
      subField: "",
      experienceLevel: "",
      skills: "",
    },
    jobSeeker: {
      educationLevel: "",
      field: "",
      subField: "",
      yearsOfExperience: "",
      skills: "",
    },
    employer: {
      companyName: "",
      companyWebsite: "",
      companySize: "",
      field: "",
      jobPostingPermissions: "",
    },
    businessOwner: {
      businessName: "",
      businessDescription: "",
      businessSector: "",
      businessStage: "",
      investmentRequired: "",
      partnershipsNeeded: "",
    },
    investor: {
      investmentSectors: "",
      investmentRange: "",
      preferredStage: "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      setBasicInfo(prev => ({
        ...prev,
        fullName: currentUser.displayName || "",
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setLocation("/login");
    }
  }, [currentUser, setLocation]);

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/locations/countries"],
  });

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/locations/countries", basicInfo.country, "cities"],
    enabled: !!basicInfo.country,
  });

  const { data: fields = [] } = useQuery<FieldConfig[]>({
    queryKey: ["/api/fields"],
  });

  const mainFields = fields.filter((f) => f.isMainField && f.enabled);

  const getSubFields = (mainFieldName: string) => {
    const mainField = fields.find((f) => f.name === mainFieldName && f.isMainField);
    if (!mainField) return [];
    return fields.filter((f) => f.parentId === mainField.id && f.enabled);
  };

  const handleRoleToggle = (roleId: keyof typeof selectedRoles) => {
    setSelectedRoles((prev) => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  const handleBasicInfoChange = (field: string, value: string) => {
    if (field === "country") {
      const selectedCountry = countries.find((c) => c.id === value);
      const phoneCode = selectedCountry?.phoneCode || "+1";
      setBasicInfo((prev) => ({ ...prev, country: value, phoneCode, city: "" }));
    } else {
      setBasicInfo((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleRoleFormDataChange = (roleId: string, field: string, value: string) => {
    setRoleFormData((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [field]: value,
      },
    }));
  };

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

  const getSelectedRolesList = () => {
    return Object.entries(selectedRoles)
      .filter(([, isSelected]) => isSelected)
      .map(([roleId]) => roleId);
  };

  const selectedRolesList = getSelectedRolesList();
  const currentRoleId = selectedRolesList[currentRoleFormIndex];
  const totalRoleForms = selectedRolesList.length;
  const isLastRoleForm = currentRoleFormIndex >= totalRoleForms - 1;

  const prepareRoleSpecificData = () => {
    const roleData: Record<string, unknown> = {};

    if (selectedRoles.professional) {
      const data = roleFormData.professional;
      roleData.professionalData = {
        title: data.currentJobTitle,
        currentJobTitle: data.currentJobTitle,
        educationLevel: data.educationLevel,
        field: data.field,
        subField: data.subField,
        experience: data.experienceLevel,
        experienceLevel: data.experienceLevel,
        skills: (data.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
      };
    }

    if (selectedRoles.jobSeeker) {
      const data = roleFormData.jobSeeker;
      roleData.jobSeekerData = {
        educationLevel: data.educationLevel,
        field: data.field,
        subField: data.subField,
        yearsOfExperience: data.yearsOfExperience,
        skills: (data.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
      };
    }

    if (selectedRoles.employer) {
      const data = roleFormData.employer;
      roleData.employerData = {
        companyName: data.companyName,
        website: data.companyWebsite,
        companyWebsite: data.companyWebsite,
        companySize: data.companySize,
        industry: data.field,
        field: data.field,
        jobPostingPermissions: data.jobPostingPermissions === "yes",
      };
    }

    if (selectedRoles.businessOwner) {
      const data = roleFormData.businessOwner;
      roleData.businessOwnerData = {
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        industry: data.businessSector,
        businessSector: data.businessSector,
        businessStage: data.businessStage,
        investmentRequired: data.investmentRequired,
        partnershipsNeeded: data.partnershipsNeeded,
      };
    }

    if (selectedRoles.investor) {
      const data = roleFormData.investor;
      roleData.investorData = {
        investmentFocus: (data.investmentSectors || "").split(",").map((s) => s.trim()).filter(Boolean),
        investmentSectors: (data.investmentSectors || "").split(",").map((s) => s.trim()).filter(Boolean),
        investmentRange: data.investmentRange,
        preferredStage: data.preferredStage,
      };
    }

    return roleData;
  };

  const performRegistration = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to complete your profile",
        variant: "destructive",
      });
      return;
    }

    if (!Object.values(selectedRoles).some((v) => v)) {
      toast({
        title: "Error",
        description: "Please select at least one role",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    toast({
      title: "Completing your profile...",
      description: "Please wait while we set up your account.",
    });

    try {
      const roleSpecificData = prepareRoleSpecificData();

      const token = await currentUser.getIdToken();
      let response: Response;
      
      try {
        response = await fetch("/api/auth/complete-registration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            profile: {
              fullName: basicInfo.fullName.trim(),
              country: basicInfo.country || "",
              city: basicInfo.city || null,
              phone: basicInfo.phone?.trim() ? `${basicInfo.phoneCode} ${basicInfo.phone.trim()}` : null,
              languages: basicInfo.languages?.trim() ? basicInfo.languages.split(",").map(l => l.trim()).filter(Boolean) : null,
              headline: basicInfo.headline?.trim() || null,
              bio: basicInfo.bio?.trim() || null,
              linkedinUrl: basicInfo.linkedinUrl?.trim() || null,
              websiteUrl: basicInfo.websiteUrl?.trim() || null,
            },
            roles: selectedRoles,
            ...roleSpecificData,
          }),
        });
      } catch (networkError) {
        console.error("Network error during backend sync:", networkError);
        throw new Error("Network error. Please check your connection and try again.");
      }

      if (!response.ok) {
        let errorMessage = "Failed to sync profile with server";
        try {
          const error = await response.json();
          if (error.error === "User already registered") {
            console.log("User already registered, continuing with Firestore update");
          } else {
            console.error("Backend sync error:", error);
            errorMessage = error.message || errorMessage;
            throw new Error(errorMessage);
          }
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message !== errorMessage) {
            throw parseError;
          }
          console.error("Failed to parse error response:", parseError);
          throw new Error(errorMessage);
        }
      }

      const updateData: any = {
        name: basicInfo.fullName.trim(),
        profile: {
          fullName: basicInfo.fullName.trim(),
          phone: basicInfo.phone?.trim() ? `${basicInfo.phoneCode} ${basicInfo.phone.trim()}` : null,
          country: basicInfo.country || null,
          city: basicInfo.city?.trim() || null,
          languages: basicInfo.languages?.trim() ? basicInfo.languages.split(",").map(l => l.trim()).filter(Boolean) : null,
          headline: basicInfo.headline?.trim() || null,
          bio: basicInfo.bio?.trim() || null,
          linkedinUrl: basicInfo.linkedinUrl?.trim() || null,
          websiteUrl: basicInfo.websiteUrl?.trim() || null,
        },
        roles: toFirestoreRoles(selectedRoles),
        needsRoleSelection: false,
        profileCompleted: true,
        status: "approved",
        approvalStatus: "approved",
        ...roleSpecificData,
      };

      await updateUserData(currentUser.uid, updateData);

      await refreshUserData();

      try {
        await firebaseSignOut(auth);
      } catch (signOutError) {
        console.error("Sign out error:", signOutError);
      }

      toast({
        title: "Profile Complete!",
        description: "Your account is ready. Please log in to continue.",
      });

      setLocation("/login");
    } catch (error: any) {
      console.error("Profile completion error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile. Please try again.",
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

  const handleNextFromStep1 = () => {
    if (validateBasicInfo()) {
      setStep(2);
    }
  };

  const handleNextFromStep2 = () => {
    if (!hasSelectedRoles) {
      toast({
        title: "Validation Error",
        description: "Please select at least one role",
        variant: "destructive",
      });
      return;
    }
    setCurrentRoleFormIndex(0);
    setStep(3);
  };

  const handleNextRoleForm = async () => {
    if (isLastRoleForm) {
      await performRegistration();
    } else {
      setCurrentRoleFormIndex((prev) => prev + 1);
    }
  };

  const handlePrevRoleForm = () => {
    if (currentRoleFormIndex > 0) {
      setCurrentRoleFormIndex((prev) => prev - 1);
    } else {
      setStep(2);
    }
  };

  const getTotalSteps = () => {
    return 2 + totalRoleForms;
  };

  const getCurrentStepDisplay = () => {
    if (step <= 2) {
      return step;
    }
    return 2 + currentRoleFormIndex + 1;
  };

  const getStepLabel = () => {
    if (step === 1) return "Personal Information";
    if (step === 2) return "Select Your Roles";
    return `${roleLabels[currentRoleId]} Details`;
  };

  const renderRoleForm = (roleId: string) => {
    const data = roleFormData[roleId];

    if (roleId === "jobSeeker") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="js-education">Education Level</Label>
            <Select
              value={data.educationLevel || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "educationLevel", value)}
            >
              <SelectTrigger id="js-education" data-testid="select-js-education">
                <SelectValue placeholder="Select education level" />
              </SelectTrigger>
              <SelectContent>
                {educationLevels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="js-field">Field</Label>
            <Select
              value={data.field || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "field", value)}
            >
              <SelectTrigger id="js-field" data-testid="select-js-field">
                <SelectValue placeholder="Select your field" />
              </SelectTrigger>
              <SelectContent>
                {mainFields.map((field) => (
                  <SelectItem key={field.id} value={field.name}>{field.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {data.field && getSubFields(data.field).length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="js-subfield">Sub-Field</Label>
              <Select
                value={data.subField || ""}
                onValueChange={(value) => handleRoleFormDataChange(roleId, "subField", value)}
              >
                <SelectTrigger id="js-subfield" data-testid="select-js-subfield">
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  {getSubFields(data.field).map((sf) => (
                    <SelectItem key={sf.id} value={sf.name}>{sf.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="js-experience">Years of Experience</Label>
            <Select
              value={data.yearsOfExperience || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "yearsOfExperience", value)}
            >
              <SelectTrigger id="js-experience" data-testid="select-js-experience">
                <SelectValue placeholder="Select experience" />
              </SelectTrigger>
              <SelectContent>
                {experienceLevels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="js-skills">Skills (comma-separated)</Label>
            <Input
              id="js-skills"
              value={data.skills || ""}
              onChange={(e) => handleRoleFormDataChange(roleId, "skills", e.target.value)}
              placeholder="e.g., Project Management, Data Analysis, Python"
              data-testid="input-js-skills"
            />
          </div>
        </div>
      );
    }

    if (roleId === "professional") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prof-title">Current Job Title</Label>
            <Input
              id="prof-title"
              value={data.currentJobTitle || ""}
              onChange={(e) => handleRoleFormDataChange(roleId, "currentJobTitle", e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              data-testid="input-prof-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prof-education">Education Level</Label>
            <Select
              value={data.educationLevel || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "educationLevel", value)}
            >
              <SelectTrigger id="prof-education" data-testid="select-prof-education">
                <SelectValue placeholder="Select education level" />
              </SelectTrigger>
              <SelectContent>
                {educationLevels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prof-field">Field</Label>
            <Select
              value={data.field || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "field", value)}
            >
              <SelectTrigger id="prof-field" data-testid="select-prof-field">
                <SelectValue placeholder="Select your field" />
              </SelectTrigger>
              <SelectContent>
                {mainFields.map((field) => (
                  <SelectItem key={field.id} value={field.name}>{field.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {data.field && getSubFields(data.field).length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="prof-subfield">Sub-Field</Label>
              <Select
                value={data.subField || ""}
                onValueChange={(value) => handleRoleFormDataChange(roleId, "subField", value)}
              >
                <SelectTrigger id="prof-subfield" data-testid="select-prof-subfield">
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  {getSubFields(data.field).map((sf) => (
                    <SelectItem key={sf.id} value={sf.name}>{sf.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="prof-experience">Experience Level</Label>
            <Select
              value={data.experienceLevel || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "experienceLevel", value)}
            >
              <SelectTrigger id="prof-experience" data-testid="select-prof-experience">
                <SelectValue placeholder="Select experience" />
              </SelectTrigger>
              <SelectContent>
                {experienceLevels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="prof-skills">Skills (comma-separated)</Label>
            <Input
              id="prof-skills"
              value={data.skills || ""}
              onChange={(e) => handleRoleFormDataChange(roleId, "skills", e.target.value)}
              placeholder="e.g., Leadership, Strategic Planning, Team Management"
              data-testid="input-prof-skills"
            />
          </div>
        </div>
      );
    }

    if (roleId === "employer") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emp-company">Company Name</Label>
            <Input
              id="emp-company"
              value={data.companyName || ""}
              onChange={(e) => handleRoleFormDataChange(roleId, "companyName", e.target.value)}
              placeholder="e.g., ABC Corporation"
              data-testid="input-emp-company"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-website">Company Website</Label>
            <Input
              id="emp-website"
              type="url"
              value={data.companyWebsite || ""}
              onChange={(e) => handleRoleFormDataChange(roleId, "companyWebsite", e.target.value)}
              placeholder="https://company.com"
              data-testid="input-emp-website"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-size">Company Size</Label>
            <Select
              value={data.companySize || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "companySize", value)}
            >
              <SelectTrigger id="emp-size" data-testid="select-emp-size">
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                {companySizes.map((size) => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-field">Industry</Label>
            <Select
              value={data.field || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "field", value)}
            >
              <SelectTrigger id="emp-field" data-testid="select-emp-field">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {mainFields.map((field) => (
                  <SelectItem key={field.id} value={field.name}>{field.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="emp-posting">Job Posting Permission</Label>
            <Select
              value={data.jobPostingPermissions || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "jobPostingPermissions", value)}
            >
              <SelectTrigger id="emp-posting" data-testid="select-emp-posting">
                <SelectValue placeholder="Can you post jobs?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes, I can post jobs</SelectItem>
                <SelectItem value="no">No, I cannot post jobs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    if (roleId === "businessOwner") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bo-name">Business Name</Label>
            <Input
              id="bo-name"
              value={data.businessName || ""}
              onChange={(e) => handleRoleFormDataChange(roleId, "businessName", e.target.value)}
              placeholder="e.g., My Startup Inc."
              data-testid="input-bo-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bo-sector">Business Sector</Label>
            <Select
              value={data.businessSector || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "businessSector", value)}
            >
              <SelectTrigger id="bo-sector" data-testid="select-bo-sector">
                <SelectValue placeholder="Select sector" />
              </SelectTrigger>
              <SelectContent>
                {mainFields.map((field) => (
                  <SelectItem key={field.id} value={field.name}>{field.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bo-stage">Business Stage</Label>
            <Select
              value={data.businessStage || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "businessStage", value)}
            >
              <SelectTrigger id="bo-stage" data-testid="select-bo-stage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {businessStages.map((stage) => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bo-investment">Investment Required</Label>
            <Select
              value={data.investmentRequired || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "investmentRequired", value)}
            >
              <SelectTrigger id="bo-investment" data-testid="select-bo-investment">
                <SelectValue placeholder="Select amount" />
              </SelectTrigger>
              <SelectContent>
                {investmentRanges.map((range) => (
                  <SelectItem key={range} value={range}>{range}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bo-description">Business Description</Label>
            <Textarea
              id="bo-description"
              value={data.businessDescription || ""}
              onChange={(e) => handleRoleFormDataChange(roleId, "businessDescription", e.target.value)}
              placeholder="Describe your business..."
              rows={3}
              data-testid="input-bo-description"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bo-partnerships">Partnerships Needed</Label>
            <Input
              id="bo-partnerships"
              value={data.partnershipsNeeded || ""}
              onChange={(e) => handleRoleFormDataChange(roleId, "partnershipsNeeded", e.target.value)}
              placeholder="e.g., Technology partners, Distribution partners"
              data-testid="input-bo-partnerships"
            />
          </div>
        </div>
      );
    }

    if (roleId === "investor") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inv-range">Investment Range</Label>
            <Select
              value={data.investmentRange || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "investmentRange", value)}
            >
              <SelectTrigger id="inv-range" data-testid="select-inv-range">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {investmentRanges.map((range) => (
                  <SelectItem key={range} value={range}>{range}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-stage">Preferred Investment Stage</Label>
            <Select
              value={data.preferredStage || ""}
              onValueChange={(value) => handleRoleFormDataChange(roleId, "preferredStage", value)}
            >
              <SelectTrigger id="inv-stage" data-testid="select-inv-stage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {businessStages.map((stage) => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="inv-sectors">Investment Sectors (comma-separated)</Label>
            <Input
              id="inv-sectors"
              value={data.investmentSectors || ""}
              onChange={(e) => handleRoleFormDataChange(roleId, "investmentSectors", e.target.value)}
              placeholder="e.g., Technology, Healthcare, FinTech, E-commerce"
              data-testid="input-inv-sectors"
            />
          </div>
        </div>
      );
    }

    return null;
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16 md:py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-3xl">Complete Your Profile</CardTitle>
              <p className="text-muted-foreground">
                Step {getCurrentStepDisplay()} of {getTotalSteps()}: {getStepLabel()}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => e.preventDefault()}>
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
                        <Label htmlFor="country">Country *</Label>
                        <Select
                          required
                          value={basicInfo.country}
                          onValueChange={(value) => handleBasicInfoChange("country", value)}
                        >
                          <SelectTrigger id="country" data-testid="select-country">
                            <SelectValue placeholder="Select your country" />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Select
                          value={basicInfo.city}
                          onValueChange={(value) => handleBasicInfoChange("city", value)}
                        >
                          <SelectTrigger id="city" data-testid="select-city">
                            <SelectValue placeholder="Select your city" />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.name}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            className={`cursor-pointer transition-all hover-elevate ${isSelected ? "border-primary border-2" : ""
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
                        data-testid="button-back-step-2"
                      >
                        <ArrowLeft className="mr-2 w-4 h-4" /> Back
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNextFromStep2}
                        disabled={!hasSelectedRoles}
                        size="lg"
                        data-testid="button-next-step-2"
                      >
                        Next <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && currentRoleId && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {roleLabels[currentRoleId]} Profile
                        {totalRoleForms > 1 && (
                          <span className="text-muted-foreground font-normal text-base ml-2">
                            ({currentRoleFormIndex + 1} of {totalRoleForms})
                          </span>
                        )}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Fill in the details for your {roleLabels[currentRoleId].toLowerCase()} profile.
                      </p>
                    </div>

                    {renderRoleForm(currentRoleId)}

                    <div className="flex justify-between gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevRoleForm}
                        size="lg"
                        data-testid="button-back-role-form"
                      >
                        <ArrowLeft className="mr-2 w-4 h-4" /> Back
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNextRoleForm}
                        disabled={loading}
                        size="lg"
                        data-testid="button-next-role-form"
                      >
                        {loading ? "Completing Profile..." : isLastRoleForm ? "Complete Profile" : "Next"}
                        {!isLastRoleForm && <ArrowRight className="ml-2 w-4 h-4" />}
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
