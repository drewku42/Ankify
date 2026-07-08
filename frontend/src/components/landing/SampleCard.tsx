interface SampleCardProps {
  question: string;
  answer: string;
}

export function SampleCard({ question, answer }: SampleCardProps) {
  return (
    <div className="landing__sample">
      <div className="landing__sample-top">Generated card</div>
      <div className="landing__sample-body">
        <p className="landing__sample-q">{question}</p>
        <div className="landing__sample-divider" />
        <p className="landing__sample-a">{answer}</p>
      </div>
      <div className="landing__sample-foot">✦ atomic · exportable to Anki</div>
    </div>
  );
}
