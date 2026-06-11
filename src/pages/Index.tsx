import { Nav } from "@/components/marketing/Nav";
import { Hero } from "@/components/marketing/Hero";
import { StatsSection } from "@/components/marketing/StatsSection";
import { ServicesSection } from "@/components/marketing/ServicesSection";
import { AIStrategyGenerator } from "@/components/marketing/AIStrategyGenerator";
import { LocalSeoSection } from "@/components/marketing/LocalSeoSection";
import { MetaAdsSection } from "@/components/marketing/MetaAdsSection";
import { CompetitorIntelSection } from "@/components/marketing/CompetitorIntelSection";
import { RoiCalculator } from "@/components/marketing/RoiCalculator";
import { ProcessTimeline } from "@/components/marketing/ProcessTimeline";
import { PricingSection } from "@/components/marketing/PricingSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { ContactSection } from "@/components/marketing/ContactSection";
import { Footer } from "@/components/marketing/Footer";

export default function Index() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <StatsSection />
        <ServicesSection />
        <AIStrategyGenerator />
        <LocalSeoSection />
        <MetaAdsSection />
        <CompetitorIntelSection />
        <RoiCalculator />
        <ProcessTimeline />
        <PricingSection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
