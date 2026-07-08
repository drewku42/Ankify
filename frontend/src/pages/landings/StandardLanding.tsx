import { LandingHero } from "@/components/landing/LandingHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SampleCard } from "@/components/landing/SampleCard";
import { SignInCTA } from "@/components/landing/SignInCTA";

export function StandardLanding() {
  return (
    <main className="landing landing--standard">
      <LandingHero />
      <HowItWorks />
      <section className="landing__showcase">
        <div className="landing__showcase-copy">
          <p className="landing__kicker">The output</p>
          <h2 className="landing__showcase-title">
            Cards that follow real spaced-repetition principles.
          </h2>
          <p className="landing__subcopy">
            Atomic, minimal, one idea per card — the way high-yield decks are built.
          </p>
        </div>
        <SampleCard
          question="What organelle is the site of ATP synthesis?"
          answer="The mitochondrion — via oxidative phosphorylation on the inner membrane."
        />
      </section>
      <footer className="landing__footer">
        <h2 className="landing__footer-title">Turn your next lecture into a deck.</h2>
        <SignInCTA />
      </footer>
    </main>
  );
}
