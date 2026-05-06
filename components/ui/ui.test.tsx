import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Button } from "./button";
import { Card } from "./card";
import { Input } from "./input";
import { ThemeToggle } from "./theme-toggle";

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

describe("ThemeToggle", () => {
  beforeEach(() => {
    // Default to light mode for each test unless overridden.
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  it("renders nothing before mount, then shows the button", async () => {
    // The mounted guard prevents hydration mismatch on the server render.
    render(<ThemeToggle />);

    // Button appears after useEffect runs (client mount).
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  it("renders toggle button with correct aria-label in light mode", async () => {
    document.documentElement.setAttribute("data-theme", "light");
    render(<ThemeToggle />);

    const button = await screen.findByRole("button", { name: "Switch to dark mode" });
    expect(button).toBeInTheDocument();
  });

  it("renders toggle button with correct aria-label in dark mode", async () => {
    document.documentElement.setAttribute("data-theme", "dark");
    render(<ThemeToggle />);

    const button = await screen.findByRole("button", { name: "Switch to light mode" });
    expect(button).toBeInTheDocument();
  });

  it("toggles from light to dark on click", async () => {
    const user = userEvent.setup();
    document.documentElement.setAttribute("data-theme", "light");
    render(<ThemeToggle />);

    const button = await screen.findByRole("button", { name: "Switch to dark mode" });
    await user.click(button);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("toggles from dark to light on click", async () => {
    const user = userEvent.setup();
    document.documentElement.setAttribute("data-theme", "dark");
    render(<ThemeToggle />);

    const button = await screen.findByRole("button", { name: "Switch to light mode" });
    await user.click(button);

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("persists preference to localStorage on toggle", async () => {
    const user = userEvent.setup();
    document.documentElement.setAttribute("data-theme", "light");
    render(<ThemeToggle />);

    const button = await screen.findByRole("button", { name: "Switch to dark mode" });
    await user.click(button);

    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("applies theme-toggle class to the button", async () => {
    render(<ThemeToggle />);

    const button = await screen.findByRole("button");
    expect(button).toHaveClass("theme-toggle");
  });
});
