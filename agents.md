# Agents Guide

Use this guide to keep generated and edited code consistent, maintainable, and aligned with product goals.

## Tech Stack

- Use the existing technology choices already present in the repository.
- Prefer established project conventions and avoid introducing new frameworks or tooling unless required.
- If a new dependency is necessary, justify it in terms of clear product or engineering value.

## Development Notes

Keep the codebase simple, focused, and easy to run.
Choose straightforward implementations over clever ones, and evolve complexity only when requirements demand it.

## Coding Style

- Add explanatory comments for non-obvious logic: describe what the code does, why it is needed, and key assumptions or trade-offs.
- Keep comments concise and useful. Comments required per function.
- Prefer small, single-purpose functions. Target roughly 10-15 lines where practical. 
- If a function grows beyond ~15 lines, split it into helper functions unless keeping it together is clearly more readable.
- Keep function complexity low: favor early returns, shallow nesting, and clear naming over dense control flow.

## Generated Code Review Checklist

- Verify alignment with documented product goals and scope; reject changes that introduce unrequested features.
- Check architectural fit with the existing codebase structure, stack, and conventions.
- Confirm readability and maintainability: clear names, small functions, minimal nesting, and comments only where logic is non-obvious.
- Look for hidden deficiencies: missing edge-case handling, brittle assumptions, unclear error states, and unnecessary complexity.
- Ensure each change is the simplest solution that satisfies the requirement without over-engineering or speculative features.
- Validate side effects across the project: impacted flows, state transitions, data handling, and developer experience.

## References

For additional context, review the project documentation and source of truth files available in the repository (for example: product requirements, architecture notes, and contribution guidelines).