import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Users, Shield, Globe2, Briefcase, Search, Building2, Handshake, TrendingUp, Network } from "lucide-react";
import { useLocation } from "wouter";

const benefits = [
  {
    icon: Users,
    title: "Verified Global Directory",
    description: "Access a curated network of approved professionals and organizations",
  },
  {
    icon: TrendingUp,
    title: "Investment & Business Opportunities",
    description: "Discover partnerships, investments, and growth prospects",
  },
  {
    icon: Briefcase,
    title: "Job Openings",
    description: "Find or post employment opportunities across sectors",
  },
  {
    icon: Network,
    title: "International Network",
    description: "Expand your professional connections globally",
  },
  {
    icon: Shield,
    title: "Exclusive Insights",
    description: "Receive valuable content and industry updates",
  },
  {
    icon: Globe2,
    title: "Trusted Professionals",
    description: "Engage with verified organizations and individuals",
  },
];

export default function Membership() {
  const [, setLocation] = useLocation();

  const handleJoinNowClick = () => {
    setLocation("/register");
  };

  const handleCreateAccountClick = () => {
    setLocation("/signup");
  };

  const handleLearnMoreClick = () => {
    setLocation("/about");
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary to-[hsl(213,58%,35%)] text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                  <circle cx="25" cy="25" r="2" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              Membership
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              Join our global community and unlock professional opportunities
            </p>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent text-accent-foreground font-semibold text-lg px-10 py-7 min-h-14 group"
              data-testid="button-join-now-hero"
              onClick={handleJoinNowClick}
            >
              Join Now
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </section>

        <section className="py-12 md:py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-center">
              Why Become a Member?
            </h2>
            <p className="text-center text-muted-foreground mb-10 max-w-3xl mx-auto text-lg">
              Experience a trusted, professional environment designed for global business collaboration and career advancement
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <Card key={benefit.title} className="border-2 hover:border-primary/30 transition-colors duration-300 hover-elevate" data-testid={`card-benefit-${benefit.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    <CardContent className="p-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center mb-4">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl">
              <CardContent className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2 rounded-full mb-4">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-semibold">No Cost to Join</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                    Membership Fee
                  </h2>
                  <div className="inline-flex items-baseline gap-2">
                    <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">FREE</span>
                  </div>
                  <p className="text-lg text-muted-foreground mt-4">
                    PEF membership is open to all approved individuals and organizations.
                  </p>
                </div>

                <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 mb-8 border border-border/50">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Approval Process
                  </h3>
                  <p className="text-muted-foreground">
                    All registrations undergo review to maintain a credible and professional environment. This ensures that every member contributes to a trusted, high-quality community.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 transition-colors hover:bg-background">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">No hidden fees or charges</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 transition-colors hover:bg-background">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Review process ensures quality</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 transition-colors hover:bg-background">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Email confirmation upon approval</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 transition-colors hover:bg-background">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Access to all member features</span>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    size="lg"
                    className="min-h-14 px-10 font-semibold group"
                    data-testid="button-create-account"
                    onClick={handleCreateAccountClick}
                  >
                    Create Your Account
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12 md:py-20 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of professionals, employers, business owners, and investors already building their global network through PEF.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="min-h-14 px-10 font-semibold"
              data-testid="button-learn-more"
              onClick={handleLearnMoreClick}
            >
              Learn More About How It Works
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
