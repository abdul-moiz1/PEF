import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  Target, 
  Globe2, 
  TrendingUp, 
  Building2, 
  Briefcase, 
  UserCircle, 
  DollarSign, 
  Quote, 
  Sparkles, 
  Brain, 
  Database, 
  ArrowRight,
  Heart,
  ClipboardCheck,
  Award,
  Handshake,
  Lightbulb
} from "lucide-react";
import { Link } from "wouter";
import chairmanImage from "@assets/image_1763374941295.png";

export default function About() {
  const coreValues = [
    {
      icon: Handshake,
      title: "Collaboration",
      description: "We believe community success comes from supporting each other through engagement, knowledge-sharing, and teamwork.",
      color: "primary"
    },
    {
      icon: Shield,
      title: "Integrity",
      description: "We commit to honesty, transparency, and authenticity in every interaction, opportunity, and initiative.",
      color: "secondary"
    },
    {
      icon: Users,
      title: "Inclusiveness",
      description: "We welcome professionals from all backgrounds, industries, and regions with equal respect and opportunity.",
      color: "accent"
    },
    {
      icon: TrendingUp,
      title: "Growth",
      description: "We empower every member to learn, improve, and reach their professional potential through guidance, exposure, and networking.",
      color: "primary"
    },
    {
      icon: Heart,
      title: "Service",
      description: "We encourage a volunteer-driven culture where helping others is at the heart of everything we do.",
      color: "secondary"
    },
    {
      icon: ClipboardCheck,
      title: "Accountability",
      description: "We take ownership of our commitments and maintain high standards in leadership, communication, and community processes.",
      color: "accent"
    },
    {
      icon: Award,
      title: "Professional Excellence",
      description: "We promote ethical conduct, respectful communication, and continuous self-development in all chapters globally.",
      color: "primary"
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section with Stats */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary via-primary to-[hsl(213,58%,35%)] text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-secondary/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
                Building Bridges Between<br />Talent and Opportunity
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                Professional Executive Forum connects the world's professionals, employers, investors, and business owners in a trusted global network
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-md p-6 text-center border border-white/20 transition-colors duration-300 hover:bg-white/20" data-testid="stat-global">
                <Globe2 className="w-8 h-8 mx-auto mb-3 text-secondary" />
                <div className="text-3xl md:text-4xl font-display font-bold mb-1">Global</div>
                <div className="text-white/80">Cross-Border Network</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-md p-6 text-center border border-white/20 transition-colors duration-300 hover:bg-white/20" data-testid="stat-verified">
                <Shield className="w-8 h-8 mx-auto mb-3 text-secondary" />
                <div className="text-3xl md:text-4xl font-display font-bold mb-1">Verified</div>
                <div className="text-white/80">Professional Profiles</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-md p-6 text-center border border-white/20 transition-colors duration-300 hover:bg-white/20" data-testid="stat-intelligent">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-secondary" />
                <div className="text-3xl md:text-4xl font-display font-bold mb-1">Intelligent</div>
                <div className="text-white/80">Opportunity Matching</div>
              </div>
            </div>
          </div>
        </section>

        {/* Leadership Spotlight - Chairman Vision */}
        <section className="relative py-12 md:py-20 bg-background overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Image Side */}
              <div className="relative order-2 lg:order-1" data-testid="section-chairman">
                <div className="relative rounded-md overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-primary/20"></div>
                  <img 
                    src={chairmanImage} 
                    alt="Chairman & Founder PEF" 
                    className="w-full h-auto relative z-10"
                    data-testid="img-chairman"
                  />
                </div>
                <div className="mt-6 text-center lg:text-left">
                  <h3 className="text-xl font-display font-bold mb-1">Chairman & Founder</h3>
                  <p className="text-muted-foreground">Professional Executive Forum</p>
                </div>
              </div>

              {/* Vision Quote Side */}
              <div className="order-1 lg:order-2">
                <div className="mb-6">
                  <Quote className="w-12 h-12 text-secondary/30 mb-4" />
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
                    PEF Vision
                  </h2>
                </div>
                
                <blockquote className="text-xl md:text-2xl leading-relaxed text-foreground/90 mb-8 italic">
                  "To build a trusted and intelligent network where business owners, directors, and professionals connect through meaningful collaboration, creating a smart bridge between opportunities and talent."
                </blockquote>

                <p className="text-lg leading-relaxed text-muted-foreground mb-8">
                  Our goal is not only to empower job seekers with access to the right people and projects, but also to help discover new business collaborations, unlock investment opportunities, and drive collective growth and integrated success for all.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link href="/membership">
                    <Button size="lg" className="group" data-testid="button-join-vision">
                      Join Our Vision
                      <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" size="lg" data-testid="button-contact">
                      Get in Touch
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                PEF Mission
              </h2>
              <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-xl leading-relaxed text-foreground text-center mb-8">
                To empower professionals through networking, knowledge-sharing, and community-driven support, helping members access real opportunities, build meaningful connections, and grow in their careers with integrity and collaboration.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values - All 7 Values */}
        <section className="py-12 md:py-20 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Our Core Values
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreValues.map((value, index) => {
                const IconComponent = value.icon;
                const bgColor = value.color === 'primary' ? 'bg-primary/10' : 
                               value.color === 'secondary' ? 'bg-secondary/10' : 'bg-accent/10';
                const textColor = value.color === 'primary' ? 'text-primary' : 
                                 value.color === 'secondary' ? 'text-secondary' : 'text-accent';
                
                return (
                  <Card key={index} className="hover-elevate" data-testid={`card-value-${value.title.toLowerCase().replace(' ', '-')}`}>
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 ${bgColor} rounded-md flex items-center justify-center mb-4`}>
                        <IconComponent className={`w-6 h-6 ${textColor}`} />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Future Plan - AI Matching Platform */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">The Future Plan</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                AI-Powered Matching
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Intelligent technology that connects the right people with the right opportunities
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Key Features */}
              <div className="space-y-6">
                <Card className="hover-elevate border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-2">Smart Opportunity Suggestions</h3>
                        <p className="text-muted-foreground">
                          AI-based system will automatically suggest opportunities to business owners
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate border-secondary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-secondary/10 rounded-md flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-2">Intelligent Job Matching</h3>
                        <p className="text-muted-foreground">
                          Job seekers will be matched with relevant projects, mentors, or companies
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate border-accent/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-accent/10 rounded-md flex items-center justify-center flex-shrink-0">
                        <Database className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-2">Data-Driven Decisions</h3>
                        <p className="text-muted-foreground">
                          Data-driven decisions to maximize impact, efficiency and growth
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right side - AI Hub Diagram */}
              <div className="relative">
                <div className="bg-card rounded-md p-8 border">
                  {/* Central AI Hub */}
                  <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
                      <Brain className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold">AI Matching Hub</h3>
                  </div>

                  {/* Connected Elements */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-blue-500/10 rounded-md">
                      <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Briefcase className="w-7 h-7 text-blue-600" />
                      </div>
                      <h4 className="font-semibold">Job Seekers</h4>
                    </div>

                    <div className="text-center p-4 bg-purple-500/10 rounded-md">
                      <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Building2 className="w-7 h-7 text-purple-600" />
                      </div>
                      <h4 className="font-semibold">Businesses</h4>
                    </div>

                    <div className="text-center p-4 bg-green-500/10 rounded-md">
                      <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-7 h-7 text-green-600" />
                      </div>
                      <h4 className="font-semibold">Projects Collaboration</h4>
                    </div>

                    <div className="text-center p-4 bg-amber-500/10 rounded-md">
                      <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="w-7 h-7 text-amber-600" />
                      </div>
                      <h4 className="font-semibold">Investors</h4>
                    </div>
                  </div>

                  {/* Connection Lines Visual */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="hsl(var(--primary))" />
                          <stop offset="100%" stopColor="hsl(var(--secondary))" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-lg text-muted-foreground mb-6">
                Our AI platform is currently in development and will revolutionize how professionals connect globally
              </p>
              <Link href="/contact">
                <Button size="lg" variant="default" data-testid="button-ai-interest">
                  Express Interest in Early Access
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Community Ecosystem */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-secondary/10 to-primary/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Our Community
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A diverse ecosystem connecting five key stakeholder groups
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover-elevate" data-testid="card-professionals">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCircle className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Professionals</h3>
                  <p className="text-muted-foreground">
                    Experienced experts seeking new opportunities and collaborations to expand their impact.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-jobseekers">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Job Seekers</h3>
                  <p className="text-muted-foreground">
                    Talented individuals connecting with the right employers and career opportunities worldwide.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-employers">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Employers</h3>
                  <p className="text-muted-foreground">
                    Organizations finding top talent and building high-performing teams for growth.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-business-owners">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Business Owners</h3>
                  <p className="text-muted-foreground">
                    Entrepreneurs discovering partnerships, collaborations, and new market opportunities.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-investors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Investors</h3>
                  <p className="text-muted-foreground">
                    Strategic investors finding promising ventures and building portfolio value.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate bg-gradient-to-br from-primary/5 to-secondary/5" data-testid="card-join-community">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                  <Users className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-3">Join the Network</h3>
                  <Link href="/register">
                    <Button variant="default" data-testid="button-join-community">
                      Become a Member
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-14 md:py-20 bg-gradient-to-br from-primary to-[hsl(213,58%,35%)] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              Ready to Connect with Global Opportunities?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
              Join thousands of professionals, employers, and investors building meaningful connections on PEF
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="text-lg px-8 group" data-testid="button-cta-join">
                  Join Now
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/opportunities">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/30" data-testid="button-cta-explore">
                  Explore Opportunities
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
