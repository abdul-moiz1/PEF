import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getJobPosts, getUserData } from "@/lib/firestoreUtils";
import type { FirestoreJobPost, FirestoreUser } from "@shared/firestoreTypes";
import { Briefcase, MapPin, DollarSign, Clock, Search, Mail, Building, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

export default function BrowseJobs() {
  const [jobs, setJobs] = useState<FirestoreJobPost[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<FirestoreJobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<FirestoreJobPost | null>(null);
  const [employerData, setEmployerData] = useState<FirestoreUser | null>(null);
  const [loadingEmployer, setLoadingEmployer] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredJobs(filtered);
    } else {
      setFilteredJobs(jobs);
    }
  }, [searchTerm, jobs]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const jobsData = await getJobPosts({ status: "open" });
      const approvedJobs = jobsData.filter((job) => job.approvalStatus === "approved");
      setJobs(approvedJobs);
      setFilteredJobs(approvedJobs);
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (job: FirestoreJobPost) => {
    setSelectedJob(job);
    setLoadingEmployer(true);
    try {
      const employer = await getUserData(job.employerId);
      setEmployerData(employer);
    } catch (error) {
      console.error("Error loading employer data:", error);
      setEmployerData(null);
    } finally {
      setLoadingEmployer(false);
    }
  };

  const handleCloseDialog = () => {
    setSelectedJob(null);
    setEmployerData(null);
  };

  const toggleExpand = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 md:pt-28 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Available Job Opportunities</h1>
              <p className="text-muted-foreground text-sm">Browse and apply to jobs posted by employers</p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-jobs"
              />
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No jobs found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms" : "No open positions at the moment"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                return (
                  <Card key={job.id} data-testid={`card-job-${job.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{job.title}</CardTitle>
                            <Badge variant="default" className="text-xs">job</Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {job.employmentType && (
                              <div className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                <span className="capitalize">{job.employmentType.replace("-", " ")}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{format(new Date(job.createdAt), "MMM d, yyyy")}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpand(job.id)}
                          data-testid={`button-toggle-job-${job.id}`}
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="pt-0">
                        <Separator className="my-4" />
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">{job.description}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 pt-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span>Contact Email</span>
                            </div>
                            <span className="text-sm">View full details to contact</span>
                            <Button
                              onClick={() => handleViewDetails(job)}
                              data-testid={`button-view-details-${job.id}`}
                            >
                              View Full Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <Dialog open={!!selectedJob} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-xl">{selectedJob.title}</DialogTitle>
                  <Badge variant="default">job</Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {selectedJob.employmentType && (
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      <span className="capitalize">{selectedJob.employmentType.replace("-", " ")}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedJob.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Posted {format(new Date(selectedJob.createdAt), "MMM d, yyyy")}</span>
                  </div>
                </div>

                {(selectedJob.salaryMin || selectedJob.salaryMax) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {selectedJob.salaryCurrency} {selectedJob.salaryMin?.toLocaleString()}
                      {selectedJob.salaryMax && ` - ${selectedJob.salaryMax.toLocaleString()}`}
                    </span>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
                </div>

                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Requirements</h4>
                    <ul className="space-y-2">
                      {selectedJob.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Benefits</h4>
                    <ul className="space-y-2">
                      {selectedJob.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">Contact Information</h4>
                  {loadingEmployer ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Loading contact details...</span>
                    </div>
                  ) : employerData ? (
                    <div className="bg-muted/50 rounded-md p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{employerData.employerData?.companyName || employerData.fullName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${employerData.email}`} 
                          className="text-primary hover:underline"
                          data-testid="link-employer-email"
                        >
                          {employerData.email}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Contact information not available</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
