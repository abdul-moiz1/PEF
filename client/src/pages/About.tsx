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
  Lightbulb,
  Zap
} from "lucide-react";
import { Link } from "wouter";
import chairmanImage from "@assets/image_1763374941295.png";

export default function About() {
  const coreValues = [
    {
      icon: Handshake,
      title: "Collaboration",
      description: "We believe community success comes from supporting each other through engagement, knowledge-sharing, and teamwork.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Integrity",
      description: "We commit to honesty, transparency, and authenticity in every interaction, opportunity, and initiative.",
      gradient: "from-purple-500 to-indigo-500"
    },
    {
      icon: Users,
      title: "Inclusiveness",
      description: "We welcome professionals from all backgrounds, industries, and regions with equal respect and opportunity.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: TrendingUp,
      title: "Growth",
      description: "We empower every member to learn, improve, and reach their professional potential through guidance, exposure, and networking.",
      gradient: "from-orange-500 to-amber-500"
    },
    {
      icon: Heart,
      title: "Service",
      description: "We encourage a volunteer-driven culture where helping others is at the heart of everything we do.",
      gradient: "from-rose-500 to-pink-500"
    },
    {
      icon: ClipboardCheck,
      title: "Accountability",
      description: "We take ownership of our commitments and maintain high standards in leadership, communication, and community processes.",
      gradient: "from-teal-500 to-cyan-500"
    },
    {
      icon: Award,
      title: "Professional Excellence",
      description: "We promote ethical conduct, respectful communication, and continuous self-development in all chapters globally.",
      gradient: "from-violet-500 to-purple-500"
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section with Stats */}
        <section className="relative pt-24 md:pt-28 pb-12 md:pb-20 bg-gradient-to-br from-primary via-primary to-[hsl(213,58%,35%)] text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-secondary/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
                Building Bridges Between<br />Talent and Opportunity
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                Professional Executive Forum connects the world's professionals, employers, investors, and business owners in a trusted global network
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-md p-5 text-center border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-[1.02]" data-testid="stat-global">
                <Globe2 className="w-7 h-7 mx-auto mb-2 text-secondary" />
                <div className="text-2xl md:text-3xl font-display font-bold mb-1">Global</div>
                <div className="text-white/80 text-sm">Cross-Border Network</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-md p-5 text-center border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-[1.02]" data-testid="stat-verified">
                <Shield className="w-7 h-7 mx-auto mb-2 text-secondary" />
                <div className="text-2xl md:text-3xl font-display font-bold mb-1">Verified</div>
                <div className="text-white/80 text-sm">Professional Profiles</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-md p-5 text-center border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-[1.02]" data-testid="stat-intelligent">
                <TrendingUp className="w-7 h-7 mx-auto mb-2 text-secondary" />
                <div className="text-2xl md:text-3xl font-display font-bold mb-1">Intelligent</div>
                <div className="text-white/80 text-sm">Opportunity Matching</div>
              </div>
            </div>
          </div>
        </section>

        {/* PEF Vision Section - Chairman Style */}
        <section className="relative py-10 md:py-16 bg-gradient-to-b from-primary/5 via-secondary/5 to-background overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/30 rounded-full blur-3xl"></div>
          </div>
          
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                <Quote className="w-4 h-4" />
                <span className="text-sm font-semibold">Leadership Vision</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3">
                PEF Vision
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full"></div>
            </div>

            <div className="grid lg:grid-cols-5 gap-10 items-center">
              <div className="lg:col-span-2 relative" data-testid="section-chairman-image">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-2xl scale-95"></div>
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl opacity-20"></div>
                  <div className="relative rounded-2xl overflow-hidden border-4 border-white dark:border-muted shadow-2xl">
                    <img 
                      src={chairmanImage} 
                      alt="Chairman & Founder PEF" 
                      className="w-full h-auto"
                      data-testid="img-chairman"
                    />
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <div className="inline-block bg-white dark:bg-card px-5 py-2.5 rounded-full shadow-lg border border-border">
                    <h3 className="text-lg font-display font-bold text-primary">Chairman & Founder</h3>
                    <p className="text-sm text-muted-foreground">Professional Executive Forum</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 relative">
                <div className="absolute -left-6 top-0 w-1 h-full bg-gradient-to-b from-primary via-secondary to-accent rounded-full hidden lg:block"></div>
                
                <div className="lg:pl-6">
                  <Quote className="w-14 h-14 text-primary/20 mb-4" />
                  
                  <blockquote className="text-xl md:text-2xl lg:text-3xl leading-relaxed text-foreground font-display mb-6">
                    <span className="text-primary">"</span>
                    To build a trusted and intelligent network where business owners, directors, and professionals connect through meaningful collaboration, creating a smart bridge between opportunities and talent.
                    <span className="text-primary">"</span>
                  </blockquote>

                  <div className="h-px bg-gradient-to-r from-primary/50 via-secondary/50 to-transparent mb-6"></div>

                  <p className="text-lg leading-relaxed text-muted-foreground">
                    Our goal is not only to empower job seekers with access to the right people and projects, but also to help discover new business collaborations, unlock investment opportunities, and drive collective growth and integrated success for all.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 hover:bg-primary/20">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm font-medium text-primary">Global Vision</span>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 hover:bg-secondary/20">
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                      <span className="text-sm font-medium text-secondary">Trusted Network</span>
                    </div>
                    <div className="flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 hover:bg-accent/30">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span className="text-sm font-medium text-accent">Smart Connections</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
        </section>

        {/* PEF Mission Section - Professional Elegant */}
        <section className="relative py-10 md:py-16 bg-background overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-4">
                <Target className="w-4 h-4" />
                <span className="text-sm font-semibold">Our Purpose</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
                PEF Mission
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-secondary via-primary to-accent mx-auto rounded-full mb-8"></div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl blur-xl"></div>
              <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-8 md:p-10 shadow-lg">
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/30 rounded-tl-lg"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-secondary/30 rounded-br-lg"></div>
                
                <p className="text-xl md:text-2xl leading-relaxed text-foreground text-center font-medium">
                  To empower professionals through networking, knowledge-sharing, and community-driven support, helping members access real opportunities, build meaningful connections, and grow in their careers with integrity and collaboration.
                </p>

                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Networking</span>
                  </div>
                  <div className="w-px h-5 bg-border"></div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lightbulb className="w-5 h-5 text-secondary" />
                    <span className="text-sm font-medium">Knowledge-Sharing</span>
                  </div>
                  <div className="w-px h-5 bg-border"></div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="w-5 h-5 text-accent" />
                    <span className="text-sm font-medium">Community Support</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <Link href="/membership">
                <Button size="lg" className="group" data-testid="button-join-mission">
                  Join Our Mission
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" data-testid="button-contact-mission">
                  Get in Touch
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Core Values - Enhanced with Better Hover Effects */}
        <section className="relative py-10 md:py-16 bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full mb-4">
                <Award className="w-4 h-4" />
                <span className="text-sm font-semibold">What We Stand For</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
                Our Core Values
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-accent via-primary to-secondary mx-auto rounded-full mb-4"></div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {coreValues.map((value, index) => {
                const IconComponent = value.icon;
                
                return (
                  <div 
                    key={index} 
                    className="group relative"
                    data-testid={`card-value-${value.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-xl`}></div>
                    <Card className="relative h-full border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-lg group-hover:-translate-y-1">
                      <CardContent className="p-5">
                        <div className={`w-11 h-11 bg-gradient-to-br ${value.gradient} rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-300">{value.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {value.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Future Plan - AI Matching Platform with Enhanced UI */}
        <section className="relative py-10 md:py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-secondary/20 text-primary px-4 py-2 rounded-full mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">The Future Plan</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
                AI-Powered Matching
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full mb-4"></div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Intelligent technology that connects the right people with the right opportunities
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Left side - Key Features */}
              <div className="space-y-4">
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Card className="relative border-primary/20 bg-card/80 backdrop-blur-sm transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-lg group-hover:-translate-x-1">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                          <Lightbulb className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-1.5 group-hover:text-primary transition-colors">Smart Opportunity Suggestions</h3>
                          <p className="text-muted-foreground text-sm">
                            AI-based system will automatically suggest opportunities to business owners
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Card className="relative border-secondary/20 bg-card/80 backdrop-blur-sm transition-all duration-300 group-hover:border-secondary/40 group-hover:shadow-lg group-hover:-translate-x-1">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-secondary to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-1.5 group-hover:text-secondary transition-colors">Intelligent Job Matching</h3>
                          <p className="text-muted-foreground text-sm">
                            Job seekers will be matched with relevant projects, mentors, or companies
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Card className="relative border-accent/20 bg-card/80 backdrop-blur-sm transition-all duration-300 group-hover:border-accent/40 group-hover:shadow-lg group-hover:-translate-x-1">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-accent to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                          <Database className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-1.5 group-hover:text-accent transition-colors">Data-Driven Decisions</h3>
                          <p className="text-muted-foreground text-sm">
                            Data-driven decisions to maximize impact, efficiency and growth
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right side - AI Hub Diagram */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl blur-2xl"></div>
                <div className="relative bg-card/90 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-xl">
                  {/* Central AI Hub */}
                  <div className="relative flex justify-center mb-8 z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-lg opacity-50 animate-pulse"></div>
                      <div className="relative w-20 h-20 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center shadow-xl">
                        <Brain className="w-10 h-10 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative text-center mb-8 z-10">
                    <h3 className="text-lg font-bold">AI Matching Hub</h3>
                    <p className="text-sm text-muted-foreground">Connecting opportunities intelligently</p>
                  </div>

                  {/* Connected Elements */}
                  <div className="relative z-20 grid grid-cols-2 gap-4">
                    <div className="group text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/20 transition-all duration-300 hover:scale-105 hover:border-blue-500/40 hover:shadow-lg cursor-default">
                      <div className="relative mx-auto mb-2 w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-blue-400/40"></div>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:rotate-12">
                          <Briefcase className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm">Job Seekers</h4>
                    </div>

                    <div className="group text-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border border-purple-500/20 transition-all duration-300 hover:scale-105 hover:border-purple-500/40 hover:shadow-lg cursor-default">
                      <div className="relative mx-auto mb-2 w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-purple-400/40"></div>
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:rotate-12">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm">Businesses</h4>
                    </div>

                    <div className="group text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-500/20 transition-all duration-300 hover:scale-105 hover:border-green-500/40 hover:shadow-lg cursor-default">
                      <div className="relative mx-auto mb-2 w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-green-400/40"></div>
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:rotate-12">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm">Projects Collaboration</h4>
                    </div>

                    <div className="group text-center p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl border border-amber-500/20 transition-all duration-300 hover:scale-105 hover:border-amber-500/40 hover:shadow-lg cursor-default">
                      <div className="relative mx-auto mb-2 w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-amber-400/40"></div>
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:rotate-12">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm">Investors</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Currently in Development</span>
              </div>
              <p className="text-muted-foreground mb-5">
                Our AI platform will revolutionize how professionals connect globally
              </p>
              <Link href="/contact">
                <Button size="lg" variant="default" className="group" data-testid="button-ai-interest">
                  Express Interest in Early Access
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Community Ecosystem */}
        <section className="relative py-10 md:py-16 bg-gradient-to-br from-secondary/10 to-primary/5 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-20 w-64 h-64 bg-secondary/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                <Users className="w-4 h-4" />
                <span className="text-sm font-semibold">Our Ecosystem</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
                Our Community
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full mb-4"></div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A diverse ecosystem connecting five key stakeholder groups
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Card className="group hover-elevate transition-all duration-300 hover:-translate-y-1" data-testid="card-professionals">
                <CardContent className="p-5 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                    <UserCircle className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Professionals</h3>
                  <p className="text-muted-foreground text-sm">
                    Experienced experts seeking new opportunities and collaborations to expand their impact.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover-elevate transition-all duration-300 hover:-translate-y-1" data-testid="card-jobseekers">
                <CardContent className="p-5 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Job Seekers</h3>
                  <p className="text-muted-foreground text-sm">
                    Talented individuals connecting with the right employers and career opportunities worldwide.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover-elevate transition-all duration-300 hover:-translate-y-1" data-testid="card-employers">
                <CardContent className="p-5 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Employers</h3>
                  <p className="text-muted-foreground text-sm">
                    Organizations finding top talent and building high-performing teams for growth.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover-elevate transition-all duration-300 hover:-translate-y-1" data-testid="card-business-owners">
                <CardContent className="p-5 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Business Owners</h3>
                  <p className="text-muted-foreground text-sm">
                    Entrepreneurs discovering partnerships, collaborations, and new market opportunities.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover-elevate transition-all duration-300 hover:-translate-y-1" data-testid="card-investors">
                <CardContent className="p-5 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Investors</h3>
                  <p className="text-muted-foreground text-sm">
                    Strategic investors finding promising ventures and building portfolio value.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover-elevate bg-gradient-to-br from-primary/5 to-secondary/5 transition-all duration-300 hover:-translate-y-1" data-testid="card-join-community">
                <CardContent className="p-5 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">Join the Network</h3>
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
        <section className="py-12 md:py-16 bg-gradient-to-br from-primary to-[hsl(213,58%,35%)] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
              Ready to Connect with Global Opportunities?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
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
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/30 transition-all duration-300 hover:bg-white/20" data-testid="button-cta-explore">
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
