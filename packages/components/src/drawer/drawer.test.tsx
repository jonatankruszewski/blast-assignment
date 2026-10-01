import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "./drawer.js";

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose?.();
    setOpen(false);
  };
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open
      </button>
      <Drawer open={open} onClose={close} ariaLabel="Guardrail">
        <DrawerHeader icon={null} eyebrow="Preventive Guardrail" title="Title" />
        <DrawerBody main={<p>Main</p>} aside={<p>Aside</p>} />
        <DrawerFooter>
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button type="button">Deploy</button>
        </DrawerFooter>
      </Drawer>
    </>
  );
}

describe("Drawer", () => {
  it("renders nothing when closed", () => {
    render(<Harness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens, focuses itself and closes on Escape, restoring focus", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const opener = screen.getByRole("button", { name: "Open" });
    await user.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Guardrail" });
    expect(dialog).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByRole("complementary")).toHaveTextContent("Aside");
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("traps Tab inside the drawer", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Deploy" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Deploy" })).toHaveFocus();
  });
});
