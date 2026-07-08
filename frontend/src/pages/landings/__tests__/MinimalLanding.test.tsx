import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/store";
import { MinimalLanding } from "@/pages/landings/MinimalLanding";

describe("MinimalLanding", () => {
  it("renders the hero with the CTA", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <MinimalLanding />
        </MemoryRouter>
      </Provider>,
    );
    expect(
      screen.getByRole("heading", { name: /stop making cards/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });
});
