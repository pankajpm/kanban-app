import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Kanban home page", () => {
  it("renders the starter board columns and sample cards", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: "Plan, move, and finish work on one board.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "To Do" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "In Progress" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByText("Create sample data")).toBeInTheDocument();
    expect(screen.getByText("Add draggable cards")).toBeInTheDocument();
    expect(screen.getByText("Sketch board layout")).toBeInTheDocument();
  });

  it("adds a new card to the selected column and resets the form", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByLabelText("Card title"), "Review test coverage");
    await user.type(screen.getByLabelText("Card description"), "Check the first suite.");
    await user.selectOptions(screen.getByLabelText("Column"), "done");
    await user.click(screen.getByRole("button", { name: "Add card" }));

    expect(screen.getByText("Review test coverage")).toBeInTheDocument();
    expect(screen.getByText("Check the first suite.")).toBeInTheDocument();
    expect(screen.getByLabelText("Card title")).toHaveValue("");
    expect(screen.getByLabelText("Card description")).toHaveValue("");
    expect(screen.getByLabelText("Column")).toHaveValue("todo");
  });

  it("does not add a card when the title is blank", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByLabelText("Card description"), "Description without a title.");
    await user.click(screen.getByRole("button", { name: "Add card" }));

    expect(screen.queryByText("Description without a title.")).not.toBeInTheDocument();
  });

  it("deletes an existing card from the board", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(
      screen.getByRole("button", { name: "Delete Create sample data" }),
    );

    expect(screen.queryByText("Create sample data")).not.toBeInTheDocument();
  });
});
