import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { updateUserData } from "@/lib/firestoreUtils";
import { 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  Briefcase,
  Building2,
  TrendingUp,
  Target,
  Handshake,
  Sparkles
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface FieldConfig {
  id: string;
  name: string;
  parentId: string | null;
  isMainField: boolean;
  enabled: boolean;
}

interface OnboardingCardProps {
  roleType: "jobSeeker" | "professional" | "employer" | "businessOwner" | "investor";
  onComplete?: () => void;
}

const roleLabels: Record<string, string> = {
  jobSeeker: "Job Seeker",
  professional: "Professional",
  employer: "Employer",
  businessOwner: "Business Owner",
  investor: "Investor",
};

const roleIcons: Record<string, typeof Target> = {
  jobSeeker: Target,
  professional: Briefcase,
  employer: Building2,
  businessOwner: Handshake,
  investor: TrendingUp,
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

function getRoleDataFromUserData(userData: unknown, roleType: string): Record<string, unknown> {
  if (!userData || typeof userData !== 'object') return {};
  const data = userData as Record<string, unknown>;
  const roleDataKey = `${roleType}Data`;
  const roleData = data[roleDataKey];
  if (!roleData || typeof roleData !== 'object') return {};
  return roleData as Record<string, unknown>;
}

export function OnboardingCard({ roleType, onComplete }: OnboardingCardProps) {
  const { currentUser, userData, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: fields = [] } = useQuery<FieldConfig[]>({
    queryKey: ["/api/fields"],
  });

  const mainFields = fields.filter((f) => f.isMainField && f.enabled);

  const roleData = getRoleDataFromUserData(userData, roleType);

  const safeString = (val: unknown): string => {
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.join(", ");
    return "";
  };

  const getInitialFormData = (): Record<string, string> => {
    if (roleType === "jobSeeker") {
      return {
        educationLevel: safeString(roleData.educationLevel),
        field: safeString(roleData.field),
        subField: safeString(roleData.subField),
        yearsOfExperience: safeString(roleData.yearsOfExperience),
        skills: safeString(roleData.skills),
      };
    } else if (roleType === "professional") {
      return {
        currentJobTitle: safeString(roleData.title || roleData.currentJobTitle),
        educationLevel: safeString(roleData.educationLevel),
        field: safeString(roleData.field),
        subField: safeString(roleData.subField),
        experienceLevel: safeString(roleData.experience || roleData.experienceLevel),
        skills: safeString(roleData.skills),
      };
    } else if (roleType === "employer") {
      let jobPostingValue = "";
      if (roleData.jobPostingPermissions === true || roleData.jobPostingPermissions === "yes") {
        jobPostingValue = "yes";
      } else if (roleData.jobPostingPermissions === false || roleData.jobPostingPermissions === "no") {
        jobPostingValue = "no";
      }
      return {
        companyName: safeString(roleData.companyName),
        companyWebsite: safeString(roleData.website || roleData.companyWebsite),
        companySize: safeString(roleData.companySize),
        field: safeString(roleData.industry || roleData.field),
        jobPostingPermissions: jobPostingValue,
      };
    } else if (roleType === "businessOwner") {
      return {
        businessName: safeString(roleData.businessName),
        businessDescription: safeString(roleData.businessDescription),
        businessSector: safeString(roleData.industry || roleData.businessSector),
        businessStage: safeString(roleData.businessStage),
        investmentRequired: safeString(roleData.investmentRequired),
        partnershipsNeeded: safeString(roleData.partnershipsNeeded),
      };
    } else {
      return {
        investmentSectors: safeString(roleData.investmentFocus || roleData.investmentSectors),
        investmentRange: safeString(roleData.investmentRange),
        preferredStage: safeString(roleData.preferredStage),
      };
    }
  };

  const [formData, setFormData] = useState<Record<string, string>>(getInitialFormData);

  const getSubFields = (mainFieldName: string) => {
    const mainField = fields.find((f) => f.name === mainFieldName && f.isMainField);
    if (!mainField) return [];
    return fields.filter((f) => f.parentId === mainField.id && f.enabled);
  };

  const calculateProgress = () => {
    const values = Object.values(formData);
    const filled = values.filter((v) => v && v.toString().trim() !== "").length;
    return Math.round((filled / values.length) * 100);
  };

  const isComplete = () => {
    if (roleType === "jobSeeker") {
      return !!(formData.educationLevel && formData.field && formData.skills);
    } else if (roleType === "professional") {
      return !!(formData.currentJobTitle && formData.field && formData.skills);
    } else if (roleType === "employer") {
      return !!(formData.companyName && formData.field && formData.jobPostingPermissions);
    } else if (roleType === "businessOwner") {
      return !!(formData.businessName && formData.businessSector);
    } else {
      return !!(formData.investmentRange);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      let updateData: Record<string, unknown> = {};
      const existingData = (userData as unknown as Record<string, unknown>) || {};

      if (roleType === "jobSeeker") {
        const existingRoleData = (existingData.jobSeekerData as Record<string, unknown>) || {};
        updateData = {
          jobSeekerData: {
            ...existingRoleData,
            educationLevel: formData.educationLevel,
            field: formData.field,
            subField: formData.subField,
            yearsOfExperience: formData.yearsOfExperience,
            skills: (formData.skills || "").split(",").map((s: string) => s.trim()).filter(Boolean),
          },
        };
      } else if (roleType === "professional") {
        const existingRoleData = (existingData.professionalData as Record<string, unknown>) || {};
        updateData = {
          professionalData: {
            ...existingRoleData,
            title: formData.currentJobTitle,
            currentJobTitle: formData.currentJobTitle,
            educationLevel: formData.educationLevel,
            field: formData.field,
            subField: formData.subField,
            experience: formData.experienceLevel,
            experienceLevel: formData.experienceLevel,
            skills: (formData.skills || "").split(",").map((s: string) => s.trim()).filter(Boolean),
          },
        };
      } else if (roleType === "employer") {
        const existingRoleData = (existingData.employerData as Record<string, unknown>) || {};
        updateData = {
          employerData: {
            ...existingRoleData,
            companyName: formData.companyName,
            website: formData.companyWebsite,
            companyWebsite: formData.companyWebsite,
            companySize: formData.companySize,
            industry: formData.field,
            field: formData.field,
            jobPostingPermissions: formData.jobPostingPermissions === "yes",
          },
        };
      } else if (roleType === "businessOwner") {
        const existingRoleData = (existingData.businessOwnerData as Record<string, unknown>) || {};
        updateData = {
          businessOwnerData: {
            ...existingRoleData,
            businessName: formData.businessName,
            businessDescription: formData.businessDescription,
            industry: formData.businessSector,
            businessSector: formData.businessSector,
            businessStage: formData.businessStage,
            investmentRequired: formData.investmentRequired,
            partnershipsNeeded: formData.partnershipsNeeded,
          },
        };
      } else {
        const existingRoleData = (existingData.investorData as Record<string, unknown>) || {};
        updateData = {
          investorData: {
            ...existingRoleData,
            investmentFocus: (formData.investmentSectors || "").split(",").map((s: string) => s.trim()).filter(Boolean),
            investmentSectors: (formData.investmentSectors || "").split(",").map((s: string) => s.trim()).filter(Boolean),
            investmentRange: formData.investmentRange,
            preferredStage: formData.preferredStage,
          },
        };
      }

      await updateUserData(currentUser.uid, updateData);
      await refreshUserData();

      toast({
        title: "Profile Updated",
        description: `Your ${roleLabels[roleType]} information has been saved.`,
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      toast({
        title: "Error",
        description: "Failed to save your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const progress = calculateProgress();
  const complete = isComplete();
  const Icon = roleIcons[roleType];

  if (complete && progress === 100) {
    return null;
  }

  return (
    <Card className={`border-2 ${complete ? "border-green-500/30" : "border-primary/30"} bg-gradient-to-br from-primary/5 to-transparent`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {complete ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Sparkles className="w-5 h-5 text-primary" />
            )}
            <CardTitle className="text-lg">
              Complete Your {roleLabels[roleType]} Profile
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={complete ? "default" : "secondary"} className="text-xs">
              {progress}% complete
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid={`button-toggle-onboarding-${roleType}`}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <CardDescription>
          {complete 
            ? "Your profile is ready. You can still update your information below."
            : "Add more details to unlock all features and improve your visibility"}
        </CardDescription>
        {!isExpanded && (
          <Progress value={progress} className="mt-2" />
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <Progress value={progress} />

          {roleType === "jobSeeker" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="js-education">Education Level</Label>
                <Select
                  value={formData.educationLevel || ""}
                  onValueChange={(value) => setFormData({ ...formData, educationLevel: value })}
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
                  value={formData.field || ""}
                  onValueChange={(value) => setFormData({ ...formData, field: value, subField: "" })}
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

              {formData.field && getSubFields(formData.field).length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="js-subfield">Sub-Field</Label>
                  <Select
                    value={formData.subField || ""}
                    onValueChange={(value) => setFormData({ ...formData, subField: value })}
                  >
                    <SelectTrigger id="js-subfield" data-testid="select-js-subfield">
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSubFields(formData.field).map((sf) => (
                        <SelectItem key={sf.id} value={sf.name}>{sf.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="js-experience">Years of Experience</Label>
                <Select
                  value={formData.yearsOfExperience || ""}
                  onValueChange={(value) => setFormData({ ...formData, yearsOfExperience: value })}
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
                  value={formData.skills || ""}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="e.g., Project Management, Data Analysis, Python"
                  data-testid="input-js-skills"
                />
              </div>
            </div>
          )}

          {roleType === "professional" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prof-title">Current Job Title</Label>
                <Input
                  id="prof-title"
                  value={formData.currentJobTitle || ""}
                  onChange={(e) => setFormData({ ...formData, currentJobTitle: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  data-testid="input-prof-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prof-education">Education Level</Label>
                <Select
                  value={formData.educationLevel || ""}
                  onValueChange={(value) => setFormData({ ...formData, educationLevel: value })}
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
                  value={formData.field || ""}
                  onValueChange={(value) => setFormData({ ...formData, field: value, subField: "" })}
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

              {formData.field && getSubFields(formData.field).length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="prof-subfield">Sub-Field</Label>
                  <Select
                    value={formData.subField || ""}
                    onValueChange={(value) => setFormData({ ...formData, subField: value })}
                  >
                    <SelectTrigger id="prof-subfield" data-testid="select-prof-subfield">
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSubFields(formData.field).map((sf) => (
                        <SelectItem key={sf.id} value={sf.name}>{sf.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="prof-experience">Experience Level</Label>
                <Select
                  value={formData.experienceLevel || ""}
                  onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
                >
                  <SelectTrigger id="prof-experience" data-testid="select-prof-experience">
                    <SelectValue placeholder="Select experience level" />
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
                  value={formData.skills || ""}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="e.g., Leadership, Strategic Planning, Team Management"
                  data-testid="input-prof-skills"
                />
              </div>
            </div>
          )}

          {roleType === "employer" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emp-company">Company Name *</Label>
                <Input
                  id="emp-company"
                  value={formData.companyName || ""}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g., Acme Corporation"
                  data-testid="input-emp-company"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emp-website">Company Website</Label>
                <Input
                  id="emp-website"
                  type="url"
                  value={formData.companyWebsite || ""}
                  onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                  placeholder="https://company.com"
                  data-testid="input-emp-website"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emp-size">Company Size</Label>
                <Select
                  value={formData.companySize || ""}
                  onValueChange={(value) => setFormData({ ...formData, companySize: value })}
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
                <Label htmlFor="emp-field">Industry / Field *</Label>
                <Select
                  value={formData.field || ""}
                  onValueChange={(value) => setFormData({ ...formData, field: value })}
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

              <div className="space-y-2">
                <Label htmlFor="emp-permissions">Job Posting Permissions *</Label>
                <Select
                  value={formData.jobPostingPermissions || ""}
                  onValueChange={(value) => setFormData({ ...formData, jobPostingPermissions: value })}
                >
                  <SelectTrigger id="emp-permissions" data-testid="select-emp-permissions">
                    <SelectValue placeholder="Request job posting access" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes, I want to post jobs</SelectItem>
                    <SelectItem value="no">No, just browsing talent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {roleType === "businessOwner" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bo-name">Business Name *</Label>
                <Input
                  id="bo-name"
                  value={formData.businessName || ""}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g., My Startup Inc."
                  data-testid="input-bo-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bo-sector">Business Sector *</Label>
                <Select
                  value={formData.businessSector || ""}
                  onValueChange={(value) => setFormData({ ...formData, businessSector: value })}
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bo-description">Business Description</Label>
                <Textarea
                  id="bo-description"
                  value={formData.businessDescription || ""}
                  onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                  placeholder="Describe your business, products/services, and value proposition..."
                  rows={3}
                  data-testid="input-bo-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bo-stage">Business Stage</Label>
                <Select
                  value={formData.businessStage || ""}
                  onValueChange={(value) => setFormData({ ...formData, businessStage: value })}
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
                  value={formData.investmentRequired || ""}
                  onValueChange={(value) => setFormData({ ...formData, investmentRequired: value })}
                >
                  <SelectTrigger id="bo-investment" data-testid="select-bo-investment">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not seeking investment">Not seeking investment</SelectItem>
                    {investmentRanges.map((range) => (
                      <SelectItem key={range} value={range}>{range}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bo-partnerships">Partnership Opportunities</Label>
                <Input
                  id="bo-partnerships"
                  value={formData.partnershipsNeeded || ""}
                  onChange={(e) => setFormData({ ...formData, partnershipsNeeded: e.target.value })}
                  placeholder="e.g., Distribution partners, Technology partners, Strategic alliances"
                  data-testid="input-bo-partnerships"
                />
              </div>
            </div>
          )}

          {roleType === "investor" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-range">Investment Range *</Label>
                <Select
                  value={formData.investmentRange || ""}
                  onValueChange={(value) => setFormData({ ...formData, investmentRange: value })}
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
                  value={formData.preferredStage || ""}
                  onValueChange={(value) => setFormData({ ...formData, preferredStage: value })}
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
                  value={formData.investmentSectors || ""}
                  onChange={(e) => setFormData({ ...formData, investmentSectors: e.target.value })}
                  placeholder="e.g., Technology, Healthcare, FinTech, E-commerce"
                  data-testid="input-inv-sectors"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              data-testid={`button-save-onboarding-${roleType}`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save {roleLabels[roleType]} Details
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
