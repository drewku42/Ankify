import { LandingHero } from "@/components/landing/LandingHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SampleCard } from "@/components/landing/SampleCard";
import { SignInCTA } from "@/components/landing/SignInCTA";
import { PdfToCardsVisual } from "@/components/landing/PdfToCardsVisual";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

export function EditorialLanding() {
  const reveal = useRevealOnScroll();

  return (
    <main className="landing landing--editorial">
      <LandingHero />

      <section ref={reveal} className="landing__editorial-statement landing__reveal">
        <p className="landing__kicker">The problem</p>
        <p className="landing__editorial-lead">
          Great decks take hours to write. So most people never make them —
          or make bad ones.
        </p>
      </section>

      <section ref={reveal} className="landing__editorial-transform landing__reveal">
        <PdfToCardsVisual />
        <p className="landing__editorial-caption">
          Your lecture PDF, distilled into atomic cards — automatically.
        </p>
      </section>

      <HowItWorks />

      <section ref={reveal} className="landing__editorial-proof landing__reveal">
        <div className="landing__editorial-proof-copy">
          <p className="landing__kicker">The craft</p>
          <h2 className="landing__editorial-h2">One idea per card. Every time.</h2>
        </div>
        <SampleCard
          question="What organelle is the site of ATP synthesis?"
          answer="The mitochondrion — via oxidative phosphorylation on the inner membrane."
        />
      </section>

      <footer className="landing__footer">
        <h2 className="landing__footer-title">From lecture hall to long-term memory.</h2>
        <SignInCTA />
      </footer>
    </main>
  );
}
