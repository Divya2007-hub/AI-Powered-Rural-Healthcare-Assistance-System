import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../i18n/I18nProvider.jsx";
import SmsSupport from "./SmsSupport.jsx";
import { sendDemoSms } from "../../api/sms.js";

vi.mock("../../api/sms.js", () => ({
  sendDemoSms: vi.fn(),
}));

function renderScreen() {
  const onBack = vi.fn();
  render(
    <I18nProvider>
      <SmsSupport onBack={onBack} />
    </I18nProvider>,
  );
  return { onBack };
}

describe("SmsSupport", () => {
  beforeEach(() => {
    sendDemoSms.mockReset();
  });

  it("asks for a message before calling the API", async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please type a message first.",
    );
    expect(sendDemoSms).not.toHaveBeenCalled();
  });

  it("shows the demo conversation after a reply", async () => {
    const user = userEvent.setup();
    sendDemoSms.mockResolvedValue({
      reply: "Medical Consultation Recommended: fever.",
      urgency_code: "consult",
      emergency: false,
      language: "en",
    });
    renderScreen();

    await user.type(
      screen.getByLabelText(/your text message/i),
      "fever, cough",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/fever\.$/)).toBeInTheDocument();
    expect(document.querySelector(".sms-bubble.is-out")).toHaveTextContent(
      "fever, cough",
    );
    expect(sendDemoSms).toHaveBeenCalledWith({
      body: "fever, cough",
      language: "en",
    });
    expect(screen.getByLabelText(/your text message/i)).toHaveValue("");
  });

  it("shows the API error and keeps the typed message", async () => {
    const user = userEvent.setup();
    sendDemoSms.mockRejectedValue(new Error("Gateway unavailable"));
    renderScreen();

    await user.type(screen.getByLabelText(/your text message/i), "fever");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Gateway unavailable",
    );
    expect(screen.getByLabelText(/your text message/i)).toHaveValue("fever");
  });

  it("calls onBack", async () => {
    const user = userEvent.setup();
    const { onBack } = renderScreen();

    await user.click(screen.getByRole("button", { name: /back to home/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
