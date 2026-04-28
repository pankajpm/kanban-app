---
name: kanban-design-guidelines
description: Enforces visual design guidelines for the kanban app UI. Use when creating or updating UI, styles, themes, layouts, components, or design tokens to keep the interface dark mode, medium contrast, lightly rounded, Geist-based, and wide-margin.
---

# Kanban Design Guidelines

Apply these rules to every UI change unless the user explicitly asks to break them.

## Core Rules

1. Keep the UI in dark mode at all times.
2. Use medium-contrast colors and elements; avoid both low-contrast haze and harsh high-contrast extremes.
3. Keep corner radii lightly rounded, with a maximum of `2px`.
4. Use fonts from the Geist family for all UI typography.
5. Keep wide horizontal margins on the main content area (left and right breathing room).

## Implementation Guidance

### Color and Contrast

- Prefer dark backgrounds with mid-tone surfaces and readable foreground text.
- Keep visual hierarchy through subtle tone differences, not stark color jumps.
- Use accent colors sparingly to highlight priority actions and active states.

### Shape and Spacing

- Use `border-radius: 2px` as the default maximum for cards, buttons, inputs, and panels.
- Avoid pill shapes or heavily rounded containers.
- Maintain generous page gutters; main content should not span edge-to-edge.

### Typography

- Use Geist as the primary UI font family.
- Keep font usage consistent across headings, body text, labels, and controls.
- Prefer clear, readable sizing and spacing over dense text blocks.

## Quick Review Checklist

- Is the screen fully dark mode?
- Are colors and elements medium contrast?
- Are corners at `2px` radius or less?
- Is Geist used for UI typography?
- Does main content keep wide left/right margins?
