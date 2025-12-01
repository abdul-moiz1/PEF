import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ChairmanMessageSection from "@/components/ChairmanMessageSection";
import GlobalReachSection from "@/components/GlobalReachSection";
import OpportunitiesGapSection from "@/components/OpportunitiesGapSection";
import WhyPEFSection from "@/components/WhyPEFSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <ChairmanMessageSection />
        <GlobalReachSection />
        <OpportunitiesGapSection />
        <WhyPEFSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
