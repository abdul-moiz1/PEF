import { Quote } from "lucide-react";
import chairmanImage from "@assets/image_1763374941295.png";

export default function ChairmanMessageSection() {
  return (
    <section className="relative py-14 md:py-20 bg-gradient-to-b from-primary/5 via-secondary/5 to-background overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/30 rounded-full blur-3xl"></div>
      </div>
      
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Quote className="w-4 h-4" />
            <span className="text-sm font-semibold">Leadership Vision</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
            Chairman's Message
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full"></div>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2 relative" data-testid="section-chairman-image">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-2xl scale-95"></div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl opacity-20"></div>
              <div className="relative rounded-2xl overflow-hidden border-4 border-white dark:border-muted shadow-2xl">
                <img 
                  src={chairmanImage} 
                  alt="Chairman & Founder PEF" 
                  className="w-full h-auto"
                  data-testid="img-chairman"
                />
              </div>
            </div>
            <div className="mt-8 text-center">
              <div className="inline-block bg-white dark:bg-card px-6 py-3 rounded-full shadow-lg border border-border">
                <h3 className="text-xl font-display font-bold text-primary">Chairman & Founder</h3>
                <p className="text-sm text-muted-foreground">Professional Executive Forum</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 relative">
            <div className="absolute -left-8 top-0 w-1 h-full bg-gradient-to-b from-primary via-secondary to-accent rounded-full hidden lg:block"></div>
            
            <div className="lg:pl-8">
              <Quote className="w-16 h-16 text-primary/20 mb-6" />
              
              <blockquote className="text-2xl md:text-3xl lg:text-4xl leading-relaxed text-foreground font-display mb-8">
                <span className="text-primary">"</span>
                To build a trusted and intelligent network where business owners, directors, and professionals connect through meaningful collaboration, creating a smart bridge between opportunities and talent.
                <span className="text-primary">"</span>
              </blockquote>

              <div className="h-px bg-gradient-to-r from-primary/50 via-secondary/50 to-transparent mb-8"></div>

              <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
                Our goal is not only to empower job seekers with access to the right people and projects, but also to help discover new business collaborations, unlock investment opportunities, and drive collective growth and integrated success for all.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full transition-transform duration-200 hover:scale-105">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium text-primary">Global Vision</span>
                </div>
                <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full transition-transform duration-200 hover:scale-105">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-sm font-medium text-secondary">Trusted Network</span>
                </div>
                <div className="flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full transition-transform duration-200 hover:scale-105">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="text-sm font-medium text-accent">Smart Connections</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
}
