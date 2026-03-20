import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { CommunityShowcase } from "@/components/landing/CommunityShowcase";
import { AmbassadorsSection } from "@/components/landing/AmbassadorsSection";
import { ProfilesSection } from "@/components/landing/ProfilesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { DifferentialsSection } from "@/components/landing/DifferentialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <CommunityShowcase />
      <AmbassadorsSection />
      <ProfilesSection />
      <HowItWorksSection />
      <DifferentialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
