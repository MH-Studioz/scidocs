# SciDocs

https://mh-studioz.github.io/scidocs/

SciDocs is a browser-based scientific document workbench for writing LaTeX — math, physics, chemistry, biology and quantum notation with live preview and PDF export. The editor, renderer and exports run locally in the browser; AI refinement is an optional direct call to a provider you configure.

## Text → LaTeX

The plain-English converter works instantly with local, rule-based rewriting, so it needs no account or network connection. Phrases like “x squared plus y squared” or “integral from 0 to infinity of x squared dx” become LaTeX as you type.

### AI refine (optional)

For messier wording, the converter has a **SciDocs AI** pass. Add your own [OpenRouter](https://openrouter.ai/keys) API key under **AI settings** in the converter; the key is stored only in this browser and requests go directly from the page to OpenRouter. The default model is `google/gemini-3.5-flash-lite`, and any OpenAI-compatible base URL and model can be used instead.

You can add **custom instructions** (for example, prefer `pmatrix` and keep vectors bold) and use **Test** to check the provider’s `/models` endpoint. If the model returns invalid KaTeX, SciDocs AI automatically asks once for a corrected expression before falling back to the local draft.

**Auto refine** is enabled by default once a key is saved. It waits until you pause typing, then refines the expression automatically; stale requests are cancelled and manual AI refine still works. Auto mode uses provider credits, so it can be switched off in AI settings. Without a key, the local converter keeps working exactly as before.
