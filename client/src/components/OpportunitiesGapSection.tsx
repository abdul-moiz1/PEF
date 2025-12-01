import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, TrendingUp, AlertCircle } from "lucide-react";

const challenges = [
  "Job seekers struggle to find the right opportunities",
  "Businesses often face challenges in identifying skilled professionals, connecting with investors, and discovering the right project opportunities.",
  "Lack of central network"
];

export default function OpportunitiesGapSection() {
  return (
    <section className="relative py-14 md:py-20 bg-gradient-to-b from-muted/40 via-background to-muted/20 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent"></div>
      
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-purple-500/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-amber-500/40 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full mb-6">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">The Challenge</span>
          </div>
          <h2 
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4"
            data-testid="text-opportunities-gap-title"
          >
            The Opportunities Gap
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 via-sky-500 to-amber-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <p className="text-lg text-muted-foreground leading-relaxed">
              In today's fragmented professional landscape, meaningful connections are hard to establish:
            </p>
            <ul className="space-y-6">
              {challenges.map((challenge, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-4 p-4 bg-white dark:bg-card rounded-xl border border-border/50 shadow-sm transition-transform duration-200 hover:scale-[1.02] hover:shadow-md"
                  data-testid={`text-challenge-${index}`}
                >
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                  </span>
                  <span className="text-lg text-foreground/90">{challenge}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="flex flex-col items-center">
              <Card className="w-full max-w-xs bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-900/20 border-purple-200 dark:border-purple-700 border-2 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-purple-900 dark:text-purple-100" data-testid="text-stakeholder-investors">
                    Investors / Partners
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Searching for:</p>
                  <p className="text-sm text-purple-600 dark:text-purple-200">scalable businesses, collaborations</p>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center my-6 gap-6">
                <div className="flex flex-col items-center">
                  <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14" />
                    <path d="M5 12l7 7 7-7" />
                  </svg>
                </div>
                <div className="w-16 h-px bg-gradient-to-r from-purple-300 via-sky-300 to-amber-300"></div>
                <div className="flex flex-col items-center">
                  <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19V5" />
                    <path d="M5 12l7-7 7 7" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                <Card className="bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/40 dark:to-sky-900/20 border-sky-200 dark:border-sky-700 border-2 shadow-lg">
                  <CardContent className="p-5 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-sky-500/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                    </div>
                    <h3 className="font-bold text-base mb-1 text-sky-900 dark:text-sky-100" data-testid="text-stakeholder-jobseekers">
                      Job Seekers / Professionals
                    </h3>
                    <p className="text-xs text-sky-700 dark:text-sky-300 font-medium">Searching for:</p>
                    <p className="text-xs text-sky-600 dark:text-sky-200">jobs, mentors, projects</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-900/20 border-amber-200 dark:border-amber-700 border-2 shadow-lg">
                  <CardContent className="p-5 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-amber-500/20 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-bold text-base mb-1 text-amber-900 dark:text-amber-100" data-testid="text-stakeholder-business">
                      Business Owners / Companies
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Searching for:</p>
                    <p className="text-xs text-amber-600 dark:text-amber-200">employees, partners</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-center mt-6">
                <svg className="w-20 h-6 text-muted-foreground/50" viewBox="0 0 80 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 12h64" />
                  <path d="M68 6l6 6-6 6" />
                  <path d="M12 6l-6 6 6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-muted/30 to-transparent"></div>
    </section>
  );
}
