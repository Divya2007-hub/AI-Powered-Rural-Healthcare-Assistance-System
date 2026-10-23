import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../i18n/I18nProvider.jsx";
import SymptomCheck from "./SymptomCheck.jsx";
import { assessSymptoms } from "../../api/triage.js";

vi.mock("../../api/triage.js", () => ({
  assessSymptoms: vi.fn(),
}));

function renderScreen() {
  render(
    <I18nProvider>
      <SymptomCheck onBack={vi.fn()} />
    </I18nProvider>,
  );
}

const URGENT_RESULT = {
  urgency: "Urgent Care Required",
  urgency_code: "urgent",
  summary: "Your symptoms may need emergency care.",
  red_flags: ["Chest pain or pressure"],
  advice: ["Call emergency services now."],
  emergency: true,
  engine: "rule-based-v1",
  disclaimer: "This is general guidance, not a diagnosis.",
};

describe("SymptomCheck", () => {
  beforeEach(() => {
    assessSymptoms.mockReset();
  });

  it("rejects an empty symptom list", async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole("button", { name: /get guidance/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please enter at least one symptom.",
    );
    expect(assessSymptoms).not.toHaveBeenCalled();
  });

  it("renders the triage result and emergency warning", async () => {
    const user = userEvent.setup();
    assessSymptoms.mockResolvedValue(URGENT_RESULT);
    renderScreen();

    await user.type(screen.getByLabelText("Symptoms"), "chest pain");
    await user.click(screen.getByRole("button", { name: /get guidance/i }));

    expect(
      await screen.findByRole("heading", { name: "Urgent Care Required" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Chest pain or pressure")).toBeInTheDocument();
    expect(screen.getByText("Call emergency services now.")).toBeInTheDocument();
    expect(screen.getByText(/rule-based-v1/)).toBeInTheDocument();
    expect(assessSymptoms).toHaveBeenCalledWith(
      expect.objectContaining({
        symptoms: ["chest pain"],
        language: "en",
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("sends the selected language", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("sevacare_language", "hi");
    assessSymptoms.mockResolvedValue({
      ...URGENT_RESULT,
      urgency: "तत्काल देखभाल आवश्यक",
    });
    renderScreen();

    await user.type(screen.getByLabelText("लक्षण"), "बुखार");
    await user.click(screen.getByRole("button", { name: /मार्गदर्शन/ }));

    expect(assessSymptoms).toHaveBeenCalledWith(
      expect.objectContaining({ symptoms: ["बुखार"], language: "hi" }),
      expect.any(Object),
    );
  });
});
