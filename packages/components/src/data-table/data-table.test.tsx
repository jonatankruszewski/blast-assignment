import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "./data-table.js";

interface Row {
  id: string;
  name: string;
  count: number;
}
const rows: Row[] = [
  { id: "1", name: "Alpha", count: 3 },
  { id: "2", name: "Beta", count: 5 },
];
const columns = [
  { key: "name", header: "Name" },
  { key: "count", header: "Count", render: (row: Row) => `${String(row.count)} items` },
];

describe("DataTable", () => {
  it("renders headers and cells", () => {
    render(<DataTable ariaLabel="Things" rows={rows} columns={columns} getRowId={(r) => r.id} />);
    expect(screen.getByRole("table", { name: "Things" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "5 items" })).toBeInTheDocument();
  });

  it("activates a row by click and keyboard", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      <DataTable
        ariaLabel="Things"
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        onRowClick={onRowClick}
        getRowLabel={(r) => `open ${r.name}`}
      />,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Alpha, open Alpha" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenLastCalledWith(rows[0]);
    await user.click(screen.getByRole("button", { name: "Beta, open Beta" }));
    expect(onRowClick).toHaveBeenLastCalledWith(rows[1]);
  });

  it("shows the empty state", () => {
    render(
      <DataTable
        ariaLabel="Things"
        rows={[]}
        columns={columns}
        getRowId={(r: Row) => r.id}
        emptyState={<p>No things</p>}
      />,
    );
    expect(screen.getByText("No things")).toBeInTheDocument();
  });
});
