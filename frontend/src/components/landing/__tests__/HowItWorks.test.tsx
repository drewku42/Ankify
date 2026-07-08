import { render, screen } from "@testing-library/react";
import { HowItWorks } from "@/components/landing/HowItWorks";

describe("HowItWorks", () => {
  it("renders three numbered steps", () => {
    render(<HowItWorks />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByText(/export/i)).toBeInTheDocument();
  });
});
