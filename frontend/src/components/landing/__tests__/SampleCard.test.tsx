import { render, screen } from "@testing-library/react";
import { SampleCard } from "@/components/landing/SampleCard";

describe("SampleCard", () => {
  it("renders the question and answer passed in", () => {
    render(<SampleCard question="What makes ATP?" answer="Mitochondria" />);
    expect(screen.getByText("What makes ATP?")).toBeInTheDocument();
    expect(screen.getByText("Mitochondria")).toBeInTheDocument();
    expect(screen.getByText(/generated card/i)).toBeInTheDocument();
  });
});
