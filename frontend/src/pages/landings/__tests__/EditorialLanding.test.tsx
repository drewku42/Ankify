import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/store";
import { EditorialLanding } from "@/pages/landings/EditorialLanding";

beforeAll(() => {
  // jsdom has no IntersectionObserver
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error test shim
  globalThis.IntersectionObserver = IO;
});

describe("EditorialLanding", () => {
  it("renders the narrative with a closing CTA", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <EditorialLanding />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByRole("heading", { name: /stop making cards/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /continue with google/i }).length).toBeGreaterThanOrEqual(1);
  });
});
