# Changelog

## [1.2.0] - 2026-11-20

### Added

- **Bibliography and citations.** Import or paste BibTeX in the new Bibliography panel; entries stay in this browser. The preview resolves `\cite`, `\citep`, `\citet`, `\citealp`, `\autocite`, `\parencite` and `\textcite`, numbers entries in citation order, appends a References list, and lists every citation plus the loaded library in the References tab.
- **`\cite` autocomplete.** Typing a key inside `\cite{…}` and pressing Ctrl/Cmd + Space suggests matching bibliography keys.
- **Missing-entry diagnostics.** A cited key without a bibliography entry is flagged in the preview, the Problems tab and the issue-count badge.
- **Find and replace in the editor.** Ctrl/Cmd + F opens find, Ctrl/Cmd + H opens replace with regex, case and whole-word options from the CodeMirror search addon; a Find button in the editor toolbar opens the same bar, which docks at the bottom of the editor so it never covers the first lines.
- **Tighter math export.** SVG and PNG now crop to the formula's measured bounding box instead of the preview panel, add a 14 px margin, offer a transparent-background option, and let PNG rasterize at 1×, 2× or 3×.

### Fixed

- Citation numbers skip keys that have no bibliography entry, so a missing `\cite` shows `[?]` instead of consuming a reference number.

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
