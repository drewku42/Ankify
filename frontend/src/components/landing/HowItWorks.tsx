const STEPS = [
  {
    n: "01",
    title: "Upload your slides",
    body: "Drop in a lecture PDF — a single deck or a whole semester.",
  },
  {
    n: "02",
    title: "Ankify writes the cards",
    body: "AI distills each slide into clean, atomic, high-yield flashcards.",
  },
  {
    n: "03",
    title: "Export to Anki",
    body: "Download a ready-to-import .apkg and study in the app you already use.",
  },
];

export function HowItWorks() {
  return (
    <section className="landing__how">
      <p className="landing__kicker">How it works</p>
      <div className="landing__steps">
        {STEPS.map((s) => (
          <div key={s.n} className="landing__step">
            <span className="landing__step-n">{s.n}</span>
            <h3 className="landing__step-title">{s.title}</h3>
            <p className="landing__step-body">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
