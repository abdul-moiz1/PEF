import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/generated_images/Professional_business_handshake_hero_9421906c.png";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundAttachment: "fixed",
        }}
      />
      <div className="absolute inset-0 bg-primary/75" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
          data-testid="text-hero-title"
        >
          Professional Executive Forum
        </h1>

        <p
          className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150"
          data-testid="text-hero-subtitle"
        >
          Collecting structured information from professionals, job seekers, employers, business owners, and investors to create a massive, high-quality global database—powering intelligent opportunity matching in the future
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <Link href="/register">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent text-accent-foreground font-semibold text-lg px-8 py-6 min-h-14 transition-transform duration-200 hover:scale-105 group"
              data-testid="button-join-forum"
            >
              Join Now
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm font-semibold text-lg px-8 py-6 min-h-14 transition-transform duration-200 hover:scale-105 group"
              data-testid="button-create-account"
            >
              Create Account
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
