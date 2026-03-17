import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProfilesSection } from "@/components/landing/ProfilesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { DifferentialsSection } from "@/components/landing/DifferentialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { BoostSection } from "@/components/landing/BoostSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ProfilesSection />
      <HowItWorksSection />
      <DifferentialsSection />
      <PricingSection />
      <BoostSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
