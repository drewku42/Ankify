import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/store";
import { StandardLanding } from "@/pages/landings/StandardLanding";

describe("StandardLanding", () => {
  it("renders hero, how-it-works, a sample card, and a footer CTA", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <StandardLanding />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByRole("heading", { name: /stop making cards/i })).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText(/generated card/i)).toBeInTheDocument();
    // hero CTA + footer CTA => two Google buttons
    expect(screen.getAllByRole("button", { name: /continue with google/i }).length).toBeGreaterThanOrEqual(2);
  });
});
