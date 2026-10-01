import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { apiConfig } from "../../api/guardrails-api.js";
import { SCREENSHOT_GUARDRAIL_ID } from "../../mocks/guardrails.fixtures.js";
import { renderWithClient } from "../../test/render-with-client.js";
import { GuardrailsScreen } from "../guardrails-screen.js";

const original = { ...apiConfig };

beforeEach(() => {
  apiConfig.latencyMs = 0;
  window.history.replaceState(null, "", `/?guardrail=${SCREENSHOT_GUARDRAIL_ID}&tab=overview`);
});

afterEach(() => {
  Object.assign(apiConfig, original);
  window.history.replaceState(null, "", "/");
});

describe("GuardrailDrawer", () => {
  it("shows the screenshot guardrail with its tabs and counts", async () => {
    renderWithClient(<GuardrailsScreen />);
    const dialog = await screen.findByRole("dialog", { name: "Guardrail details" });
    expect(
      await within(dialog).findByRole("heading", {
        name: /Prevent modification of Access Analyzer Settings/,
      }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Preventive Guardrail")).toBeInTheDocument();

    const tablist = within(dialog).getByRole("tablist", { name: "Guardrail sections" });
    const names = within(tablist)
      .getAllByRole("tab")
      .map((tab) => tab.textContent.replace(/\s+/g, " ").trim());
    expect(names).toEqual([
      "Overview",
      "Previous Activities (15)",
      "Affected Resources (34)",
      "Violations (4)",
      "Exclusions (2)",
      "Tasks (2)",
      "Enforcement Analysis",
    ]);
    expect(within(tablist).getByRole("tab", { name: /Overview/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("switches tabs through the URL", async () => {
    const user = userEvent.setup();
    renderWithClient(<GuardrailsScreen />);
    const dialog = await screen.findByRole("dialog");
    await user.click(await within(dialog).findByRole("tab", { name: /Enforcement Analysis/ }));

    expect(window.location.search).toContain("tab=enforcement-analysis");
    expect(within(dialog).getByRole("tab", { name: /Enforcement Analysis/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(within(dialog).getByRole("tabpanel")).toHaveTextContent(
      /Enforcement analysis is not available yet/,
    );
  });

  it("hides and shows the metadata panel", async () => {
    const user = userEvent.setup();
    renderWithClient(<GuardrailsScreen />);
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("Defense Hardening")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Hide Metadata" }));
    expect(within(dialog).queryByText("Defense Hardening")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Show Metadata" }));
    expect(within(dialog).getByText("Defense Hardening")).toBeInTheDocument();
  });

  it("closes with Cancel and returns to the table", async () => {
    const user = userEvent.setup();
    renderWithClient(<GuardrailsScreen />);
    const dialog = await screen.findByRole("dialog");
    await user.click(await within(dialog).findByRole("button", { name: "Cancel" }));

    expect(window.location.search).toBe("");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(await screen.findByRole("heading", { name: "Guardrails" })).toBeInTheDocument();
  });
});

describe("GuardrailsScreen", () => {
  it("opens the drawer from a table row", async () => {
    window.history.replaceState(null, "", "/");
    const user = userEvent.setup();
    renderWithClient(<GuardrailsScreen />);

    const table = await screen.findByRole("table", { name: "Guardrails" });
    await user.click(within(table).getByText("Block public access changes on S3 buckets"));

    expect(window.location.search).toBe("?guardrail=gr-s3-public&tab=overview");
    const dialog = await screen.findByRole("dialog");
    expect(
      await within(dialog).findByRole("heading", {
        name: /Block public access changes on S3 buckets/,
      }),
    ).toBeInTheDocument();
  });

  it("shows an error state for an unknown guardrail", async () => {
    window.history.replaceState(null, "", "/?guardrail=does-not-exist&tab=overview");
    renderWithClient(<GuardrailsScreen />);
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      /Could not load this guardrail/,
    );
    expect(within(dialog).getByRole("button", { name: "Back to guardrails" })).toBeInTheDocument();
  });
});
