import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase, MapPin, Globe, Award, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import type { TalentProfile } from "../../../server/storage";
import TalentPreviewDialog from "./TalentPreviewDialog";

export default function TalentBrowser() {
  const [selectedRole, setSelectedRole] = useState<"professional" | "jobSeeker">("professional");
  const [selectedTalent, setSelectedTalent] = useState<TalentProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogRoleType, setDialogRoleType] = useState<"professional" | "jobSeeker">("professional");

  const { data: talent = [], isLoading } = useQuery<TalentProfile[]>({
    queryKey: ["/api/talent", selectedRole],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/talent?role=${selectedRole}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch talent");
      }
      return response.json();
    },
    enabled: !!auth.currentUser,
  });

  const handleViewProfile = (person: TalentProfile, roleType: "professional" | "jobSeeker") => {
    setSelectedTalent(person);
    setDialogRoleType(roleType);
    setDialogOpen(true);
  };

  const handleTabChange = (value: string) => {
    setSelectedRole(value as "professional" | "jobSeeker");
    setDialogOpen(false);
    setSelectedTalent(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Browse Talent</CardTitle>
          <CardDescription>
            View approved professionals and job seekers on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRole} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="professional" data-testid="tab-professionals">
                <Award className="w-4 h-4 mr-2" />
                Professionals
              </TabsTrigger>
              <TabsTrigger value="jobSeeker" data-testid="tab-job-seekers">
                <Briefcase className="w-4 h-4 mr-2" />
                Job Seekers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="professional" className="mt-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading professionals...</p>
                </div>
              ) : talent.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No professionals found</h3>
                  <p className="text-sm text-muted-foreground">
                    There are currently no approved professionals on the platform
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {talent.map((person, idx) => {
                    const professionalProfile = person.roleSpecificProfile as any;
                    
                    return (
                      <Card 
                        key={person.user.id} 
                        className="hover-elevate cursor-pointer" 
                        data-testid={`card-professional-${idx}`}
                        onClick={() => handleViewProfile(person, "professional")}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-lg">{person.profile.fullName}</h4>
                              {person.profile.headline && (
                                <p className="text-sm text-muted-foreground">{person.profile.headline}</p>
                              )}
                            </div>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProfile(person, "professional");
                              }}
                              data-testid={`button-view-professional-${idx}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {person.profile.city ? `${person.profile.city}, ` : ""}{person.profile.country}
                            </Badge>
                            {professionalProfile?.industry && (
                              <Badge variant="outline" className="text-xs">
                                {professionalProfile.industry}
                              </Badge>
                            )}
                          </div>

                          {(professionalProfile?.currentJobTitle || professionalProfile?.currentTitle || professionalProfile?.title) && (
                            <div>
                              <p className="text-sm">
                                <span className="font-medium">Current Role:</span>{" "}
                                {professionalProfile.currentJobTitle || professionalProfile.currentTitle || professionalProfile.title}
                                {(professionalProfile.currentEmployer || professionalProfile.company) && ` at ${professionalProfile.currentEmployer || professionalProfile.company}`}
                              </p>
                            </div>
                          )}

                          {(professionalProfile?.yearsOfExperience || professionalProfile?.yearsExperience || professionalProfile?.experience) && (
                            <p className="text-sm">
                              <span className="font-medium">Experience:</span>{" "}
                              {professionalProfile.yearsOfExperience || professionalProfile.yearsExperience || professionalProfile.experience} years
                            </p>
                          )}

                          {(professionalProfile?.skills?.length > 0 || professionalProfile?.expertise?.length > 0) && (
                            <div>
                              <p className="text-xs font-medium mb-1">Skills:</p>
                              <div className="flex flex-wrap gap-1">
                                {(professionalProfile.skills || professionalProfile.expertise || []).slice(0, 5).map((skill: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {(professionalProfile.skills || professionalProfile.expertise || []).length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{(professionalProfile.skills || professionalProfile.expertise).length - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {person.profile.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {person.profile.bio}
                            </p>
                          )}

                          {(person.profile.linkedinUrl || person.profile.websiteUrl) && (
                            <div className="flex gap-2 pt-2">
                              {person.profile.linkedinUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(person.profile.linkedinUrl!, "_blank");
                                  }}
                                  data-testid={`button-linkedin-${idx}`}
                                >
                                  <Globe className="w-3 h-3 mr-1" />
                                  LinkedIn
                                </Button>
                              )}
                              {person.profile.websiteUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(person.profile.websiteUrl!, "_blank");
                                  }}
                                  data-testid={`button-website-${idx}`}
                                >
                                  <Globe className="w-3 h-3 mr-1" />
                                  Website
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="jobSeeker" className="mt-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading job seekers...</p>
                </div>
              ) : talent.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No job seekers found</h3>
                  <p className="text-sm text-muted-foreground">
                    There are currently no approved job seekers on the platform
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {talent.map((person, idx) => {
                    const jobSeekerProfile = person.roleSpecificProfile as any;
                    
                    return (
                      <Card 
                        key={person.user.id} 
                        className="hover-elevate cursor-pointer" 
                        data-testid={`card-job-seeker-${idx}`}
                        onClick={() => handleViewProfile(person, "jobSeeker")}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-lg">{person.profile.fullName}</h4>
                              {person.profile.headline && (
                                <p className="text-sm text-muted-foreground">{person.profile.headline}</p>
                              )}
                            </div>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProfile(person, "jobSeeker");
                              }}
                              data-testid={`button-view-job-seeker-${idx}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {person.profile.city ? `${person.profile.city}, ` : ""}{person.profile.country}
                            </Badge>
                            {jobSeekerProfile?.availability && (
                              <Badge variant="outline" className="text-xs capitalize">
                                Available: {jobSeekerProfile.availability}
                              </Badge>
                            )}
                          </div>

                          {(jobSeekerProfile?.targetJobTitles?.length > 0 || jobSeekerProfile?.desiredRole) && (
                            <div>
                              <p className="text-xs font-medium mb-1">Looking for:</p>
                              <div className="flex flex-wrap gap-1">
                                {jobSeekerProfile.targetJobTitles ? 
                                  jobSeekerProfile.targetJobTitles.map((title: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {title}
                                    </Badge>
                                  )) : (
                                    <Badge variant="secondary" className="text-xs">
                                      {jobSeekerProfile.desiredRole}
                                    </Badge>
                                  )
                                }
                              </div>
                            </div>
                          )}

                          {jobSeekerProfile?.employmentType && (
                            <p className="text-sm">
                              <span className="font-medium">Employment Type:</span>{" "}
                              <span className="capitalize">{jobSeekerProfile.employmentType}</span>
                            </p>
                          )}

                          {(jobSeekerProfile?.salaryExpectationMin || jobSeekerProfile?.salaryExpectationMax || jobSeekerProfile?.desiredSalary) && (
                            <p className="text-sm">
                              <span className="font-medium">Salary Expectation:</span>{" "}
                              {jobSeekerProfile.desiredSalary ? 
                                `$${jobSeekerProfile.desiredSalary.toLocaleString()}` :
                                `$${jobSeekerProfile.salaryExpectationMin?.toLocaleString()} - $${jobSeekerProfile.salaryExpectationMax?.toLocaleString()}`
                              }
                            </p>
                          )}

                          {jobSeekerProfile?.preferredIndustries && jobSeekerProfile.preferredIndustries.length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-1">Preferred Industries:</p>
                              <div className="flex flex-wrap gap-1">
                                {jobSeekerProfile.preferredIndustries.slice(0, 4).map((industry: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {industry}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {person.profile.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {person.profile.bio}
                            </p>
                          )}

                          {(person.profile.linkedinUrl || person.profile.websiteUrl) && (
                            <div className="flex gap-2 pt-2">
                              {person.profile.linkedinUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(person.profile.linkedinUrl!, "_blank");
                                  }}
                                  data-testid={`button-linkedin-${idx}`}
                                >
                                  <Globe className="w-3 h-3 mr-1" />
                                  LinkedIn
                                </Button>
                              )}
                              {person.profile.websiteUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(person.profile.websiteUrl!, "_blank");
                                  }}
                                  data-testid={`button-website-${idx}`}
                                >
                                  <Globe className="w-3 h-3 mr-1" />
                                  Website
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TalentPreviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        talent={selectedTalent}
        roleType={dialogRoleType}
      />
    </>
  );
}
