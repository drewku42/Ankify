import { SignInCTA } from "@/components/landing/SignInCTA";
import { PdfToCardsVisual } from "@/components/landing/PdfToCardsVisual";

export function LandingHero() {
  return (
    <section className="landing__hero">
      <div className="landing__hero-copy">
        <p className="landing__kicker">01 — Lecture PDF → Anki</p>
        <h1 className="landing__headline">
          Stop making cards
          <br />
          by hand. <span className="landing__mark">Ankify it.</span>
        </h1>
        <p className="landing__subcopy">
          Upload your lecture slides. Ankify writes clean, atomic flashcards and
          exports them straight to Anki.
        </p>
        <SignInCTA />
      </div>
      <PdfToCardsVisual />
    </section>
  );
}
