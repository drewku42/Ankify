import { render, screen } from "@testing-library/react";
import { PdfToCardsVisual } from "@/components/landing/PdfToCardsVisual";

describe("PdfToCardsVisual", () => {
  it("labels the source as a PDF", () => {
    render(<PdfToCardsVisual />);
    expect(screen.getByText("PDF")).toBeInTheDocument();
  });

  it("renders generated cards with question labels", () => {
    render(<PdfToCardsVisual />);
    const qs = screen.getAllByText(/^Q ·/);
    expect(qs.length).toBeGreaterThanOrEqual(3);
  });
});
