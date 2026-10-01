import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiConfig } from "../../api/guardrails-api.js";
import { SCREENSHOT_GUARDRAIL_ID } from "../../mocks/guardrails.fixtures.js";
import { renderWithClient } from "../../test/render-with-client.js";
import { DeployFooter } from "./deploy-footer.js";

const original = { ...apiConfig };

beforeEach(() => {
  apiConfig.latencyMs = 20;
});

afterEach(() => {
  Object.assign(apiConfig, original);
});

describe("DeployFooter", () => {
  it("shows a pending button, then confirms the deployment", async () => {
    apiConfig.random = () => 0.99;
    const user = userEvent.setup();
    renderWithClient(<DeployFooter guardrailId={SCREENSHOT_GUARDRAIL_ID} onCancel={vi.fn()} />);

    const deploy = screen.getByRole("button", { name: /Deploy Guardrail/ });
    await user.click(deploy);
    expect(deploy).toHaveAttribute("aria-busy", "true");
    expect(deploy).toBeDisabled();

    expect(await screen.findByText("Guardrail deployed.")).toBeInTheDocument();
    await waitFor(() => {
      expect(deploy).not.toBeDisabled();
    });
  });

  it("reports a failed deployment and lets the user retry", async () => {
    apiConfig.random = () => 0;
    const user = userEvent.setup();
    renderWithClient(<DeployFooter guardrailId={SCREENSHOT_GUARDRAIL_ID} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Deploy Guardrail/ }));
    await waitFor(() => {
      expect(screen.getByText(/Deployment failed/)).toBeInTheDocument();
    });

    apiConfig.random = () => 0.99;
    await user.click(screen.getByRole("button", { name: /Retry Deploy/ }));
    expect(await screen.findByText("Guardrail deployed.")).toBeInTheDocument();
  });

  it("calls onCancel from the Cancel button", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderWithClient(<DeployFooter guardrailId={SCREENSHOT_GUARDRAIL_ID} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
