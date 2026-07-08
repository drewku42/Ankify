const CARDS = [
  { q: "Q · Site of ATP synthesis?", a: "Mitochondrion" },
  { q: "Q · ATP stands for?", a: "Adenosine triphosphate" },
  { q: "Q · Where in the cell?", a: "Inner membrane" },
];

export function PdfToCardsVisual() {
  return (
    <div className="landing__flow" aria-hidden="true">
      <div className="landing__fan">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`landing__page landing__page--p${i + 1}`}>
            <span className="landing__ln landing__ln--m" />
            <span className="landing__ln" />
            <span className="landing__ln landing__ln--s" />
          </div>
        ))}
        <div className="landing__page landing__page--p4">
          <span className="landing__pdftag">PDF</span>
          <span className="landing__ln landing__ln--m" />
          <span className="landing__ln" />
          <span className="landing__ln landing__ln--s" />
        </div>
      </div>

      <div className="landing__arrow">→</div>

      <div className="landing__fan">
        {CARDS.map((c, i) => (
          <div key={i} className={`landing__pdfcard landing__pdfcard--c${i + 1}`}>
            <span className="landing__pdfcard-q">{c.q}</span>
            <span className="landing__pdfcard-a">{c.a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
