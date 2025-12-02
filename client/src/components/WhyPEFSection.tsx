import { FileText, Briefcase, Handshake, Lightbulb, CheckCircle } from "lucide-react";
import pefLogo from "@assets/image_1763355890421.png";

const benefits = [
  "Build a network connecting business owners, directors, Key professionals and Job Seekers",
  "Collect and organize relevant data to create meaningful connections",
  "Facilitate collaborations, job placements, and business opportunities"
];

export default function WhyPEFSection() {
  return (
    <section className="relative py-14 md:py-20 bg-gradient-to-b from-muted/30 via-primary/5 to-background overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-muted/30 to-transparent"></div>
      
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2 rounded-full mb-6">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">The Solution</span>
          </div>
          <h2 
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4"
            data-testid="text-why-pef-title"
          >
            WHY PEF - Our Solution
          </h2>
          <p className="text-xl md:text-2xl text-primary font-display font-semibold mb-4">
            Empower & Grow
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <p className="text-lg text-muted-foreground leading-relaxed">
              PEF creates the bridge that connects talent with opportunity:
            </p>
            <ul className="space-y-6">
              {benefits.map((benefit, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-4 p-4 bg-white dark:bg-card rounded-xl border border-border/50 shadow-sm transition-transform duration-200 hover:scale-[1.02] hover:shadow-md"
                  data-testid={`text-benefit-${index}`}
                >
                  <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </span>
                  <span className="text-lg text-foreground/90">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex items-center justify-center min-h-[420px]">
            <div className="flex items-center justify-center">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center shadow-2xl border-4 border-white dark:border-muted z-10">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white dark:bg-card flex items-center justify-center shadow-inner overflow-hidden">
                  <img 
                    src={pefLogo} 
                    alt="PEF Logo" 
                    className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover"
                    data-testid="img-pef-logo"
                  />
                </div>
              </div>
            </div>

            <div className="absolute top-0 left-4 md:left-8 flex flex-col items-center transition-transform duration-200 hover:scale-105" data-testid="connection-job-seekers">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white dark:bg-card shadow-lg border border-border flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-center bg-white dark:bg-card px-2 md:px-3 py-1 rounded-full shadow-sm border border-border whitespace-nowrap">Job Seekers</span>
            </div>

            <div className="absolute top-0 right-4 md:right-8 flex flex-col items-center transition-transform duration-200 hover:scale-105" data-testid="connection-business-owners">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white dark:bg-card shadow-lg border border-border flex items-center justify-center mb-2">
                <Briefcase className="w-6 h-6 md:w-8 md:h-8 text-secondary" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-center bg-white dark:bg-card px-2 md:px-3 py-1 rounded-full shadow-sm border border-border whitespace-nowrap">Business Owners</span>
            </div>

            <div className="absolute bottom-0 left-4 md:left-8 flex flex-col items-center transition-transform duration-200 hover:scale-105" data-testid="connection-collaborations">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white dark:bg-card shadow-lg border border-border flex items-center justify-center mb-2">
                <Handshake className="w-6 h-6 md:w-8 md:h-8 text-accent" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-center bg-white dark:bg-card px-2 md:px-3 py-1 rounded-full shadow-sm border border-border whitespace-nowrap">Collaborations</span>
            </div>

            <div className="absolute bottom-0 right-4 md:right-8 flex flex-col items-center transition-transform duration-200 hover:scale-105" data-testid="connection-opportunities">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white dark:bg-card shadow-lg border border-border flex items-center justify-center mb-2">
                <Lightbulb className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-center bg-white dark:bg-card px-2 md:px-3 py-1 rounded-full shadow-sm border border-border whitespace-nowrap">Opportunities</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
}
