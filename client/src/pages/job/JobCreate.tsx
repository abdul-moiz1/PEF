import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createJobPost } from "@/lib/firestoreUtils";
import { Briefcase } from "lucide-react";

interface Country {
  id: number;
  code: string;
  name: string;
}

export default function JobCreate() {
  const { currentUser } = useAuth();
  const { hasRole } = useUserRoles(currentUser?.uid);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/locations/countries"],
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    country: "",
    city: "",
    employmentType: "full-time" as "full-time" | "part-time" | "remote" | "contract",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    requirements: "",
    skills: "",
    benefits: "",
  });

  if (!hasRole("employer")) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 md:pt-28 pb-16 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>Only employers can post jobs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/dashboard")} data-testid="button-go-dashboard">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!formData.title || !formData.description || !formData.location) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, description, and location.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const jobPostData = {
        employerId: currentUser.uid,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        country: formData.country,
        city: formData.city,
        employmentType: formData.employmentType,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
        salaryCurrency: formData.salaryCurrency,
        requirements: formData.requirements.split("\n").filter((r) => r.trim()),
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        benefits: formData.benefits.split(",").map((b) => b.trim()).filter(Boolean),
        status: "open" as const,
        approvalStatus: "pending" as const,
        applicants: [],
      };

      const jobId = await createJobPost(jobPostData);

      toast({
        title: "Job posted successfully!",
        description: "Your job posting is now live and pending approval.",
      });

      setLocation(`/job/${jobId}`);
    } catch (error) {
      console.error("Error creating job post:", error);
      toast({
        title: "Error",
        description: "Failed to create job posting. Please try again.",
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
              <CardTitle className="text-2xl flex items-center gap-2">
                <Briefcase className="w-6 h-6" />
                Post a Job
              </CardTitle>
              <CardDescription>Create a new job posting to find qualified candidates</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Senior Software Engineer"
                      required
                      data-testid="input-job-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the role, responsibilities, and what you're looking for..."
                      rows={6}
                      required
                      data-testid="input-job-description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., New York, NY"
                        required
                        data-testid="input-job-location"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) => setFormData({ ...formData, country: value })}
                      >
                        <SelectTrigger id="country" data-testid="select-job-country">
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
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g., New York"
                        data-testid="input-job-city"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(value: any) => setFormData({ ...formData, employmentType: value })}
                    >
                      <SelectTrigger data-testid="select-employment-type">
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salaryMin">Min Salary</Label>
                      <Input
                        id="salaryMin"
                        type="number"
                        value={formData.salaryMin}
                        onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                        placeholder="50000"
                        data-testid="input-salary-min"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salaryMax">Max Salary</Label>
                      <Input
                        id="salaryMax"
                        type="number"
                        value={formData.salaryMax}
                        onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                        placeholder="80000"
                        data-testid="input-salary-max"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salaryCurrency">Currency</Label>
                      <Input
                        id="salaryCurrency"
                        value={formData.salaryCurrency}
                        onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value })}
                        placeholder="USD"
                        data-testid="input-salary-currency"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements (one per line)</Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="5+ years of experience in software development&#10;Bachelor's degree in Computer Science&#10;Strong communication skills"
                      rows={4}
                      data-testid="input-job-requirements"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">Required Skills (comma-separated)</Label>
                    <Input
                      id="skills"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="JavaScript, React, Node.js, TypeScript"
                      data-testid="input-job-skills"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="benefits">Benefits (comma-separated)</Label>
                    <Input
                      id="benefits"
                      value={formData.benefits}
                      onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                      placeholder="Health insurance, 401k, Remote work, Flexible hours"
                      data-testid="input-job-benefits"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/dashboard/employer")}
                    disabled={loading}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1" data-testid="button-post-job">
                    {loading ? "Posting..." : "Post Job"}
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
