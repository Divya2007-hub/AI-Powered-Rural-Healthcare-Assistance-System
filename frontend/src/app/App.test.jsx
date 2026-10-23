import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App.jsx";
import { I18nProvider } from "../i18n/I18nProvider.jsx";

function renderApp() {
  render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  );
}

describe("App navigation", () => {
  it("opens the SMS screen from the header", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "SMS" }));

    expect(
      screen.getByRole("heading", { name: "SMS Support" }),
    ).toBeInTheDocument();
  });

  it("returns home from the SMS screen", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "SMS" }));
    await user.click(screen.getByRole("button", { name: /back to home/i }));

    expect(
      screen.getByRole("heading", { name: /your health/i }),
    ).toBeInTheDocument();
  });
});
