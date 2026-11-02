import Hero from '@/components/home/Hero';
import ServiceGrid from '@/components/home/ServiceGrid';
import HowItWorks from '@/components/home/HowItWorks';
import PricingPreview from '@/components/home/PricingPreview';
import Comparison from '@/components/home/Comparison';
import Ownership from '@/components/home/Ownership';
import Faq from '@/components/home/Faq';
import FinalCta from '@/components/home/FinalCta';

export default function Home() {
  return (
    <>
      <Hero />
      <ServiceGrid />
      <HowItWorks />
      <PricingPreview />
      <Comparison />
      <Ownership />
      <Faq />
      <FinalCta />
    </>
  );
}