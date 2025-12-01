import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function CTASection() {
  return (
    <section className="relative py-16 md:py-24 bg-primary overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="network" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="white" />
              <line x1="50" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.5" />
              <line x1="50" y1="50" x2="50" y2="100" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#network)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6"
          data-testid="text-cta-title"
        >
          Register and Be Part of the Future
        </h2>
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-3xl mx-auto" data-testid="text-cta-description">
          Provide your structured information today and join the global database that will power intelligent opportunity matching tomorrow. Every registration helps build the foundation for Phase 2.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent text-accent-foreground font-semibold text-lg px-10 py-7 min-h-14 group"
              data-testid="button-cta-join"
            >
              Join Now
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/membership">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm font-semibold text-lg px-10 py-7 min-h-14"
              data-testid="button-cta-learn"
            >
              Learn More
            </Button>
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-white/80">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">Free</div>
            <div className="text-sm">Membership</div>
          </div>
          <div className="h-12 w-px bg-white/30" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">Verified</div>
            <div className="text-sm">Profiles Only</div>
          </div>
          <div className="h-12 w-px bg-white/30" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">Global</div>
            <div className="text-sm">Network</div>
          </div>
        </div>
      </div>
    </section>
  );
}
