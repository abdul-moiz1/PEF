import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Globe,
  Briefcase,
  Award,
  Calendar,
  DollarSign,
  Building2,
  Clock,
  Mail,
  Phone,
  Languages,
} from "lucide-react";
import type { TalentProfile } from "../../../server/storage";

interface TalentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent: TalentProfile | null;
  roleType: "professional" | "jobSeeker";
}

export default function TalentPreviewDialog({
  open,
  onOpenChange,
  talent,
  roleType,
}: TalentPreviewDialogProps) {
  if (!talent) return null;

  const { user, profile, roleSpecificProfile } = talent;
  const initials = profile.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  const professionalData = roleType === "professional" ? (roleSpecificProfile as any) : null;
  const jobSeekerData = roleType === "jobSeeker" ? (roleSpecificProfile as any) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="sr-only">Profile Preview</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-primary/10">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold" data-testid="text-talent-name">
                  {profile.fullName}
                </h2>
                {profile.headline && (
                  <p className="text-muted-foreground" data-testid="text-talent-headline">
                    {profile.headline}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {profile.country && (
                    <Badge variant="secondary" className="text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      {profile.city ? `${profile.city}, ` : ""}
                      {profile.country}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {roleType === "professional" ? (
                      <>
                        <Award className="w-3 h-3 mr-1" />
                        Professional
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-3 h-3 mr-1" />
                        Job Seeker
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            {profile.bio && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">About</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </div>
              </>
            )}

            {roleType === "professional" && professionalData && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium">Professional Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(professionalData.currentJobTitle || professionalData.currentTitle || professionalData.title) && (
                      <div className="flex items-start gap-2">
                        <Briefcase className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Current Role</p>
                          <p className="text-sm font-medium">
                            {professionalData.currentJobTitle || professionalData.currentTitle || professionalData.title}
                          </p>
                        </div>
                      </div>
                    )}

                    {(professionalData.currentEmployer || professionalData.company) && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Company</p>
                          <p className="text-sm font-medium">
                            {professionalData.currentEmployer || professionalData.company}
                          </p>
                        </div>
                      </div>
                    )}

                    {professionalData.industry && (
                      <div className="flex items-start gap-2">
                        <Award className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Industry</p>
                          <p className="text-sm font-medium">{professionalData.industry}</p>
                        </div>
                      </div>
                    )}

                    {(professionalData.yearsOfExperience || professionalData.yearsExperience || professionalData.experience) && (
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Experience</p>
                          <p className="text-sm font-medium">
                            {professionalData.yearsOfExperience || professionalData.yearsExperience || professionalData.experience} years
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {(professionalData.skills?.length > 0 || professionalData.expertise?.length > 0) && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Skills & Expertise</p>
                      <div className="flex flex-wrap gap-1">
                        {(professionalData.skills || professionalData.expertise || []).map((skill: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {professionalData.certifications?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Certifications</p>
                      <div className="flex flex-wrap gap-1">
                        {professionalData.certifications.map((cert: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {roleType === "jobSeeker" && jobSeekerData && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium">Job Seeker Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(jobSeekerData.desiredRole || jobSeekerData.desiredTitle) && (
                      <div className="flex items-start gap-2">
                        <Briefcase className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Desired Role</p>
                          <p className="text-sm font-medium">
                            {jobSeekerData.desiredRole || jobSeekerData.desiredTitle}
                          </p>
                        </div>
                      </div>
                    )}

                    {jobSeekerData.availability && (
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Availability</p>
                          <p className="text-sm font-medium capitalize">{jobSeekerData.availability}</p>
                        </div>
                      </div>
                    )}

                    {jobSeekerData.employmentType && (
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Employment Type</p>
                          <p className="text-sm font-medium capitalize">{jobSeekerData.employmentType}</p>
                        </div>
                      </div>
                    )}

                    {jobSeekerData.experienceLevel && (
                      <div className="flex items-start gap-2">
                        <Award className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Experience Level</p>
                          <p className="text-sm font-medium capitalize">{jobSeekerData.experienceLevel}</p>
                        </div>
                      </div>
                    )}

                    {(jobSeekerData.desiredSalary || jobSeekerData.salaryExpectationMin || jobSeekerData.salaryExpectationMax) && (
                      <div className="flex items-start gap-2">
                        <DollarSign className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Salary Expectation</p>
                          <p className="text-sm font-medium">
                            {jobSeekerData.desiredSalary ? 
                              `$${jobSeekerData.desiredSalary.toLocaleString()}` :
                              `$${jobSeekerData.salaryExpectationMin?.toLocaleString()} - $${jobSeekerData.salaryExpectationMax?.toLocaleString()}`
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {jobSeekerData.desiredLocation && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Desired Location</p>
                          <p className="text-sm font-medium">{jobSeekerData.desiredLocation}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {jobSeekerData.targetJobTitles?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Target Job Titles</p>
                      <div className="flex flex-wrap gap-1">
                        {jobSeekerData.targetJobTitles.map((title: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {jobSeekerData.skills?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {jobSeekerData.skills.map((skill: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {jobSeekerData.preferredIndustries?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Preferred Industries</p>
                      <div className="flex flex-wrap gap-1">
                        {jobSeekerData.preferredIndustries.map((industry: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {profile.languages && profile.languages.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Languages className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium">Languages</h3>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {profile.languages.map((lang: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {(profile.linkedinUrl || profile.websiteUrl || profile.portfolioUrl) && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-3">Links</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.linkedinUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(profile.linkedinUrl!, "_blank")}
                        data-testid="button-preview-linkedin"
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        LinkedIn
                      </Button>
                    )}
                    {profile.websiteUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(profile.websiteUrl!, "_blank")}
                        data-testid="button-preview-website"
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        Website
                      </Button>
                    )}
                    {profile.portfolioUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(profile.portfolioUrl!, "_blank")}
                        data-testid="button-preview-portfolio"
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        Portfolio
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
