import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { TabPanel, Tabs } from "./tabs.js";

function Harness() {
  const [value, setValue] = useState("a");
  return (
    <>
      <Tabs
        ariaLabel="Sections"
        value={value}
        onChange={setValue}
        items={[
          { id: "a", label: "Overview" },
          { id: "b", label: "Violations", count: 4 },
          { id: "c", label: "Tasks", count: 2 },
        ]}
      />
      <TabPanel id={value}>panel {value}</TabPanel>
    </>
  );
}

describe("Tabs", () => {
  it("renders counts and links tabs to panels", () => {
    render(<Harness />);
    const tab = screen.getByRole("tab", { name: "Violations (4)" });
    expect(tab).toHaveAttribute("id", "tab-b");
    expect(tab).toHaveAttribute("aria-controls", "panel-b");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "tab-a");
  });

  it("moves selection and focus with arrow keys, Home and End", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("tab", { name: "Overview" }));
    await user.keyboard("{ArrowRight}");
    const second = screen.getByRole("tab", { name: "Violations (4)" });
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("panel b");
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Tasks (2)" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Tasks (2)" })).toHaveFocus();
  });

  it("keeps only the selected tab in the tab order", () => {
    render(<Harness />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1]);
  });
});
