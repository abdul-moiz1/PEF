import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, Edit, MapPin, Calendar, Briefcase, DollarSign, Mail } from "lucide-react";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const SECTORS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Real Estate",
  "Manufacturing",
  "Retail",
  "Energy",
  "Education",
  "Transportation",
  "Agriculture",
  "Hospitality",
  "Media & Entertainment",
  "Telecommunications",
  "Construction",
  "Other",
];

interface Country {
  id: string;
  code: string;
  name: string;
  phoneCode: string;
  isPrimary: boolean;
  comingSoon: boolean;
}

interface City {
  id: string;
  name: string;
}

interface Opportunity {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  sector?: string | null;
  country?: string | null;
  city?: string | null;
  budgetOrSalary?: string | null;
  contactPreference?: string | null;
  status: string;
  approvalStatus: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const opportunitySchema = z.object({
  type: z.enum(["investment", "partnership", "collaboration"]),
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  sector: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  budgetOrSalary: z.string().optional(),
  contactPreference: z.string().optional(),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

interface EditOpportunityDialogProps {
  opportunity: Opportunity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditOpportunityDialog({ 
  opportunity, 
  open, 
  onOpenChange 
}: EditOpportunityDialogProps) {
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      type: (opportunity.type as "investment" | "partnership" | "collaboration") || "investment",
      title: opportunity.title || "",
      description: opportunity.description || "",
      sector: opportunity.sector || "",
      country: opportunity.country || "",
      city: opportunity.city || "",
      budgetOrSalary: opportunity.budgetOrSalary || "",
      contactPreference: opportunity.contactPreference || "",
    },
  });

  const { data: countries = [], isLoading: countriesLoading } = useQuery<Country[]>({
    queryKey: ["/api/locations/countries"],
  });

  const { data: cities = [], isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ["/api/locations/countries", selectedCountryId, "cities"],
    queryFn: async () => {
      if (!selectedCountryId) return [];
      const response = await fetch(`/api/locations/countries/${selectedCountryId}/cities`);
      if (!response.ok) throw new Error("Failed to fetch cities");
      return response.json();
    },
    enabled: !!selectedCountryId,
  });

  useEffect(() => {
    if (open && opportunity) {
      form.reset({
        type: (opportunity.type as "investment" | "partnership" | "collaboration") || "investment",
        title: opportunity.title || "",
        description: opportunity.description || "",
        sector: opportunity.sector || "",
        country: opportunity.country || "",
        city: opportunity.city || "",
        budgetOrSalary: opportunity.budgetOrSalary || "",
        contactPreference: opportunity.contactPreference || "",
      });
      
      if (opportunity.country && countries.length > 0) {
        const country = countries.find(c => c.name === opportunity.country);
        if (country) {
          setSelectedCountryId(country.id);
        }
      }
    }
  }, [open, opportunity, countries, form]);

  const updateOpportunityMutation = useMutation({
    mutationFn: async (data: OpportunityFormData) => {
      if (!currentUser) throw new Error("Not authenticated");
      
      const response = await apiRequest("PATCH", `/api/opportunities/${opportunity.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: "Success!",
        description: "Your opportunity has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update opportunity",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OpportunityFormData) => {
    updateOpportunityMutation.mutate(data);
  };

  const handleCountryChange = (countryName: string) => {
    form.setValue("country", countryName);
    form.setValue("city", "");
    const country = countries.find(c => c.name === countryName);
    setSelectedCountryId(country?.id || "");
  };

  const [activeTab, setActiveTab] = useState<string>("preview");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Opportunity</DialogTitle>
          <DialogDescription>
            Preview or edit your opportunity details
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview" data-testid="tab-preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="edit" data-testid="tab-edit">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4 space-y-4">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{opportunity.type}</Badge>
                <Badge variant={opportunity.status === "open" ? "default" : "secondary"}>
                  {opportunity.status}
                </Badge>
                <Badge variant={opportunity.approvalStatus === "approved" ? "default" : opportunity.approvalStatus === "rejected" ? "destructive" : "secondary"}>
                  {opportunity.approvalStatus}
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-semibold">{opportunity.title}</h3>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{opportunity.description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                {opportunity.sector && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>{opportunity.sector}</span>
                  </div>
                )}
                {(opportunity.country || opportunity.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{[opportunity.city, opportunity.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {opportunity.budgetOrSalary && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>{opportunity.budgetOrSalary}</span>
                  </div>
                )}
                {opportunity.contactPreference && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{opportunity.contactPreference}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Posted {format(new Date(opportunity.createdAt), "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setActiveTab("edit")} data-testid="button-go-to-edit">
                <Edit className="w-4 h-4 mr-2" />
                Edit Opportunity
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="edit" className="mt-4">
            <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opportunity Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="edit-select-opportunity-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="investment">Investment Opportunity</SelectItem>
                      <SelectItem value="partnership">Sponsorship</SelectItem>
                      <SelectItem value="collaboration">Collaboration Project</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Seeking $2M Series A for Clean Energy Expansion" 
                      {...field} 
                      data-testid="edit-input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide detailed information about this opportunity..."
                      className="min-h-32"
                      {...field}
                      data-testid="edit-textarea-description"
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 50 characters - be specific about your opportunity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector/Industry</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-sector">
                          <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SECTORS.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budgetOrSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget/Investment Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., $1M - $5M" {...field} data-testid="edit-input-budget" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select 
                      onValueChange={handleCountryChange} 
                      value={field.value}
                      disabled={countriesLoading}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-country">
                          <SelectValue placeholder={countriesLoading ? "Loading..." : "Select country"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedCountryId || citiesLoading}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-city">
                          <SelectValue placeholder={
                            !selectedCountryId 
                              ? "Select country first" 
                              : citiesLoading 
                                ? "Loading..." 
                                : "Select city"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactPreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Your contact email or method" {...field} data-testid="edit-input-contact" />
                  </FormControl>
                  <FormDescription>
                    Your email and any additional contact methods
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateOpportunityMutation.isPending}
                data-testid="edit-button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateOpportunityMutation.isPending}
                data-testid="edit-button-submit"
              >
                {updateOpportunityMutation.isPending ? "Updating..." : "Update Opportunity"}
              </Button>
            </div>
          </form>
        </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
