import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Plus } from "lucide-react";

interface Country {
  id: string;
  code: string;
  name: string;
  phoneCode: string | null;
}

interface City {
  id: string;
  name: string;
}

interface PublicOpportunityFormData {
  name: string;
  email: string;
  type: string;
  title: string;
  description: string;
  sector: string;
  country: string;
  city: string;
  budgetOrSalary: string;
  contactPreference: string;
  employmentType: "full-time" | "part-time" | "remote" | "contract";
  experienceRequired: string;
  skills: string;
  benefits: string;
  applicationEmail: string;
  investmentAmount: string;
  investmentType: string;
  partnershipType: string;
}

export default function PublicOpportunityForm() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");

  const { data: countries = [], isLoading: countriesLoading } = useQuery<Country[]>({
    queryKey: ["/api/locations/countries"],
  });

  const { data: cities = [], isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ["/api/locations/countries", selectedCountryId, "cities"],
    enabled: !!selectedCountryId,
    queryFn: async () => {
      const response = await fetch(`/api/locations/countries/${selectedCountryId}/cities`);
      if (!response.ok) throw new Error("Failed to fetch cities");
      return response.json();
    },
  });
  
  const initialFormData: PublicOpportunityFormData = {
    name: "",
    email: "",
    type: "",
    title: "",
    description: "",
    sector: "",
    country: "",
    city: "",
    budgetOrSalary: "",
    contactPreference: "",
    employmentType: "full-time",
    experienceRequired: "",
    skills: "",
    benefits: "",
    applicationEmail: "",
    investmentAmount: "",
    investmentType: "",
    partnershipType: "",
  };
  
  const [formData, setFormData] = useState<PublicOpportunityFormData>(initialFormData);

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedCountryId("");
    setSelectedCityId("");
  };

  const submitMutation = useMutation({
    mutationFn: async (data: PublicOpportunityFormData) => {
      const response = await fetch("/api/public-opportunities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit opportunity");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Opportunity submitted successfully!",
        description: "Your opportunity is now live on the board.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      resetForm();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit opportunity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({ title: "Valid email is required", variant: "destructive" });
      return;
    }
    
    if (!formData.type) {
      toast({ title: "Please select an opportunity type", variant: "destructive" });
      return;
    }
    
    if (formData.title.length < 10) {
      toast({ title: "Title must be at least 10 characters", variant: "destructive" });
      return;
    }
    
    if (formData.description.length < 20) {
      toast({ title: "Description must be at least 20 characters", variant: "destructive" });
      return;
    }

    if (!formData.country.trim()) {
      toast({ title: "Country is required", variant: "destructive" });
      return;
    }
    
    if (formData.type === "job") {
      if (!formData.applicationEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.applicationEmail)) {
        toast({ title: "Valid application email is required for job postings", variant: "destructive" });
        return;
      }
    } else {
      if (!formData.contactPreference.trim()) {
        toast({ title: "Contact information is required", variant: "destructive" });
        return;
      }
      
      const emailMatch = formData.contactPreference.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (!emailMatch) {
        toast({ 
          title: "Email required in contact information", 
          description: "Please include an email address so interested parties can reach you via the 'Contact Now' button",
          variant: "destructive" 
        });
        return;
      }
    }
    
    submitMutation.mutate(formData);
  };

  const handleChange = (field: keyof PublicOpportunityFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDialogChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    setOpen(newOpen);
  };

  const handleCountryChange = (countryId: string) => {
    const country = countries.find(c => c.id === countryId);
    setSelectedCountryId(countryId);
    setSelectedCityId("");
    handleChange("country", country?.name || "");
    handleChange("city", "");
  };

  const handleCityChange = (cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    setSelectedCityId(cityId);
    handleChange("city", city?.name || "");
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button size="lg" data-testid="button-post-opportunity">
          <Plus className="w-5 h-5 mr-2" />
          Post Opportunity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post an Opportunity</DialogTitle>
          <DialogDescription>
            Share your job, business, or investment opportunity with our global community
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="John Doe"
              required
              data-testid="input-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="john@example.com"
              required
              data-testid="input-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Opportunity Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange("type", value)}
            >
              <SelectTrigger id="type" data-testid="select-type">
                <SelectValue placeholder="Select opportunity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="job">Job Opening</SelectItem>
                <SelectItem value="investment">Investment Opportunity</SelectItem>
                <SelectItem value="partnership">Sponsorship</SelectItem>
                <SelectItem value="collaboration">Business Collaboration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              {formData.type === "job" ? "Job Title" : "Opportunity Title"} *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder={
                formData.type === "job"
                  ? "e.g. Senior Software Engineer"
                  : "e.g. Seeking Investment for Tech Startup"
              }
              required
              data-testid="input-title"
            />
          </div>

          {formData.type === "job" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => handleChange("employmentType", value)}
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
                  onChange={(e) => handleChange("sector", e.target.value)}
                  placeholder="e.g. Technology, Healthcare"
                  data-testid="input-sector"
                />
              </div>
            </div>
          )}

          {formData.type !== "job" && (
            <div className="space-y-2">
              <Label htmlFor="sector">Industry/Sector</Label>
              <Input
                id="sector"
                value={formData.sector}
                onChange={(e) => handleChange("sector", e.target.value)}
                placeholder="e.g. Technology, Healthcare"
                data-testid="input-sector"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select
                value={selectedCountryId}
                onValueChange={handleCountryChange}
              >
                <SelectTrigger id="country" data-testid="select-country">
                  <SelectValue placeholder={countriesLoading ? "Loading..." : "Select country"} />
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
                value={selectedCityId}
                onValueChange={handleCityChange}
                disabled={!selectedCountryId || citiesLoading}
              >
                <SelectTrigger id="city" data-testid="select-city">
                  <SelectValue placeholder={
                    !selectedCountryId 
                      ? "Select country first" 
                      : citiesLoading 
                        ? "Loading..." 
                        : cities.length === 0 
                          ? "No cities available" 
                          : "Select city"
                  } />
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
            <Label htmlFor="description">
              {formData.type === "job" ? "Job Description" : "Description"} *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder={
                formData.type === "job"
                  ? "Describe the role, responsibilities, and requirements..."
                  : "Describe your opportunity in detail..."
              }
              rows={5}
              required
              data-testid="input-description"
            />
          </div>

          {formData.type === "job" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="experienceRequired">Experience Required</Label>
                <Input
                  id="experienceRequired"
                  value={formData.experienceRequired}
                  onChange={(e) => handleChange("experienceRequired", e.target.value)}
                  placeholder="e.g. 5+ years in software development"
                  data-testid="input-experience"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Required Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => handleChange("skills", e.target.value)}
                  placeholder="e.g. React, TypeScript, Node.js"
                  data-testid="input-skills"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetOrSalary">Salary Range</Label>
                <Input
                  id="budgetOrSalary"
                  value={formData.budgetOrSalary}
                  onChange={(e) => handleChange("budgetOrSalary", e.target.value)}
                  placeholder="e.g. $80,000 - $120,000/year"
                  data-testid="input-salary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefits">Benefits (comma-separated)</Label>
                <Input
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => handleChange("benefits", e.target.value)}
                  placeholder="e.g. Health insurance, 401k, Remote work"
                  data-testid="input-benefits"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationEmail">Application Email *</Label>
                <Input
                  id="applicationEmail"
                  type="email"
                  required
                  value={formData.applicationEmail}
                  onChange={(e) => handleChange("applicationEmail", e.target.value)}
                  placeholder="e.g. careers@company.com"
                  data-testid="input-application-email"
                />
              </div>
            </>
          )}

          {formData.type === "investment" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="investmentAmount">Investment Amount Sought</Label>
                <Input
                  id="investmentAmount"
                  value={formData.investmentAmount}
                  onChange={(e) => handleChange("investmentAmount", e.target.value)}
                  placeholder="e.g. $500,000 - $1,000,000"
                  data-testid="input-investment-amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="investmentType">Investment Type</Label>
                <Input
                  id="investmentType"
                  value={formData.investmentType}
                  onChange={(e) => handleChange("investmentType", e.target.value)}
                  placeholder="e.g. Equity, Debt, Convertible Note"
                  data-testid="input-investment-type"
                />
              </div>
            </>
          )}

          {formData.type === "partnership" && (
            <div className="space-y-2">
              <Label htmlFor="partnershipType">Partnership Type</Label>
              <Input
                id="partnershipType"
                value={formData.partnershipType}
                onChange={(e) => handleChange("partnershipType", e.target.value)}
                placeholder="e.g. Strategic, Financial, Technology"
                data-testid="input-partnership-type"
              />
            </div>
          )}

          {formData.type !== "job" && (
            <div className="space-y-2">
              <Label htmlFor="budgetOrSalary">Budget/Investment Amount</Label>
              <Input
                id="budgetOrSalary"
                value={formData.budgetOrSalary}
                onChange={(e) => handleChange("budgetOrSalary", e.target.value)}
                placeholder="e.g. $50,000"
                data-testid="input-budget"
              />
            </div>
          )}

          {formData.type !== "job" && (
            <div className="space-y-2">
              <Label htmlFor="contactPreference">Contact Information *</Label>
              <Textarea
                id="contactPreference"
                value={formData.contactPreference}
                onChange={(e) => handleChange("contactPreference", e.target.value)}
                placeholder="Email (required): contact@example.com or phone/website..."
                rows={2}
                required
                data-testid="textarea-contact"
              />
              <p className="text-xs text-muted-foreground">
                Include an email address for the "Contact Now" button to work
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogChange(false)}
              disabled={submitMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              data-testid="button-submit"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Opportunity"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
