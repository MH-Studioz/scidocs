# SciDocs

https://mh-studioz.github.io/scidocs/

v1.3.0

[Release notes](CHANGELOG.md)

SciDocs is a browser-based scientific document workbench for writing LaTeX — math, physics, chemistry, biology and quantum notation with live preview and PDF export. The editor, renderer and exports run locally in the browser; AI refinement is an optional direct call to a provider you configure.

## Quick start

1. Type or paste LaTeX in the editor; the preview updates automatically.
2. Put formulas **inside math mode** (see below). A command such as `\sigma` is not interpreted in ordinary text.
3. Use **Symbol Lab** on the left (or below the editor on a phone): search `/sigma`, then tap the result. SciDocs wraps it in math automatically when needed.
4. Use **Compile** for an immediate refresh, **Export PDF** to download, and **History** to restore a snapshot or make a backup.
5. Open the **Guide** button in the top bar for the same instructions inside the app.

## Math mode: why `\sigma` can appear as text

LaTeX commands only render inside math mode. This is valid LaTeX behavior, not a preview failure:

| Editor source | What it means |
|---|---|
| `\sigma * 8` | Ordinary text; the command is shown literally |
| `$\sigma * 8$` | Inline math |
| `$$\sigma * 8$$` | Centered display math |
| `\begin{equation}\sigma * 8\end{equation}` | Numbered equation |
| `\(\sigma * 8\)` | Inline math with bracket delimiters |
| `\[\sigma * 8\]` | Display math with bracket delimiters |

If you see a command rendered literally, wrap the **whole expression**, not just the command. For example, change `\sigma * 8` to `$\sigma * 8$`.

The syntax banner also warns when a known math command appears outside math mode and offers **Go to line** and a one-click **Fix**. The built-in **Symbol Lab** avoids the problem for new insertions: outside math, it inserts `$\sigma$` and leaves the cursor inside the math so you can continue typing; inside math or an equation environment, it inserts the raw command. Document structures such as sections and tables are never wrapped.

### Do not nest `$$…$$` inside `equation`

An `equation`, `align`, `gather` or similar environment is already in math mode. Adding display delimiters inside it is invalid and produces a red parse error such as “LaTeX could not fully parse `$$\sum_{i=1}^{n}$$`”:

```latex
% Invalid: equation is already math mode
\begin{equation}
  $$\sum_{i=1}^{n}$$
\end{equation}
```

Write the formula directly instead:

```latex
\begin{equation}
  \sum_{i=1}^{n}
\end{equation}
```

The inline and display-math toolbar buttons now check the cursor first. If you are already inside math, they do not add extra `$` delimiters. The syntax banner reports any remaining nested `$$` with **Go to line** and **Remove $$** actions.

## Problems, outline and references

The **Problems** button (the list icon in the top bar) opens a single panel with three tabs and a badge showing the current issue count:

- **Problems** lists every syntax and reference issue in source order. **Go to line** moves the editor cursor, and **Fix** applies a safe single-line repair such as wrapping a math command or removing nested `$$`. Fixes can be undone with **Ctrl/Cmd + Z**.
- **Outline** lists sections, subsections and numbered equations with their line numbers, so you can jump around a long document.
- **References** lists every `\label`, its kind and assigned number, its use count, and any missing or duplicate labels. The preview resolves `\ref`, `\eqref`, `\autoref` and `\pageref`; a missing label is shown as `??` and is also reported in Problems.

Equation, figure, table and section numbers are assigned in source order by the browser preview. This is a helpful consistency check, not a replacement for a full LaTeX/BibTeX compile.

## Snippets and macros

Open **Snippets** in the top bar to save reusable LaTeX fragments. Give each snippet a name, an autocomplete trigger such as `\quadform`, and its LaTeX body. Saved snippets live in this browser’s `localStorage` and show a rendered math preview.

- Type the trigger in the editor and press **Ctrl/Cmd + Space** to insert the snippet from autocomplete.
- **Insert** places the snippet at the current cursor; **Use editor selection** fills the body from the selected text.
- The delete button removes a snippet from this browser. Snippets are never uploaded; backups and share links carry the library so another browser can pick it up.
- A body can mark several placeholders: `[[CURSOR]]` is the first stop, `[[CURSOR:2]]`, `[[CURSOR:3]]`… follow. After inserting, **Tab** and **Shift-Tab** step through them; clicking in the editor ends the walk. The toolbar’s fraction and binomial inserts use two stops.

Document macros declared with `\newcommand`, `\def` or `\DeclareMathOperator` are expanded in math and in prose, and show up in command autocomplete together with your saved snippet triggers. `\def` parameters such as `\def\pair#1#2{\langle #1, #2\rangle}` are supported. A body built only from math commands (`\newcommand{\R}{\mathbb{R}}`, `\def\pair#1#2{\langle #1, #2\rangle}`) is rendered as inline math when the macro is used in prose. Optional-argument defaults are supported (`\newcommand{\norm}[1][x]{\lVert #1\rVert}`; `\norm`, `\norm{y}` and `\norm[y]` all work). `\newenvironment{name}[n][default]{begin}{end}` renders its begin code, the body and its end code, with `#1…` substituted, and `\newtheorem` names and counters drive theorem numbering.

## Figures, tables and images

`\begin{figure}` and `\begin{table}` render with numbered captions ("Figure 1: …"), and `\ref`, `\eqref` and `\autoref` resolve to those numbers; `\autoref` names the kind ("Figure 1", "Table 2", "Theorem 3").

`\includegraphics[width=0.6\textwidth]{plot.png}` shows the real image when the file is attached to the project. Open **Images** in the top bar to attach PNG, JPEG, GIF or WebP files (up to 12 images, 1.5 MB each and 4 MB per project) or remove them. Images are stored as data URLs inside the project record, so they travel with backups, share links (up to 250 KB of images per link) and the browser workspace. A missing file shows a filename chip marked "not attached" instead of a broken image.

Theorem blocks are numbered per kind and follow `\newtheorem`, including a shared counter (`\newtheorem{lem}[thm]{Lemma}`) and numbering within sections (`\newtheorem{claim}{Claim}[section]`); `proof` stays unnumbered.

## Copy and export math

Select a formula (or place the cursor on its line) and open **Math** in the top bar. The dialog normalizes common `$…$`, `$$…$$`, `\(…\)` and `\[…\]` delimiters and shows a live KaTeX preview. Toggle **Display style** for a centered equation.

- **Copy LaTeX** copies the normalized formula; **Copy MathML** copies accessible MathML.
- **SVG** downloads a vector export; **PNG** rasterizes it through a canvas. Both render from the browser’s MathML support and crop to the formula itself with a 14 px margin, so there is no empty panel around the result.
- **Transparent background** keeps the margin and glyphs but drops the white field, which suits slides and dark posters.
- **PNG scale** exports at 1×, 2× (default) or 3× for print-quality images.

## Bibliography and citations

The **Bibliography** button (bookmark icon in the top bar) holds a local BibTeX library. Click **Import .bib** to load a file, or paste BibTeX into the textarea; edits save automatically in this browser. The panel lists every parsed entry with its type, author, year and how many times the document cites it, and each entry has a **Cite** button that inserts `\cite{key}` at the cursor.

In the document, the preview resolves `\cite`, `\citep`, `\citet`, `\citealp`, `\autocite`, `\parencite` and `\textcite`:

- Entries are numbered in order of first citation and shown as `[1]`, `[1, 2]` or `(1, 2)` for `\citep`.
- A **References** list is appended to the rendered document in citation order.
- `\citet{key}` prints the first author and year. Optional note arguments such as `\cite[chap. 2]{key}` are accepted but not printed.
- A key with no bibliography entry renders as `[?]` and is reported in **Problems** and the issue-count badge.
- Typing `\cite{` and pressing **Ctrl/Cmd + Space** autocompletes from the library; commas add further keys.

The library is parsed once and cached until its BibTeX text changes, so a large `.bib` file does not slow down live preview or diagnostics.

The **References** tab in **Problems** shows citations, the loaded library and the missing keys. Parsing is approximate: BibTeX strings, cross-references and complex LaTeX in fields are flattened to plain text, and the numbering is the browser preview's own, not a BibTeX run.

## Find and replace

**Ctrl/Cmd + F** opens find and **Ctrl/Cmd + H** opens find-and-replace; the **Find** chip in the editor toolbar opens the same bar for touch use. The bar docks at the bottom of the editor so it never hides the line you are reading.

- **Enter** jumps to the next match, **Shift + Enter** to the previous one.
- Replace shows a confirm step with **Yes**, **No**, **All** and **Stop**, so you can replace one occurrence or all of them.
- Type a pattern between slashes (`/energy\s*=/`) to use a regular expression; the bar also honours case and whole-word options.

## Text → LaTeX

The plain-English converter works instantly with local, rule-based rewriting, so it needs no account or network connection. Phrases like “x squared plus y squared” or “integral from 0 to infinity of x squared dx” become LaTeX as you type.

## Add an AI key (optional, about 2 minutes)

AI refinement is optional. The local converter always works without it.

1. Open **https://openrouter.ai/keys** and sign in (or create an account).
2. Click **Create key**, copy the key, and keep it private.
3. Open SciDocs and click **Text → LaTeX** in the top bar.
4. Expand **AI settings**.
5. Paste the key into **API key**.
6. Optionally add **custom instructions** (for example: “Prefer `pmatrix` for matrices and keep vectors bold”).
7. Click **Test**. A successful check shows **Connected · N models**.
8. Click **Save**. The badge should read **auto on**.

Now type a formula and pause: SciDocs AI refines it automatically. Use **AI refine** to run it manually, or uncheck **Auto refine while typing** to avoid spending credits automatically.

### Using a different provider

The **Model** and **Base URL** fields accept any OpenAI-compatible chat-completions provider. Change both, paste that provider’s key, and click **Test** then **Save**. The default is `google/gemini-3.5-flash-lite` on `https://openrouter.ai/api/v1`.

### Privacy and cost

- The key is stored only in this browser’s `localStorage`.
- Requests go directly from your browser to the provider you configure; SciDocs has no server and never receives the key.
- AI calls use your provider account and credits. Auto mode only runs while you are using the converter and pauses after you stop typing.
- Never commit an API key to the repository or paste it into chat. Keys belong only in the AI settings panel.

### Troubleshooting

- **`add an API key first`** — the key was not saved. Paste it again and click **Save**.
- **`AI request failed (401)`** — the key is wrong or revoked. Create a new key.
- **`AI request failed (402)`** — the provider account needs credits.
- **`AI request failed (429)`** — rate limited. Wait or switch models.
- **`Test failed: HTTP 404`** — the base URL or model is wrong, or the provider does not expose `/models`.
- **`AI unavailable · local draft`** — the local converter result is still usable; check the AI settings.
- **No network request without a key** — expected. AI stays off until you add one.

If the model returns invalid KaTeX, SciDocs AI automatically sends one correction request with the parse error, then falls back to the local draft if the correction also fails.

## Editor and files

- **Ctrl + Space** (Windows/Linux) or **Cmd + Space** (macOS) suggests LaTeX commands while typing. If macOS Spotlight captures `Cmd + Space`, use **Alt + /**.
- **Ctrl/Cmd + F** opens find and **Ctrl/Cmd + H** opens find and replace in the editor.
- The **Symbol Lab** search accepts `/sigma`, `\sigma` or `sigma`; symbols are wrapped in math automatically when the cursor is outside math. The **Inline math** and **Display math** items, and the toolbar wrap buttons, never add duplicate delimiters.
- **Guide** in the top bar covers math mode, symbol insertion, errors, history, sharing and shortcuts.
- **Import** loads a `.tex` file into the editor; **.tex** downloads the current source.
- **Share** copies a link containing the document; opening it imports a local `(shared)` project.
- **Templates** starts a lab report, homework set or paper.
- The syntax banner shows the first structural problem with **Go to line** and, when available, a one-click **Fix**; it also reports a count of further issues and warns about math commands used outside math mode.
- **History** keeps automatic snapshots, restores previous versions, and exports/imports a JSON workspace backup.
- **Info** explains what the browser preview supports and where a full TeX compile is needed.
- **Guide** explains the workflow in the app; this README is the longer reference.
- The inline/display math toolbar buttons do not add `$` delimiters when the cursor is already inside math; they show a short notice instead. Empty wraps use a valid `$ $` or `$$ $$` pair, and boundary insertions add separation so a new `$$` is not formed accidentally.
- Projects autosave to `IndexedDB` (with a `localStorage` mirror); PDF export rasterizes the compiled document, and if the renderer stalls for 30 seconds it opens the print dialog instead so you can still choose “Save as PDF”.

## History and backups

Open **History** in the project toolbar. SciDocs keeps up to 20 snapshots per project in IndexedDB: one when you pause after editing (at most every five minutes), one when you switch projects or replace the editor with a template or import, and any manual snapshots you create. Each snapshot can be restored or downloaded as `.tex`.

**Export backup** downloads a JSON file containing every project — source, attached images, the BibTeX library and your saved snippets. **Import backup** adds the projects from a JSON file without deleting current projects; duplicate names receive a numeric suffix. Bibliography entries are merged by key and snippets by name and body, so an import never overwrites what you already have. Browsers can clear site storage, so keep a backup of important work.

## Offline use

SciDocs registers a small service worker after the first visit. The app shell, icons and the libraries loaded from jsDelivr and Google Fonts are cached, so the editor and preview reopen offline. AI refinement still needs a network connection because it calls your provider. Use the browser’s **Install** action (or **Add to Home Screen**) for a standalone window. If a cached asset is stale after an update, reload once while online.

## Preview scope

The live preview is a fast browser renderer, not a full TeX distribution. Core math and KaTeX commands, sections, lists, tables, links, common formatting, custom macros, citations with a generated reference list, and the built-in science notation work. Arbitrary packages, BibTeX, multi-file `\input`, exact journal layout, custom fonts and full TikZ are outside the preview. Unsupported commands may appear as text or be ignored. For a submission that depends on those features, download the `.tex` source and compile it in your TeX editor or Overleaf. The **Info** button in the top bar repeats this scope inside the app.

## Share links

**Share** encodes the current project name, its LaTeX source, attached images (up to 250 KB), the BibTeX library and your snippets into the URL fragment (after `#share=`) and copies the link. Nothing is uploaded: the recipient's browser decodes it locally, opens the document as a new project named `… (shared)`, and merges any bibliography entries and snippets it does not already have. Very large images are left out of the link; a backup moves those.

- The fragment is compressed when the browser supports `CompressionStream`, with a plain Base64 fallback.
- Very large documents produce very long URLs; use **.tex** download for those.
- Anyone with the link can read the document. It is not encrypted beyond HTTPS, so do not share unpublished or sensitive work with people you would not send the `.tex` file to.
