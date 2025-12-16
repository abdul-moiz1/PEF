import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, DollarSign, Mail, ArrowLeft, Eye } from "lucide-react";

interface Country {
  id: number;
  code: string;
  name: string;
}

interface City {
  id: number;
  name: string;
  countryId: string;
}

interface PostJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editJob?: {
    id: string | number;
    title: string;
    description: string;
    sector: string;
    country: string;
    city: string;
    budgetOrSalary: string;
    contactPreference: string;
    details?: {
      employmentType?: string;
      experienceRequired?: string;
      skills?: string[];
      benefits?: string[];
      applicationEmail?: string;
    };
  } | null;
}

export default function PostJobDialog({ open, onOpenChange, editJob }: PostJobDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  
  const employerEmail = currentUser?.email || "";
  
  const createEmptyFormData = () => ({
    title: "",
    description: "",
    sector: "",
    country: "",
    city: "",
    budgetOrSalary: "",
    contactPreference: "",
    employmentType: "full-time" as "full-time" | "part-time" | "remote" | "contract",
    experienceRequired: "",
    skills: "",
    benefits: "",
  });

  const getFormDataFromJob = (job: NonNullable<typeof editJob>) => ({
    title: job.title || "",
    description: job.description || "",
    sector: job.sector || "",
    country: job.country || "",
    city: job.city || "",
    budgetOrSalary: job.budgetOrSalary || "",
    contactPreference: job.contactPreference || "",
    employmentType: (job.details?.employmentType || "full-time") as "full-time" | "part-time" | "remote" | "contract",
    experienceRequired: job.details?.experienceRequired || "",
    skills: job.details?.skills?.join(", ") || "",
    benefits: job.details?.benefits?.join(", ") || "",
  });

  const [formData, setFormData] = useState(createEmptyFormData());

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/locations/countries"],
  });

  const selectedCountryId = countries.find(c => c.name === formData.country)?.id;

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/locations/countries", selectedCountryId, "cities"],
    queryFn: async () => {
      if (!selectedCountryId) return [];
      const response = await fetch(`/api/locations/countries/${selectedCountryId}/cities`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedCountryId,
  });

  useEffect(() => {
    if (open) {
      if (editJob) {
        setFormData(getFormDataFromJob(editJob));
      } else {
        setFormData(createEmptyFormData());
      }
      setShowPreview(false);
    }
  }, [open, editJob]);

  const saveJobMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!auth.currentUser) {
        throw new Error("You must be logged in to post a job");
      }

      const token = await auth.currentUser.getIdToken();
      if (!token) {
        throw new Error("Failed to get authentication token. Please try logging in again.");
      }
      
      const skillsArray = data.skills.split(",").map(s => s.trim()).filter(Boolean);
      const benefitsArray = data.benefits.split(",").map(b => b.trim()).filter(Boolean);
      
      const isEditing = !!editJob;
      const url = isEditing ? `/api/opportunities/${editJob.id}` : "/api/opportunities";
      const method = isEditing ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "job",
          title: data.title,
          description: data.description,
          sector: data.sector,
          country: data.country,
          city: data.city,
          budgetOrSalary: data.budgetOrSalary,
          contactPreference: data.contactPreference,
          details: {
            employmentType: data.employmentType,
            experienceRequired: data.experienceRequired,
            skills: skillsArray.length > 0 ? skillsArray : undefined,
            benefits: benefitsArray.length > 0 ? benefitsArray : undefined,
            applicationEmail: employerEmail,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEditing ? "update" : "create"} job posting`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: editJob 
          ? "Your job posting has been updated successfully!"
          : "Your job posting has been created and is pending approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save job posting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveJobMutation.mutate(formData);
  };

  const handlePreview = () => {
    if (!formData.title || !formData.description || !formData.country) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, description, and country before previewing.",
        variant: "destructive",
      });
      return;
    }
    setShowPreview(true);
  };

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(false)}
          data-testid="button-back-to-edit"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Edit
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-xl">{formData.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {formData.city ? `${formData.city}, ` : ""}{formData.country}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {formData.employmentType}
                </span>
                {formData.budgetOrSalary && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {formData.budgetOrSalary}
                  </span>
                )}
              </div>
            </div>
            <Badge variant="outline">Preview</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{formData.description}</p>
          </div>
          
          {formData.experienceRequired && (
            <div>
              <h4 className="font-medium mb-2">Experience Required</h4>
              <p className="text-sm text-muted-foreground">{formData.experienceRequired}</p>
            </div>
          )}
          
          {formData.skills && (
            <div>
              <h4 className="font-medium mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {formData.skills.split(",").map((skill, i) => (
                  <Badge key={i} variant="secondary">{skill.trim()}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {formData.benefits && (
            <div>
              <h4 className="font-medium mb-2">Benefits</h4>
              <div className="flex flex-wrap gap-2">
                {formData.benefits.split(",").map((benefit, i) => (
                  <Badge key={i} variant="outline">{benefit.trim()}</Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2 flex items-center gap-1">
              <Mail className="w-4 h-4" />
              Application Contact
            </h4>
            <p className="text-sm text-muted-foreground">{employerEmail}</p>
            {formData.contactPreference && (
              <p className="text-sm text-muted-foreground mt-1">{formData.contactPreference}</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-wrap gap-3 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPreview(false)}
          data-testid="button-edit-preview"
        >
          Edit
        </Button>
        <Button
          type="button"
          onClick={() => saveJobMutation.mutate(formData)}
          disabled={saveJobMutation.isPending}
          data-testid="button-confirm-post"
        >
          {saveJobMutation.isPending ? "Saving..." : editJob ? "Update Job" : "Confirm & Post"}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editJob ? "Edit Job Posting" : "Post a New Job"}</DialogTitle>
          <DialogDescription>
            {showPreview 
              ? "Review your job posting before submitting."
              : editJob 
                ? "Update your job posting details below."
                : "Fill out the form below to create a new job posting."}
          </DialogDescription>
        </DialogHeader>
        
        {showPreview ? renderPreview() : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                data-testid="input-job-title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => setFormData({ ...formData, employmentType: value as any })}
                >
                  <SelectTrigger id="employmentType" data-testid="select-employment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Industry/Sector</Label>
                <Input
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  placeholder="e.g. Technology, Healthcare"
                  data-testid="input-sector"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value, city: "" })}
                >
                  <SelectTrigger id="country" data-testid="select-country">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
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
                  disabled={!formData.country || cities.length === 0}
                >
                  <SelectTrigger id="city" data-testid="select-city">
                    <SelectValue placeholder={!formData.country ? "Select a country first" : cities.length === 0 ? "No cities available" : "Select a city"} />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role, responsibilities, and requirements..."
                rows={5}
                data-testid="textarea-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceRequired">Experience Required</Label>
              <Input
                id="experienceRequired"
                value={formData.experienceRequired}
                onChange={(e) => setFormData({ ...formData, experienceRequired: e.target.value })}
                placeholder="e.g. 5+ years in software development"
                data-testid="input-experience"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Required Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="e.g. React, TypeScript, Node.js"
                data-testid="input-skills"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetOrSalary">Salary Range</Label>
              <Input
                id="budgetOrSalary"
                value={formData.budgetOrSalary}
                onChange={(e) => setFormData({ ...formData, budgetOrSalary: e.target.value })}
                placeholder="e.g. $80,000 - $120,000/year"
                data-testid="input-salary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits (comma-separated)</Label>
              <Input
                id="benefits"
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder="e.g. Health insurance, 401k, Remote work"
                data-testid="input-benefits"
              />
            </div>

            <div className="space-y-2">
              <Label>Application Email</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{employerEmail}</span>
                <Badge variant="secondary" className="ml-auto">Auto-filled</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Applications will be sent to your account email.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPreference">Additional Contact Information</Label>
              <Textarea
                id="contactPreference"
                value={formData.contactPreference}
                onChange={(e) => setFormData({ ...formData, contactPreference: e.target.value })}
                placeholder="Phone number, website, or other contact details..."
                rows={2}
                data-testid="textarea-contact"
              />
            </div>

            <div className="flex flex-wrap gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saveJobMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={saveJobMutation.isPending}
                data-testid="button-preview"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                type="submit"
                disabled={saveJobMutation.isPending}
                data-testid="button-submit-job"
              >
                {saveJobMutation.isPending ? "Saving..." : editJob ? "Update Job" : "Post Job"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
