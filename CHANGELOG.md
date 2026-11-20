# Changelog

## [1.0.1] - 2026-11-20

### Fixed

- **Symbol Lab Inline math and Display math items** no longer double-wrap their contents. They previously produced `$$$$` in text and nested `$$` inside an equation.
- **Math symbols at delimiter boundaries** now add separation before or after an adjacent `$`, so an insertion cannot accidentally form a new `$$` display delimiter.
- **Empty inline and display wraps** now insert valid empty forms (`$ $` and `$$ $$`) instead of the ambiguous `$$` / `$$$$`.
- **Document blocks** such as sections, equations, tables, and lists are blocked inside math mode with a short notice instead of creating nested structures.
- **Document Cases** is treated as math content: it is wrapped in inline math when placed in text and inserted raw inside an existing math context.
- **The cursor between the two closing dollars of `$$…$$`** is now recognized as inside display math, preventing erroneous wrapping there.
- **Nested display delimiters** inside `equation`, `align`, or inline math are reported by the syntax banner with a **Go to line** action.
