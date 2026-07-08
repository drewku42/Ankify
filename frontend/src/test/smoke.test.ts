import { describe, it, expect } from "vitest";

describe("test harness", () => {
  it("runs and has jest-dom matchers", () => {
    const el = document.createElement("div");
    el.textContent = "ok";
    document.body.appendChild(el);
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent("ok");
  });
});
