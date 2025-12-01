import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, TrendingUp } from "lucide-react";

const challenges = [
  "Job seekers struggle to find the right opportunities",
  "Businesses often face challenges in identifying skilled professionals, connecting with investors, and discovering the right project opportunities.",
  "Lack of central network"
];

export default function OpportunitiesGapSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-center mb-12"
          data-testid="text-opportunities-gap-title"
        >
          The Opportunities Gap
        </h2>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <ul className="space-y-4">
              {challenges.map((challenge, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-3 text-lg text-muted-foreground"
                  data-testid={`text-challenge-${index}`}
                >
                  <span className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0"></span>
                  <span>{challenge}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="flex flex-col items-center">
              <Card className="w-full max-w-xs bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 border-2">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-bold text-lg mb-1" data-testid="text-stakeholder-investors">
                    Investors / Partners
                  </h3>
                  <p className="text-sm text-muted-foreground">Searching for:</p>
                  <p className="text-sm">scalable businesses, collaborations</p>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center my-4 gap-4">
                <svg className="w-8 h-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
                <svg className="w-8 h-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12l7-7 7 7" />
                </svg>
              </div>

              <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                <Card className="bg-sky-100 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700 border-2">
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-sky-600 dark:text-sky-400" />
                    <h3 className="font-bold text-sm mb-1" data-testid="text-stakeholder-jobseekers">
                      Job Seekers / Professionals
                    </h3>
                    <p className="text-xs text-muted-foreground">Searching for:</p>
                    <p className="text-xs">jobs, mentors, projects</p>
                  </CardContent>
                </Card>

                <Card className="bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 border-2">
                  <CardContent className="p-4 text-center">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-bold text-sm mb-1" data-testid="text-stakeholder-business">
                      Business Owners / Companies
                    </h3>
                    <p className="text-xs text-muted-foreground">Searching for:</p>
                    <p className="text-xs">employees, partners</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-center mt-4">
                <svg className="w-16 h-8 text-muted-foreground" viewBox="0 0 64 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 12h48M52 6l6 6-6 6M12 6l-6 6 6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
