import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Briefcase, MapPin, Globe, Award, Eye, Building2, Clock, DollarSign, GraduationCap, Linkedin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import type { TalentProfile } from "../../../server/storage";
import TalentPreviewDialog from "./TalentPreviewDialog";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function TalentCard({ 
  person, 
  idx, 
  roleType, 
  onViewProfile 
}: { 
  person: TalentProfile; 
  idx: number; 
  roleType: "professional" | "jobSeeker";
  onViewProfile: (person: TalentProfile, roleType: "professional" | "jobSeeker") => void;
}) {
  const profile = person.roleSpecificProfile as any;
  const isProfessional = roleType === "professional";

  return (
    <div
      className="group flex items-start gap-4 p-4 rounded-lg border bg-card hover-elevate cursor-pointer transition-all"
      onClick={() => onViewProfile(person, roleType)}
      data-testid={`card-${roleType === "professional" ? "professional" : "job-seeker"}-${idx}`}
    >
      <Avatar className="h-12 w-12 shrink-0 border-2 border-muted">
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {getInitials(person.profile.fullName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-base truncate" data-testid={`text-name-${idx}`}>
              {person.profile.fullName}
            </h4>
            {person.profile.headline && (
              <p className="text-sm text-muted-foreground truncate">
                {person.profile.headline}
              </p>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ visibility: 'visible' }}
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(person, roleType);
            }}
            data-testid={`button-view-${roleType === "professional" ? "professional" : "job-seeker"}-${idx}`}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(person.profile.city || person.profile.country) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{person.profile.city ? `${person.profile.city}, ` : ""}{person.profile.country}</span>
            </div>
          )}
          
          {isProfessional ? (
            <>
              {profile?.industry && (
                <Badge variant="secondary" className="text-xs">
                  <Building2 className="w-3 h-3 mr-1" />
                  {profile.industry}
                </Badge>
              )}
              {(profile?.yearsOfExperience || profile?.yearsExperience || profile?.experience) && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {profile.yearsOfExperience || profile.yearsExperience || profile.experience} yrs exp
                </Badge>
              )}
            </>
          ) : (
            <>
              {profile?.availability && (
                <Badge variant="secondary" className="text-xs capitalize">
                  <Clock className="w-3 h-3 mr-1" />
                  {profile.availability}
                </Badge>
              )}
              {profile?.employmentType && (
                <Badge variant="outline" className="text-xs capitalize">
                  {profile.employmentType}
                </Badge>
              )}
            </>
          )}
        </div>

        {isProfessional ? (
          <>
            {(profile?.currentJobTitle || profile?.currentTitle || profile?.title) && (
              <p className="text-sm">
                <span className="text-muted-foreground">Currently:</span>{" "}
                <span className="font-medium">
                  {profile.currentJobTitle || profile.currentTitle || profile.title}
                </span>
                {(profile.currentEmployer || profile.company) && (
                  <span className="text-muted-foreground"> at {profile.currentEmployer || profile.company}</span>
                )}
              </p>
            )}

            {(profile?.skills?.length > 0 || profile?.expertise?.length > 0) && (
              <div className="flex flex-wrap gap-1">
                {(profile.skills || profile.expertise || []).slice(0, 4).map((skill: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs font-normal">
                    {skill}
                  </Badge>
                ))}
                {(profile.skills || profile.expertise || []).length > 4 && (
                  <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                    +{(profile.skills || profile.expertise).length - 4}
                  </Badge>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {(profile?.targetJobTitles?.length > 0 || profile?.desiredRole) && (
              <div className="flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {profile.targetJobTitles ?
                    profile.targetJobTitles.slice(0, 3).map((title: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs font-normal">
                        {title}
                      </Badge>
                    )) : (
                      <Badge variant="secondary" className="text-xs font-normal">
                        {profile.desiredRole}
                      </Badge>
                    )
                  }
                  {profile.targetJobTitles?.length > 3 && (
                    <Badge variant="secondary" className="text-xs font-normal text-muted-foreground">
                      +{profile.targetJobTitles.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {(profile?.salaryExpectationMin || profile?.salaryExpectationMax || profile?.desiredSalary) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" />
                <span>
                  {profile.desiredSalary ?
                    `${profile.desiredSalary.toLocaleString()}` :
                    `${profile.salaryExpectationMin?.toLocaleString()} - ${profile.salaryExpectationMax?.toLocaleString()}`
                  }
                </span>
              </div>
            )}
          </>
        )}

        {person.profile.bio && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {person.profile.bio}
          </p>
        )}

        {(person.profile.linkedinUrl || person.profile.websiteUrl) && (
          <div className="flex gap-2 pt-1">
            {person.profile.linkedinUrl && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(person.profile.linkedinUrl!, "_blank");
                }}
                data-testid={`button-linkedin-${idx}`}
              >
                <Linkedin className="w-3.5 h-3.5 mr-1" />
                LinkedIn
              </Button>
            )}
            {person.profile.websiteUrl && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(person.profile.websiteUrl!, "_blank");
                }}
                data-testid={`button-website-${idx}`}
              >
                <Globe className="w-3.5 h-3.5 mr-1" />
                Website
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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

  const EmptyState = ({ type }: { type: "professional" | "jobSeeker" }) => (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">
        No {type === "professional" ? "professionals" : "job seekers"} found
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        There are currently no approved {type === "professional" ? "professionals" : "job seekers"} on the platform
      </p>
    </div>
  );

  const LoadingState = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-4 p-4 rounded-lg border animate-pulse">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-5 bg-muted rounded w-20" />
              <div className="h-5 bg-muted rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Browse Talent</CardTitle>
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
                <LoadingState />
              ) : talent.length === 0 ? (
                <EmptyState type="professional" />
              ) : (
                <div className="space-y-3">
                  {talent.map((person, idx) => (
                    <TalentCard
                      key={person.user.id}
                      person={person}
                      idx={idx}
                      roleType="professional"
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="jobSeeker" className="mt-0">
              {isLoading ? (
                <LoadingState />
              ) : talent.length === 0 ? (
                <EmptyState type="jobSeeker" />
              ) : (
                <div className="space-y-3">
                  {talent.map((person, idx) => (
                    <TalentCard
                      key={person.user.id}
                      person={person}
                      idx={idx}
                      roleType="jobSeeker"
                      onViewProfile={handleViewProfile}
                    />
                  ))}
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
