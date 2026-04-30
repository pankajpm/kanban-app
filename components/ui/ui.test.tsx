import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import { Card } from "./card";
import { Input } from "./input";

describe("UI primitives", () => {
  it("renders a default button with project button styling", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("button");
  });

  it("renders a ghost button variant with caller classes", () => {
    render(
      <Button className="extra-class" variant="ghost">
        Delete
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "button",
      "button-ghost",
      "extra-class",
    );
  });

  it("renders an input with project input styling", () => {
    render(<Input aria-label="Card title" />);

    expect(screen.getByLabelText("Card title")).toHaveClass("input");
  });

  it("renders a card with project card styling and caller classes", () => {
    render(<Card className="task-card">Task content</Card>);

    expect(screen.getByText("Task content")).toHaveClass("card", "task-card");
  });
});
