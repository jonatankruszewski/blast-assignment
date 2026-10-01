import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MenuSelect } from "./menu-select.js";

const options = [
  { value: "all", label: "All" },
  { value: "permissions", label: "Permissions" },
  { value: "violations", label: "Violations" },
];

describe("MenuSelect", () => {
  it("shows label and current value", () => {
    render(
      <MenuSelect
        label="Layers"
        ariaLabel="Layers"
        value="all"
        options={options}
        onChange={vi.fn()}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Layers: All" });
    expect(trigger).toHaveTextContent("Layers: All");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("selects with the mouse", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MenuSelect ariaLabel="Layers" value="all" options={options} onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Violations" }));
    expect(onChange).toHaveBeenCalledWith("violations");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("supports keyboard navigation and returns focus on Escape", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MenuSelect ariaLabel="Layers" value="all" options={options} onChange={onChange} />);
    const trigger = screen.getByRole("button");
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveFocus();
    expect(screen.getByRole("option", { name: "All" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("permissions");
    expect(trigger).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("shows the placeholder when nothing is selected", () => {
    render(
      <MenuSelect
        ariaLabel="Select Cloud Unit"
        placeholder="Select Cloud Unit"
        options={options}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Select Cloud Unit" })).toHaveTextContent(
      "Select Cloud Unit",
    );
  });
});
