import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PublicOpportunityForm from "@/components/PublicOpportunityForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Briefcase, TrendingUp, Handshake, Building2, MapPin, Calendar, Mail, DollarSign, User, Clock, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Opportunity, JobDetails } from "@shared/schema";

const opportunityTypes = [
  {
    icon: Briefcase,
    title: "Job Openings",
    description: "Employment opportunities across various sectors and experience levels",
    color: "bg-blue-500",
  },
  {
    icon: TrendingUp,
    title: "Investment Opportunities",
    description: "Funding and investment prospects for growth-ready businesses",
    color: "bg-green-500",
  },
  {
    icon: Handshake,
    title: "Sponsorship",
    description: "Strategic collaborations and business partnerships",
    color: "bg-purple-500",
  },
  {
    icon: Building2,
    title: "Expansion Projects",
    description: "Business growth and market expansion initiatives",
    color: "bg-orange-500",
  },
];

const getOpportunityTypeDisplay = (type: string) => {
  switch (type) {
    case "job":
      return { label: "Job Opening", className: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100" };
    case "investment":
      return { label: "Investment", className: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" };
    case "partnership":
      return { label: "Sponsorship", className: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100" };
    case "collaboration":
      return { label: "Collaboration", className: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100" };
    default:
      return { label: "Opportunity", className: "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100" };
  }
};

function OpportunityPreviewDialog({ 
  opportunity, 
  open, 
  onClose 
}: { 
  opportunity: Opportunity | null; 
  open: boolean; 
  onClose: () => void;
}) {
  const { toast } = useToast();
  
  if (!opportunity) return null;
  
  const details = (opportunity.details as any) || {};
  const typeDisplay = getOpportunityTypeDisplay(opportunity.type);
  
  const getContactEmail = () => {
    if (opportunity.type === "job" && details.applicationEmail) {
      return details.applicationEmail;
    }
    const emailMatch = opportunity.contactPreference?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0] : null;
  };
  
  const contactEmail = getContactEmail();
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-opportunity-preview">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="secondary" className={typeDisplay.className}>
              {typeDisplay.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {opportunity.status === "open" ? "Open" : "Closed"}
            </Badge>
            {opportunity.sector && (
              <Badge variant="outline" className="text-xs">
                {opportunity.sector}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-2xl">{opportunity.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-1 text-sm">
            <MapPin className="w-4 h-4" />
            {opportunity.city ? `${opportunity.city}, ` : ""}{opportunity.country}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">{opportunity.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunity.budgetOrSalary && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">
                    {opportunity.type === "job" ? "Salary" : opportunity.type === "investment" ? "Funding Amount" : "Budget"}
                  </p>
                  <p className="text-muted-foreground">{opportunity.budgetOrSalary}</p>
                </div>
              </div>
            )}
            
            {opportunity.type === "job" && details.employmentType && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Employment Type</p>
                  <p className="text-muted-foreground capitalize">{details.employmentType}</p>
                </div>
              </div>
            )}
            
            {opportunity.type === "job" && details.experienceRequired && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Experience Required</p>
                  <p className="text-muted-foreground">{details.experienceRequired}</p>
                </div>
              </div>
            )}
            
            {opportunity.type === "investment" && details.investmentType && (
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Investment Type</p>
                  <p className="text-muted-foreground">{details.investmentType}</p>
                </div>
              </div>
            )}
            
            {opportunity.type === "partnership" && details.partnershipType && (
              <div className="flex items-start gap-3">
                <Handshake className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Partnership Type</p>
                  <p className="text-muted-foreground">{details.partnershipType}</p>
                </div>
              </div>
            )}
          </div>
          
          {opportunity.type === "job" && details.skills && Array.isArray(details.skills) && details.skills.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {details.skills.map((skill: string, i: number) => (
                  <Badge key={i} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {opportunity.type === "job" && details.benefits && (
            <div>
              <h4 className="font-semibold mb-2">Benefits</h4>
              <p className="text-muted-foreground">{details.benefits}</p>
            </div>
          )}
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Contact Information</h4>
            {contactEmail ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span data-testid="text-opportunity-email">{contactEmail}</span>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => {
                    const subject = encodeURIComponent(`Inquiry: ${opportunity.title}`);
                    window.location.href = `mailto:${contactEmail}?subject=${subject}`;
                  }}
                  data-testid="button-contact-opportunity"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {opportunity.type === "job" ? "Apply Now" : "Contact Now"}
                </Button>
              </div>
            ) : opportunity.contactPreference ? (
              <div className="space-y-3">
                <p className="text-muted-foreground" data-testid="text-opportunity-contact">
                  {opportunity.contactPreference}
                </p>
                <Button 
                  className="w-full"
                  onClick={async () => {
                    try {
                      if (navigator.clipboard?.writeText) {
                        await navigator.clipboard.writeText(opportunity.contactPreference || "");
                        toast({
                          title: "Contact Copied!",
                          description: "Contact information has been copied to your clipboard.",
                        });
                      } else {
                        toast({
                          title: "Contact Information",
                          description: opportunity.contactPreference || "",
                          duration: 5000,
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Contact Information",
                        description: opportunity.contactPreference || "",
                        duration: 5000,
                      });
                    }
                  }}
                  data-testid="button-copy-contact"
                >
                  Copy Contact Info
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No contact information provided</p>
            )}
          </div>
          
          {opportunity.createdAt && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Posted: {new Date(opportunity.createdAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Opportunities() {
  const { toast } = useToast();
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const { data: opportunities = [], isLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
    queryFn: async () => {
      const response = await fetch("/api/opportunities");
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
  });
  
  const handleCardClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setPreviewOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="relative py-24 md:py-32 bg-gradient-to-br from-primary to-[hsl(213,58%,35%)] text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              Discover Opportunities
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Across Sectors and Countries
            </p>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mt-4">
              The Opportunity Board connects members with curated, high-quality listings created by approved users.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-center">
              Types of Opportunities
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto text-lg">
              Every listing is reviewed to ensure clarity, relevance, and professionalism.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {opportunityTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card key={type.title} className="border-2 hover:border-primary/30 transition-all hover-elevate" data-testid={`card-opportunity-type-${type.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 ${type.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{type.title}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center mb-16">
              <p className="text-muted-foreground">
                Plus: <strong>Collaborative initiatives</strong> and other professional opportunities
              </p>
            </div>

            <div className="mb-16 text-center">
              <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">
                Share Your Opportunity
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Post a job, investment opportunity, or business collaboration with our global community
              </p>
              <PublicOpportunityForm />
            </div>

            <h3 className="text-2xl md:text-3xl font-display font-bold mb-8 text-center">
              Available Opportunities
            </h3>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading opportunities...</p>
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">No opportunities available yet</h4>
                <p className="text-muted-foreground mb-6">
                  Check back soon for new job postings and other opportunities
                </p>
                <Button onClick={() => window.location.href = "/login"} data-testid="button-post-opportunity">
                  Login to Post an Opportunity
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {opportunities.map((opportunity, idx) => {
                  const details = (opportunity.details as any) || {};
                  const typeDisplay = getOpportunityTypeDisplay(opportunity.type);
                  
                  return (
                    <Card 
                      key={opportunity.id} 
                      className="hover:border-primary/30 transition-all hover-elevate cursor-pointer" 
                      onClick={() => handleCardClick(opportunity)}
                      data-testid={`card-opportunity-${idx}`}
                    >
                      <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <Badge variant="secondary" className={typeDisplay.className}>
                            {typeDisplay.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {opportunity.status === "open" ? "Open" : "Closed"}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3" />
                          {opportunity.city ? `${opportunity.city}, ` : ""}{opportunity.country}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {opportunity.description}
                        </p>
                        
                        {opportunity.type === "job" && details.employmentType && (
                          <Badge variant="outline" className="capitalize">
                            {details.employmentType}
                          </Badge>
                        )}
                        
                        {opportunity.budgetOrSalary && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {opportunity.type === "job" 
                                ? "Salary:" 
                                : opportunity.type === "investment" 
                                ? "Funding:" 
                                : "Budget:"}
                            </span>
                            <span className="text-sm text-muted-foreground">{opportunity.budgetOrSalary}</span>
                          </div>
                        )}
                        
                        {opportunity.type === "job" && details.experienceRequired && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Experience:</span>
                            <span className="text-sm text-muted-foreground">{details.experienceRequired}</span>
                          </div>
                        )}
                        
                        {opportunity.type === "investment" && details.investmentType && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Investment Type:</span>
                            <span className="text-sm text-muted-foreground">{details.investmentType}</span>
                          </div>
                        )}
                        
                        {opportunity.type === "partnership" && details.partnershipType && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Partnership Type:</span>
                            <span className="text-sm text-muted-foreground">{details.partnershipType}</span>
                          </div>
                        )}
                        
                        {opportunity.sector && (
                          <Badge variant="secondary" className="text-xs">
                            {opportunity.sector}
                          </Badge>
                        )}
                        
                        <div className="pt-3 border-t">
                          {opportunity.type === "job" ? (
                            details.applicationEmail ? (
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `mailto:${details.applicationEmail}`;
                                }}
                                data-testid={`button-apply-${idx}`}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Apply Now
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="secondary"
                                className="w-full"
                                disabled
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`button-apply-${idx}`}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Contact Information Required
                              </Button>
                            )
                          ) : (
                            (() => {
                              const emailMatch = opportunity.contactPreference?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                              const contactEmail = emailMatch ? emailMatch[0] : null;
                              
                              if (contactEmail) {
                                const subject = encodeURIComponent(`Inquiry: ${opportunity.title}`);
                                return (
                                  <Button 
                                    size="sm" 
                                    className="w-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.location.href = `mailto:${contactEmail}?subject=${subject}`;
                                    }}
                                    data-testid={`button-contact-${idx}`}
                                  >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Contact Now
                                  </Button>
                                );
                              } else if (opportunity.contactPreference) {
                                return (
                                  <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                      <span className="font-medium">Contact:</span> {opportunity.contactPreference}
                                    </p>
                                    <Button 
                                      size="sm" 
                                      className="w-full"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          if (navigator.clipboard?.writeText) {
                                            await navigator.clipboard.writeText(opportunity.contactPreference || "");
                                            toast({
                                              title: "Contact Copied!",
                                              description: "Contact information has been copied to your clipboard.",
                                            });
                                          } else {
                                            toast({
                                              title: "Contact Information",
                                              description: opportunity.contactPreference || "",
                                              duration: 5000,
                                            });
                                          }
                                        } catch (error) {
                                          toast({
                                            title: "Contact Information",
                                            description: opportunity.contactPreference || "",
                                            duration: 5000,
                                          });
                                        }
                                      }}
                                      data-testid={`button-contact-${idx}`}
                                    >
                                      <Mail className="w-4 h-4 mr-2" />
                                      Inquire Now
                                    </Button>
                                  </div>
                                );
                              } else {
                                return (
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                    className="w-full"
                                    disabled
                                    onClick={(e) => e.stopPropagation()}
                                    data-testid={`button-contact-${idx}`}
                                  >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Contact Information Required
                                  </Button>
                                );
                              }
                            })()
                          )}
                        </div>
                        
                        {opportunity.type === "job" && details.skills && Array.isArray(details.skills) && details.skills.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2">Required Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {details.skills.slice(0, 4).map((skill: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {details.skills.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{details.skills.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-muted-foreground mt-4">
                Login required to post or view full opportunity details
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      
      <OpportunityPreviewDialog
        opportunity={selectedOpportunity}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
