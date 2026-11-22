# Changelog

## [1.3.3] - 2026-11-22

### Fixed

- **A document that carries its own bibliography now exports cleanly.** `\begin{thebibliography}{…}` with `\bibitem{key}` entries used to reach the preview as raw prose, with `\bibitem` and `\newblock` showing as text and citations printing `[?]` when no `.bib` library was loaded. The environment is now parsed in place: each `\bibitem` becomes an entry in the same numbered **References** list the `.bib` path produces, `\cite` resolves against those keys, and entries keep their emphasis and formulas. Reference numbers follow `\bibitem` order, every entry is listed even when nothing cites it, and `\bibitem[label]{key}` labels are used by `\citet`.
- A key known only to the `.bib` library is appended to that list in number order, so a mixed document never prints a citation number without a matching entry.
- The “Missing bibliography entry” hint now mentions defining the key with `\bibitem`.

## [1.3.2] - 2026-11-22

### Fixed

- **Export PDF now downloads a real PDF file.** The old export rasterized the whole page with html2pdf/html2canvas and could stall the tab indefinitely; the new exporter builds the document with jsPDF instead. Body text is real, selectable text with the page's fonts and colours, figures are embedded from their attached images, and formulas are rasterized from MathJax at 4× so inline and display math keep their shape. Every page gets its number and a running title.
- Inline formulas and the ∎ end-of-proof mark were dropped from the PDF, because the line splitter rebuilt words character by character and had no text for them.
- Text-only list items disappeared from the PDF — the generated References list lost its entries. A list item without element children is now drawn as a paragraph with its marker.
- A table could be split from its caption across a page break; the table is measured first and moves to the next page with its caption when they fit together. A figure likewise reserves room for its caption.
- A section number ran into its title (“1Results”).

### Changed

- html2pdf is no longer loaded. jsPDF 2.5.2 and MathJax 3.2.2 are loaded on demand and precached by the service worker, so export still works offline after the first use.

## [1.3.1] - 2026-11-21

### Fixed

- A macro used inside `$$…$$` was expanded as if it were prose, so a math-only body was wrapped a second time and leaked dollar signs. Display delimiters, `\[…\]` and `\(…\)` now switch math mode once, and the wrapped case renders as display math.

## [1.3.0] - 2026-11-21

### Added

- **Attached images.** `\includegraphics{file}` now renders the real image when it is attached to the project. The new **Images** dialog attaches PNG, JPEG, GIF or WebP files (12 per project, 1.5 MB each, 4 MB total), stores them as data URLs in the project record and honours `width=0.6\textwidth`-style options.
- **Theorem numbering.** Theorem-like blocks are numbered (`Theorem 1`, `Lemma 2`, …), including `\newtheorem` names, shared counters and `[section]` numbering; `\autoref` names the kind.
- **References and library travel with the document.** Backups and share links now carry the BibTeX library, saved snippets and project images, and merge them on import instead of overwriting.
- **Snippet tab stops.** A snippet body can mark several placeholders with `[[CURSOR]]`, `[[CURSOR:2]]`, `[[CURSOR:3]]`… After inserting, **Tab** and **Shift-Tab** walk the stops and clicking in the editor ends the walk. The fraction and binomial toolbar inserts now use two stops.
- **Document macros in prose.** Macros declared with `\newcommand`, `\def` (including parameters) or `\DeclareMathOperator` are expanded in text as well as math, and user-defined macros appear in `\` autocomplete. Optional-argument defaults and `\newenvironment` are supported.

### Fixed

- `\def\name#1#2{…}` definitions were not collected before; parameter text is now parsed, so parameterised `\def` macros expand.
- PDF export could stay stuck on “Rendering…” when the canvas renderer stalled. It now has a 30-second watchdog, a smaller render scale and a print-dialog fallback.

## [1.2.1] - 2026-11-20

### Changed

- **Bibliography parsing is memoized.** The BibTeX library is parsed once and reused until its text changes, instead of being re-parsed for every live-preview compile and every diagnostics pass. Rendering, citation numbering and exports are unchanged.

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
