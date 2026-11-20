# Changelog

## [1.1.0] - 2026-11-20

### Added

- **Problems & outline panel** with Problems, Outline and References tabs, an issue-count badge, line jumps, and a Recheck action.
- **One-click math diagnostics** in the syntax banner and Problems tab for wrapping commands outside math mode, balancing `\left`/`\right`, and removing nested display delimiters.
- **Snippet & macro library** with named snippets, autocomplete triggers, live math previews, editor-selection capture, insertion and deletion; snippets persist locally.
- **Cross-reference manager** that indexes sections, equations, figures, tables and labels, reports missing or duplicate labels, and resolves `\ref`, `\eqref`, `\autoref` and `\pageref` in the preview.
- **Copy and export math** from the current selection or line: normalized LaTeX, MathML, SVG and 2× PNG.

### Fixed

- Reference numbers now resolve correctly when a `\label` shares a line with `\begin{equation}` or `\section`, including labels inside `\begin{document}`.
- Banner **Fix** buttons now use a visible amber style instead of dark text on a dark background.
- Math PNG export now rasterizes through a data URL, avoiding blob-image restrictions for SVG documents with `foreignObject`.
- Math export trims unmatched `$` delimiters at either edge of a selection.

## [1.0.1] - 2026-11-20

### Fixed

- **Symbol Lab Inline math and Display math items** no longer double-wrap their contents. They previously produced `$$$$` in text and nested `$$` inside an equation.
- **Math symbols at delimiter boundaries** now add separation before or after an adjacent `$`, so an insertion cannot accidentally form a new `$$` display delimiter.
- **Empty inline and display wraps** now insert valid empty forms (`$ $` and `$$ $$`) instead of the ambiguous `$$` / `$$$$`.
- **Document blocks** such as sections, equations, tables, and lists are blocked inside math mode with a short notice instead of creating nested structures.
- **Document Cases** is treated as math content: it is wrapped in inline math when placed in text and inserted raw inside an existing math context.
- **The cursor between the two closing dollars of `$$…$$`** is now recognized as inside display math, preventing erroneous wrapping there.
- **Nested display delimiters** inside `equation`, `align`, or inline math are reported by the syntax banner with a **Go to line** action.
