import { FileText, Briefcase, Handshake, Lightbulb } from "lucide-react";
import pefLogo from "@assets/image_1763355890421.png";

const benefits = [
  "Build a network connecting business owners, directors, Key professionals and Job Seekers",
  "Collect and organize relevant data to create meaningful connections",
  "Facilitate collaborations, job placements, and business opportunities"
];

export default function WhyPEFSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-center mb-4"
          data-testid="text-why-pef-title"
        >
          WHY PEF - Our Solution
        </h2>
        <p className="text-xl md:text-2xl text-center text-muted-foreground mb-12">
          Empower & Grow
        </p>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-3 text-lg text-muted-foreground"
                  data-testid={`text-benefit-${index}`}
                >
                  <span className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0"></span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex items-center justify-center min-h-[400px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-white dark:bg-muted flex items-center justify-center shadow-lg border border-border z-10">
                <img 
                  src={pefLogo} 
                  alt="PEF Logo" 
                  className="w-40 h-40 md:w-48 md:h-48 object-contain"
                  data-testid="img-pef-logo"
                />
              </div>
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-full flex flex-col items-center" data-testid="connection-job-seekers">
              <FileText className="w-12 h-12 text-foreground mb-2" />
              <span className="text-sm font-semibold text-center">Job Seekers</span>
              <svg className="absolute top-full mt-2 w-16 h-12" viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M32 0 L48 48" className="text-muted-foreground" />
              </svg>
            </div>

            <div className="absolute top-4 left-1/2 translate-x-1/4 flex flex-col items-center" data-testid="connection-business-owners">
              <Briefcase className="w-12 h-12 text-foreground mb-2" />
              <span className="text-sm font-semibold text-center">Business Owners</span>
              <svg className="absolute top-full mt-2 w-16 h-12" viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M32 0 L16 48" className="text-muted-foreground" />
              </svg>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-full flex flex-col items-center" data-testid="connection-collaborations">
              <svg className="absolute bottom-full mb-2 w-16 h-12" viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M32 48 L48 0" className="text-muted-foreground" />
              </svg>
              <Handshake className="w-12 h-12 text-foreground mb-2" />
              <span className="text-sm font-semibold text-center">Collaborations</span>
            </div>

            <div className="absolute bottom-4 left-1/2 translate-x-1/4 flex flex-col items-center" data-testid="connection-opportunities">
              <svg className="absolute bottom-full mb-2 w-16 h-12" viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M32 48 L16 0" className="text-muted-foreground" />
              </svg>
              <Lightbulb className="w-12 h-12 text-foreground mb-2" />
              <span className="text-sm font-semibold text-center">Opportunities</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
