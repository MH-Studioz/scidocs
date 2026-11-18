# SciDocs

https://mh-studioz.github.io/scidocs/

SciDocs is a browser-based scientific document workbench for writing LaTeX — math, physics, chemistry, biology and quantum notation with live preview and PDF export. The editor, renderer and exports run locally in the browser; AI refinement is an optional direct call to a provider you configure.

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
- **Import** loads a `.tex` file into the editor; **.tex** downloads the current source.
- **Share** copies a link containing the document; opening it imports a local `(shared)` project.
- **Templates** starts a lab report, homework set or paper.
- Projects autosave to `localStorage`; PDF export uses the rendered preview.

## Share links

**Share** encodes the current project name and LaTeX source into the URL fragment (after `#share=`) and copies the link. Nothing is uploaded: the recipient's browser decodes the document locally and opens it as a new project named `… (shared)`, leaving their existing projects alone.

- The fragment is compressed when the browser supports `CompressionStream`, with a plain Base64 fallback.
- Very large documents produce very long URLs; use **.tex** download for those.
- Anyone with the link can read the document. It is not encrypted beyond HTTPS, so do not share unpublished or sensitive work with people you would not send the `.tex` file to.
