import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/store";
import { LandingHero } from "@/components/landing/LandingHero";

describe("LandingHero", () => {
  it("renders the headline and kicker", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <LandingHero />
        </MemoryRouter>
      </Provider>,
    );
    expect(
      screen.getByRole("heading", { name: /stop making cards/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/lecture pdf → anki/i)).toBeInTheDocument();
  });
});
