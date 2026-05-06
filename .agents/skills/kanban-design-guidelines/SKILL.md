---
name: kanban-design-guidelines
description: Enforces visual design guidelines for the kanban app UI. Use when creating or updating UI, styles, themes, layouts, components, or design tokens to keep the interface dual-mode (light/dark), medium contrast, lightly rounded, Geist-based, and wide-margin.
---

# Kanban Design Guidelines

Apply these rules to every UI change unless the user explicitly asks to break them.

## Core Rules

1. Support both light and dark modes. The app uses a `data-theme` attribute on `<html>` to switch between them. System preference is the default; users can toggle manually.
2. Use medium-contrast colors and elements; avoid both low-contrast haze and harsh high-contrast extremes.
3. Keep corner radii lightly rounded, with a maximum of `2px`.
4. Use fonts from the Geist family for all UI typography.
5. Keep wide horizontal margins on the main content area (left and right breathing room).

## Implementation Guidance

### Color and Theming

- All colors must go through CSS custom properties defined in `:root` (light) and `[data-theme="dark"]` (dark). No hardcoded hex or rgb values in selectors.
- Light palette: warm cream background (`#f7f4ef`), white panels, teal primary (`#1f6f62`), red-orange accent (`#cc4f35`).
- Dark palette: deep green-gray background (`#141918`), dark-surface panels (`#1c2422`), brighter teal primary (`#2d9e8c`), warmer accent (`#e06b50`). Maintains the warm green-gray character of the light palette.
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

- Do all color values reference CSS variables (no raw hex/rgb in selectors)?
- Does the change work correctly in both light and dark modes?
- Are colors and elements medium contrast?
- Are corners at `2px` radius or less?
- Is Geist used for UI typography?
- Does main content keep wide left/right margins?
