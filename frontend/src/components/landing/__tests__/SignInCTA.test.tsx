import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/store";
import { SignInCTA } from "@/components/landing/SignInCTA";
import { API_URL } from "@/config";

function renderCTA(props = {}) {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <SignInCTA {...props} />
      </MemoryRouter>
    </Provider>,
  );
}

describe("SignInCTA", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  it("redirects to the Google auth endpoint on click", async () => {
    renderCTA();
    await userEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(window.location.href).toBe(`${API_URL}/auth/google`);
  });

  it("shows the .apkg export note by default", () => {
    renderCTA();
    expect(screen.getByText(/exports to/i)).toHaveTextContent(".apkg");
  });

  it("hides the export note when showExportNote is false", () => {
    renderCTA({ showExportNote: false });
    expect(screen.queryByText(/exports to/i)).not.toBeInTheDocument();
  });
});
