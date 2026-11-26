/* =====================================================================
       SciDocs — 100% client-side scientific LaTeX IDE
   No backend, no build step. Everything runs in this tab.
   ===================================================================== */
(() => {
  'use strict';

  const R = String.raw;
  const CURSOR = '[[CURSOR]]';
  const CURSOR2 = '[[CURSOR:2]]';
  const STORE_KEY = 'latexlab.workspace.v1';
  const PREFS_KEY = 'latexlab.prefs.v1';
  const IMAGE_MAX_BYTES = 1.5 * 1024 * 1024;
  const IMAGE_TOTAL_BYTES = 4 * 1024 * 1024;
  const IMAGE_SHARE_BYTES = 250 * 1024;
  const IMAGE_KEY_LIMIT = 12;
  const IMAGE_DATA_URL = /^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/;
  const DB_NAME = 'scidocs.db';
  const DB_VERSION = 1;
  const SNAPSHOT_LIMIT = 20;
  const SNIPPETS_KEY = 'scidocs.snippets.v1';
  const SNIPPET_LIMIT = 50;
  const BIB_KEY = 'scidocs.bib.v1';
  const BIB_LIMIT = 400;

  /* ------------------------------------------------------------------ *
   *  DOM helpers
   * ------------------------------------------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const uid = () =>
    'p_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

  const escapeHtml = (value) =>
    String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));

  const safeHref = (url) => {
    const value = String(url || '').trim();
    if (!value) return '#';
    return /^(https?:|mailto:|#|\/|\.\.?\/)/i.test(value) ? value : '#';
  };

  const debounce = (fn, wait) => {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  };

  const refreshIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (_) { /* non-fatal */ }
    }
  };

  const shorten = (text, max = 46) => {
    const flat = String(text).replace(/\s+/g, ' ').trim();
    return flat.length > max ? flat.slice(0, max - 1) + '…' : flat;
  };

  const fmtLongDate = () =>
    new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  /* ------------------------------------------------------------------ *
   *  Starter documents
   * ------------------------------------------------------------------ */
  const STARTER = R`\documentclass[11pt]{article}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{geometry}
\geometry{margin=1in}

\title{The Quantum Harmonic Oscillator}
\author{SciDocs \\ Department of Physics}
\date{\today}

\begin{document}
\maketitle

\begin{abstract}
These notes collect the analytic solution of the one-dimensional quantum harmonic oscillator, its matrix representation in the occupation-number basis, and a compact table of the lowest energy eigenstates. Every formula below is typeset live in your browser with LaTeX — there is no server involved.
\end{abstract}

\section{Introduction}
The time-independent Schrodinger equation for a particle of mass $m$ in a potential $V(x)$ is
\begin{equation}
  -\frac{\hbar^{2}}{2m}\frac{d^{2}\psi}{dx^{2}} + V(x)\psi = E\psi .
\end{equation}
For the oscillator $V(x) = \tfrac{1}{2}m\omega^{2}x^{2}$, so the spectrum is discrete and the eigenfunctions are localised.

\subsection{Ladder Operators}
Define the annihilation and creation operators
\begin{equation}
  a = \sqrt{\frac{m\omega}{2\hbar}}\left(x + \frac{i p}{m\omega}\right),
  \qquad
  a^{\dagger} = \sqrt{\frac{m\omega}{2\hbar}}\left(x - \frac{i p}{m\omega}\right),
\end{equation}
so that the Hamiltonian becomes $H = \hbar\omega\left(a^{\dagger}a + \tfrac{1}{2}\right)$.

\section{Energy Spectrum}
Acting with the ladder operators gives the familiar equally spaced levels:
\begin{align}
  E_n &= \hbar\omega\left(n + \frac{1}{2}\right), \\
  \psi_n(x) &= \frac{1}{\sqrt{2^{n} n!}}\left(\frac{m\omega}{\pi\hbar}\right)^{1/4} H_n\!\left(\sqrt{\frac{m\omega}{\hbar}}\,x\right) e^{-m\omega x^{2}/2\hbar}.
\end{align}

\subsection{Key Properties}
\begin{itemize}
  \item The ground state $\psi_0$ is a Gaussian of width $\sigma = \sqrt{\hbar/2m\omega}$.
  \item The parity of $\psi_n$ is $(-1)^{n}$.
  \item Matrix elements obey $\langle m | x | n \rangle \propto \delta_{m,n\pm1}$.
\end{itemize}

\section{Matrix Representation}
Truncating to the first three levels gives
\begin{equation}
  H \approx \hbar\omega
  \begin{pmatrix}
    \tfrac{1}{2} & 0 & 0 \\
    0 & \tfrac{3}{2} & 0 \\
    0 & 0 & \tfrac{5}{2}
  \end{pmatrix},
  \qquad
  a = \begin{pmatrix}
    0 & 1 & 0 \\
    0 & 0 & \sqrt{2} \\
    0 & 0 & 0
  \end{pmatrix}.
\end{equation}

\section{Summary}
\begin{table}
  \centering
  \caption{Lowest energy eigenstates of the harmonic oscillator.}
  \begin{tabular}{|c|c|c|}
    \hline
    \textbf{State} & \textbf{Energy} & \textbf{Parity} \\
    \hline
    $n = 0$ & $\tfrac{1}{2}\hbar\omega$ & $+1$ \\
    $n = 1$ & $\tfrac{3}{2}\hbar\omega$ & $-1$ \\
    $n = 2$ & $\tfrac{5}{2}\hbar\omega$ & $+1$ \\
    \hline
  \end{tabular}
\end{table}

The oscillator is the cleanest exactly solvable model in quantum mechanics, and every result above follows from the algebra of $a$ and $a^{\dagger}$.
\end{document}
`;

  const BLANK_DOC = R`\documentclass[11pt]{article}
\usepackage{amsmath}
\usepackage{amssymb}

\title{Untitled Document}
\author{Your Name}
\date{\today}

\begin{document}
\maketitle

\section{Introduction}
Start typing here. Inline math looks like $e^{i\pi} + 1 = 0$, and a display equation looks like

\begin{equation}
  \int_{0}^{\infty} e^{-x^{2}} \, dx = \frac{\sqrt{\pi}}{2}.
\end{equation}

\section{Next Steps}
\begin{itemize}
  \item Use the Symbol Lab on the left to insert Greek letters, matrices and environments.
  \item Try the natural text converter to turn plain English into LaTeX.
  \item Export the rendered document as a PDF from the top bar.
\end{itemize}

\end{document}
`;

  const PROJECT_TEMPLATES = [
    {
      id: 'lab-report',
      name: 'Lab report',
      description: 'Title, abstract, methods, results table and discussion.',
      content: String.raw`\documentclass[11pt]{article}
\usepackage{amsmath,amssymb}
\usepackage{geometry}
\geometry{margin=1in}

\title{Lab Report: Experiment Name}
\author{Your Name}
\date{\today}

\begin{document}
\maketitle

\begin{abstract}
One-paragraph summary of the question, method and main result.
\end{abstract}

\section{Introduction}
State the question and the hypothesis.

\section{Methods}
Describe the apparatus and procedure.

\section{Results}
\begin{table}[h]
  \centering
  \caption{Measured values.}
  \begin{tabular}{|l|c|c|}
    \hline
    Trial & Measurement & Uncertainty \\
    \hline
    1 & 0.00 & 0.00 \\
    2 & 0.00 & 0.00 \\
    \hline
  \end{tabular}
\end{table}

\section{Discussion}
Interpret the result and compare it with theory.

\section{Conclusion}
Answer the original question in one or two sentences.

\end{document}
`
    },
    {
      id: 'homework',
      name: 'Homework set',
      description: 'Numbered problems with worked equations and answers.',
      content: String.raw`\documentclass[11pt]{article}
\usepackage{amsmath,amssymb}
\usepackage{geometry}
\geometry{margin=1in}

\title{Problem Set 1}
\author{Your Name}
\date{\today}

\begin{document}
\maketitle

\section*{Problem 1}
State the problem here.
\begin{equation}
  \int_{0}^{1} x^{2} \, dx = \frac{1}{3}.
\end{equation}

\section*{Problem 2}
Continue with the next problem.

\end{document}
`
    },
    {
      id: 'paper',
      name: 'Short paper',
      description: 'Abstract, introduction, methods, results and conclusion.',
      content: String.raw`\documentclass[11pt]{article}
\usepackage{amsmath,amssymb}
\usepackage{geometry}
\geometry{margin=1in}

\title{Paper Title}
\author{Your Name}
\date{\today}

\begin{document}
\maketitle

\begin{abstract}
Summarise the motivation, approach and key finding.
\end{abstract}

\section{Introduction}
Motivate the problem and state the contribution.

\section{Methods}
Describe the model, data or derivation.

\section{Results}
Present the main result.
\begin{equation}
  E = mc^{2}.
\end{equation}

\section{Discussion}
Explain limitations and implications.

\section{Conclusion}
Close with the main takeaway.

\end{document}
`
    }
  ];

  /* ------------------------------------------------------------------ *
   *  TeX macros shared by the preview and the symbol drawer
   * ------------------------------------------------------------------ */
  const MACROS = {
    '\\R': '\\mathbb{R}',
    '\\N': '\\mathbb{N}',
    '\\Z': '\\mathbb{Z}',
    '\\C': '\\mathbb{C}',
    '\\Q': '\\mathbb{Q}',
    '\\abs': '\\left|#1\\right|',
    '\\norm': '\\left\\lVert#1\\right\\rVert',
    '\\bra': '\\left\\langle#1\\right|',
    '\\ket': '\\left|#1\\right\\rangle',
    '\\braket': '\\left\\langle#1\\,\\middle|\\,#2\\right\\rangle',
    '\\dd': '\\mathrm{d}',
    '\\tr': '\\operatorname{tr}',
    '\\Tr': '\\operatorname{Tr}',
    '\\slashed': '\\not{#1}',
    '\\male': '\\text{♂}',
    '\\female': '\\text{♀}',
    '\\rank': '\\operatorname{rank}',
    '\\diag': '\\operatorname{diag}',
    '\\eps': '\\varepsilon',
    '\\bm': '\\boldsymbol{#1}',
    '\\mathds': '\\mathbb{#1}',
    '\\vb': '\\mathbf{#1}',
    '\\va': '\\vec{#1}',
    '\\vu': '\\hat{#1}',
    '\\grad': '\\nabla',
    '\\curl': '\\nabla \\times',
    '\\laplacian': '\\nabla^{2}',
    '\\order': '\\mathcal{O}(#1)',
    '\\eval': '\\left.#1\\right|',
    '\\comm': '[#1,#2]',
    '\\acomm': '\\{#1,#2\\}',
    '\\poissonbracket': '\\{#1,#2\\}',
    '\\pb': '\\{#1,#2\\}',
    '\\ev': '\\left\\langle #1\\right\\rangle',
    '\\cross': '\\times',
    '\\divergence': '\\nabla \\cdot',
    '\\ang': '#1^{\\circ}',
    '\\pu': '\\mathrm{#1}',
    '\\set': '\\{#1\\}',
    '\\Set': '\\left\\{#1\\right\\}',
    '\\pmqty': '\\begin{pmatrix}#1\\end{pmatrix}',
    '\\bqmty': '\\begin{bmatrix}#1\\end{bmatrix}',
    '\\Bmqty': '\\begin{Bmatrix}#1\\end{Bmatrix}',
    '\\vmqty': '\\begin{vmatrix}#1\\end{vmatrix}',
    '\\Vmqty': '\\begin{Vmatrix}#1\\end{Vmatrix}',
    '\\smqty': '\\begin{smallmatrix}#1\\end{smallmatrix}',
    '\\expval': '\\left\\langle #1\\right\\rangle',
    '\\ketbra': '\\left|#1\\right\\rangle\\!\\left\\langle #2\\right|',
    '\\matrixel': '\\left\\langle #1\\,\\middle|\\,#2\\,\\middle|\\,#3\\right\\rangle',
    '\\mel': '\\left\\langle #1\\,\\middle|\\,#2\\,\\middle|\\,#3\\right\\rangle',
    '\\pqty': '\\left(#1\\right)',
    '\\bqty': '\\left[#1\\right]',
    '\\vqty': '\\left|#1\\right|',
    '\\Bqty': '\\left\\{#1\\right\\}',
    '\\erf': '\\operatorname{erf}',
    '\\erfc': '\\operatorname{erfc}',
    '\\sgn': '\\operatorname{sgn}',
    '\\SI': '#1\\,\\mathrm{#2}',
    '\\si': '\\mathrm{#1}',
    '\\unit': '\\mathrm{#1}',
    '\\num': '#1',
    '\\dv': '\\frac{d #1}{d #2}',
    '\\pdv': '\\frac{\\partial #1}{\\partial #2}'
  };

  const KATEX_BASE = {
    throwOnError: false,
    errorColor: '#DC2626',
    strict: false,
    trust: true,
    macros: MACROS
  };

  /* ------------------------------------------------------------------ *
   *  Symbol lab content
   * ------------------------------------------------------------------ */
  const SYMBOL_GROUPS = [
    {
      id: 'greek',
      title: 'Greek letters',
      icon: 'sigma',
      open: true,
      items: [
        ['\\alpha', 'alpha'], ['\\beta', 'beta'], ['\\gamma', 'gamma'], ['\\delta', 'delta'],
        ['\\epsilon', 'epsilon'], ['\\varepsilon', 'varepsilon'], ['\\zeta', 'zeta'], ['\\eta', 'eta'],
        ['\\theta', 'theta'], ['\\vartheta', 'vartheta'], ['\\iota', 'iota'], ['\\kappa', 'kappa'],
        ['\\lambda', 'lambda'], ['\\mu', 'mu'], ['\\nu', 'nu'], ['\\xi', 'xi'],
        ['\\pi', 'pi'], ['\\rho', 'rho'], ['\\sigma', 'sigma'], ['\\tau', 'tau'],
        ['\\upsilon', 'upsilon'], ['\\phi', 'phi'], ['\\varphi', 'varphi'], ['\\chi', 'chi'],
        ['\\psi', 'psi'], ['\\omega', 'omega'], ['\\Gamma', 'Gamma'], ['\\Delta', 'Delta'],
        ['\\Theta', 'Theta'], ['\\Lambda', 'Lambda'], ['\\Sigma', 'Sigma'], ['\\Omega', 'Omega'],
        ['\\Xi', 'Xi'], ['\\Pi', 'Pi'], ['\\Upsilon', 'Upsilon'], ['\\Phi', 'Phi'], ['\\Psi', 'Psi'],
        ['\\ell', 'ell'], ['\\aleph', 'aleph'], ['\\wp', 'wp'], ['\\Re', 'Re'], ['\\Im', 'Im']
      ].map(([cmd, label]) => ({ display: cmd, label, insert: cmd + ' ' }))
    },
    {
      id: 'calculus',
      title: 'Calculus & operators',
      icon: 'radical',
      items: [
        { display: '\\int', label: 'Integral', insert: '\\int ' },
        { display: '\\iint', label: 'Double integral', insert: '\\iint ' },
        { display: '\\iiint', label: 'Triple integral', insert: '\\iiint ' },
        { display: '\\oint', label: 'Contour integral', insert: '\\oint ' },
        { display: '\\sum_{i=1}^{n}', label: 'Summation', insert: '\\sum_{i=1}^{n} ' },
        { display: '\\prod_{i=1}^{n}', label: 'Product', insert: '\\prod_{i=1}^{n} ' },
        { display: '\\lim_{x \\to 0}', label: 'Limit', insert: '\\lim_{x \\to 0} ' },
        { display: '\\partial', label: 'Partial', insert: '\\partial ' },
        { display: '\\nabla', label: 'Nabla', insert: '\\nabla ' },
        { display: '\\infty', label: 'Infinity', insert: '\\infty ' },
        { display: '\\frac{a}{b}', label: 'Fraction', insert: '\\frac{' + CURSOR + '}{' + CURSOR2 + '}' },
        { display: '\\sqrt{x}', label: 'Square root', insert: '\\sqrt{' + CURSOR + '}' },
        { display: '\\sin x', label: 'sine', insert: '\\sin ' },
        { display: '\\cos x', label: 'cosine', insert: '\\cos ' },
        { display: '\\tan x', label: 'tangent', insert: '\\tan ' },
        { display: '\\log x', label: 'logarithm', insert: '\\log ' },
        { display: '\\ln x', label: 'natural log', insert: '\\ln ' },
        { display: '\\exp(x)', label: 'exponential', insert: '\\exp ' },
        { display: '\\lim_{x\\to\\infty}', label: 'limit at infinity', insert: '\\lim_{x \\to \\infty} ' },
        { display: '\\frac{d}{dx}', label: 'derivative', insert: '\\frac{d}{dx}' },
        { display: '\\frac{\\partial}{\\partial x}', label: 'partial derivative', insert: '\\frac{\\partial}{\\partial x}' },
        { display: '\\bigcup_{i=1}^{n}', label: 'big union', insert: '\\bigcup_{i=1}^{n} ' },
        { display: '\\bigcap_{i=1}^{n}', label: 'big intersection', insert: '\\bigcap_{i=1}^{n} ' },
        { display: '\\smallint', label: 'small integral', insert: '\\smallint ' }
      ]
    },
    {
      id: 'math',
      title: 'Math building blocks',
      icon: 'braces',
      items: [
        { display: 'x^2', label: 'Inline math', insert: '$' + CURSOR + ' $' },
        { display: '\\sum_{i=1}^{n} x_i', label: 'Display math', insert: '$$' + CURSOR + ' $$' },
        { display: '\\binom{n}{k}', label: 'Binomial', insert: '\\binom{' + CURSOR + '}{' + CURSOR2 + '}' },
        { display: '\\boxed{E=mc^2}', label: 'Boxed', insert: '\\boxed{' + CURSOR + '}' },
        { display: '\\text{if } x>0', label: 'Text in math', insert: '\\text{' + CURSOR + '}' },
        { display: '\\left(\\frac{a}{b}\\right)', label: 'Parentheses', insert: '\\left( ' + CURSOR + ' \\right)' },
        { display: '\\overbrace{a+b}^{n}', label: 'Overbrace', insert: '\\overbrace{' + CURSOR + '}^{}' },
        { display: '\\underbrace{a+b}_{n}', label: 'Underbrace', insert: '\\underbrace{' + CURSOR + '}_{}' },
        { display: '\\cancel{x}', label: 'Cancel', insert: '\\cancel{' + CURSOR + '}' }
      ]
    },
    {
      id: 'matrices',
      title: 'Matrices & cases',
      icon: 'grid-3x3',
      items: [
        {
          display: '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}',
          label: 'pmatrix',
          insert: '\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}'
        },
        {
          display: '\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}',
          label: 'bmatrix',
          insert: '\\begin{bmatrix}\n  a & b \\\\\n  c & d\n\\end{bmatrix}'
        },
        {
          display: '\\begin{vmatrix}a&b\\\\c&d\\end{vmatrix}',
          label: 'vmatrix',
          insert: '\\begin{vmatrix}\n  a & b \\\\\n  c & d\n\\end{vmatrix}'
        },
        {
          display: '\\begin{cases}1 & x>0\\\\0 & x\\le 0\\end{cases}',
          label: 'cases',
          insert: '\\begin{cases}\n  ' + CURSOR + ' & x > 0 \\\\\n  0 & \\text{otherwise}\n\\end{cases}'
        },
        {
          display: '\\begin{aligned}a&=b\\\\c&=d\\end{aligned}',
          label: 'aligned',
          insert: '\\begin{aligned}\n  a &= b \\\\\n  c &= d\n\\end{aligned}'
        },
        {
          display: '\\begin{matrix}a&b\\\\c&d\\end{matrix}',
          label: 'matrix',
          insert: '\\begin{matrix}\n  a & b \\\\\n  c & d\n\\end{matrix}'
        },
        {
          display: '\\begin{Bmatrix}a&b\\\\c&d\\end{Bmatrix}',
          label: 'Bmatrix',
          insert: '\\begin{Bmatrix}\n  a & b \\\\\n  c & d\n\\end{Bmatrix}'
        },
        {
          display: '\\begin{Vmatrix}a&b\\\\c&d\\end{Vmatrix}',
          label: 'Vmatrix',
          insert: '\\begin{Vmatrix}\n  a & b \\\\\n  c & d\n\\end{Vmatrix}'
        },
        {
          display: '\\begin{array}{cc}a&b\\\\c&d\\end{array}',
          label: 'array',
          insert: '\\begin{array}{cc}\n  a & b \\\\\n  c & d\n\\end{array}'
        }
      ]
    },
    {
      id: 'relations',
      title: 'Relations & logic',
      icon: 'equal',
      items: [
        '\\leq', '\\geq', '\\neq', '\\approx', '\\equiv', '\\sim', '\\propto', '\\in',
        '\\notin', '\\subset', '\\subseteq', '\\cup', '\\cap', '\\forall', '\\exists',
        '\\rightarrow', '\\Rightarrow', '\\leftrightarrow', '\\pm', '\\times', '\\cdot', '\\div',
        '\\cong', '\\simeq', '\\asymp', '\\ll', '\\gg', '\\prec', '\\succ', '\\preceq',
        '\\succeq', '\\subsetneq', '\\supset', '\\supseteq', '\\setminus', '\\emptyset',
        '\\varnothing', '\\perp', '\\parallel', '\\nparallel', '\\vdash', '\\models',
        '\\angle', '\\triangle', '\\therefore', '\\because', '\\mid', '\\nmid', '\\iff',
        '\\uparrow', '\\downarrow', '\\Longleftrightarrow'
      ].map((cmd) => ({ display: cmd, label: cmd.slice(1), insert: cmd + ' ' }))
    },
    {
      id: 'sets',
      title: 'Sets & logic',
      icon: 'layers',
      items: [
        { display: '\\neg p', label: 'not', insert: '\\neg ' },
        { display: 'p \\land q', label: 'and', insert: '\\land ' },
        { display: 'p \\lor q', label: 'or', insert: '\\lor ' },
        { display: 'p \\veebar q', label: 'exclusive or', insert: '\\veebar ' },
        { display: '\\top', label: 'tautology (top)', insert: '\\top ' },
        { display: '\\bot', label: 'contradiction (bottom)', insert: '\\bot ' },
        { display: '\\nexists', label: 'does not exist', insert: '\\nexists ' },
        { display: '\\vDash', label: 'models', insert: '\\vDash ' },
        { display: '\\Vdash', label: 'forces', insert: '\\Vdash ' },
        { display: '\\nvdash', label: 'does not prove', insert: '\\nvdash ' },
        { display: '\\nvDash', label: 'does not model', insert: '\\nvDash ' },
        { display: '\\uplus', label: 'multiset union', insert: '\\uplus ' },
        { display: '\\sqcup', label: 'disjoint union', insert: '\\sqcup ' },
        { display: '\\sqcap', label: 'disjoint intersection', insert: '\\sqcap ' },
        { display: '\\bigsqcup', label: 'big disjoint union', insert: '\\bigsqcup ' },
        { display: '\\bigoplus', label: 'big direct sum', insert: '\\bigoplus ' },
        { display: '\\bigotimes', label: 'big tensor product', insert: '\\bigotimes ' },
        { display: '\\bigodot', label: 'big circled dot', insert: '\\bigodot ' },
        { display: '\\bigvee', label: 'big or', insert: '\\bigvee ' },
        { display: '\\bigwedge', label: 'big and', insert: '\\bigwedge ' },
        { display: '\\coprod', label: 'coproduct', insert: '\\coprod ' },
        { display: '\\smallsetminus', label: 'small set minus', insert: '\\smallsetminus ' },
        { display: '\\complement', label: 'complement', insert: '\\complement ' },
        { display: '\\subseteqq', label: 'subset or equal (double)', insert: '\\subseteqq ' },
        { display: '\\supseteqq', label: 'superset or equal (double)', insert: '\\supseteqq ' },
        { display: '\\subsetneqq', label: 'proper subset (strict)', insert: '\\subsetneqq ' },
        { display: '\\supsetneqq', label: 'proper superset (strict)', insert: '\\supsetneqq ' },
        { display: '\\nsubseteq', label: 'not a subset or equal', insert: '\\nsubseteq ' },
        { display: '\\nsupseteq', label: 'not a superset or equal', insert: '\\nsupseteq ' },
        { display: '\\mathcal{P}(S)', label: 'power set', insert: '\\mathcal{P}(' + CURSOR + ')' },
        { display: '\\left|A\\right|', label: 'cardinality', insert: '\\left| ' + CURSOR + ' \\right|' },
        { display: '\\aleph_0', label: 'aleph nought', insert: '\\aleph_0' },
        { display: '\\mathfrak{c}', label: 'cardinality of the continuum', insert: '\\mathfrak{c}' },
        { display: '\\triangleq', label: 'defined as', insert: '\\triangleq ' }
      ]
    },
    {
      id: 'logic',
      title: 'Logic & gates',
      icon: 'circuit-board',
      items: [
        { display: '\\neg A', label: 'NOT gate', insert: '\\neg ' + CURSOR },
        { display: 'A \\land B', label: 'AND gate', insert: CURSOR + ' \\land B' },
        { display: 'A \\lor B', label: 'OR gate', insert: CURSOR + ' \\lor B' },
        { display: 'A \\oplus B', label: 'XOR gate', insert: CURSOR + ' \\oplus B' },
        { display: 'A \\uparrow B', label: 'NAND gate (Sheffer stroke)', insert: CURSOR + ' \\uparrow B' },
        { display: 'A \\downarrow B', label: 'NOR gate (Peirce arrow)', insert: CURSOR + ' \\downarrow B' },
        { display: 'A \\odot B', label: 'XNOR gate', insert: CURSOR + ' \\odot B' },
        { display: 'A \\to B', label: 'IMPLIES gate', insert: CURSOR + ' \\to B' },
        { display: 'A \\leftrightarrow B', label: 'biconditional (IFF)', insert: CURSOR + ' \\leftrightarrow B' },
        { display: 'A \\veebar B', label: 'exclusive or (veebar)', insert: CURSOR + ' \\veebar B' },
        { display: '\\overline{A}', label: 'negation bar', insert: '\\overline{' + CURSOR + '}' },
        { display: '\\overline{A \\land B}', label: 'NAND drawn as negated AND', insert: '\\overline{' + CURSOR + ' \\land B}' },
        { display: '\\overline{A \\lor B}', label: 'NOR drawn as negated OR', insert: '\\overline{' + CURSOR + ' \\lor B}' },
        { display: 'A \\equiv B', label: 'logical equivalence', insert: CURSOR + ' \\equiv B' },
        { display: 'A \\vDash B', label: 'entails (models)', insert: CURSOR + ' \\vDash B' },
        { display: 'A \\vdash B', label: 'derives (proves)', insert: CURSOR + ' \\vdash B' }
      ]
    },
    {
      id: 'arrows',
      title: 'Arrows',
      icon: 'arrow-right',
      items: [
        ['\\rightarrow', 'right'], ['\\leftarrow', 'left'], ['\\leftrightarrow', 'left-right'],
        ['\\Rightarrow', 'implies'], ['\\Leftarrow', 'implied by'], ['\\Leftrightarrow', 'iff'],
        ['\\longrightarrow', 'long right'], ['\\longleftarrow', 'long left'],
        ['\\longleftrightarrow', 'long left-right'], ['\\Longrightarrow', 'long implies'],
        ['\\Longleftarrow', 'long implied by'], ['\\Longleftrightarrow', 'long iff'],
        ['\\mapsto', 'maps to'], ['\\longmapsto', 'long maps to'],
        ['\\hookrightarrow', 'hook right'], ['\\hookleftarrow', 'hook left'],
        ['\\nearrow', 'up-right'], ['\\searrow', 'down-right'],
        ['\\swarrow', 'down-left'], ['\\nwarrow', 'up-left'],
        ['\\uparrow', 'up'], ['\\downarrow', 'down'], ['\\updownarrow', 'up-down'],
        ['\\Uparrow', 'double up'], ['\\Downarrow', 'double down'], ['\\Updownarrow', 'double up-down'],
        ['\\rightharpoonup', 'right harpoon up'], ['\\rightharpoondown', 'right harpoon down'],
        ['\\leftharpoonup', 'left harpoon up'], ['\\leftharpoondown', 'left harpoon down'],
        ['\\rightleftharpoons', 'equilibrium'], ['\\leftrightharpoons', 'reverse equilibrium'],
        ['\\rightrightarrows', 'two right'], ['\\leftleftarrows', 'two left'],
        ['\\rightleftarrows', 'right then left'], ['\\leftrightarrows', 'left then right'],
        ['\\twoheadrightarrow', 'two-headed right'], ['\\twoheadleftarrow', 'two-headed left'],
        ['\\rightarrowtail', 'right tail'], ['\\leftarrowtail', 'left tail'],
        ['\\dashrightarrow', 'dashed right'], ['\\dashleftarrow', 'dashed left'],
        ['\\circlearrowleft', 'anticlockwise'], ['\\circlearrowright', 'clockwise'],
        ['\\curvearrowleft', 'curve left'], ['\\curvearrowright', 'curve right'],
        ['\\looparrowleft', 'loop left'], ['\\looparrowright', 'loop right'],
        ['\\rightsquigarrow', 'squiggle right'], ['\\multimap', 'multimap'],
        ['\\xrightarrow{abc}', 'labelled right'], ['\\xleftarrow{abc}', 'labelled left'],
        ['\\implies', 'implies (spaced)'], ['\\impliedby', 'implied by (spaced)'],
        ['\\nleftarrow', 'not left'], ['\\nrightarrow', 'not right'],
        ['\\nLeftarrow', 'not implied by'], ['\\nRightarrow', 'not implies'],
        ['\\nleftrightarrow', 'not left-right'], ['\\nLeftrightarrow', 'not iff'],
        ['\\Lsh', 'left shift'], ['\\Rsh', 'right shift']
      ].map(([cmd, label]) => ({
        display: cmd,
        label,
        insert: cmd.indexOf('{') !== -1 ? cmd.replace('{abc}', '{' + CURSOR + '}') : cmd + ' '
      }))
    },
    {
      id: 'physics',
      title: 'Physics & vectors',
      icon: 'atom',
      items: [
        { display: '\\hbar', label: 'hbar', insert: '\\hbar ' },
        { display: '\\psi', label: 'psi', insert: '\\psi ' },
        { display: '\\Psi', label: 'Psi', insert: '\\Psi ' },
        { display: '\\phi', label: 'phi', insert: '\\phi ' },
        { display: '\\nabla', label: 'nabla', insert: '\\nabla ' },
        { display: '\\partial', label: 'partial', insert: '\\partial ' },
        { display: '\\oint', label: 'oint', insert: '\\oint ' },
        { display: '\\Delta', label: 'Delta', insert: '\\Delta ' },
        { display: '\\vec{v}', label: 'vector', insert: '\\vec{' + CURSOR + '}' },
        { display: '\\hat{x}', label: 'hat', insert: '\\hat{' + CURSOR + '}' },
        { display: '\\bra{\\psi}', label: 'bra', insert: '\\bra{' + CURSOR + '}' },
        { display: '\\ket{\\psi}', label: 'ket', insert: '\\ket{' + CURSOR + '}' },
        { display: '\\dagger', label: 'dagger', insert: '\\dagger ' },
        { display: '\\ddagger', label: 'double dagger', insert: '\\ddagger ' },
        { display: '\\otimes', label: 'tensor product', insert: '\\otimes ' },
        { display: '\\oplus', label: 'direct sum', insert: '\\oplus ' },
        { display: '\\langle', label: 'left angle', insert: '\\langle ' },
        { display: '\\rangle', label: 'right angle', insert: '\\rangle ' },
        { display: '\\lVert', label: 'norm bar', insert: '\\lVert ' },
        { display: '\\mathcal{L}', label: 'Lagrangian', insert: '\\mathcal{L}' },
        { display: '\\mathcal{H}', label: 'Hamiltonian', insert: '\\mathcal{H}' },
        { display: '\\mathbb{R}', label: 'real numbers', insert: '\\mathbb{R}' },
        { display: '\\vec{E}', label: 'electric field', insert: '\\vec{E}' },
        { display: '\\vec{B}', label: 'magnetic field', insert: '\\vec{B}' },
        { display: '\\dot{x}', label: 'time derivative', insert: '\\dot{x}' },
        { display: '\\ddot{x}', label: 'second time derivative', insert: '\\ddot{x}' },
        { display: '\\tilde{x}', label: 'tilde', insert: '\\tilde{x}' },
        { display: '\\overline{x}', label: 'overline', insert: '\\overline{x}' },
        { display: '\\epsilon_0', label: 'epsilon nought', insert: '\\epsilon_0' },
        { display: '\\mu_0', label: 'mu nought', insert: '\\mu_0' },
        { display: 'c', label: 'speed of light', insert: 'c' },
        { display: 'G', label: 'gravitational constant', insert: 'G' },
        { display: 'k_B', label: 'Boltzmann constant', insert: 'k_{B}' },
        { display: 'N_A', label: 'Avogadro constant', insert: 'N_{A}' },
        { display: '\\mu_B', label: 'Bohr magneton', insert: '\\mu_B' },
        { display: '\\Phi', label: 'flux', insert: '\\Phi ' }
      ]
    },
    {
      id: 'chemistry',
      title: 'Chemistry',
      icon: 'flask-conical',
      items: [
        { display: '\\ce{H2O}', label: 'Chemical formula', insert: '\\ce{' + CURSOR + '}' },
        { display: '\\ce{A -> B}', label: 'Reaction', insert: '\\ce{' + CURSOR + ' -> }' },
        { display: '\\ce{A <=> B}', label: 'Equilibrium reaction', insert: '\\ce{' + CURSOR + ' <=> }' },
        { display: '\\ce{A ->[heat] B}', label: 'Reaction with condition', insert: '\\ce{' + CURSOR + ' ->[heat] }' },
        { display: '\\ce{Fe^2+}', label: 'Ion charge', insert: '\\ce{Fe^2+}' },
        { display: '\\ce{SO4^2-}', label: 'Polyatomic ion', insert: '\\ce{SO4^2-}' },
        { display: '\\ce{NaOH(aq)}', label: 'Aqueous state', insert: '\\ce{' + CURSOR + '(aq)}' },
        { display: '\\ce{H2O(g)}', label: 'Gas state', insert: '\\ce{' + CURSOR + '(g)}' },
        { display: '\\rightleftharpoons', label: 'Equilibrium arrow', insert: '\\rightleftharpoons ' },
        { display: '\\xrightarrow{\\text{heat}}', label: 'Labelled reaction arrow', insert: '\\xrightarrow{\\text{' + CURSOR + '}}' },
        { display: '\\uparrow', label: 'Gas evolved', insert: '\\uparrow ' },
        { display: '\\downarrow', label: 'Precipitate', insert: '\\downarrow ' },
        { display: '^{\\circ}', label: 'Degrees', insert: '^{\\circ}' },
        { display: '\\mathrm{pH}', label: 'pH', insert: '\\mathrm{pH}' },
        { display: '\\mathrm{p}K_{a}', label: 'pKa', insert: '\\mathrm{p}K_{a}' },
        { display: '\\Delta', label: 'Heat', insert: '\\Delta ' },
        { display: '\\mathrm{sp}^{3}', label: 'sp3 orbital', insert: '\\mathrm{sp}^{3}' },
        { display: '\\equiv', label: 'Triple bond', insert: '\\equiv ' }
      ]
    },
    {
      id: 'biology',
      title: 'Biology',
      icon: 'dna',
      items: [
        { text: '♂', label: 'male', insert: '\\male ' },
        { text: '♀', label: 'female', insert: '\\female ' },
        { display: '\\dna{ATGC}', label: 'DNA sequence', insert: '\\dna{' + CURSOR + '}' },
        { display: '\\rna{AUGC}', label: 'RNA sequence', insert: '\\rna{' + CURSOR + '}' },
        { display: '\\dnac{ATGC}', label: 'Complementary strand', insert: '\\dnac{' + CURSOR + '}' },
        { display: '5^{\\prime} \\to 3^{\\prime}', label: 'DNA direction', insert: "5'-" + CURSOR + "-3'" },
        { display: '\\text{DNA}', label: 'DNA', insert: '\\text{DNA}' },
        { display: '\\text{RNA}', label: 'RNA', insert: '\\text{RNA}' },
        { display: '\\text{mRNA}', label: 'mRNA', insert: '\\text{mRNA}' },
        { display: '\\text{ATP}', label: 'ATP', insert: '\\text{ATP}' },
        { display: '\\text{AUG}', label: 'codon', insert: '\\text{' + CURSOR + '}' },
        { display: '\\times', label: 'genetic cross', insert: '\\times ' },
        { display: '\\rightleftharpoons', label: 'enzyme equilibrium', insert: '\\rightleftharpoons ' },
        { display: '\\uparrow', label: 'upregulated', insert: '\\uparrow ' },
        { display: '\\downarrow', label: 'downregulated', insert: '\\downarrow ' },
        { display: '\\alpha', label: 'alpha helix', insert: '\\alpha ' },
        { display: '\\beta', label: 'beta sheet', insert: '\\beta ' },
        { display: '\\Delta', label: 'change', insert: '\\Delta ' },
        { display: '^{\\circ}', label: 'degrees', insert: '^{\\circ}' }
      ]
    },
    {
      id: 'quantum',
      title: 'Quantum mechanics',
      icon: 'waves',
      items: [
        { display: '\\ket{\\psi}', label: 'ket', insert: '\\ket{' + CURSOR + '}' },
        { display: '\\bra{\\psi}', label: 'bra', insert: '\\bra{' + CURSOR + '}' },
        { display: '\\braket{\\phi|\\psi}', label: 'braket', insert: '\\braket{' + CURSOR + '}' },
        { display: '\\ketbra{\\psi}{\\phi}', label: 'density operator', insert: '\\ketbra{' + CURSOR + '}{}' },
        { display: '\\expval{A}', label: 'expectation value', insert: '\\expval{' + CURSOR + '}' },
        { display: '\\matrixel{\\phi}{A}{\\psi}', label: 'matrix element', insert: '\\matrixel{' + CURSOR + '}{A}{}' },
        { display: '\\comm{A}{B}', label: 'commutator', insert: '\\comm{' + CURSOR + '}{}' },
        { display: '\\acomm{A}{B}', label: 'anticommutator', insert: '\\acomm{' + CURSOR + '}{}' },
        { display: '\\hbar', label: 'hbar', insert: '\\hbar ' },
        { display: '\\hat{H}', label: 'Hamiltonian operator', insert: '\\hat{H}' },
        { display: '\\hat{p}', label: 'momentum operator', insert: '\\hat{p}' },
        { display: '\\hat{x}', label: 'position operator', insert: '\\hat{x}' },
        { display: '\\nabla^{2}', label: 'Laplacian', insert: '\\nabla^{2}' },
        { display: '\\partial_t', label: 'time derivative', insert: '\\partial_t ' },
        { display: '\\sigma_z', label: 'Pauli z', insert: '\\sigma_z' },
        { display: '\\rho', label: 'density matrix', insert: '\\rho ' },
        { display: '\\Tr', label: 'trace', insert: '\\Tr ' },
        { display: '\\otimes', label: 'tensor product', insert: '\\otimes ' },
        { display: '\\dagger', label: 'adjoint', insert: '^{\\dagger}' },
        { display: '\\mathbb{1}', label: 'identity', insert: '\\mathbb{1}' }
      ]
    },
    {
      id: 'quantumgates',
      title: 'Quantum gates',
      icon: 'cpu',
      items: [
        { display: '\\mathrm{I}', label: 'identity gate', insert: '\\mathrm{I}' },
        { display: '\\mathrm{H}', label: 'Hadamard gate', insert: '\\mathrm{H}' },
        { display: '\\mathrm{X}', label: 'Pauli-X gate (bit flip)', insert: '\\mathrm{X}' },
        { display: '\\mathrm{Y}', label: 'Pauli-Y gate', insert: '\\mathrm{Y}' },
        { display: '\\mathrm{Z}', label: 'Pauli-Z gate (phase flip)', insert: '\\mathrm{Z}' },
        { display: '\\mathrm{S}', label: 'phase gate S', insert: '\\mathrm{S}' },
        { display: '\\mathrm{T}', label: 'pi over 8 gate T', insert: '\\mathrm{T}' },
        { display: '\\mathrm{CNOT}', label: 'controlled NOT (CNOT, CX)', insert: '\\mathrm{CNOT}' },
        { display: '\\mathrm{CZ}', label: 'controlled Z gate', insert: '\\mathrm{CZ}' },
        { display: '\\mathrm{SWAP}', label: 'SWAP gate', insert: '\\mathrm{SWAP}' },
        { display: '\\mathrm{Toffoli}', label: 'Toffoli gate (CCNOT)', insert: '\\mathrm{Toffoli}' },
        { display: '\\mathrm{CSWAP}', label: 'Fredkin gate (CSWAP)', insert: '\\mathrm{CSWAP}' },
        { display: '\\mathrm{C}U', label: 'controlled-U gate', insert: '\\mathrm{C}U' },
        { display: 'U', label: 'arbitrary unitary gate', insert: 'U' },
        { display: '\\mathrm{CPHASE}', label: 'controlled phase gate', insert: '\\mathrm{CPHASE}' },
        { display: '\\mathrm{R}_x(\\theta)', label: 'rotation around x', insert: '\\mathrm{R}_x(' + CURSOR + ')' },
        { display: '\\mathrm{R}_y(\\theta)', label: 'rotation around y', insert: '\\mathrm{R}_y(' + CURSOR + ')' },
        { display: '\\mathrm{R}_z(\\theta)', label: 'rotation around z', insert: '\\mathrm{R}_z(' + CURSOR + ')' },
        { display: 'M', label: 'measurement', insert: 'M' },
        { display: '\\ket{0}', label: 'zero state', insert: '\\ket{0}' },
        { display: '\\ket{1}', label: 'one state', insert: '\\ket{1}' },
        { display: '\\ket{+}', label: 'plus state', insert: '\\ket{+}' }
      ]
    },
    {
      id: 'structure',
      title: 'Document structures',
      icon: 'braces',
      items: [
        { icon: 'hash', label: 'Section', insert: '\\section{' + CURSOR + '}\n' },
        { icon: 'hash', label: 'Subsection', insert: '\\subsection{' + CURSOR + '}\n' },
        { icon: 'sigma', label: 'Equation', insert: '\n\\begin{equation}\n  ' + CURSOR + '\n\\end{equation}\n' },
        {
          icon: 'sigma',
          label: 'Align block',
          insert: '\n\\begin{align}\n  a &= b \\\\\n  c &= d\n\\end{align}\n'
        },
        { icon: 'list', label: 'Itemize', insert: '\n\\begin{itemize}\n  \\item ' + CURSOR + '\n\\end{itemize}\n' },
        {
          icon: 'list-ordered',
          label: 'Enumerate',
          insert: '\n\\begin{enumerate}\n  \\item ' + CURSOR + '\n\\end{enumerate}\n'
        },
        {
          icon: 'table',
          label: 'Table',
          insert: '\n\\begin{table}[h]\n  \\centering\n  \\caption{' + CURSOR + '}\n  \\begin{tabular}{|c|c|}\n    \\hline\n    A & B \\\\\n    \\hline\n    1 & 2 \\\\\n    \\hline\n  \\end{tabular}\n\\end{table}\n'
        },
        {
          icon: 'image',
          label: 'Figure',
          insert: '\n\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=0.6\\textwidth]{' + CURSOR + '}\n  \\caption{A caption}\n\\end{figure}\n'
        },
        { icon: 'quote', label: 'Quote', insert: '\n\\begin{quote}\n  ' + CURSOR + '\n\\end{quote}\n' },
        { icon: 'braces', label: 'Cases', math: true, insert: '\n\\begin{cases}\n  ' + CURSOR + ' & x > 0 \\\\\n  0 & \\text{otherwise}\n\\end{cases}\n' },
        { icon: 'book-open', label: 'Theorem', insert: '\n\\begin{theorem}\n  ' + CURSOR + '\n\\end{theorem}\n' },
        { icon: 'book-open', label: 'Definition', insert: '\n\\begin{definition}\n  ' + CURSOR + '\n\\end{definition}\n' },
        { icon: 'check-circle-2', label: 'Proof', insert: '\n\\begin{proof}\n  ' + CURSOR + '\n\\end{proof}\n' },
        { icon: 'list', label: 'Description', insert: '\n\\begin{description}\n  \\item[' + CURSOR + '] Definition\n\\end{description}\n' },
        {
          icon: 'table',
          label: 'Truth table',
          insert: '\n\\begin{table}[h]\n  \\centering\n  \\caption{' + CURSOR + 'Truth table}\n  \\begin{tabular}{|c|c|c|}\n    \\hline\n    $A$ & $B$ & $A \\land B$ \\\\\n    \\hline\n    0 & 0 & 0 \\\\\n    0 & 1 & 0 \\\\\n    1 & 0 & 0 \\\\\n    1 & 1 & 1 \\\\\n    \\hline\n  \\end{tabular}\n\\end{table}\n'
        },
        {
          icon: 'grid-3x3',
          label: 'Karnaugh map',
          insert: '\n\\begin{equation*}\n  \\begin{array}{c|c|c}\n    & B=0 & B=1 \\\\\n    \\hline\n    A=0 & 0 & 1 \\\\\n    \\hline\n    A=1 & 1 & 0\n  \\end{array}\n\\end{equation*}\n'
        },
        { icon: 'code-2', label: 'Verbatim', insert: '\n\\begin{verbatim}\n' + CURSOR + '\n\\end{verbatim}\n' },
        { icon: 'sigma', label: 'Gather', insert: '\n\\begin{gather}\n  a = b \\\\\n  c = d\n\\end{gather}\n' },
        { icon: 'sigma', label: 'Align (unnumbered)', insert: '\n\\begin{align*}\n  a &= b \\\\\n  c &= d\n\\end{align*}\n' }
      ]
    }
  ];

  /* ------------------------------------------------------------------ *
   *  Application state
   * ------------------------------------------------------------------ */
  const state = { projects: [], activeId: null };
  let cm = null;
  let historyOpen = false;
  let lastSnapshotAt = 0;
  let snapshotBusy = false;
  const prefs = { sidebarCollapsed: false };

  const activeProject = () =>
    state.projects.find((p) => p.id === state.activeId) || state.projects[0];

  /* ------------------------------------------------------------------ *
   *  localStorage persistence
   * ------------------------------------------------------------------ */
  let dbPromise = null;
  let storageWarned = false;

  function openDb() {
    if (!('indexedDB' in window)) return Promise.resolve(null);
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
      let request;
      try {
        request = indexedDB.open(DB_NAME, DB_VERSION);
      } catch (_) {
        resolve(null);
        return;
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('workspace')) db.createObjectStore('workspace');
        if (!db.objectStoreNames.contains('snapshots')) db.createObjectStore('snapshots', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('SciDocs: IndexedDB unavailable, using localStorage only', request.error);
        resolve(null);
      };
    });
    return dbPromise;
  }

  async function idbGet(store, key) {
    const db = await openDb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const request = db.transaction(store, 'readonly').objectStore(store).get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }

  async function idbPut(store, value, key) {
    const db = await openDb();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(store, 'readwrite');
        const objectStore = tx.objectStore(store);
        if (key === undefined) objectStore.put(value);
        else objectStore.put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch (_) {
        resolve(false);
      }
    });
  }

  async function idbAll(store) {
    const db = await openDb();
    if (!db) return [];
    return new Promise((resolve) => {
      try {
        const request = db.transaction(store, 'readonly').objectStore(store).getAll();
        request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
        request.onerror = () => resolve([]);
      } catch (_) {
        resolve([]);
      }
    });
  }

  async function idbDelete(store, key) {
    const db = await openDb();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).delete(key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (_) {
        resolve(false);
      }
    });
  }

  function workspacePayload() {
    return { version: 2, activeId: state.activeId, projects: state.projects };
  }

  /* Images attached to a project are stored in its workspace record as data
     URLs. Caps keep the record inside browser storage limits. */
  function sanitizeImages(raw) {
    if (!raw || typeof raw !== 'object') return {};
    const out = {};
    let total = 0;
    Object.keys(raw).slice(0, IMAGE_KEY_LIMIT).forEach((key) => {
      const value = raw[key];
      if (typeof value !== 'string' || !IMAGE_DATA_URL.test(value)) return;
      const bytes = Math.round(value.length * 0.75);
      if (bytes > IMAGE_MAX_BYTES || total + bytes > IMAGE_TOTAL_BYTES) return;
      total += bytes;
      out[String(key).slice(0, 120)] = value;
    });
    return out;
  }

  function projectImages() {
    const project = activeProject();
    if (!project) return {};
    if (!project.images || typeof project.images !== 'object') project.images = {};
    return project.images;
  }

  function imageFor(ctx, name) {
    const images = (ctx && ctx.images) || {};
    const wanted = String(name || '').trim();
    if (!wanted) return '';
    if (images[wanted]) return images[wanted];
    const base = wanted.split('/').pop();
    if (images[base]) return images[base];
    const key = Object.keys(images).find((entry) => entry.split('/').pop() === base);
    return key ? images[key] : '';
  }

  function imageWidthStyle(options) {
    const opts = String(options || '');
    const fraction = /width\s*=\s*([0-9.]+)\s*\\(?:textwidth|linewidth|columnwidth|hsize)/.exec(opts);
    if (fraction) {
      const percent = Math.max(2, Math.min(100, parseFloat(fraction[1]) * 100));
      return 'width:' + percent + '%';
    }
    const absolute = /width\s*=\s*([0-9.]+)\s*(cm|mm|in|pt)/.exec(opts);
    if (absolute) {
      const unit = { cm: 37.8, mm: 3.78, in: 96, pt: 1.33 }[absolute[2]] || 1;
      return 'width:' + Math.round(parseFloat(absolute[1]) * unit) + 'px';
    }
    return '';
  }

  function persist() {
    const payload = workspacePayload();
    let localSaved = true;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(payload));
    } catch (err) {
      localSaved = false;
      console.warn('SciDocs: could not save workspace to localStorage', err);
    }
    idbPut('workspace', payload, 'current').then((ok) => {
      if (!ok && !localSaved && !storageWarned) {
        storageWarned = true;
        toast('Browser storage is blocked — download a backup from History before closing.', 'error');
      }
    });
  }

  function persistPrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (_) { /* ignore */ }
  }

  function adoptWorkspace(data) {
    if (!data || !Array.isArray(data.projects) || !data.projects.length) return false;
    let migrated = false;
    state.projects = data.projects.map((p) => {
      const saved = String(typeof p.content === 'string' ? p.content : '');
      const content = saved.replace(/in your browser by KaTeX/g, 'in your browser with LaTeX');
      if (content !== saved) migrated = true;
      return {
        id: String(p.id || uid()),
        name: String(p.name || 'Untitled Document'),
        content,
        images: sanitizeImages(p.images),
        updatedAt: Number(p.updatedAt) || Date.now()
      };
    });
    state.activeId = state.projects.some((p) => p.id === data.activeId)
      ? data.activeId
      : state.projects[0].id;
    return migrated;
  }

  async function loadWorkspace() {
    const stored = await idbGet('workspace', 'current');
    if (stored && Array.isArray(stored.projects) && stored.projects.length) {
      const migrated = adoptWorkspace(stored);
      if (migrated) persist();
      return;
    }

    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.projects) && data.projects.length) {
          const migrated = adoptWorkspace(data);
          await idbPut('workspace', workspacePayload(), 'current');
          if (migrated) persist();
          return;
        }
      }
    } catch (err) {
      console.warn('SciDocs: saved workspace is unreadable, starting fresh', err);
    }
    state.projects = [
      { id: uid(), name: 'Starter Document', content: STARTER, updatedAt: Date.now() }
    ];
    state.activeId = state.projects[0].id;
    persist();
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        prefs.sidebarCollapsed = Boolean(data && data.sidebarCollapsed);
      }
    } catch (_) { /* ignore */ }
    document.body.classList.toggle('sidebar-collapsed', prefs.sidebarCollapsed);
    const toggle = $('#sidebarToggle');
    if (toggle) toggle.setAttribute('aria-pressed', String(prefs.sidebarCollapsed));
  }

  function saveNow() {
    const project = activeProject();
    if (!project || !cm) return;
    project.content = cm.getValue();
    project.updatedAt = Date.now();
    persist();
    maybeAutoSnapshot();
    const saveState = $('#saveState');
    if (saveState) saveState.textContent = 'Saved locally';
  }

  function relativeTime(timestamp) {
    const diff = Math.max(0, Date.now() - timestamp);
    if (diff < 60 * 1000) return 'just now';
    if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + 'h ago';
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  async function captureSnapshot(reason) {
    const project = activeProject();
    if (!project || !cm || snapshotBusy) return false;
    const content = cm.getValue();
    if (!content.trim()) return false;
    snapshotBusy = true;
    try {
      const snapshots = (await idbAll('snapshots'))
        .filter((item) => item.projectId === project.id)
        .sort((a, b) => b.createdAt - a.createdAt);
      if (snapshots[0] && snapshots[0].content === content) return false;
      const snapshot = {
        id: 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        projectId: project.id,
        name: project.name,
        content,
        createdAt: Date.now(),
        reason: reason || 'Manual'
      };
      await idbPut('snapshots', snapshot);
      lastSnapshotAt = snapshot.createdAt;
      const keep = [snapshot].concat(snapshots).slice(0, SNAPSHOT_LIMIT);
      const keepIds = new Set(keep.map((item) => item.id));
      for (const old of snapshots) {
        if (!keepIds.has(old.id)) await idbDelete('snapshots', old.id);
      }
      if (historyOpen) renderHistory();
      return true;
    } finally {
      snapshotBusy = false;
    }
  }

  function maybeAutoSnapshot() {
    if (Date.now() - lastSnapshotAt < 5 * 60 * 1000) return;
    lastSnapshotAt = Date.now();
    captureSnapshot('Auto');
  }

  async function renderHistory() {
    const list = $('#historyList');
    if (!list) return;
    const project = activeProject();
    if (!project) return;
    const scope = $('#historyScope');
    if (scope) scope.textContent = 'Snapshots for “' + project.name + '”. Auto-saved about every 5 minutes while editing.';
    list.innerHTML = '<p class="history-empty">Loading snapshots…</p>';
    const items = (await idbAll('snapshots'))
      .filter((item) => item.projectId === project.id)
      .sort((a, b) => b.createdAt - a.createdAt);
    if (!items.length) {
      list.innerHTML = '<p class="history-empty">No snapshots yet. One is saved automatically when you pause after editing, or use <strong>Snapshot now</strong>.</p>';
      return;
    }
    list.innerHTML = '';
    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'history-row';
      const meta = document.createElement('div');
      meta.className = 'history-meta';
      const title = document.createElement('strong');
      title.textContent = item.reason || 'Snapshot';
      const detail = document.createElement('span');
      detail.textContent = relativeTime(item.createdAt) + ' · ' +
        countWords(item.content) + ' words';
      meta.appendChild(title);
      meta.appendChild(detail);
      const actions = document.createElement('div');
      actions.className = 'history-actions';
      const restore = document.createElement('button');
      restore.type = 'button';
      restore.className = 'btn btn-ghost btn-xs';
      restore.textContent = 'Restore';
      restore.addEventListener('click', () => restoreSnapshot(item));
      const download = document.createElement('button');
      download.type = 'button';
      download.className = 'btn btn-ghost btn-xs';
      download.textContent = 'Download';
      download.addEventListener('click', () => {
        triggerDownload(new Blob([item.content], { type: 'application/x-tex;charset=utf-8' }),
          projectFileStem(project) + '-' + new Date(item.createdAt).toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.tex');
      });
      actions.appendChild(restore);
      actions.appendChild(download);
      row.appendChild(meta);
      row.appendChild(actions);
      list.appendChild(row);
    }
    refreshIcons();
  }

  async function restoreSnapshot(item) {
    if (!item || !cm) return;
    await captureSnapshot('Before restore');
    closeModal('#historyModal');
    historyOpen = false;
    openConfirm({
      title: 'Restore this version?',
      message: 'The current text will be replaced by the snapshot from ' + relativeTime(item.createdAt) + '. A backup snapshot is saved first.',
      confirmLabel: 'Restore version',
      onConfirm: () => {
        cm.setValue(item.content);
        markDirty();
        saveNow();
        renderNow({ manual: true });
        toast('Restored snapshot from ' + relativeTime(item.createdAt), 'success');
      }
    });
  }

  function openHistory() {
    if (cm) saveNow();
    historyOpen = true;
    openModal('#historyModal');
    renderHistory();
  }

  function exportBackup() {
    saveNow();
    const payload = {
      app: 'SciDocs',
      version: 2,
      exportedAt: new Date().toISOString(),
      projects: state.projects.map(({ id, name, content, updatedAt, images }) =>
        ({ id, name, content, updatedAt, images: sanitizeImages(images) })),
      library: { bib: readBibText(), snippets: readSnippets() }
    };
    triggerDownload(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }), 'scidocs-backup.json');
    toast('Workspace backup downloaded', 'success');
  }

  function importBackup() {
    const input = $('#backupFile');
    if (!input) return;
    input.value = '';
    input.click();
  }

  async function handleBackupFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('Backup is larger than 5 MB.', 'warn');
      return;
    }
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch (_) {
      toast('That file is not valid JSON.', 'error');
      return;
    }
    if (!data || !Array.isArray(data.projects) || !data.projects.length) {
      toast('That backup contains no projects.', 'warn');
      return;
    }
    closeModal('#historyModal');
    historyOpen = false;
    openConfirm({
      title: 'Import backup?',
      message: 'Add ' + data.projects.length + ' project' + (data.projects.length === 1 ? '' : 's') +
        ' to this browser. Existing projects will be kept and renamed if needed.',
      confirmLabel: 'Import projects',
      onConfirm: () => {
        const used = new Set(state.projects.map((p) => p.name));
        const imported = data.projects.map((p) => {
          let name = String(p && p.name || 'Imported document').slice(0, 80) || 'Imported document';
          const base = name;
          let count = 2;
          while (used.has(name)) name = base + ' (' + count++ + ')';
          used.add(name);
          return {
            id: uid(),
            name,
            content: String(p && typeof p.content === 'string' ? p.content : ''),
            images: sanitizeImages(p && p.images),
            updatedAt: Date.now()
          };
        });
        state.projects = imported.concat(state.projects);
        state.activeId = imported[0].id;
        lastSnapshotAt = 0;
        persist();
        const library = data.library || {};
        const bibAdded = mergeBibText(library.bib);
        const snippetAdded = mergeSnippets(library.snippets);
        if (bibAdded || snippetAdded) {
          toast('Also restored ' + [bibAdded ? 'the bibliography' : '',
            snippetAdded ? snippetAdded + ' snippet' + (snippetAdded === 1 ? '' : 's') : '']
            .filter(Boolean).join(' and '), 'success');
        }
        renderProjectSelect();
        if (cm) {
          cm.setValue(imported[0].content);
          cm.clearHistory();
          cm.focus();
        }
        updateTabName();
        renderNow();
        toast('Imported ' + imported.length + ' project' + (imported.length === 1 ? '' : 's'), 'success');
      }
    });
  }

  const scheduleSave = debounce(() => saveNow(), 650);

  function markDirty() {
    const saveState = $('#saveState');
    if (saveState) saveState.textContent = 'Unsaved…';
    scheduleSave();
    updateStats();
  }

  function projectFileStem(project) {
    const name = (project && project.name) || 'document';
    const cleaned = name
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || 'document';
  }

  function updateTabName() {
    const project = activeProject();
    if (!project) return;
    const file = projectFileStem(project) + '.tex';
    const tab = $('#editorTabName');
    if (tab) tab.textContent = file;
    const option = $('#projectSelect');
    if (option) option.value = project.id;
    document.title = project.name + ' — SciDocs';
  }

  function renderProjectSelect() {
    const select = $('#projectSelect');
    if (!select) return;
    select.innerHTML = state.projects
      .map(
        (p) =>
          '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + '</option>'
      )
      .join('');
    select.value = state.activeId;
  }

  function openProject(id) {
    if (!cm || id === state.activeId) return;
    if (!state.projects.some((p) => p.id === id)) return;
    saveNow();
    captureSnapshot('Before switch');
    state.activeId = id;
    persist();
    renderProjectSelect();
    cm.setValue(activeProject().content);
    cm.clearHistory();
    cm.setCursor({ line: 0, ch: 0 });
    cm.focus();
    updateTabName();
    renderNow();
    const saveState = $('#saveState');
    if (saveState) saveState.textContent = 'Saved locally';
    toast('Opened ' + activeProject().name, 'info');
  }

  /* ------------------------------------------------------------------ *
   *  Text helpers for the LaTeX renderer
   * ------------------------------------------------------------------ */
  function matchBrace(text, open) {
    let depth = 0;
    for (let i = open; i < text.length; i++) {
      const ch = text[i];
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return i;
        if (depth < 0) return -1;
      }
    }
    return -1;
  }

  function matchBracket(text, open) {
    let depth = 0;
    for (let i = open; i < text.length; i++) {
      if (text[i] === '[') depth++;
      else if (text[i] === ']') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  /* "none" | "inline" | "display" at a given offset, so block-level parsing
     never mistakes a matrix inside $…$ for a top-level environment. */
  function mathStateAt(text, index) {
    let state = 'none';
    for (let i = 0; i < index && i < text.length; i++) {
      const ch = text[i];
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch !== '$') continue;
      if (text[i + 1] === '$') {
        state = state === 'display' ? 'none' : state === 'none' ? 'display' : state;
        i++;
      } else {
        state = state === 'inline' ? 'none' : state === 'none' ? 'inline' : state;
      }
    }
    return state;
  }

  function stripComments(src) {
    return stripCommentsWithMap(src).text;
  }

  /* Comments are removed for rendering, but the preview's on-sheet editor
     needs to know where every rendered character came from. The map holds the
     original index of each kept character (plus a final entry for the end). */
  function stripCommentsWithMap(src) {
    const s = String(src);
    const chars = [];
    const map = [];
    let i = 0;
    while (i < s.length) {
      if (s[i] === '%' && (i === 0 || s[i - 1] !== '\\')) {
        while (i < s.length && s[i] !== '\n') i++;
        continue;
      }
      map.push(i);
      chars.push(s[i]);
      i++;
    }
    map.push(s.length);
    return { text: chars.join(''), map };
  }

  function grabArg(src, name) {
    const re = new RegExp('\\\\' + name + '\\*?(?![A-Za-z])');
    const m = re.exec(src);
    if (!m) return null;
    let i = m.index + m[0].length;
    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] === '[') {
      const closeBracket = matchBracket(src, i);
      if (closeBracket > 0) {
        i = closeBracket + 1;
        while (i < src.length && /\s/.test(src[i])) i++;
      }
    }
    if (src[i] !== '{') return null;
    const close = matchBrace(src, i);
    if (close < 0) return null;
    return src.slice(i + 1, close);
  }

  function removeArgCommand(src, name) {
    const re = new RegExp('\\\\' + name + '\\*?(?![A-Za-z])');
    const m = re.exec(src);
    if (!m) return src;
    let i = m.index + m[0].length;
    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] === '[') {
      const b = matchBracket(src, i);
      if (b > 0) {
        i = b + 1;
        while (i < src.length && /\s/.test(src[i])) i++;
      }
    }
    if (src[i] === '{') {
      const close = matchBrace(src, i);
      if (close > 0) return src.slice(0, m.index) + src.slice(close + 1);
    }
    return src;
  }

  function findEnvEnd(text, from, env) {
    const re = /\\(begin|end)\s*\{([A-Za-z*]+)\}/g;
    re.lastIndex = from;
    let depth = 1;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m[1] === 'begin') {
        depth++;
      } else {
        depth--;
        if (depth === 0) return m[2] === env ? { start: m.index, end: m.index + m[0].length } : null;
        if (depth < 0) return null;
      }
    }
    return null;
  }

  function processCommands(text, map) {
    let out = '';
    let i = 0;
    while (i < text.length) {
      if (text[i] !== '\\') {
        out += text[i];
        i++;
        continue;
      }
      const m = /^\\([A-Za-z]+)\*?/.exec(text.slice(i, i + 40));
      if (!m) {
        out += text[i];
        i++;
        continue;
      }
      const handler = map[m[1]];
      let k = i + m[0].length;
      while (k < text.length && (text[k] === ' ' || text[k] === '\t')) k++;
      if (handler) {
        if (text[k] === '{') {
          const close = matchBrace(text, k);
          if (close > 0) {
            out += handler(text.slice(k + 1, close));
            i = close + 1;
            continue;
          }
        }
        if (text[k] === '[') {
          const closeBracket = matchBracket(text, k);
          if (closeBracket > 0 && text[closeBracket + 1] === '{') {
            const close = matchBrace(text, closeBracket + 1);
            if (close > 0) {
              out += handler(text.slice(closeBracket + 2, close));
              i = close + 1;
              continue;
            }
          }
        }
      }
      out += text[i];
      i++;
    }
    return out;
  }

  /* ------------------------------------------------------------------ *
   *  LaTeX renderer
   * ------------------------------------------------------------------ */
  const MATH_ENVS = new Set([
    'equation', 'equation*', 'displaymath', 'math', 'multline', 'multline*',
    'align', 'align*', 'alignat', 'alignat*', 'flalign', 'flalign*',
    'eqnarray', 'eqnarray*', 'gather', 'gather*', 'split', 'aligned', 'gathered',
    'cases', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix', 'matrix', 'smallmatrix'
  ]);

  const THEOREM_ENVS = {
    theorem: 'Theorem',
    lemma: 'Lemma',
    proposition: 'Proposition',
    corollary: 'Corollary',
    definition: 'Definition',
    example: 'Example',
    remark: 'Remark',
    proof: 'Proof'
  };

  /* Theorem-like environments are numbered per kind, unless \newtheorem shares
     a counter or asks for numbering within sections. Proof stays unnumbered. */
  function collectTheoremDefs(src) {
    const defs = {};
    Object.keys(THEOREM_ENVS).forEach((env) => {
      defs[env] = { name: THEOREM_ENVS[env], counter: env, within: '', numbered: env !== 'proof' };
    });
    const text = maskMacroDefs(src);
    const re = /\\newtheorem\*?\s*\{([A-Za-z*]+)\}\s*(?:\[([^\]]*)\])?\s*\{([^{}]*)\}\s*(?:\[([^\]]*)\])?/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      defs[m[1]] = {
        name: m[3].trim() || m[1],
        counter: (m[2] || m[1]).trim(),
        within: (m[4] || '').trim(),
        numbered: true
      };
    }
    return defs;
  }


  const BLOCK_RE = /\\begin\s*\{([A-Za-z*]+)\}|\\(maketitle|tableofcontents|newpage|clearpage|pagebreak|hrule|hrulefill)\b|\\(chapter|section|subsection|subsubsection|paragraph|subparagraph)(\*?)\s*(?:\[[^\]]*\]\s*)?\{/g;

  function makeCtx(meta) {
    return {
      meta: meta || {},
      errors: [],
      warnings: [],
      headings: [],
      references: null,
      theorems: null,
      theoremCounters: {},
      counters: {
        chapter: 0,
        section: 0,
        subsection: 0,
        subsubsection: 0,
        equation: 0,
        table: 0,
        figure: 0
      }
    };
  }

  function readMeta(preamble) {
    const date = grabArg(preamble, 'date');
    return {
      title: grabArg(preamble, 'title') || '',
      author: grabArg(preamble, 'author') || '',
      date
    };
  }

  function dateLine(meta) {
    if (meta.date === null || meta.date === undefined) return fmtLongDate();
    const raw = String(meta.date).trim();
    if (!raw) return '';
    return raw.replace(/\\today\b/g, fmtLongDate());
  }

  function titleBlock(meta, ctx) {
    const title = meta.title ? renderInline(meta.title, ctx) : 'Untitled Document';
    const author = meta.author ? renderInline(meta.author, ctx) : '';
    const date = dateLine(meta);
    return (
      '<div class="doc-titleblock">' +
      '<div class="doc-title">' + title + '</div>' +
      (author ? '<div class="doc-author">' + author + '</div>' : '') +
      (date ? '<div class="doc-date">' + renderInline(date, ctx) + '</div>' : '') +
      '</div>'
    );
  }

  /* ------------------------------------------------------------------ *
   *  physics-package conveniences: optional arguments and delimiters
   * ------------------------------------------------------------------ */
  const PHYSICS_SIZE = /\\(?:bigg|Bigg|big|Big)[lr]?/;
  const SIZED_COMMANDS = [
    { name: '\\abs', left: '\\left|', right: '\\right|' },
    { name: '\\norm', left: '\\left\\lVert', right: '\\right\\rVert' },
    { name: '\\pqty', left: '\\left(', right: '\\right)' },
    { name: '\\bqty', left: '\\left[', right: '\\right]' },
    { name: '\\vqty', left: '\\left|', right: '\\right|' },
    { name: '\\Bqty', left: '\\left\\{', right: '\\right\\}' }
  ];

  function skipTexSpace(tex, index) {
    let i = index;
    while (i < tex.length && /\s/.test(tex[i])) i += 1;
    return i;
  }

  function readTexGroup(tex, start) {
    if (tex[start] !== '{') return null;
    let depth = 0;
    for (let i = start; i < tex.length; i += 1) {
      const ch = tex[i];
      if (ch === '\\') { i += 1; continue; }
      if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) return { content: tex.slice(start + 1, i), end: i + 1 };
      }
    }
    return null;
  }

  function readTexBracket(tex, start) {
    if (tex[start] !== '[') return null;
    let depth = 0;
    for (let i = start; i < tex.length; i += 1) {
      const ch = tex[i];
      if (ch === '\\') { i += 1; continue; }
      if (ch === '{') {
        const group = readTexGroup(tex, i);
        if (!group) return null;
        i = group.end - 1;
        continue;
      }
      if (ch === '[') depth += 1;
      else if (ch === ']') {
        depth -= 1;
        if (depth === 0) return { content: tex.slice(start + 1, i), end: i + 1 };
      }
    }
    return null;
  }

  function findQtyClose(tex, start, open, close) {
    let depth = 0;
    let braces = 0;
    for (let i = start; i < tex.length; i += 1) {
      const ch = tex[i];
      if (ch === '\\') {
        const pair = tex.slice(i, i + 2);
        if (braces === 0 && depth === 0 && open !== close && pair === close) {
          return { contentEnd: i, end: i + 2 };
        }
        if (braces === 0 && open === close && pair === open && i > start) {
          return { contentEnd: i, end: i + 2 };
        }
        i += 1;
        continue;
      }
      if (ch === '{') { braces += 1; continue; }
      if (ch === '}') { braces -= 1; continue; }
      if (braces > 0) continue;
      if (open === close) {
        if (ch === open) {
          if (depth === 0) return { contentEnd: i, end: i + 1 };
          depth += 1;
        }
        continue;
      }
      if (ch === open) { depth += 1; continue; }
      if (ch === close) {
        if (depth === 0) return { contentEnd: i, end: i + 1 };
        depth -= 1;
      }
    }
    return null;
  }

  function splitBraket(content) {
    const parts = [];
    let current = '';
    let braces = 0;
    for (let i = 0; i < content.length; i += 1) {
      const ch = content[i];
      if (ch === '\\') {
        current += ch + (content[i + 1] || '');
        i += 1;
        continue;
      }
      if (ch === '{') braces += 1;
      if (ch === '}') braces -= 1;
      if (ch === '|' && braces === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }
    parts.push(current.trim());
    return parts.map(expandPhysicsMacros);
  }

  function readDerivative(tex, index, kind) {
    const name = kind === 'partial' ? '\\pdv' : kind === 'delta' ? '\\fdv' : '\\dv';
    const symbol = kind === 'partial' ? '\\partial' : kind === 'delta' ? '\\delta' : 'd';
    let i = skipTexSpace(tex, index + name.length);
    let order = '';
    if (tex[i] === '[') {
      const opt = readTexBracket(tex, i);
      if (!opt) return null;
      order = opt.content.trim();
      i = skipTexSpace(tex, opt.end);
    }
    const top = readTexGroup(tex, i);
    if (!top) return null;
    i = skipTexSpace(tex, top.end);
    const bottom = readTexGroup(tex, i);
    if (!bottom) return null;
    i = skipTexSpace(tex, bottom.end);
    const sup = order ? '^{' + order + '}' : '';
    const fn = expandPhysicsMacros(top.content);
    const variable = expandPhysicsMacros(bottom.content);
    if (kind === 'partial' && tex[i] === '{') {
      const second = readTexGroup(tex, i);
      if (second) {
        return {
          html: '\\frac{\\partial^{2} ' + fn + '}{\\partial ' + variable +
            ' \\partial ' + expandPhysicsMacros(second.content) + '}',
          end: second.end
        };
      }
    }
    const numerator = symbol + sup + ' ' + fn;
    const denominator = symbol === 'd'
      ? 'd' + variable + sup
      : symbol + ' ' + variable + sup;
    return { html: '\\frac{' + numerator + '}{' + denominator + '}', end: i };
  }

  function readQty(tex, index) {
    let i = skipTexSpace(tex, index + 4);
    const size = PHYSICS_SIZE.exec(tex.slice(i));
    if (size && size.index === 0) i = skipTexSpace(tex, i + size[0].length);
    const open = tex[i];
    if (open === '{') {
      const group = readTexGroup(tex, i);
      if (!group) return null;
      return {
        html: '\\left\\{' + expandPhysicsMacros(group.content) + '\\right\\}',
        end: group.end
      };
    }
    let openTex = '';
    let closeTex = '';
    let openChar = '';
    let closeChar = '';
    let contentStart = i;
    if (open === '(' || open === '[') {
      openChar = open;
      closeChar = open === '(' ? ')' : ']';
      openTex = open;
      closeTex = closeChar;
      contentStart = i + 1;
    } else if (tex.slice(i, i + 2) === '\\{') {
      openChar = '\\{';
      closeChar = '\\}';
      openTex = '\\{';
      closeTex = '\\}';
      contentStart = i + 2;
    } else if (tex.slice(i, i + 2) === '\\|') {
      openChar = '\\|';
      closeChar = '\\|';
      openTex = '\\|';
      closeTex = '\\|';
      contentStart = i + 2;
    } else if (open === '|') {
      openChar = '|';
      closeChar = '|';
      openTex = '|';
      closeTex = '|';
      contentStart = i + 1;
    } else {
      return null;
    }
    const found = findQtyClose(tex, contentStart, openChar, closeChar);
    if (!found) return null;
    let content = tex.slice(contentStart, found.contentEnd);
    content = content.replace(/\\(?:bigg|Bigg|big|Big)[lr]?\s*$/, '');
    return {
      html: '\\left' + openTex + ' ' + expandPhysicsMacros(content) + ' \\right' + closeTex,
      end: found.end
    };
  }

  function sequenceHtml(input, complement, rna) {
    let value = String(input || '').replace(/[^A-Za-z\s]/g, '').toUpperCase();
    value = rna ? value.replace(/T/g, 'U') : value.replace(/U/g, 'T');
    if (complement) {
      const pairs = rna ? { A: 'U', U: 'A', C: 'G', G: 'C' } : { A: 'T', T: 'A', C: 'G', G: 'C' };
      value = value.split('').map((ch) => pairs[ch] || ch).join('');
    }
    const left = complement ? '3' : '5';
    const right = complement ? '5' : '3';
    return '<span class="doc-dna"><span class="doc-dna-end">' + left + '′</span>' +
      '<code class="mono">' + escapeHtml(value) + '</code>' +
      '<span class="doc-dna-end">' + right + '′</span></span>';
  }

  function readSequence(tex, index, kind) {
    const start = skipTexSpace(tex, index + kind.length + 1);
    const group = readTexGroup(tex, start);
    if (!group) return null;
    const complement = kind === 'dnac' || kind === 'rnac';
    const rna = kind === 'rna' || kind === 'rnac';
    let value = group.content.replace(/[^A-Za-z\s]/g, '').toUpperCase();
    value = rna ? value.replace(/T/g, 'U') : value.replace(/U/g, 'T');
    if (!value.trim()) return null;
    if (complement) {
      const pairs = rna ? { A: 'U', U: 'A', C: 'G', G: 'C' } : { A: 'T', T: 'A', C: 'G', G: 'C' };
      value = value.split('').map((ch) => pairs[ch] || ch).join('');
    }
    const left = complement ? '3' : '5';
    const right = complement ? '5' : '3';
    return {
      html: '\\text{' + left + '}^{\\prime}\\text{-}\\texttt{' + value +
        '}\\text{-}\\text{' + right + '}^{\\prime}',
      end: group.end
    };
  }

  function formatChemical(input) {
    const text = String(input || '');
    let out = '';
    let i = 0;
    let lastAtom = false;
    while (i < text.length) {
      const ch = text[i];
      const rest = text.slice(i);
      const arrows = [
        ['<=>', '\\rightleftharpoons'],
        ['<->', '\\leftrightarrow'],
        ['->>', '\\longrightarrow'],
        ['->', '\\longrightarrow'],
        ['<-', '\\longleftarrow']
      ];
      const arrow = arrows.find(([token]) => rest.startsWith(token));
      if (arrow) {
        i += arrow[0].length;
        const after = skipTexSpace(text, i);
        if (text[after] === '[') {
          const bracket = readTexBracket(text, after);
          if (bracket) {
            out += '\\overset{\\text{' + bracket.content + '}}{' + arrow[1] + '} ';
            i = bracket.end;
            lastAtom = false;
            continue;
          }
        }
        out += arrow[1] + ' ';
        lastAtom = false;
        continue;
      }
      if (ch === '^') {
        i += 1;
        let charge = '';
        const group = readTexGroup(text, i);
        if (group) {
          charge = group.content;
          i = group.end;
        } else {
          while (/[0-9]/.test(text[i] || '')) { charge += text[i]; i += 1; }
          if (text[i] === '+' || text[i] === '-') { charge += text[i]; i += 1; }
        }
        out += '^{' + charge + '}';
        lastAtom = false;
        continue;
      }
      if (ch === '_') {
        i += 1;
        const group = readTexGroup(text, i);
        if (group) {
          out += '_{' + group.content + '}';
          i = group.end;
        } else {
          let sub = '';
          while (/[0-9A-Za-z]/.test(text[i] || '')) { sub += text[i]; i += 1; }
          out += '_{' + sub + '}';
        }
        lastAtom = false;
        continue;
      }
      if (/[0-9]/.test(ch)) {
        let digits = '';
        while (/[0-9]/.test(text[i] || '')) { digits += text[i]; i += 1; }
        out += lastAtom ? '_{' + digits + '}' : digits;
        continue;
      }
      if (/[A-Z]/.test(ch)) {
        let symbol = ch;
        if (/[a-z]/.test(text[i + 1] || '')) {
          symbol += text[i + 1];
          i += 1;
        }
        out += '\\mathrm{' + symbol + '}';
        i += 1;
        lastAtom = true;
        continue;
      }
      if (/[a-z]/.test(ch)) {
        let word = ch;
        while (/[a-z]/.test(text[i + 1] || '')) {
          word += text[i + 1];
          i += 1;
        }
        out += '\\mathrm{' + word + '}';
        i += 1;
        lastAtom = true;
        continue;
      }
      if (ch === '(') {
        let depth = 0;
        let end = -1;
        for (let k = i; k < text.length; k += 1) {
          if (text[k] === '\\') { k += 1; continue; }
          if (text[k] === '(') depth += 1;
          else if (text[k] === ')') {
            depth -= 1;
            if (depth === 0) { end = k; break; }
          }
        }
        if (end === -1) { out += '('; i += 1; continue; }
        const inner = text.slice(i + 1, end);
        out += /^[a-z]+$/.test(inner) ? '\\text{(' + inner + ')}' : '(' + formatChemical(inner) + ')';
        i = end + 1;
        lastAtom = true;
        continue;
      }
      if (ch === '[' || ch === ']') {
        out += ch;
        i += 1;
        lastAtom = ch === ']';
        continue;
      }
      if (ch === '+') {
        const before = text[i - 1] || '';
        const after = text[i + 1] || '';
        const isCharge = before && !/\s/.test(before) && (after === '' || /\s/.test(after));
        out += isCharge ? '^{+}' : ' + ';
        i += 1;
        lastAtom = false;
        continue;
      }
      if (ch === '-') {
        const before = text[i - 1] || '';
        const after = text[i + 1] || '';
        const isCharge = before && !/\s/.test(before) && (after === '' || /\s/.test(after));
        out += isCharge ? '^{-}' : '-';
        i += 1;
        lastAtom = false;
        continue;
      }
      if (ch === '=') { out += '='; i += 1; lastAtom = false; continue; }
      if (ch === '#') { out += '\\equiv '; i += 1; lastAtom = false; continue; }
      if (ch === '.') { out += '\\cdot '; i += 1; lastAtom = false; continue; }
      if (ch === ',') { out += ', '; i += 1; lastAtom = false; continue; }
      if (ch === ' ') { out += ' '; i += 1; lastAtom = false; continue; }
      if (ch === '{') {
        const group = readTexGroup(text, i);
        if (group) {
          out += '\\text{' + group.content + '}';
          i = group.end;
          lastAtom = false;
          continue;
        }
      }
      out += ch === '%' ? '\\%' : ch;
      i += 1;
      lastAtom = false;
    }
    return out.trim();
  }

  function readMatrixQuantity(tex, index) {
    const open = tex[skipTexSpace(tex, index + 5)];
    let i = skipTexSpace(tex, index + 5);
    if (open === '{') {
      const group = readTexGroup(tex, i);
      if (!group) return null;
      return {
        html: '\\begin{matrix}' + expandPhysicsMacros(group.content) + '\\end{matrix}',
        end: group.end
      };
    }
    let openChar = '';
    let closeChar = '';
    let openTex = '';
    let closeTex = '';
    let contentStart = i;
    if (open === '(' || open === '[') {
      openChar = open;
      closeChar = open === '(' ? ')' : ']';
      openTex = open;
      closeTex = closeChar;
      contentStart = i + 1;
    } else if (tex.slice(i, i + 2) === '\\{') {
      openChar = '\\{';
      closeChar = '\\}';
      openTex = '\\{';
      closeTex = '\\}';
      contentStart = i + 2;
    } else if (tex.slice(i, i + 2) === '\\|') {
      openChar = '\\|';
      closeChar = '\\|';
      openTex = '\\|';
      closeTex = '\\|';
      contentStart = i + 2;
    } else if (open === '|') {
      openChar = '|';
      closeChar = '|';
      openTex = '|';
      closeTex = '|';
      contentStart = i + 1;
    } else {
      return null;
    }
    const found = findQtyClose(tex, contentStart, openChar, closeChar);
    if (!found) return null;
    const content = tex.slice(contentStart, found.contentEnd);
    return {
      html: '\\left' + openTex + ' \\begin{matrix}' + expandPhysicsMacros(content) +
        '\\end{matrix} \\right' + closeTex,
      end: found.end
    };
  }

  function expandPhysicsMacros(input) {
    const tex = String(input || '');
    if (tex.indexOf('\\') === -1) return tex;
    let out = '';
    let i = 0;
    while (i < tex.length) {
      if (tex[i] !== '\\') {
        out += tex[i];
        i += 1;
        continue;
      }
      if (tex.startsWith('\\dv', i) && !/[A-Za-z]/.test(tex[i + 3] || '')) {
        const parsed = readDerivative(tex, i, 'd');
        if (parsed) { out += parsed.html; i = parsed.end; continue; }
      }
      if (tex.startsWith('\\pdv', i) && !/[A-Za-z]/.test(tex[i + 4] || '')) {
        const parsed = readDerivative(tex, i, 'partial');
        if (parsed) { out += parsed.html; i = parsed.end; continue; }
      }
      if (tex.startsWith('\\fdv', i) && !/[A-Za-z]/.test(tex[i + 4] || '')) {
        const parsed = readDerivative(tex, i, 'delta');
        if (parsed) { out += parsed.html; i = parsed.end; continue; }
      }
      const sized = SIZED_COMMANDS.find((entry) => tex.startsWith(entry.name + '[', i));
      if (sized) {
        const opt = readTexBracket(tex, i + sized.name.length);
        if (opt) {
          const start = skipTexSpace(tex, opt.end);
          const group = readTexGroup(tex, start);
          if (group) {
            out += sized.left + ' ' + expandPhysicsMacros(group.content) + ' ' + sized.right;
            i = group.end;
            continue;
          }
        }
      }
      if (tex.startsWith('\\qty', i) && !/[A-Za-z]/.test(tex[i + 4] || '')) {
        const parsed = readQty(tex, i);
        if (parsed) { out += parsed.html; i = parsed.end; continue; }
      }
      if (tex.startsWith('\\mqty', i) && !/[A-Za-z]/.test(tex[i + 5] || '')) {
        const parsed = readMatrixQuantity(tex, i);
        if (parsed) { out += parsed.html; i = parsed.end; continue; }
      }
      if (tex.startsWith('\\ce', i) && !/[A-Za-z]/.test(tex[i + 3] || '')) {
        const start = skipTexSpace(tex, i + 3);
        const group = readTexGroup(tex, start);
        if (group) {
          out += formatChemical(group.content);
          i = group.end;
          continue;
        }
      }
      const seqKind = ['dnac', 'rnac', 'dna', 'rna'].find((name) =>
        tex.startsWith('\\' + name, i) && !/[A-Za-z]/.test(tex[i + name.length + 1] || '')
      );
      if (seqKind) {
        const parsed = readSequence(tex, i, seqKind);
        if (parsed) { out += parsed.html; i = parsed.end; continue; }
      }
      if (tex.startsWith('\\braket', i) && !/[A-Za-z]/.test(tex[i + 7] || '')) {
        const start = skipTexSpace(tex, i + 7);
        const group = readTexGroup(tex, start);
        if (group && tex[skipTexSpace(tex, group.end)] !== '{') {
          out += '\\left\\langle ' + splitBraket(group.content).join(' \\middle| ') +
            ' \\right\\rangle';
          i = group.end;
          continue;
        }
      }
      if ((tex.startsWith('\\vb*', i) || tex.startsWith('\\va*', i)) &&
        !/[A-Za-z]/.test(tex[i + 4] || '')) {
        const start = skipTexSpace(tex, i + 4);
        const group = readTexGroup(tex, start);
        if (group) {
          out += '\\boldsymbol{' + expandPhysicsMacros(group.content) + '}';
          i = group.end;
          continue;
        }
      }
      out += tex[i];
      i += 1;
    }
    return out;
  }

  function renderMath(expr, display, ctx) {
    let source = String(expr)
      .replace(/\\label\s*\{[^}]*\}/g, '')
      .replace(/\\(nonumber|notag)\b/g, '');
    if (ctx && ctx.macroMap && ctx.macroMap.size) {
      source = expandTextMacros(source, ctx.macroMap, 0, false);
    }
    const clean = expandPhysicsMacros(source).trim();
    if (!clean) return '';
    if (!window.katex) {
      return '<code class="math-fallback">' + escapeHtml(clean) + '</code>';
    }
    try {
      const html = window.katex.renderToString(clean, Object.assign({}, KATEX_BASE, {
        displayMode: Boolean(display),
        macros: Object.assign({}, MACROS, (ctx && ctx.macros) || {})
      }));
      if (ctx && (html.indexOf('katex-error') >= 0 || html.indexOf('mathcolor="#DC2626"') >= 0) &&
        ctx.warnings.length < 4) {
        ctx.warnings.push('LaTeX could not fully parse “' + shorten(clean, 60) + '”.');
      }
      return html;
    } catch (err) {
      if (ctx) ctx.errors.push('Math error: ' + (err && err.message ? err.message : String(err)));
      return '<code class="math-fallback">' + escapeHtml(clean) + '</code>';
    }
  }

  function renderInline(raw, ctx) {
    if (raw == null) return '';
    /* Expand macros before math is split out, so a math-only macro used in
       prose can become an inline math segment. */
    const text = ctx && ctx.macroMap && ctx.macroMap.size
      ? expandTextMacros(String(raw), ctx.macroMap, 0)
      : String(raw);
    let out = '';
    let last = 0;
    let m;
    const mathRe = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$([^$\n]+?)\$/g;
    while ((m = mathRe.exec(text)) !== null) {
      out += renderText(text.slice(last, m.index), ctx);
      let expr;
      let display;
      if (m[1] !== undefined) { expr = m[1]; display = true; }
      else if (m[2] !== undefined) { expr = m[2]; display = true; }
      else if (m[3] !== undefined) { expr = m[3]; display = false; }
      else { expr = m[4]; display = false; }
      out += renderMath(expr, display, ctx);
      last = m.index + m[0].length;
    }
    out += renderText(text.slice(last), ctx);
    return out;
  }

  /* Document macros can also be used outside math: \newcommand{\proj}{Projection}
     then “the \proj operator”. KaTeX receives the same definitions for math, so
     this only covers prose. Arguments are substituted left to right, and the
     depth cap stops a macro that expands to itself. */
  function expandTextMacros(text, defs, depth, wrapMath) {
    const wrap = wrapMath !== false;
    if (!defs || !defs.size || depth > 6) return text;
    let out = '';
    let i = 0;
    let inMath = false;
    while (i < text.length) {
      if (text[i] === '$') {
        if (text[i + 1] === '$') { inMath = !inMath; out += '$$'; i += 2; continue; }
        inMath = !inMath;
        out += text[i];
        i += 1;
        continue;
      }
      if (text[i] !== '\\') { out += text[i]; i += 1; continue; }
      const m = /^\\([A-Za-z]+)\*?/.exec(text.slice(i, i + 40));
      if (!m) {
        const next = text[i + 1];
        if (next === '[' || next === '(') inMath = true;
        else if (next === ']' || next === ')') inMath = false;
        out += text[i];
        if (next && '$%&#_{}'.indexOf(next) >= 0) { out += next; i += 2; } else { i += 1; }
        continue;
      }
      const def = defs.get(m[1]);
      if (!def) { out += text[i]; i += 1; continue; }
      let k = i + m[0].length;
      const args = [];
      let ok = true;
      if (def.opt !== null && def.opt !== undefined) {
        k = skipTexSpace(text, k);
        let optional;
        if (text[k] === '[') {
          const bracket = readTexBracket(text, k);
          if (bracket) { optional = bracket.content; k = bracket.end; }
        } else if (text[k] === '{') {
          /* Accept braces for an optional argument too: \\norm{y}. */
          const group = readTexGroup(text, k);
          if (group) { optional = group.content; k = group.end; }
        }
        args.push(optional === undefined ? def.opt : optional);
      }
      for (let a = args.length; a < def.args; a += 1) {
        k = skipTexSpace(text, k);
        if (text[k] === '{') {
          const group = readTexGroup(text, k);
          if (!group) { ok = false; break; }
          args.push(group.content);
          k = group.end;
        } else if (text[k] === '[') {
          const opt = readTexBracket(text, k);
          if (!opt) { ok = false; break; }
          args.push(opt.content);
          k = opt.end;
        } else if (k < text.length) {
          args.push(text[k]);
          k += 1;
        } else { ok = false; break; }
      }
      if (!ok) { out += text[i]; i += 1; continue; }
      let body = def.body;
      if (def.args) {
        body = body.replace(/#([1-9])/g, (token, n) => {
          const value = args[Number(n) - 1];
          return value === undefined ? '' : value;
        });
      }
      let expanded = expandTextMacros(body, defs, depth + 1);
      if (def.math && wrap && !inMath && !/^\s*\$/.test(expanded)) expanded = '$' + expanded + '$';
      out += expanded;
      i = k;
    }
    return out;
  }

  function renderText(raw, ctx) {
    const slots = [];
    const hold = (html) => {
      slots.push(html);
      return '\u0002' + (slots.length - 1) + '\u0002';
    };
    const inline = (arg) => renderInline(arg, ctx);

    const map = {
      textbf: (a) => hold('<strong>' + inline(a) + '</strong>'),
      textit: (a) => hold('<em>' + inline(a) + '</em>'),
      emph: (a) => hold('<em>' + inline(a) + '</em>'),
      textsl: (a) => hold('<em>' + inline(a) + '</em>'),
      textsc: (a) => hold('<span class="doc-smallcaps">' + inline(a) + '</span>'),
      texttt: (a) => hold('<code class="doc-code">' + escapeHtml(a) + '</code>'),
      textrm: (a) => hold(inline(a)),
      textsf: (a) => hold(inline(a)),
      textnormal: (a) => hold(inline(a)),
      text: (a) => hold(inline(a)),
      mbox: (a) => hold(inline(a)),
      underline: (a) => hold('<span class="doc-underline">' + inline(a) + '</span>'),
      footnote: (a) => hold('<sup class="doc-footnote">' + inline(a) + '</sup>'),
      cite: (a) => hold(citationLabel(a, ctx, 'bracket').html),
      citep: (a) => hold(citationLabel(a, ctx, 'paren').html),
      citet: (a) => hold(citationLabel(a, ctx, 'text').html),
      dna: (a) => hold(sequenceHtml(a, false, false)),
      rna: (a) => hold(sequenceHtml(a, false, true)),
      dnac: (a) => hold(sequenceHtml(a, true, false)),
      rnac: (a) => hold(sequenceHtml(a, true, true)),
      ref: (a) => {
        const entry = ctx && ctx.references && ctx.references.labelMap.get(a);
        const text = entry && entry.number ? entry.number : '??';
        return hold('<span class="doc-ref' + (entry ? '' : ' is-missing') + '" title="' +
          escapeHtml(entry ? entry.name : 'Missing label: ' + a) + '">' + escapeHtml(text) + '</span>');
      },
      eqref: (a) => {
        const entry = ctx && ctx.references && ctx.references.labelMap.get(a);
        const text = entry && entry.number ? entry.number : '??';
        return hold('<span class="doc-ref' + (entry ? '' : ' is-missing') + '">(' + escapeHtml(text) + ')</span>');
      },
      autoref: (a) => {
        const entry = ctx && ctx.references && ctx.references.labelMap.get(a);
        const kind = entry && entry.kind === 'figure' ? 'Figure ' :
          entry && entry.kind === 'table' ? 'Table ' :
          entry && entry.kind === 'theorem' ? ((entry.kindLabel || 'Theorem') + ' ') :
          entry && entry.kind === 'section' ? 'Section ' : 'Equation ';
        return hold('<span class="doc-ref' + (entry ? '' : ' is-missing') + '">' +
          escapeHtml(entry ? kind + entry.number : '??') + '</span>');
      },
      pageref: (a) => {
        const entry = ctx && ctx.references && ctx.references.labelMap.get(a);
        return hold('<span class="doc-ref' + (entry ? '' : ' is-missing') + '">p. ' +
          escapeHtml(entry && entry.number ? entry.number : '??') + '</span>');
      },
      label: () => hold(''),
      index: () => hold(''),
      /* Bibliography markers never print as text. Inside a thebibliography
         block they are consumed by its renderer; a stray one would otherwise
         land in the preview as raw LaTeX (the diagnostics flag it). */
      bibitem: () => hold('')
    };

    let text = processCommands(String(raw), map);

    text = text.replace(/\\href\{([^{}]*)\}\{([^{}]*)\}/g, (match, url, label) =>
      hold('<a class="doc-link" href="' + escapeHtml(safeHref(url)) +
        '" target="_blank" rel="noopener">' + inline(label) + '</a>')
    );
    text = text.replace(/\\url\{([^{}]*)\}/g, (match, url) =>
      hold('<a class="doc-link mono" href="' + escapeHtml(safeHref(url)) +
        '" target="_blank" rel="noopener">' + escapeHtml(url) + '</a>')
    );
    text = text.replace(/\\male(?![A-Za-z])/g, () => hold('♂'));
    text = text.replace(/\\female(?![A-Za-z])/g, () => hold('♀'));

    text = text.replace(
      /\\(noindent|centering|raggedright|raggedleft|hfill|vfill|bigskip|medskip|smallskip|newpage|clearpage|pagebreak|linebreak|nopagebreak|break|small|footnotesize|scriptsize|normalsize|large|Large|LARGE|huge|Huge|bfseries|itshape|slshape|scshape|mdseries|upshape|rmfamily|sffamily|ttfamily|protect|relax|newblock)\b/g,
      ''
    );
    text = text.replace(
      /\\(vspace|hspace|rule|phantom|hphantom|vphantom|setlength|addtolength)\*?\s*(\[[^\]]*\])?\s*\{[^}]*\}(\s*\{[^}]*\})?/g,
      ''
    );
    text = text.replace(/\\(qed|blacksquare)\b/g, () => hold('<span class="doc-qed">&#8718;</span>'));
    text = text.replace(/\\(ldots|dots|cdots)\b/g, () => hold('…'));
    text = text.replace(/\\[ \t]*\n/g, ' ');
    text = text.replace(/\\\\\s*(\[[^\]]*\])?/g, () => hold('<br />'));
    text = text.replace(/\\newline(?![A-Za-z])/g, () => hold('<br />'));
    text = text.replace(/\\par(?![A-Za-z])/g, () => hold('</p><p>'));
    text = text.replace(/\\[&%$#_{}]/g, (token) => hold(escapeHtml(token[1])));
    text = text.replace(/[ \t]*\n[ \t]*/g, ' ');
    text = text.replace(/[ \t]{2,}/g, ' ');
    text = text.replace(/---/g, '\u2014').replace(/--/g, '\u2013');
    text = text.replace(/``/g, '\u201C').replace(/''/g, '\u201D');
    text = text.replace(/~/g, '\u00A0');

    /* chemistry written outside math mode, e.g. "water is \ce{H2O}" */
    let withChem = '';
    let chemAt = 0;
    while (chemAt < text.length) {
      const pos = text.indexOf('\\ce', chemAt);
      if (pos === -1) {
        withChem += text.slice(chemAt);
        break;
      }
      withChem += text.slice(chemAt, pos);
      if (/[A-Za-z]/.test(text[pos + 3] || '')) {
        withChem += '\\ce';
        chemAt = pos + 3;
        continue;
      }
      const start = skipTexSpace(text, pos + 3);
      const group = readTexGroup(text, start);
      if (!group) {
        withChem += '\\ce';
        chemAt = pos + 3;
        continue;
      }
      withChem += hold(renderMath('\\ce{' + group.content + '}', false, ctx));
      chemAt = group.end;
    }
    text = withChem;
    text = escapeHtml(text);
    text = text.replace(/\u0002(\d+)\u0002/g, (token, idx) =>
      slots[Number(idx)] !== undefined ? slots[Number(idx)] : ''
    );
    return text;
  }

  function renderProse(text, ctx, offset) {
    if (!text || !text.trim()) return '';
    const src = String(text);
    const base = Number.isFinite(offset) ? offset : null;
    const chunks = [];
    const gap = /\n[ \t]*\n/g;
    let cursor = 0;
    let m;
    while ((m = gap.exec(src)) !== null) {
      chunks.push([cursor, m.index]);
      cursor = m.index + m[0].length;
    }
    chunks.push([cursor, src.length]);

    let out = '';
    chunks.forEach(([from, to]) => {
      const raw = src.slice(from, to);
      const body = raw.trim();
      if (!body) return;
      const html = renderInline(body, ctx);
      if (!html) return;
      /* data-src is the block's range in the rendered source, so the preview
         can write an edit made on the sheet back to the editor. A \\par
         splits the paragraph visually, so that case stays read-only. */
      const lead = raw.length - raw.replace(/^\s+/, '').length;
      const trail = raw.length - raw.replace(/\s+$/, '').length;
      const attr = base !== null && body.indexOf('\\par') === -1
        ? ' data-src="' + (base + from + lead) + ':' + (base + from + raw.length - trail) + '" tabindex="0" aria-keyshortcuts="Enter"'
        : '';
      out += '<p' + attr + '>' + html + '</p>';
    });
    return out;
  }

  function renderHeading(cmd, arg, ctx, numbered, srcStart) {
    const text = renderInline(arg, ctx).trim();
    const c = ctx.counters;
    let level = 2;
    let number = '';

    if (cmd === 'chapter') {
      c.chapter += 1;
      c.section = 0;
      c.subsection = 0;
      c.subsubsection = 0;
      number = String(c.chapter);
      level = 2;
    } else if (cmd === 'section') {
      c.section += 1;
      c.subsection = 0;
      c.subsubsection = 0;
      number = String(c.section);
      level = 2;
    } else if (cmd === 'subsection') {
      c.subsection += 1;
      c.subsubsection = 0;
      number = (c.chapter ? c.chapter + '.' : '') + c.section + '.' + c.subsection;
      level = 3;
    } else if (cmd === 'subsubsection') {
      c.subsubsection += 1;
      number = (c.chapter ? c.chapter + '.' : '') + c.section + '.' + c.subsection + '.' + c.subsubsection;
      level = 4;
    } else {
      level = 5;
    }

    const id = 'sec-' + ctx.headings.length;
    ctx.headings.push({
      level,
      number: numbered ? number : '',
      text: text.replace(/<[^>]*>/g, ''),
      id
    });

    const srcAttr = Number.isFinite(srcStart) && String(arg).indexOf('\\par') === -1
      ? ' data-src="' + srcStart + ':' + (srcStart + String(arg).length) + '" tabindex="0" aria-keyshortcuts="Enter"'
      : '';

    return (
      '<h' + level + ' class="doc-h doc-h' + level + '" id="' + id + '"' + srcAttr + '>' +
      (numbered && number ? '<span class="doc-h-num">' + number + '</span>' : '') +
      '<span>' + text + '</span>' +
      '</h' + level + '>'
    );
  }

  function renderToc(ctx) {
    if (!ctx.headings.length) return '';
    const items = ctx.headings
      .map(
        (h) =>
          '<li class="toc-' + h.level + '"><a href="#' + h.id + '">' +
          (h.number ? h.number + ' ' : '') + escapeHtml(h.text) + '</a></li>'
      )
      .join('');
    return (
      '<nav class="doc-toc"><div class="doc-toc-title">Contents</div><ol>' +
      items + '</ol></nav>'
    );
  }

  function splitItems(inner) {
    const re = /\\item\b\s*(?:\[([^\]]*)\])?/g;
    const items = [];
    let label = '';
    let started = false;
    let last = 0;
    let m;
    while ((m = re.exec(inner)) !== null) {
      if (started) items.push({ label, body: inner.slice(last, m.index), start: last, end: m.index });
      started = true;
      label = m[1] || '';
      last = m.index + m[0].length;
    }
    if (started) items.push({ label, body: inner.slice(last), start: last, end: inner.length });
    return items;
  }

  function renderList(kind, inner, ctx, offset) {
    const items = splitItems(inner);
    const base = Number.isFinite(offset) ? offset : null;
    const at = (index) => (base === null ? undefined : base + index);
    if (!items.length) return renderBlocks(inner, ctx, at(0));

    if (kind === 'dl') {
      return (
        '<dl>' +
        items
          .map(
            (it) =>
              '<dt>' + renderInline(it.label || 'Item', ctx) + '</dt>' +
              '<dd>' + renderBlocks(it.body, ctx, at(it.start)) + '</dd>'
          )
          .join('') +
        '</dl>'
      );
    }

    return (
      '<' + kind + '>' +
      items
        .map((it) => {
          const head = it.label ? '<strong>' + renderInline(it.label, ctx) + '</strong> ' : '';
          return '<li>' + head + renderBlocks(it.body, ctx, at(it.start)) + '</li>';
        })
        .join('') +
      '</' + kind + '>'
    );
  }

  function renderTabular(inner, ctx) {
    let rest = String(inner);
    let spec = '';
    const specMatch = /^\s*(?:\[[^\]]*\])?\s*\{([^}]*)\}/.exec(rest);
    if (specMatch) {
      spec = specMatch[1];
      rest = rest.slice(specMatch[0].length);
      /* \begin{tabular*}{width}{cols} */
      if (!/[lcr]/.test(spec)) {
        const secondSpec = /^\s*\{([^}]*)\}/.exec(rest);
        if (secondSpec) {
          spec = secondSpec[1];
          rest = rest.slice(secondSpec[0].length);
        }
      }
    }
    rest = rest
      .replace(/\\(hline|toprule|midrule|bottomrule|addlinespace|endhead|endfirsthead)\b/g, '')
      .replace(/\\cline\s*\{[^}]*\}/g, '');

    const aligns = spec.split('').filter((ch) => 'lcr'.indexOf(ch) >= 0);
    const rows = rest
      .split(/\\\\/)
      .map((row) => row.trim())
      .filter(Boolean);

    const body = rows
      .map((row) => {
        const cells = row.split(/(?<!\\)&/);
        const tds = cells
          .map((cell, idx) => {
            const rawCell = cell.trim();
            let align = aligns[idx] === 'l' ? 'ta-l' : aligns[idx] === 'r' ? 'ta-r' : 'ta-c';
            let colspan = 1;
            let content = rawCell;
            const span = /^\\multicolumn\s*\{(\d+)\}\s*\{([^}]*)\}\s*\{([\s\S]*)\}$/.exec(rawCell);
            if (span) {
              colspan = Math.max(1, parseInt(span[1], 10) || 1);
              content = span[3];
              const specAlign = span[2].replace(/[^lcr]/g, '')[0];
              if (specAlign) align = specAlign === 'l' ? 'ta-l' : specAlign === 'r' ? 'ta-r' : 'ta-c';
            }
            content = content.replace(/\\multirow\s*\{[^}]*\}\s*\{[^}]*\}\s*\{([\s\S]*)\}/g, '$1');
            return (
              '<td class="' + align + '"' + (colspan > 1 ? ' colspan="' + colspan + '"' : '') + '>' +
              renderInline(content, ctx) + '</td>'
            );
          })
          .join('');
        return '<tr>' + tds + '</tr>';
      })
      .join('');

    return '<table class="doc-table"><tbody>' + body + '</tbody></table>';
  }

  function renderFloat(kind, inner, ctx) {
    const source = String(inner);
    const graphicMatch = /\\includegraphics\s*(?:\[([^\]]*)\])?\s*\{([^}]*)\}/.exec(source);
    const graphic = graphicMatch ? graphicMatch[2].trim() : '';
    const graphicOptions = graphicMatch ? graphicMatch[1] || '' : '';
    const caption = grabArg(source, 'caption') || '';
    let cleaned = removeArgCommand(source, 'caption');
    if (graphicMatch) cleaned = cleaned.replace(graphicMatch[0], '');
    let body = renderBlocks(cleaned, ctx);

    if (kind === 'table') {
      ctx.counters.table += 1;
      return (
        '<div class="doc-table-wrap" role="group">' + body +
        (caption
          ? '<div class="doc-caption">Table ' + ctx.counters.table + ': ' +
            renderInline(caption, ctx) + '</div>'
          : '') +
        '</div>'
      );
    }

    ctx.counters.figure += 1;
    if (graphic) {
      const url = imageFor(ctx, graphic);
      const style = imageWidthStyle(graphicOptions);
      body = (url
        ? '<div class="doc-figure-media"><img src="' + url + '" alt="' +
          escapeHtml(shorten(graphic, 64)) + '" loading="lazy"' + (style ? ' style="' + style + '"' : '') + ' /></div>'
        : '<div class="doc-figure-box"><span>' + escapeHtml(shorten(graphic, 64)) +
          '</span><span class="doc-figure-note">not attached — open Images</span></div>') + body;
    }
    return (
      '<figure class="doc-figure">' + body +
      (caption
        ? '<figcaption>Figure ' + ctx.counters.figure + ': ' +
          renderInline(caption, ctx) + '</figcaption>'
        : '') +
      '</figure>'
    );
  }

  function renderTheorem(name, inner, ctx, offset) {
    let body = String(inner);
    let custom = '';
    const opt = /^\s*\[([^\]]*)\]/.exec(body);
    if (opt) {
      custom = opt[1];
      body = body.slice(opt[0].length);
    }
    const bodyOffset = Number.isFinite(offset) ? offset + (opt ? opt[0].length : 0) : undefined;
    const def = (ctx && ctx.theorems && ctx.theorems[name]) ||
      { name: THEOREM_ENVS[name] || name, counter: name, within: '', numbered: true };
    let number = '';
    if (def.numbered) {
      const sectionLabel = [ctx.counters.chapter, ctx.counters.section]
        .filter((value) => value > 0).join('.');
      const scope = def.within === 'section' ? sectionLabel : '';
      const key = def.counter + '@' + scope;
      ctx.theoremCounters[key] = (ctx.theoremCounters[key] || 0) + 1;
      number = (scope ? scope + '.' : '') + ctx.theoremCounters[key];
    }
    return (
      '<div class="doc-theorem"><span class="doc-theorem-label">' +
      escapeHtml((def.name || name) + (number ? ' ' + number : '')) +
      (custom ? ' (' + escapeHtml(custom) + ')' : '') +
      '</span>' + renderBlocks(body, ctx, bodyOffset) + '</div>'
    );
  }

  function renderDisplayMath(expr, ctx, numbered) {
    const html = renderMath(expr, true, ctx);
    if (!html) return '';
    if (!numbered) {
      return '<div class="eq-block eq-plain"><div class="eq-body">' + html + '</div></div>';
    }
    ctx.counters.equation += 1;
    return (
      '<div class="eq-block"><div class="eq-body">' + html +
      '</div><span class="eq-number">(' + ctx.counters.equation + ')</span></div>'
    );
  }

  function renderCustomEnvironment(def, inner, ctx) {
    let body = String(inner);
    const args = [];
    if (def.opt !== null && def.opt !== undefined) {
      const lead = /^\s*\[([^\]]*)\]/.exec(body);
      if (lead) { args.push(lead[1]); body = body.slice(lead[0].length); }
      else args.push(def.opt);
    }
    while (args.length < def.args) {
      const lead = /^\s*\{/.exec(body);
      if (!lead) break;
      const open = lead[0].length - 1;
      const close = matchBrace(body, open);
      if (close < 0) break;
      args.push(body.slice(open + 1, close));
      body = body.slice(close + 1);
    }
    const fill = (snippet) => String(snippet || '').replace(/#([1-9])/g, (token, n) =>
      (args[Number(n) - 1] === undefined ? '' : args[Number(n) - 1]));
    return renderBlocks(fill(def.begin) + body + fill(def.end), ctx);
  }

  function renderEnvironment(env, inner, ctx, offset) {
    const base = Number.isFinite(offset) ? offset : null;
    const nest = base === null ? undefined : base;
    if (ctx && ctx.envMap && ctx.envMap[env]) return renderCustomEnvironment(ctx.envMap[env], inner, ctx);
    if (MATH_ENVS.has(env)) {
      if (env === 'math') return renderMath(inner, false, ctx);

      if (env === 'cases' || env === 'pmatrix' || env === 'bmatrix' || env === 'Bmatrix' ||
          env === 'vmatrix' || env === 'Vmatrix' || env === 'matrix' || env === 'smallmatrix') {
        return renderDisplayMath(
          '\\begin{' + env + '}' + inner + '\\end{' + env + '}', ctx, false
        );
      }

      let expr = inner;
      let numbered = false;
      const wrap = {
        align: 'aligned', 'align*': 'aligned', alignat: 'aligned', 'alignat*': 'aligned',
        flalign: 'aligned', 'flalign*': 'aligned', eqnarray: 'aligned', 'eqnarray*': 'aligned',
        split: 'aligned', gather: 'gathered', 'gather*': 'gathered'
      }[env];

      if (env === 'equation' || env === 'equation*' || env === 'multline' || env === 'multline*' ||
          env === 'displaymath') {
        numbered = env === 'equation' || env === 'multline';
        if (/\\\\/.test(expr)) expr = '\\begin{aligned}' + expr + '\\end{aligned}';
      } else if (wrap) {
        numbered = env.indexOf('*') < 0;
        expr = '\\begin{' + wrap + '}' + expr + '\\end{' + wrap + '}';
      } else if (env === 'aligned' || env === 'gathered') {
        expr = '\\begin{' + env + '}' + inner + '\\end{' + env + '}';
      }

      return renderDisplayMath(expr, ctx, numbered);
    }

    switch (env) {
      case 'itemize':
        return renderList('ul', inner, ctx, nest);
      case 'enumerate':
        return renderList('ol', inner, ctx, nest);
      case 'description':
        return renderList('dl', inner, ctx, nest);
      case 'tabular':
      case 'tabular*':
      case 'array':
        return renderTabular(inner, ctx);
      case 'table':
      case 'table*':
        return renderFloat('table', inner, ctx);
      case 'figure':
      case 'figure*':
        return renderFloat('figure', inner, ctx);
      case 'abstract':
        return (
          '<div class="doc-abstract"><div class="doc-abstract-title">Abstract</div>' +
          renderBlocks(inner, ctx, nest) + '</div>'
        );
      case 'quote':
      case 'quotation':
      case 'verse':
        return '<blockquote class="doc-quote">' + renderBlocks(inner, ctx, nest) + '</blockquote>';
      case 'center':
      case 'flushleft':
      case 'flushright':
        return '<div class="doc-center">' + renderBlocks(inner, ctx, nest) + '</div>';
      case 'verbatim':
      case 'lstlisting':
      case 'minted':
        return '<pre class="doc-verbatim">' + escapeHtml(inner) + '</pre>';
      case 'minipage':
      case 'multicols':
        return '<div class="doc-center">' +
          renderBlocks(String(inner).replace(/^\s*\{[^}]*\}/, ''), ctx) + '</div>';
      case 'thebibliography':
        return renderBibliography(inner, ctx);
      case 'document':
        return renderBlocks(inner, ctx, nest);
      default:
        break;
    }

    if (ctx && ctx.theorems && ctx.theorems[env]) return renderTheorem(env, inner, ctx, nest);
    return renderBlocks(inner, ctx, nest);
  }

  function renderCommandBlock(cmd, ctx) {
    if (cmd === 'maketitle') return titleBlock(ctx.meta, ctx);
    if (cmd === 'tableofcontents') return renderToc(ctx);
    if (cmd === 'hrule' || cmd === 'hrulefill') return '<hr />';
    return '';
  }

  function renderBlocks(text, ctx, offset) {
    const re = new RegExp(BLOCK_RE.source, 'g');
    /* null means "this text no longer lines up with the source" (a float body
       with its caption removed, a custom environment, a bibliography entry).
       Those blocks render normally but stay read-only on the sheet. */
    const base = Number.isFinite(offset) ? offset : null;
    const at = (index) => (base === null ? undefined : base + index);
    let out = '';
    let last = 0;
    let m;

    while ((m = re.exec(text)) !== null) {
      if (m[1]) {
        const env = m[1];
        if (mathStateAt(text, m.index) !== 'none') continue;
        let innerStart = m.index + m[0].length;
        /* optional placement/position argument, e.g. \begin{table}[h] */
        const placement = /^\s*\[[^\]]*\]/.exec(text.slice(innerStart));
        if (placement) innerStart += placement[0].length;
        const found = findEnvEnd(text, innerStart, env);
        if (!found) {
          out += renderProse(text.slice(last, m.index), ctx, at(last));
          out += renderProse(m[0], ctx, at(m.index));
          last = m.index + m[0].length;
          re.lastIndex = last;
          continue;
        }
        out += renderProse(text.slice(last, m.index), ctx, at(last));
        out += renderEnvironment(env, text.slice(innerStart, found.start), ctx, at(innerStart));
        last = found.end;
        re.lastIndex = last;
        continue;
      }

      if (m[2]) {
        out += renderProse(text.slice(last, m.index), ctx, at(last));
        out += renderCommandBlock(m[2].toLowerCase(), ctx);
        last = m.index + m[0].length;
        re.lastIndex = last;
        continue;
      }

      if (m[3]) {
        const open = m.index + m[0].length - 1;
        const close = matchBrace(text, open);
        if (close < 0) continue;
        out += renderProse(text.slice(last, m.index), ctx, at(last));
        out += renderHeading(m[3].toLowerCase(), text.slice(open + 1, close), ctx, m[4] !== '*', at(open + 1));
        last = close + 1;
        re.lastIndex = last;
      }
    }

    out += renderProse(text.slice(last), ctx, at(last));
    return out;
  }

  /* A body built only from math commands (\mathbb{R}, \langle #1, #2\rangle)
     renders as inline math when the macro is used in prose. */
  const MATH_MACRO_COMMAND = /\\(?:mathbb|mathcal|mathbf|mathrm|mathit|mathsf|mathtt|operatorname|frac|tfrac|dfrac|sqrt|sum|prod|int|lim|partial|nabla|infty|langle|rangle|lVert|rVert|vec|hat|bar|tilde|dot|ddot|left|right|cdot|times|pm|mp|leq|geq|neq|approx|equiv|propto|subset|supset|in|forall|exists|to|mapsto|rightarrow|leftarrow|Rightarrow|Leftrightarrow|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|chi|psi|omega|hbar|ell)/;

  function mathMacroBody(body) {
    const src = String(body || '');
    if (!MATH_MACRO_COMMAND.test(src)) return false;
    const prose = src
      .replace(/\\[A-Za-z]+\s*\{[^{}]*\}/g, '')
      .replace(/\\[A-Za-z]+/g, '')
      .replace(/#\d/g, '');
    return !/[A-Za-z]{2,}/.test(prose);
  }

  function collectUserMacros(src) {
    const macros = {};
    const defs = [];
    const text = String(src || '');
    const defRe = /\\(newcommand|renewcommand|providecommand)\*?\s*\{?\s*\\([A-Za-z]+)\s*\}?\s*(?:\[(\d)\])?(?:\s*\[([^\]]*)\])?\s*\{/g;
    let m;
    const remember = (name, args, body, opt) => {
      macros['\\' + name] = body;
      defs.push({ name, args, body, opt: opt === undefined ? null : opt, math: mathMacroBody(body) });
    };
    while ((m = defRe.exec(text)) !== null) {
      const open = m.index + m[0].length - 1;
      const close = matchBrace(text, open);
      if (close < 0) continue;
      remember(m[2], m[3] ? Number(m[3]) : 0, text.slice(open + 1, close), m[4]);
    }
    const defPlain = /\\def\s*\\([A-Za-z]+)((?:#\d)+)?\s*\{/g;
    while ((m = defPlain.exec(text)) !== null) {
      const open = m.index + m[0].length - 1;
      const close = matchBrace(text, open);
      if (close < 0) continue;
      remember(m[1], m[2] ? (m[2].match(/#/g) || []).length : 0, text.slice(open + 1, close));
    }
    const opRe = /\\DeclareMathOperator\*?\s*\{\\([A-Za-z]+)\}\s*\{([^{}]*)\}/g;
    while ((m = opRe.exec(text)) !== null) {
      remember(m[1], 0, '\\operatorname{' + m[2] + '}');
    }

    const envs = {};
    const envRe = /\\newenvironment\*?\s*\{([A-Za-z*]+)\}\s*(?:\[(\d)\])?\s*(?:\[([^\]]*)\])?\s*\{/g;
    while ((m = envRe.exec(text)) !== null) {
      const open = m.index + m[0].length - 1;
      const close = matchBrace(text, open);
      if (close < 0) continue;
      const next = /^\s*\{/.exec(text.slice(close + 1));
      if (!next) continue;
      const endOpen = close + 1 + next[0].length - 1;
      const endClose = matchBrace(text, endOpen);
      if (endClose < 0) continue;
      envs[m[1]] = {
        name: m[1],
        args: m[2] ? Number(m[2]) : 0,
        opt: m[3] === undefined ? null : m[3],
        begin: text.slice(open + 1, close),
        end: text.slice(endOpen + 1, endClose)
      };
    }
    return { macros, defs, envs };
  }

  /* Blank out macro definitions so document checks do not treat their bodies
     as prose. Every replacement keeps the line structure intact. */
  function maskMacroDefs(src) {
    const text = String(src || '');
    const patterns = [
      /\\(?:newcommand|renewcommand|providecommand)\*?\s*\{?\s*\\[A-Za-z]+\s*\}?\s*(?:\[\d\])?\s*(?:\[[^\]]*\])?\s*\{/g,
      /\\def\s*\\[A-Za-z]+(?:#\d)*\s*\{/g,
      /\\DeclareMathOperator\*?\s*\{\\[A-Za-z]+\}\s*\{/g,
      /\\newenvironment\*?\s*\{[A-Za-z*]+\}\s*(?:\[\d\])?\s*(?:\[[^\]]*\])?\s*\{/g
    ];
    let out = text;
    patterns.forEach((re) => {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        const open = m.index + m[0].length - 1;
        const close = matchBrace(text, open);
        if (close < 0) continue;
        let end = close + 1;
        if (m[0].indexOf('\\newenvironment') === 0) {
          const next = /^\s*\{/.exec(text.slice(close + 1));
          if (next) {
            const endOpen = close + 1 + next[0].length - 1;
            const endClose = matchBrace(text, endOpen);
            if (endClose > 0) end = endClose + 1;
          }
        }
        const blank = text.slice(m.index, end).replace(/[^\n]/g, ' ');
        out = out.slice(0, m.index) + blank + out.slice(end);
      }
    });
    return out;
  }

  function sourceLineWithoutComment(line) {
    return String(line || '').replace(/(^|[^\\])%.*$/, '$1');
  }

  function parseReferenceIndex(source, macroMap) {
    /* Expand document macros first so a \\figref{fig:one} that becomes
       \\ref{fig:one} counts as a reference to the label. */
    const expanded = macroMap && macroMap.size
      ? expandTextMacros(String(source || ''), macroMap, 0)
      : String(source || '');
    const lines = expanded.split('\n');
    const labels = [];
    const refs = [];
    const labelMap = new Map();
    const section = { chapter: 0, section: 0, subsection: 0, subsubsection: 0 };
    let equation = 0;
    let figure = 0;
    let table = 0;
    let lastHeading = null;
    const envStack = [];
    const numbered = new Set(['equation', 'align', 'alignat', 'flalign', 'eqnarray', 'gather', 'multline']);
    const theoremDefs = collectTheoremDefs(expanded);
    const theoremCounters = {};

    const sectionDisplay = () => [section.chapter, section.section, section.subsection, section.subsubsection]
      .filter((value) => value > 0).join('.');

    lines.forEach((rawLine, lineIndex) => {
      const line = sourceLineWithoutComment(rawLine);
      const heading = /^\s*\\(chapter|section|subsection|subsubsection|paragraph)\*?\s*(?:\[[^\]]*\]\s*)?\{([^}]*)\}/.exec(line);
      if (heading) {
        const kind = heading[1];
        if (kind === 'chapter') {
          section.chapter += 1;
          section.section = section.subsection = section.subsubsection = 0;
        } else if (kind === 'section') {
          section.section += 1;
          section.subsection = section.subsubsection = 0;
        } else if (kind === 'subsection') {
          section.subsection += 1;
          section.subsubsection = 0;
        } else if (kind === 'subsubsection') {
          section.subsubsection += 1;
        }
        lastHeading = { title: heading[2].replace(/\\[A-Za-z]+\*?/g, '').trim(), number: sectionDisplay(), line: lineIndex + 1 };
      }

      const events = [];
      const tokenRe = /\\(begin|end)\s*\{([A-Za-z*]+)\}|\\label\s*\{([^}]*)\}|\\(ref|eqref|autoref|pageref)\s*\{([^}]*)\}/g;
      let token;
      while ((token = tokenRe.exec(line)) !== null) {
        if (token[1]) events.push({ index: token.index, type: token[1], env: token[2] });
        else if (token[3] !== undefined) events.push({ index: token.index, type: 'label', name: token[3].trim() });
        else if (token[4]) events.push({ index: token.index, type: 'ref', command: token[4], name: token[5].trim() });
      }
      events.sort((a, b) => a.index - b.index);

      events.forEach((event) => {
        if (event.type === 'begin') {
          const theoremDef = theoremDefs[event.env];
          if (theoremDef) {
            const scope = theoremDef.within === 'section' ? sectionDisplay() : '';
            const key = theoremDef.counter + '@' + scope;
            theoremCounters[key] = (theoremCounters[key] || 0) + 1;
            envStack.push({
              env: event.env,
              kind: 'theorem',
              kindLabel: theoremDef.name,
              number: theoremDef.numbered ? (scope ? scope + '.' : '') + theoremCounters[key] : ''
            });
            return;
          }
          /* Only math and float environments affect label numbering. Ignore
             the outer document, lists and theorem wrappers here. */
          if (!(MATH_ENVS.has(event.env) || event.env.indexOf('figure') === 0 || event.env.indexOf('table') === 0)) {
            return;
          }
          let number = '';
          let kind = event.env;
          if (numbered.has(event.env)) {
            equation += 1;
            number = String(equation);
          } else if (event.env === 'figure' || event.env === 'figure*') {
            figure += 1;
            number = String(figure);
            kind = 'figure';
          } else if (event.env === 'table' || event.env === 'table*') {
            table += 1;
            number = String(table);
            kind = 'table';
          }
          envStack.push({ env: event.env, number, kind });
          return;
        }
        if (event.type === 'end') {
          for (let i = envStack.length - 1; i >= 0; i -= 1) {
            if (envStack[i].env === event.env) { envStack.splice(i, 1); break; }
          }
          return;
        }
        if (event.type === 'label') {
          if (!event.name || event.name.indexOf('#') >= 0) return;
          const current = envStack.length ? envStack[envStack.length - 1] : null;
          let kind = 'section';
          let number = '';
          let context = lastHeading ? lastHeading.title : 'Document';
          if (current) {
            context = current.env;
            if (current.number) {
              kind = ['figure', 'table', 'theorem'].indexOf(current.kind) >= 0 ? current.kind : 'equation';
              number = current.number;
            } else if (MATH_ENVS.has(current.env)) {
              kind = 'equation';
            }
          } else if (lastHeading) {
            number = lastHeading.number;
          }
          const entry = {
            name: event.name,
            line: lineIndex + 1,
            kind,
            number,
            context,
            kindLabel: current && current.kindLabel ? current.kindLabel : ''
          };
          labels.push(entry);
          if (!labelMap.has(event.name)) labelMap.set(event.name, entry);
          return;
        }
        if (event.type === 'ref' && event.name && event.name.indexOf('#') < 0) {
          refs.push({ name: event.name, line: lineIndex + 1, command: event.command });
        }
      });
    });

    const counts = {};
    labels.forEach((label) => { counts[label.name] = (counts[label.name] || 0) + 1; });
    const duplicates = labels.filter((label) => counts[label.name] > 1);
    const used = new Set(refs.map((ref) => ref.name));
    const missing = refs.filter((ref) => !labelMap.has(ref.name));
    const unused = labels.filter((label) => !used.has(label.name));

    return { labels, refs, labelMap, duplicates, missing, unused, equation, figure, table };
  }

  /* ------------------------------------------------------------------ *
   *  Bibliography (local BibTeX library, parsed approximately)
   * ------------------------------------------------------------------ */
  function readBibText() {
    try {
      return localStorage.getItem(BIB_KEY) || '';
    } catch (_) {
      return '';
    }
  }

  function writeBibText(text) {
    try {
      localStorage.setItem(BIB_KEY, String(text || '').slice(0, 200000));
      return true;
    } catch (_) {
      return false;
    }
  }

  function readBibEntries() {
    return parseBibEntries(readBibText());
  }

  function bibBlockEnd(src, open) {
    const opener = src[open];
    const closer = opener === '{' ? '}' : ')';
    let depth = 0;
    for (let i = open; i < src.length; i++) {
      const ch = src[i];
      if (ch === '\\') { i += 1; continue; }
      if (ch === opener) depth += 1;
      else if (ch === closer) {
        depth -= 1;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  function cleanBibValue(value) {
    return String(value || '')
      .replace(/\\['"`^~=.]\s*\{?([A-Za-z])\}?/g, '$1')
      .replace(/\\&/g, '&')
      .replace(/\\%/g, '%')
      .replace(/\\_/g, '_')
      .replace(/\\[A-Za-z]+\s*/g, ' ')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseBibFields(body) {
    const src = String(body || '');
    const fields = {};
    let i = 0;
    while (i < src.length) {
      const nameMatch = /^\s*,?\s*([A-Za-z][A-Za-z0-9_-]*)\s*=\s*/.exec(src.slice(i));
      if (!nameMatch) {
        const next = src.indexOf(',', i);
        if (next < 0) break;
        i = next + 1;
        continue;
      }
      const name = nameMatch[1].toLowerCase();
      let k = i + nameMatch[0].length;
      let value = '';
      if (src[k] === '{') {
        const end = bibBlockEnd(src, k);
        if (end < 0) break;
        value = src.slice(k + 1, end);
        k = end + 1;
      } else if (src[k] === '"') {
        const end = src.indexOf('"', k + 1);
        if (end < 0) break;
        value = src.slice(k + 1, end);
        k = end + 1;
      } else {
        const end = src.indexOf(',', k);
        value = src.slice(k, end < 0 ? src.length : end);
        k = end < 0 ? src.length : end;
      }
      fields[name] = cleanBibValue(value);
      i = k;
    }
    return fields;
  }

  /* Parsing a large .bib file on every compile is wasteful: the preview and the
     diagnostics each recompile while typing. Cache the last parse by its exact
     source text; callers must treat the returned entries as read-only. */
  let bibParseCache = { text: null, entries: [] };

  function parseBibEntries(text) {
    const src = String(text || '');
    if (bibParseCache.text === src) return bibParseCache.entries;
    const entries = [];
    const seen = new Set();
    let at = src.indexOf('@');
    while (at >= 0 && entries.length < BIB_LIMIT) {
      const head = /^@([A-Za-z]+)\s*([{(])/.exec(src.slice(at, at + 60));
      if (!head) {
        at = src.indexOf('@', at + 1);
        continue;
      }
      const open = at + head[0].length - 1;
      const close = bibBlockEnd(src, open);
      if (close < 0) break;
      const type = head[1].toLowerCase();
      if (type !== 'comment' && type !== 'preamble' && type !== 'string') {
        const inner = src.slice(open + 1, close);
        const comma = inner.indexOf(',');
        const key = (comma < 0 ? inner : inner.slice(0, comma)).trim();
        if (key && !seen.has(key)) {
          seen.add(key);
          entries.push(Object.assign({ key, type }, parseBibFields(comma < 0 ? '' : inner.slice(comma + 1))));
        }
      }
      at = src.indexOf('@', close + 1);
    }
    bibParseCache = { text: src, entries };
    return entries;
  }

  function bibAuthor(entry) {
    const raw = String((entry && (entry.author || entry.editor)) || '').trim();
    if (!raw) return '';
    const parts = raw.split(/\s+and\s+/i).map((part) => part.trim()).filter(Boolean);
    const surname = (part) => {
      if (part.indexOf(',') >= 0) return part.split(',')[0].trim();
      const words = part.split(/\s+/);
      return words[words.length - 1] || part;
    };
    const names = parts.map(surname);
    if (names.length > 3) return names[0] + ' et al.';
    if (names.length === 2) return names[0] + ' & ' + names[1];
    return names.join(', ');
  }

  function formatBibEntry(entry) {
    if (!entry) return '';
    /* \bibitem entries arrive as prose, not as BibTeX fields. */
    if (entry.latex) return cleanBibValue(entry.latex);
    const author = bibAuthor(entry);
    const head = author
      ? author + (entry.year ? ' (' + entry.year + ')' : '')
      : entry.year ? '(' + entry.year + ')' : '';
    const venue = entry.journal || entry.booktitle || entry.publisher || entry.school || entry.institution || '';
    const bits = [];
    if (head) bits.push(head + '.');
    if (entry.title) bits.push(entry.title.replace(/\.$/, '') + '.');
    if (venue) bits.push(venue.replace(/\.$/, '') + '.');
    const tail = entry.doi ? ' doi:' + entry.doi : entry.url ? ' ' + entry.url : '';
    return (bits.join(' ') || entry.key) + tail;
  }

  /* A document may carry its own bibliography instead of a .bib library:
     \begin{thebibliography}{1} \bibitem{key} text … \end{thebibliography}.
     Those entries are plain LaTeX and take part in citation numbering just like
     library entries, so \cite resolves without any imported .bib file. */
  function parseBibItems(text, insideEnv) {
    const src = String(text || '');
    let inner = src;
    if (!insideEnv) {
      const open = /\\begin\s*\{thebibliography\}(?:\s*\{[^}]*\})?/.exec(src);
      /* A \bibitem outside a thebibliography block is not a reference in
         LaTeX; it is reported as a problem instead of earning a number. */
      if (!open) return [];
      inner = src.slice(open.index + open[0].length);
      const close = inner.indexOf('\\end{thebibliography}');
      if (close >= 0) inner = inner.slice(0, close);
    }
    const items = [];
    const re = /\\bibitem\s*(?:\[([^\]]*)\])?\s*\{([^}]*)\}/g;
    let match;
    let cursor = -1;
    let current = null;
    while ((match = re.exec(inner)) !== null) {
      if (current) {
        current.text = inner.slice(cursor, match.index);
        items.push(current);
      }
      current = { key: match[2].trim(), label: (match[1] || '').trim() };
      cursor = re.lastIndex;
    }
    if (current) {
      current.text = inner.slice(cursor);
      items.push(current);
    }
    const seenKeys = new Set();
    return items
      .filter((item) => {
        if (!item.key || seenKeys.has(item.key)) return false;
        seenKeys.add(item.key);
        return true;
      })
      .map((item) => ({
        key: item.key,
        label: item.label,
        type: 'bibitem',
        latex: String(item.text || '').replace(/\\newblock\b/g, ' ').replace(/\s+/g, ' ').trim()
      }));
  }

  function parseCitations(source) {
    const lines = String(source || '').split('\n');
    const order = [];
    const counts = new Map();
    const occurrences = [];
    const citeRe = /\\(?:cite|citep|citet|citealp|autocite|parencite|textcite)\*?\s*(?:\[[^\]]*\]\s*){0,2}\{([^}]*)\}/g;
    lines.forEach((rawLine, lineIndex) => {
      const line = sourceLineWithoutComment(rawLine);
      let match;
      citeRe.lastIndex = 0;
      while ((match = citeRe.exec(line)) !== null) {
        String(match[1] || '').split(',').map((key) => key.trim()).filter(Boolean).forEach((key) => {
          if (!counts.has(key)) order.push(key);
          counts.set(key, (counts.get(key) || 0) + 1);
          occurrences.push({ name: key, line: lineIndex + 1 });
        });
      }
    });
    const entryMap = new Map(readBibEntries().map((entry) => [entry.key, entry]));
    /* The document's own \bibitem list wins over a library entry with the same
       key and fixes the reference numbers, as it does in LaTeX. */
    const bibItems = parseBibItems(source);
    bibItems.forEach((entry) => entryMap.set(entry.key, entry));
    const numbers = new Map();
    let nextNumber = 0;
    const sequence = bibItems.length
      ? bibItems.map((entry) => entry.key).concat(order.filter((key) => !bibItems.some((entry) => entry.key === key)))
      : order;
    sequence.forEach((key) => {
      if (!entryMap.has(key) || numbers.has(key)) return;
      nextNumber += 1;
      numbers.set(key, nextNumber);
    });
    const missing = order.filter((key) => !entryMap.has(key));
    return { order, counts, occurrences, missing, entryMap, numbers, bibItems };
  }

  function citeKeys(raw) {
    return String(raw || '').split(',').map((key) => key.trim()).filter(Boolean);
  }

  function citationLabel(raw, ctx, style) {
    const keys = citeKeys(raw);
    const citations = ctx && ctx.citations;
    if (!keys.length) {
      return { html: '<span class="doc-cite is-missing">[?]</span>', missing: true };
    }
    let missing = false;
    const parts = keys.map((key) => {
      const known = citations && citations.entryMap ? citations.entryMap.has(key) : false;
      const number = known && citations.numbers ? citations.numbers.get(key) : null;
      if (!number) { missing = true; return '?'; }
      return String(number);
    });
    const label = parts.slice().sort((a, b) => {
      if (a === '?' || b === '?') return 0;
      return Number(a) - Number(b);
    }).join(', ');
    const cls = 'doc-cite' + (missing ? ' is-missing' : '');
    if (style === 'paren') return { html: '<span class="' + cls + '">(' + escapeHtml(label) + ')</span>', missing };
    if (style === 'text') {
      const entry = citations && citations.entryMap ? citations.entryMap.get(keys[0]) : null;
      /* \bibitem entries have no author field; use their label or the key. */
      const who = entry ? (bibAuthor(entry) || entry.label || keys[0]) : keys[0];
      const year = entry && entry.year ? ' (' + entry.year + ')' : '';
      return { html: '<span class="' + cls + '">' + escapeHtml(who + year) + '</span>', missing };
    }
    return { html: '<span class="' + cls + '">[' + escapeHtml(label) + ']</span>', missing };
  }

  /* Renders the document's own \bibitem list as the same numbered References
     block the .bib path appends. Entries keep their LaTeX, so emphasis and
     formulas inside a reference survive. */
  function renderBibliography(inner, ctx) {
    const items = parseBibItems(inner, true);
    if (!items.length) return '';
    const rows = items.map((item) =>
      '<li class="doc-bib-item" id="bib:' + escapeHtml(item.key) + '">' +
      renderProse(item.latex, ctx) + '</li>'
    ).join('');
    /* A cited key that only the .bib library knows keeps its number but would
       have no entry here, so it is appended in number order. */
    const citations = ctx && ctx.citations;
    const extras = [];
    if (citations && citations.numbers) {
      citations.numbers.forEach((number, key) => {
        if (items.some((item) => item.key === key)) return;
        extras.push({ number, key });
      });
    }
    extras.sort((a, b) => a.number - b.number);
    const extraRows = extras.map((extra) =>
      '<li class="doc-bib-item" id="bib:' + escapeHtml(extra.key) + '">' +
      escapeHtml(formatBibEntry(citations.entryMap.get(extra.key))) + '</li>'
    ).join('');
    return '<section class="doc-bibliography" aria-label="References">' +
      '<h2 class="doc-bib-title">References</h2>' +
      '<ol class="doc-bib-list">' + rows + extraRows + '</ol></section>';
  }

  function bibliographyHtml(citations) {
    const items = citations.order
      .filter((key) => citations.entryMap.has(key))
      .map((key) => '<li class="doc-bib-item">' + escapeHtml(formatBibEntry(citations.entryMap.get(key))) + '</li>')
      .join('');
    return '<section class="doc-bibliography" aria-label="References">' +
      '<h2 class="doc-bib-title">References</h2>' +
      '<ol class="doc-bib-list">' + items + '</ol></section>';
  }

  function parseOutline(source) {
    const lines = String(source || '').split('\n');
    const items = [];
    const headingRe = /^\s*\\(chapter|section|subsection|subsubsection|paragraph)\*?\s*(?:\[[^\]]*\]\s*)?\{([^}]*)\}/;
    const envRe = /\\begin\s*\{(equation|align|gather|multline|figure|table)\*?\}/g;
    lines.forEach((rawLine, index) => {
      const line = sourceLineWithoutComment(rawLine);
      const heading = headingRe.exec(line);
      if (heading) {
        items.push({
          type: 'heading',
          level: { chapter: 0, section: 1, subsection: 2, subsubsection: 3, paragraph: 4 }[heading[1]],
          title: heading[2].replace(/\\[A-Za-z]+\*?/g, '').trim() || heading[1],
          line: index + 1
        });
        return;
      }
      let env;
      while ((env = envRe.exec(line)) !== null) {
        items.push({ type: env[1].replace('*', ''), title: env[1], line: index + 1 });
      }
    });
    return items;
  }

  function compileDocument(source) {
    const stripped = stripCommentsWithMap(source);
    const src = stripped.text;
    const ctx = makeCtx({});
    const macroSet = collectUserMacros(src);
    ctx.macros = macroSet.macros;
    ctx.macroMap = new Map(macroSet.defs.map((def) => [def.name, def]));
    ctx.envMap = macroSet.envs || {};
    ctx.theorems = collectTheoremDefs(src);
    ctx.theoremCounters = {};
    ctx.images = projectImages();
    ctx.references = parseReferenceIndex(src, ctx.macroMap);
    ctx.citations = parseCitations(src);
    ctx.bibliography = Array.from(ctx.citations.entryMap.values());

    const beginMatch = /\\begin\s*\{document\}/.exec(src);
    let preamble = '';
    let body = src;
    let bodyStart = 0;

    if (beginMatch) {
      preamble = src.slice(0, beginMatch.index);
      bodyStart = beginMatch.index + beginMatch[0].length;
      const after = src.slice(bodyStart);
      const endIdx = after.search(/\\end\s*\{document\}/);
      body = endIdx >= 0 ? after.slice(0, endIdx) : after;
    } else {
      const preambleLine = /^\s*\\(documentclass|usepackage|RequirePackage|newcommand|renewcommand|providecommand|newenvironment|DeclareMathOperator|DeclareRobustCommand|def|let|title|author|date|geometry|pagestyle|thispagestyle|setlength|addtolength|setcounter|bibliography|bibliographystyle|graphicspath|hypersetup|newtheorem)\b/;
      /* Preamble lines are blanked rather than removed: every offset in the
         rendered body then still points at the same place in the source, which
         the on-sheet editor relies on. */
      const pre = [];
      body = src.split('\n').map((line) => {
        if (!preambleLine.test(line)) return line;
        pre.push(line);
        return line.replace(/[^\r]/g, ' ');
      }).join('\n');
      preamble = pre.join('\n');
    }

    ctx.editMap = { map: stripped.map, bodyStart };
    ctx.meta = readMeta(preamble);

    if (/\\tableofcontents\b/.test(body)) {
      const probe = makeCtx(ctx.meta);
      renderBlocks(body, probe, 0);
      ctx.headings = probe.headings;
    }

    let html = '';
    try {
      html = renderBlocks(body, ctx, 0);
    } catch (err) {
      ctx.errors.push('Renderer stopped: ' + (err && err.message ? err.message : String(err)));
      html =
        '<div class="doc-empty"><strong>Render failed</strong><span>' +
        escapeHtml(String((err && err.message) || err)) + '</span></div>';
    }

    if (ctx.citations.order.some((key) => ctx.citations.entryMap.has(key)) &&
      !/\\begin\s*\{thebibliography\}/.test(body)) {
      html += bibliographyHtml(ctx.citations);
    }

    if (ctx.meta.title && !/\\maketitle\b/.test(body)) {
      html = titleBlock(ctx.meta, ctx) + html;
    }

    return { html, ctx, meta: ctx.meta };
  }

  /* ------------------------------------------------------------------ *
   *  Source analysis (non-blocking diagnostics)
   * ------------------------------------------------------------------ */
  function lineOf(text, index) {
    let line = 1;
    for (let i = 0; i < index && i < text.length; i++) {
      if (text[i] === '\n') line++;
    }
    return line;
  }

  function analyzeSource(source) {
    const text = stripComments(source);
    const errors = [];
    const warnings = [];

    /* braces */
    const braceStack = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === '{') braceStack.push(i);
      else if (ch === '}') {
        if (!braceStack.length) {
          errors.push({
            msg: 'Unexpected closing brace “}” on line ' + lineOf(text, i) + '.',
            hint: 'Remove it or add a matching “{” earlier.',
            line: lineOf(text, i)
          });
          break;
        }
        braceStack.pop();
      }
    }
    if (braceStack.length && errors.length < 3) {
      errors.push({
        msg: braceStack.length + ' unclosed “{” — first on line ' + lineOf(text, braceStack[0]) + '.',
        hint: 'Every “{” needs a matching “}”.',
        line: lineOf(text, braceStack[0])
      });
    }

    /* math delimiters */
    let single = 0;
    let double = 0;
    let lastSingle = -1;
    let lastDouble = -1;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\\') {
        i++;
        continue;
      }
      if (text[i] === '$') {
        if (text[i + 1] === '$') {
          double++;
          lastDouble = i;
          i++;
        } else {
          single++;
          lastSingle = i;
        }
      }
    }
    if (single % 2 === 1) {
      errors.push({
        msg: 'A “$” inline math delimiter is never closed.',
        hint: 'Pair each $…$; write \\$ for a literal dollar sign.',
        line: lineOf(text, lastSingle)
      });
    }
    if (double % 2 === 1) {
      errors.push({
        msg: 'A “$$” display math delimiter is never closed.',
        hint: 'Display math needs both opening and closing $$.',
        line: lineOf(text, lastDouble)
      });
    }

    /* environments */
    const envStack = [];
    const envRe = /\\(begin|end)\s*\{([A-Za-z*]+)\}/g;
    let em;
    while ((em = envRe.exec(text)) !== null) {
      const line = lineOf(text, em.index);
      if (em[1] === 'begin') {
        envStack.push({ env: em[2], line });
      } else {
        const top = envStack.pop();
        if (!top) {
          errors.push({
            msg: '\\end{' + em[2] + '} on line ' + line + ' has no matching \\begin.',
            hint: 'Add the opening environment or remove this line.',
            line
          });
        } else if (top.env !== em[2]) {
          errors.push({
            msg: '\\end{' + em[2] + '} on line ' + line + ' closes \\begin{' + top.env + '} from line ' + top.line + '.',
            hint: 'Environments must nest in order.',
            line
          });
        }
      }
    }
    envStack.slice(0, 2).forEach((open) => {
      errors.push({
        msg: '\\begin{' + open.env + '} on line ' + open.line + ' is never closed.',
        hint: 'Add \\end{' + open.env + '} to close it.',
        line: open.line
      });
    });

    /* paired sizing commands */
    const lefts = (text.match(/\\left(?![A-Za-z])/g) || []).length;
    const rights = (text.match(/\\right(?![A-Za-z])/g) || []).length;
    if (lefts !== rights) {
      const leftIndex = text.search(/\\left(?![A-Za-z])/);
      const rightIndex = text.search(/\\right(?![A-Za-z])/);
      const pairIndex = Math.min(...[leftIndex, rightIndex].filter((index) => index >= 0));
      warnings.push({
        msg: '\\left and \\right are unbalanced (' + lefts + ' vs ' + rights + '). LaTeX may reject the expression.',
        hint: 'Pair every \\left with a matching \\right.',
        line: pairIndex >= 0 ? lineOf(text, pairIndex) : 0,
        fix: { kind: 'balance-left-right', line: pairIndex >= 0 ? lineOf(text, pairIndex) : 0 }
      });
    }

    findMathCommandsOutsideMath(source).slice(0, 3).forEach((item) => {
      warnings.push({
        msg: item.name + ' is a math command but appears outside math mode.',
        hint: 'Wrap it as $' + item.name + '$ or put it inside an equation environment.',
        line: item.line,
        fix: { kind: 'wrap-command', command: item.name, line: item.line }
      });
    });

    findNestedDisplayMath(source).slice(0, 2).forEach((item) => {
      errors.push({
        msg: 'A $$ display delimiter appears inside ' + item.where + '.',
        hint: 'Remove the extra $$; the equation environment already provides math mode.',
        line: item.line,
        fix: { kind: 'strip-dollars', line: item.line }
      });
    });

    /* \bibitem only counts inside a thebibliography block. */
    const bibRanges = [];
    const bibBegin = /\\begin\s*\{thebibliography\}/g;
    let bibMatch;
    while ((bibMatch = bibBegin.exec(text)) !== null) {
      const end = text.indexOf('\\end{thebibliography}', bibMatch.index);
      bibRanges.push([bibMatch.index, end >= 0 ? end + '\\end{thebibliography}'.length : text.length]);
    }
    const strayBibItem = /\\bibitem\s*(?:\[[^\]]*\])?\s*\{([^}]*)\}/g;
    let strayMatch;
    while ((strayMatch = strayBibItem.exec(text)) !== null) {
      if (bibRanges.some((range) => strayMatch.index >= range[0] && strayMatch.index < range[1])) continue;
      warnings.push({
        msg: '\\bibitem{' + strayMatch[1].trim() + '} is outside a thebibliography block.',
        hint: 'Wrap the entries in \\begin{thebibliography}{9} … \\end{thebibliography}; a stray \\bibitem is not a reference.',
        line: lineOf(text, strayMatch.index)
      });
      break;
    }

    return { errors, warnings };
  }

  function countWords(source) {
    const body = stripComments(source)
      .replace(/\\[A-Za-z]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, ' ')
      .replace(/[{}$&_^\\]/g, ' ');
    const words = body.match(/[A-Za-z0-9\u00C0-\u024F]+/g);
    return words ? words.length : 0;
  }

  /* ------------------------------------------------------------------ *
   *  Preview + diagnostics UI
   * ------------------------------------------------------------------ */
  function updateStats() {
    const stats = $('#docStats');
    if (!cm || !stats) return;
    const words = countWords(cm.getValue());
    stats.textContent = words + (words === 1 ? ' word' : ' words');
  }

  function updateCursorPos() {
    if (!cm) return;
    const cur = cm.getCursor();
    const el = $('#cursorPos');
    if (el) el.textContent = 'Ln ' + (cur.line + 1) + ', Col ' + (cur.ch + 1);
  }

  function updateBanner(analysis, ctx) {
    const banner = $('#syntaxBanner');
    if (!banner) return;

    const errors = analysis.errors.slice();
    const warnings = analysis.warnings.slice();

    if (ctx) {
      ctx.errors.forEach((msg) => {
        if (!errors.some((e) => e.msg === msg)) errors.push({ msg });
      });
      ctx.warnings.forEach((warning) => {
        const msg = typeof warning === 'string' ? warning : warning.msg;
        if (!warnings.some((item) => (typeof item === 'string' ? item : item.msg) === msg)) {
          warnings.push(typeof warning === 'string' ? { msg: warning } : warning);
        }
      });
    }

    let level = 'is-ok';
    let icon = 'check-circle-2';
    let title = 'Syntax OK';
    let detail = 'Braces, math delimiters and environments are balanced.';
    let hint = '';
    let jumpLine = 0;
    let fix = null;

    if (errors.length) {
      level = 'is-error';
      icon = 'alert-triangle';
      title = errors.length + ' syntax issue' + (errors.length === 1 ? '' : 's');
      detail = errors[0].msg;
      hint = errors[0].hint || '';
      jumpLine = errors[0].line || 0;
      fix = errors[0].fix || null;
      if (errors.length > 1) detail += ' (+' + (errors.length - 1) + ' more)';
    } else if (warnings.length) {
      level = 'is-warn';
      icon = 'alert-circle';
      title = 'Heads up';
      const firstWarning = warnings[0];
      detail = typeof firstWarning === 'string' ? firstWarning : firstWarning.msg;
      hint = typeof firstWarning === 'string' ? '' : firstWarning.hint || '';
      jumpLine = typeof firstWarning === 'string' ? 0 : firstWarning.line || 0;
      fix = typeof firstWarning === 'string' ? null : firstWarning.fix || null;
      if (warnings.length > 1) detail += ' (+' + (warnings.length - 1) + ' more)';
    }

    const fixButton = fix ? '<button class="banner-fix" type="button" data-fix-kind="' +
      escapeHtml(fix.kind) + '" data-fix-line="' + (fix.line || jumpLine || 1) +
      '" data-fix-command="' + escapeHtml(fix.command || '') + '">' +
      (fix.kind === 'strip-dollars' ? 'Remove $$' : fix.kind === 'balance-left-right' ? 'Balance' : 'Fix') +
      '</button>' : '';

    banner.className = 'syntax-banner ' + level;
    banner.innerHTML =
      '<i data-lucide="' + icon + '"></i>' +
      '<div class="syntax-copy"><strong>' + escapeHtml(title) + '</strong>' +
      '<span>' + escapeHtml(detail) +
      (hint ? ' <span class="banner-hint">' + escapeHtml(hint) + '</span>' : '') +
      (jumpLine ? ' <button class="banner-jump" type="button" data-jump-line="' + jumpLine + '">Go to line ' + jumpLine + '</button>' : '') +
      fixButton +
      '</span></div>';
    banner.title = errors.concat(warnings.map((w) => ({ msg: typeof w === 'string' ? w : w.msg }))).map((e) => e.msg).join('\n');
    refreshIcons();

    const badge = $('#liveBadge');
    if (badge) badge.classList.toggle('is-warn', errors.length > 0 || warnings.length > 0);
    const status = $('#renderStatus');
    if (status) status.textContent = errors.length ? 'Needs attention' : 'Live';
  }

  function jumpToLine(line) {
    if (!cm || !line) return;
    const row = Math.max(0, Math.min(Number(line) - 1, cm.lineCount() - 1));
    cm.setCursor({ line: row, ch: 0 });
    cm.focus();
    cm.scrollIntoView({ line: row, ch: 0 }, 80);
  }

  function replaceEditorLine(line, nextLine) {
    if (!cm) return;
    const row = Math.max(0, Math.min(Number(line) - 1, cm.lineCount() - 1));
    const oldLine = cm.getLine(row) || '';
    cm.replaceRange(nextLine, { line: row, ch: 0 }, { line: row, ch: oldLine.length });
    markDirty();
    cm.setCursor({ line: row, ch: Math.min(nextLine.length, nextLine.indexOf('$') >= 0 ? nextLine.indexOf('$') + 1 : nextLine.length) });
    renderNow({ manual: true });
  }

  function applyDiagnosticFix(kind, line, command) {
    if (!cm || !kind) return;
    const row = Math.max(0, Math.min(Number(line) - 1, cm.lineCount() - 1));
    const current = cm.getLine(row) || '';
    let next = current;
    let message = 'Issue fixed';

    if (kind === 'strip-dollars') {
      next = current.replace(/\$\$/g, '');
      message = 'Removed nested $$';
    } else if (kind === 'balance-left-right') {
      const lefts = (current.match(/\\left(?![A-Za-z])/g) || []).length;
      const rights = (current.match(/\\right(?![A-Za-z])/g) || []).length;
      if (lefts > rights) {
        next = current.replace(/\s*$/, '') + ' \\right.';
        message = 'Added the missing \\right';
      } else if (rights > lefts) {
        const indent = (current.match(/^\s*/) || [''])[0];
        next = indent + '\\left. ' + current.slice(indent.length);
        message = 'Added the missing \\left';
      }
    } else if (kind === 'wrap-command') {
      const cmd = String(command || '').trim();
      if (!cmd) return;
      const content = current.trim();
      const probe = content.replace(/\\[A-Za-z]+/g, ' ')
        .replace(/[0-9\s{}[\]().,;:^_+\-*\/=<>|&!]/g, '');
      if (!/[A-Za-z]/.test(probe) && content.indexOf('$') < 0) {
        const indent = (current.match(/^\s*/) || [''])[0];
        next = indent + '$' + content + '$';
      } else {
        const at = current.indexOf(cmd);
        if (at < 0) return;
        next = current.slice(0, at) + '$' + cmd + '$' + current.slice(at + cmd.length);
      }
      message = 'Wrapped the math command';
    }

    if (next === current) {
      toast('Nothing to fix on this line', 'info');
      return;
    }
    replaceEditorLine(row + 1, next);
    toast(message, 'success');
  }

  function diagnosticItems(analysis, ctx, refs) {
    const items = [];
    const seen = new Set();
    const add = (item) => {
      const key = item.severity + '|' + item.msg + '|' + (item.line || 0);
      if (seen.has(key)) return;
      seen.add(key);
      items.push(item);
    };
    (analysis.errors || []).forEach((error) => add(Object.assign({ severity: 'error' }, error)));
    (analysis.warnings || []).forEach((warning) => {
      add(Object.assign({ severity: 'warning' }, typeof warning === 'string' ? { msg: warning } : warning));
    });
    (ctx && ctx.errors ? ctx.errors : []).forEach((msg) => add({ severity: 'error', msg: String(msg) }));
    (ctx && ctx.warnings ? ctx.warnings : []).forEach((msg) => {
      add({ severity: 'warning', msg: typeof msg === 'string' ? msg : msg.msg });
    });
    const index = refs || (ctx && ctx.references) || { missing: [], duplicates: [], unused: [] };
    (index.missing || []).forEach((ref) => add({
      severity: 'error',
      msg: 'Missing label “' + ref.name + '”.',
      hint: 'Define it with \\label{' + ref.name + '} or fix the reference.',
      line: ref.line,
      refName: ref.name
    }));
    const duplicateNames = new Set();
    (index.duplicates || []).forEach((label) => {
      if (duplicateNames.has(label.name)) return;
      duplicateNames.add(label.name);
      add({
        severity: 'error',
        msg: 'Duplicate label “' + label.name + '”.',
        hint: 'Each label must be unique; rename one definition.',
        line: label.line
      });
    });
    const citations = (ctx && ctx.citations) || { missing: [], occurrences: [] };
    (citations.missing || []).forEach((key) => {
      const first = (citations.occurrences || []).find((entry) => entry.name === key);
      add({
        severity: 'error',
        msg: 'Missing bibliography entry “' + key + '”.',
        hint: 'Import a .bib file, add the entry in Bibliography, or define it with \\bibitem in a thebibliography block.',
        line: first && first.line
      });
    });
    (index.unused || []).forEach((label) => add({
      severity: 'info',
      msg: 'Unused label “' + label.name + '”.',
      hint: 'Add a reference or remove the label.',
      line: label.line
    }));
    return items.sort((a, b) => (a.severity === 'error' ? -1 : b.severity === 'error' ? 1 : 0) ||
      ((a.line || 0) - (b.line || 0)));
  }

  function updateProblemsBadge(items) {
    const count = $('#problemsCount');
    if (!count) return;
    const total = (items || []).length;
    count.textContent = total > 99 ? '99+' : String(total);
    count.hidden = total === 0;
  }

  let problemsTab = 'problems';

  function problemDiagnostics() {
    const source = cm ? cm.getValue() : '';
    const analysis = analyzeSource(source);
    const result = compileDocument(source);
    const refs = result.ctx.references || parseReferenceIndex(source);
    return {
      source,
      analysis,
      result,
      refs,
      items: diagnosticItems(analysis, result.ctx, refs)
    };
  }

  function issueRows(items) {
    if (!items.length) {
      return '<div class="panel-empty"><i data-lucide="check-circle-2"></i><strong>No problems found</strong><span>Braces, math delimiters, environments and references look good.</span></div>';
    }
    return items.map((item) => {
      const fix = item.fix;
      const line = item.line || 0;
      return '<div class="issue-row is-' + escapeHtml(item.severity) + '">' +
        '<button class="issue-main" type="button"' + (line ? ' data-jump-line="' + line + '"' : '') + '>' +
        '<i data-lucide="' + (item.severity === 'error' ? 'alert-triangle' : item.severity === 'warning' ? 'alert-circle' : 'info') + '"></i>' +
        '<span class="issue-copy"><strong>' + escapeHtml(item.msg) + '</strong>' +
        (item.hint ? '<span>' + escapeHtml(item.hint) + '</span>' : '') + '</span>' +
        (line ? '<span class="issue-line">Ln ' + line + '</span>' : '') + '</button>' +
        (fix ? '<button class="issue-fix" type="button" data-fix-kind="' + escapeHtml(fix.kind) +
          '" data-fix-line="' + (fix.line || line || 1) + '" data-fix-command="' + escapeHtml(fix.command || '') +
          '">' + (fix.kind === 'strip-dollars' ? 'Remove $$' : fix.kind === 'balance-left-right' ? 'Balance' : 'Fix') + '</button>' : '') +
        '</div>';
    }).join('');
  }

  function outlineRows(items) {
    if (!items.length) return '<div class="panel-empty"><i data-lucide="list"></i><strong>No outline yet</strong><span>Add a \\section or an equation to see it here.</span></div>';
    const icons = { heading: 'hash', equation: 'sigma', figure: 'image', table: 'table' };
    return items.map((item) => '<button class="outline-row level-' + (item.level || 0) + '" type="button" data-jump-line="' + item.line + '">' +
      '<i data-lucide="' + (icons[item.type] || 'dot') + '"></i><span>' + escapeHtml(item.title) + '</span><span class="issue-line">Ln ' + item.line + '</span></button>').join('');
  }

  function referenceRows(refs, ctx) {
    const used = {};
    (refs.refs || []).forEach((ref) => { used[ref.name] = (used[ref.name] || 0) + 1; });
    const labelRows = (refs.labels || []).length
      ? refs.labels.map((label) => '<button class="ref-row" type="button" data-jump-line="' + label.line + '">' +
        '<span class="ref-name">' + escapeHtml(label.name) + '</span>' +
        '<span class="ref-kind">' + escapeHtml(label.kind) + (label.number ? ' ' + escapeHtml(label.number) : '') + '</span>' +
        '<span class="ref-uses">' + (used[label.name] || 0) + ' use' + ((used[label.name] || 0) === 1 ? '' : 's') + '</span></button>').join('')
      : '<p class="panel-empty-inline">No labels yet. Add \\label{name} inside an equation or section.</p>';
    const missingRows = (refs.missing || []).length
      ? refs.missing.map((ref) => '<button class="ref-row is-missing" type="button" data-jump-line="' + ref.line + '">' +
        '<span class="ref-name">' + escapeHtml(ref.name) + '</span><span class="ref-kind">missing · Ln ' + ref.line + '</span></button>').join('')
      : '<p class="panel-empty-inline">No missing references.</p>';
    const citations = (ctx && ctx.citations) || parseCitations(cm ? cm.getValue() : '');
    const bibEntries = Array.from(citations.entryMap ? citations.entryMap.values() : []);
    const citeRows = (citations.order || []).length
      ? citations.order.map((key) => {
        const entry = citations.entryMap.get(key);
        const first = (citations.occurrences || []).find((item) => item.name === key);
        const uses = citations.counts.get(key) || 0;
        const number = citations.numbers ? citations.numbers.get(key) : null;
        return '<button class="ref-row' + (entry ? '' : ' is-missing') + '" type="button"' +
          (first ? ' data-jump-line="' + first.line + '"' : '') + '>' +
          '<span class="ref-name">' + escapeHtml(key) + '</span>' +
          '<span class="ref-kind">' + (entry ? '[' + number + ']' + (entry.year ? ' · ' + escapeHtml(entry.year) : '') : 'missing entry') + '</span>' +
          '<span class="ref-uses">' + uses + ' cite' + (uses === 1 ? '' : 's') + '</span></button>';
      }).join('')
      : '<p class="panel-empty-inline">No \\cite commands yet. Add \\cite{key} or open Bibliography to import a .bib file.</p>';
    const bibRows = bibEntries.length
      ? bibEntries.slice(0, 60).map((entry) => '<div class="ref-row is-static">' +
        '<span class="ref-name">' + escapeHtml(entry.key) + '</span>' +
        '<span class="ref-kind">' + escapeHtml(entry.type) + (entry.year ? ' · ' + escapeHtml(entry.year) : '') + '</span>' +
        '<span class="ref-uses">' + (citations.counts.get(entry.key) || 0) + ' use' + ((citations.counts.get(entry.key) || 0) === 1 ? '' : 's') + '</span></div>').join('')
      : '<p class="panel-empty-inline">No bibliography loaded. Open Bibliography to import or paste BibTeX.</p>';
    return '<div class="ref-summary">' +
      '<span><strong>' + (refs.labels || []).length + '</strong> labels</span>' +
      '<span><strong>' + (refs.refs || []).length + '</strong> references</span>' +
      '<span><strong>' + (refs.missing || []).length + '</strong> missing</span>' +
      '<span><strong>' + (citations.order || []).length + '</strong> citations</span></div>' +
      '<section class="ref-section"><h4>Citations</h4>' + citeRows + '</section>' +
      '<section class="ref-section"><h4>Bibliography library · ' + bibEntries.length + ' entries</h4>' + bibRows + '</section>' +
      '<section class="ref-section"><h4>Defined labels</h4>' + labelRows + '</section>' +
      '<section class="ref-section"><h4>Missing references</h4>' + missingRows + '</section>';
  }

  function renderProblemsView(state) {
    const view = $('#problemsView');
    if (!view) return;
    const items = state ? state.items : problemDiagnostics().items;
    const refs = state ? state.refs : null;
    const count = $('#problemsTabCount');
    if (count) count.textContent = String(items.length);
    if (problemsTab === 'outline') {
      view.innerHTML = outlineRows(parseOutline(cm ? cm.getValue() : ''));
    } else if (problemsTab === 'references') {
      view.innerHTML = referenceRows(
        refs || parseReferenceIndex(cm ? cm.getValue() : ''),
        state && state.result ? state.result.ctx : null
      );
    } else {
      view.innerHTML = issueRows(items);
    }
    refreshIcons();
  }

  function openProblems(tab) {
    problemsTab = tab || 'problems';
    const state = problemDiagnostics();
    $$('#problemsTabs [data-problems-tab]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.problemsTab === problemsTab);
    });
    renderProblemsView(state);
    openModal('#problemsModal');
  }

  /* ------------------------------------------------------------------ *
   *  Editing prose on the sheet
   * ------------------------------------------------------------------ */
  let sheetEdit = null;
  let lastEditMap = null;
  let sheetFocusIndex = -1;

  function sheetBlockFor(node) {
    const preview = $('#preview');
    if (!preview || !node || !node.closest) return null;
    const block = node.closest('p[data-src], h2[data-src], h3[data-src], h4[data-src], h5[data-src]');
    if (!block || !preview.contains(block)) return null;
    if (block.closest('table, figure, .doc-toc')) return null;
    return block;
  }

  function sheetSourceRange(block) {
    if (!lastEditMap || !block) return null;
    const parts = String(block.getAttribute('data-src') || '').split(':');
    const from = Number(parts[0]);
    const to = Number(parts[1]);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return null;
    const start = lastEditMap.map[lastEditMap.bodyStart + from];
    const end = lastEditMap.map[lastEditMap.bodyStart + to];
    if (start === undefined || end === undefined || end < start) return null;
    return { start, end };
  }

  function discardSheetEdit() {
    if (!sheetEdit) return;
    const current = sheetEdit;
    sheetEdit = null;
    if (current.wrap && current.wrap.parentNode) current.wrap.parentNode.removeChild(current.wrap);
    if (current.block) current.block.style.display = '';
  }

  function finishSheetEdit(commit) {
    if (!sheetEdit || !cm) return;
    const current = sheetEdit;
    const value = current.editor.value;
    const previous = cm.getValue().slice(current.start, current.end);
    const index = Array.from(document.querySelectorAll('#preview [data-src]')).indexOf(current.block);
    sheetEdit = null;
    if (current.wrap && current.wrap.parentNode) current.wrap.parentNode.removeChild(current.wrap);
    if (current.block) current.block.style.display = '';
    if (!commit || value === previous) {
      /* Cancelling returns the caret to the passage that was being edited. */
      if (current.block && current.block.focus) {
        try { current.block.focus({ preventScroll: true }); } catch (_) { current.block.focus(); }
      }
      return;
    }
    /* The preview re-renders after the splice, so remember the passage by its
       position in the sheet and focus the new node once it exists. */
    sheetFocusIndex = index;
    cm.replaceRange(value, cm.posFromIndex(current.start), cm.posFromIndex(current.end));
    toast('Sheet edit written to the source', 'success');
  }

  function startSheetEdit(block) {
    if (!cm || !block) return;
    const range = sheetSourceRange(block);
    if (!range) return;
    sheetFocusIndex = -1;
    discardSheetEdit();
    const value = cm.getValue().slice(range.start, range.end);
    const wrap = document.createElement('div');
    wrap.className = 'sheet-edit';
    wrap.innerHTML =
      '<textarea class="sheet-editor" spellcheck="false" aria-label="Edit this passage on the sheet"></textarea>' +
      '<div class="sheet-edit-actions">' +
      '<span class="sheet-edit-hint">Editing in place \u00b7 Esc cancels \u00b7 Ctrl/Cmd + Enter saves</span>' +
      '<button type="button" class="btn btn-teal btn-sm" data-sheet-done>Done</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-sheet-cancel>Cancel</button>' +
      '</div>';
    const editor = wrap.querySelector('textarea');
    editor.value = value;
    block.style.display = 'none';
    block.parentNode.insertBefore(wrap, block.nextSibling);
    sheetEdit = { block, wrap, editor, start: range.start, end: range.end };
    const fit = () => {
      editor.style.height = 'auto';
      editor.style.height = Math.max(40, editor.scrollHeight + 2) + 'px';
    };
    editor.addEventListener('input', fit);
    editor.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        finishSheetEdit(true);
      }
    });
    /* Escape cancels from anywhere in the editor, including the buttons. */
    wrap.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      finishSheetEdit(false);
    });
    const done = wrap.querySelector('[data-sheet-done]');
    const cancel = wrap.querySelector('[data-sheet-cancel]');
    done.addEventListener('mousedown', (event) => event.preventDefault());
    cancel.addEventListener('mousedown', (event) => event.preventDefault());
    done.addEventListener('click', () => finishSheetEdit(true));
    cancel.addEventListener('click', () => finishSheetEdit(false));
    fit();
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
  }

  function sheetEditTarget(event) {
    const target = event && event.target;
    if (!target || !target.closest) return null;
    if (target.closest('a, .katex, .sheet-edit, .doc-toc')) return null;
    const selection = window.getSelection ? String(window.getSelection()) : '';
    if (selection.trim()) return null;
    return sheetBlockFor(target);
  }

  function bindSheetEditing() {
    const preview = $('#preview');
    if (!preview) return;
    const toggle = $('#sheetEditBtn');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const on = !preview.classList.contains('is-sheet-edit');
        preview.classList.toggle('is-sheet-edit', on);
        toggle.setAttribute('aria-pressed', String(on));
        toast(on
          ? 'Sheet editing on \u2014 click a paragraph or heading in the preview.'
          : 'Sheet editing off.', 'info');
      });
    }
    preview.addEventListener('dblclick', (event) => {
      const block = sheetEditTarget(event);
      if (!block) return;
      event.preventDefault();
      startSheetEdit(block);
    });
    preview.addEventListener('click', (event) => {
      if (!preview.classList.contains('is-sheet-edit')) return;
      const block = sheetEditTarget(event);
      if (!block) return;
      event.preventDefault();
      startSheetEdit(block);
    });
    /* Keyboard: Tab reaches each editable passage, Enter or Space opens it. */
    /* Any real interaction means the saved passage no longer needs the caret. */
    document.addEventListener('pointerdown', () => { sheetFocusIndex = -1; }, true);
    document.addEventListener('keydown', () => { sheetFocusIndex = -1; }, true);
    preview.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (!target || !target.closest || target !== target.closest('[data-src]')) return;
      event.preventDefault();
      startSheetEdit(target);
    });
  }

  function renderNow(options) {
    if (!cm) return;
    const opts = options || {};
    const preview = $('#preview');
    if (!preview) return;
    discardSheetEdit();

    const started = performance.now();
    const result = compileDocument(cm.getValue());
    lastEditMap = (result.ctx && result.ctx.editMap) || null;

    preview.classList.remove('is-stale');
    preview.classList.toggle('is-empty', !result.html.trim());
    preview.innerHTML = result.html.trim()
      ? result.html
      : '<div class="doc-empty"><strong>Nothing to render yet</strong>' +
        '<span>Start typing LaTeX in the editor — the preview updates as you go.</span></div>';

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(preview, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false,
          strict: false,
          macros: Object.assign({}, MACROS, (result.ctx && result.ctx.macros) || {}),
          preProcess: (math) => expandPhysicsMacros(math),
          errorColor: '#DC2626'
        });
      } catch (err) {
        console.warn('SciDocs: auto-render pass failed', err);
      }
    }

    const ms = Math.max(1, Math.round(performance.now() - started));
    const time = $('#renderTime');
    if (time) time.textContent = ms + ' ms';

    const analysis = analyzeSource(cm.getValue());
    updateBanner(analysis, result.ctx);
    updateProblemsBadge(diagnosticItems(analysis, result.ctx, result.ctx.references));

    const eqTag = $('#equationTag');
    if (eqTag) {
      const eq = result.ctx.counters.equation;
      eqTag.textContent = eq + (eq === 1 ? ' equation' : ' equations');
    }

    updateStats();

    if (sheetFocusIndex >= 0) {
      const blocks = preview.querySelectorAll('[data-src]');
      const target = blocks[Math.min(sheetFocusIndex, blocks.length - 1)];
      if (target) {
        try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
      }
    }

    if (opts.manual) {
      toast('Compiled in ' + ms + ' ms', result.ctx.errors.length ? 'warn' : 'success');
    }
  }

  const scheduleRender = debounce(() => renderNow(), 240);

  /* ------------------------------------------------------------------ *
   *  Editor
   * ------------------------------------------------------------------ */
  const MATH_ENVIRONMENTS = new Set([
    'math', 'displaymath', 'equation', 'equation*', 'align', 'align*',
    'alignat', 'alignat*', 'gather', 'gather*', 'multline', 'multline*',
    'flalign', 'flalign*', 'eqnarray', 'eqnarray*', 'split', 'aligned',
    'gathered', 'cases', 'matrix', 'pmatrix', 'bmatrix', 'Bmatrix',
    'vmatrix', 'Vmatrix', 'array', 'smallmatrix'
  ]);

  function mathModeAt(source, index) {
    const text = String(source || '');
    const limit = Math.max(0, Math.min(Number(index) || 0, text.length));
    /* A cursor sitting between the two dollars of a $$ pair is still inside
       the display delimiters; the scanner would otherwise have closed them. */
    if (limit > 0 && text.charAt(limit - 1) === '$' && text.charAt(limit) === '$') {
      return true;
    }
    let inline = false;
    let display = false;
    let environments = 0;

    for (let i = 0; i < limit; i++) {
      const ch = text[i];
      if (ch === '%') {
        while (i < limit && text[i] !== '\n') i++;
        continue;
      }
      if (ch === '\\') {
        const env = /^\\(begin|end)\s*\{([A-Za-z*]+)\}/.exec(text.slice(i, i + 40));
        if (env) {
          if (MATH_ENVIRONMENTS.has(env[2])) {
            environments += env[1] === 'begin' ? 1 : -1;
          }
          i += env[0].length - 1;
          continue;
        }
        if (text[i + 1] === '(') inline = true;
        else if (text[i + 1] === ')') inline = false;
        else if (text[i + 1] === '[') display = true;
        else if (text[i + 1] === ']') display = false;
        i++;
        continue;
      }
      if (ch === '$') {
        if (text[i + 1] === '$') {
          display = !display;
          i++;
        } else if (!display) {
          inline = !inline;
        }
      }
    }
    return display || inline || environments > 0;
  }

  function findNestedDisplayMath(source) {
    const text = String(source || '');
    const found = [];
    const seen = new Set();
    let inline = false;
    let display = false;
    let environments = 0;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '%') {
        while (i < text.length && text[i] !== '\n') i++;
        continue;
      }
      if (ch === '\\') {
        if (text[i + 1] === '\\') {
          i++;
          continue;
        }
        const env = /^\\(begin|end)\s*\{([A-Za-z*]+)\}/.exec(text.slice(i, i + 40));
        if (env) {
          if (MATH_ENVIRONMENTS.has(env[2])) {
            environments += env[1] === 'begin' ? 1 : -1;
          }
          i += env[0].length - 1;
          continue;
        }
        if (text[i + 1] === '(') inline = true;
        else if (text[i + 1] === ')') inline = false;
        else if (text[i + 1] === '[') display = true;
        else if (text[i + 1] === ']') display = false;
        i++;
        continue;
      }
      if (ch === '$') {
        if (text[i + 1] === '$') {
          const line = lineOf(text, i);
          if (environments > 0 || inline) {
            const key = line + ':env';
            if (!seen.has(key)) {
              seen.add(key);
              found.push({ line, where: environments > 0 ? 'environment' : 'inline math' });
            }
          } else {
            display = !display;
          }
          i++;
        } else {
          inline = !inline;
        }
      }
    }
    return found;
  }

  function mathDelimiterSnippet(kind, hasSelection) {
    const inner = hasSelection ? CURSOR : CURSOR + ' ';
    return kind === 'display' ? '$$' + inner + '$$' : '$' + inner + '$';
  }

  function separateMathSnippet(snippet, startIndex, endIndex) {
    const source = cm.getValue();
    let text = snippet;
    if (source.charAt(startIndex - 1) === '$' && text.charAt(0) === '$') {
      text = ' ' + text;
    }
    if (source.charAt(endIndex) === '$' && /\$$/.test(text)) {
      text += ' ';
    }
    return text;
  }

  function wrapMath(kind) {
    if (!cm) return;
    const from = cm.getCursor('from');
    const to = cm.getCursor('to');
    const startIndex = cm.indexFromPos(from);
    const endIndex = cm.indexFromPos(to);
    if (mathModeAt(cm.getValue(), startIndex)) {
      toast('Already inside math mode — no extra $ added.', 'info');
      cm.focus();
      return;
    }
    const snippet = mathDelimiterSnippet(kind, !!cm.getSelection());
    insertSnippet(separateMathSnippet(snippet, startIndex, endIndex));
  }

  function insertSymbol(item, isMath) {
    if (!item || !cm) return;
    const snippet = String(item.insert || '');
    if (!snippet.trim()) return;

    const from = cm.getCursor('from');
    const to = cm.getCursor('to');
    const startIndex = cm.indexFromPos(from);
    const endIndex = cm.indexFromPos(to);
    const inMath = mathModeAt(cm.getValue(), startIndex);

    /* The Inline math / Display math items are complete expressions, not
       symbols. Wrapping them again creates $$$$; inserting them inside math
       creates nested delimiters. */
    if (isMath && /^\s*\${1,2}/.test(snippet)) {
      if (inMath) {
        toast('Already inside math mode — no extra $ added.', 'info');
        cm.focus();
        return;
      }
      const kind = /^\s*\$\$/.test(snippet) ? 'display' : 'inline';
      const delimiter = mathDelimiterSnippet(kind, !!cm.getSelection());
      insertSnippet(separateMathSnippet(delimiter, startIndex, endIndex));
      return;
    }

    /* Sections, equations, tables and other document blocks are invalid
       inside an existing math expression. */
    if (!isMath) {
      if (inMath) {
        toast('Move outside math mode before inserting a document block.', 'info');
        cm.focus();
        return;
      }
      insertSnippet(snippet);
      return;
    }

    let text = snippet;
    if (!inMath) {
      const body = snippet.trim();
      text = '$' + body + (body.indexOf(CURSOR) === -1 ? CURSOR : '') + '$ ';
      text = separateMathSnippet(text, startIndex, endIndex);
    }
    insertSnippet(text);
  }

  /* Snippets may contain several placeholders: [[CURSOR]] is the first stop,
     [[CURSOR:2]], [[CURSOR:3]]… follow it. Tab walks forward, Shift-Tab back. */
  const CURSOR_STOP_RE = /\[\[CURSOR(?::(\d+))?\]\]/g;
  let snippetTour = null;

  function snippetTourEnd() {
    if (!snippetTour) return;
    snippetTour.marks.forEach((mark) => { try { mark.clear(); } catch (_) { /* ignore */ } });
    snippetTour = null;
  }

  function snippetTourJump(direction) {
    if (!snippetTour) return false;
    if (!cm || snippetTour.doc !== cm.getDoc()) { snippetTourEnd(); return false; }
    const index = snippetTour.at + direction;
    if (index < 0 || index >= snippetTour.marks.length) {
      /* Past the last stop the walk ends and the key press is swallowed, so it
         cannot leave a stray indentation inside the snippet. */
      snippetTourEnd();
      return true;
    }
    const pos = snippetTour.marks[index].find();
    if (!pos) { snippetTourEnd(); return false; }
    snippetTour.at = index;
    cm.setCursor(pos);
    cm.scrollIntoView(pos, 60);
    return true;
  }

  function insertSnippet(snippet) {
    if (!cm) return;
    const doc = cm.getDoc();
    const from = doc.getCursor('from');
    const selection = doc.getSelection();
    const source = String(snippet || '');
    const stops = [];
    let cleaned = '';
    let last = 0;
    let match;
    CURSOR_STOP_RE.lastIndex = 0;
    while ((match = CURSOR_STOP_RE.exec(source)) !== null) {
      cleaned += source.slice(last, match.index);
      stops.push({ order: match[1] ? Number(match[1]) : 1, offset: cleaned.length });
      last = match.index + match[0].length;
    }
    cleaned += source.slice(last);
    stops.sort((a, b) => (a.order - b.order) || (a.offset - b.offset));

    let text = cleaned;
    let cursorOffset = text.length;
    if (stops.length) {
      cursorOffset = stops[0].offset;
      if (selection) {
        text = text.slice(0, stops[0].offset) + selection + text.slice(stops[0].offset);
        cursorOffset = stops[0].offset + selection.length;
        stops.slice(1).forEach((stop) => { stop.offset += selection.length; });
      }
    }

    const startIndex = doc.indexFromPos(from);
    snippetTourEnd();
    doc.replaceSelection(text, 'end');
    if (stops.length > 1) {
      snippetTour = {
        doc,
        at: 0,
        marks: stops.map((stop) => doc.setBookmark(doc.posFromIndex(startIndex + stop.offset)))
      };
    }
    doc.setCursor(doc.posFromIndex(startIndex + cursorOffset));
    cm.focus();
  }

  let mathCommandCache = null;

  function mathCommandSet() {
    if (mathCommandCache) return mathCommandCache;
    const names = new Set([
      '\\frac', '\\dfrac', '\\tfrac', '\\sqrt', '\\sum', '\\prod', '\\int',
      '\\lim', '\\left', '\\right', '\\text', '\\mathrm', '\\mathbf', '\\mathit',
      '\\mathcal', '\\mathbb', '\\operatorname', '\\binom', '\\overline', '\\underline',
      '\\hat', '\\vec', '\\dot', '\\ddot', '\\partial', '\\nabla', '\\infty',
      '\\to', '\\mapsto', '\\times', '\\cdot', '\\pm', '\\leq', '\\geq', '\\neq'
    ]);
    SYMBOL_GROUPS.forEach((group) => {
      if (group.id === 'structure') return;
      (group.items || []).forEach((item) => {
        const match = /\\[A-Za-z]+/.exec(String(item.insert || ''));
        if (match && match[0] !== '\\begin' && match[0] !== '\\end') names.add(match[0]);
      });
    });
    mathCommandCache = names;
    return names;
  }

  function findMathCommandsOutsideMath(source) {
    const text = maskMacroDefs(source);
    const names = mathCommandSet();
    const found = [];
    const seen = new Set();
    let inline = false;
    let display = false;
    let environments = 0;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '%') {
        while (i < text.length && text[i] !== '\n') i++;
        continue;
      }
      if (ch === '\\') {
        if (text[i + 1] === '\\') {
          i++;
          continue;
        }
        const env = /^\\(begin|end)\s*\{([A-Za-z*]+)\}/.exec(text.slice(i, i + 40));
        if (env) {
          if (MATH_ENVIRONMENTS.has(env[2])) {
            environments += env[1] === 'begin' ? 1 : -1;
          }
          i += env[0].length - 1;
          continue;
        }
        const command = /^\\[A-Za-z]+/.exec(text.slice(i, i + 40));
        if (command && !inline && !display && environments === 0 && names.has(command[0]) && !seen.has(command[0])) {
          seen.add(command[0]);
          found.push({ name: command[0], line: lineOf(text, i) });
        }
        if (text[i + 1] === '(') inline = true;
        else if (text[i + 1] === ')') inline = false;
        else if (text[i + 1] === '[') display = true;
        else if (text[i + 1] === ']') display = false;
        i++;
        continue;
      }
      if (ch === '$') {
        if (text[i + 1] === '$') {
          display = !display;
          i++;
        } else if (!display) {
          inline = !inline;
        }
      }
    }
    return found;
  }

  let latexHintCache = null;

  function latexHintCommands() {
    if (latexHintCache) return latexHintCache;
    const commands = new Set([
      '\\documentclass', '\\usepackage', '\\begin', '\\end', '\\section', '\\subsection',
      '\\subsubsection', '\\paragraph', '\\label', '\\ref', '\\eqref', '\\cite', '\\caption',
      '\\includegraphics', '\\item', '\\hline', '\\maketitle', '\\tableofcontents',
      '\\newcommand', '\\renewcommand', '\\frac', '\\dfrac', '\\sqrt', '\\sum', '\\prod',
      '\\int', '\\lim', '\\left', '\\right', '\\text', '\\mathrm', '\\mathbf', '\\mathit',
      '\\mathcal', '\\mathbb', '\\operatorname', '\\binom', '\\overline', '\\underline',
      '\\hat', '\\vec', '\\dot', '\\ddot', '\\partial', '\\nabla', '\\infty', '\\to', '\\mapsto'
    ]);
    Object.keys(MACROS).forEach((key) => commands.add(key));
    SYMBOL_GROUPS.forEach((group) => {
      (group.items || []).forEach((item) => {
        let text = '';
        if (Array.isArray(item)) text = item[0];
        else if (item && typeof item === 'object') text = item.display || item.text || item.insert || '';
        const match = /\\[A-Za-z]+/.exec(String(text));
        if (match) commands.add(match[0]);
      });
    });
    latexHintCache = Array.from(commands).sort((a, b) => a.localeCompare(b));
    return latexHintCache;
  }

  function latexHint(instance) {
    const cur = instance.getCursor();
    const lineBefore = instance.getLine(cur.line).slice(0, cur.ch);
    const citeMatch = /\\(?:cite|citep|citet|citealp|autocite|parencite|textcite)\*?\s*(?:\[[^\]]*\]\s*){0,2}\{([^}]*)$/.exec(lineBefore);
    if (citeMatch) {
      const raw = citeMatch[1];
      const commaAt = raw.lastIndexOf(',');
      const done = new Set(raw.slice(0, commaAt + 1).split(',').map((key) => key.trim()).filter(Boolean));
      const tail = raw.slice(commaAt + 1);
      const lead = (tail.match(/^\s*/) || [''])[0].length;
      const term = tail.trim().toLowerCase();
      const keys = readBibEntries()
        .filter((entry) => !done.has(entry.key) && entry.key.toLowerCase().startsWith(term));
      if (keys.length) {
        return {
          list: keys.slice(0, 40).map((entry) => ({
            text: entry.key,
            displayText: entry.key + (entry.year ? ' · ' + entry.year : ''),
            className: 'cite-hint'
          })),
          from: window.CodeMirror.Pos(cur.line, cur.ch - tail.length + lead),
          to: cur
        };
      }
    }

    const refMatch = /\\(ref|eqref|autoref|pageref)\s*\{([^}]*)$/.exec(lineBefore);
    if (refMatch) {
      const term = refMatch[2].toLowerCase();
      const refIndex = parseReferenceIndex(instance.getValue());
      const labels = Array.from(new Set(refIndex.labels.map((label) => label.name)))
        .filter((name) => name.toLowerCase().startsWith(term));
      if (labels.length) {
        return {
          list: labels.slice(0, 40),
          from: window.CodeMirror.Pos(cur.line, cur.ch - refMatch[2].length),
          to: cur
        };
      }
    }

    const token = instance.getTokenAt(cur);
    const match = /\\[A-Za-z]*$/.exec(token.string);
    if (!match) return null;
    const term = match[0].slice(1).toLowerCase();
    if (!term) return null;
    const snippets = readSnippets()
      .filter((item) => item.trigger && item.trigger.slice(1).toLowerCase().startsWith(term))
      .map((item) => ({
        text: item.body,
        displayText: item.trigger + ' · ' + item.name,
        className: 'snippet-hint'
      }));
    const commands = latexHintCommands()
      .filter((cmd) => cmd.slice(1).toLowerCase().startsWith(term))
      .map((cmd) => ({ text: cmd, displayText: cmd }));
    const docMacros = Object.keys(collectUserMacros(instance.getValue()).macros)
      .filter((name) => name.slice(1).toLowerCase().startsWith(term))
      .map((name) => ({ text: name, displayText: name + ' · macro in this document' }));
    const list = snippets.concat(docMacros, commands);
    if (!list.length) return null;
    return {
      list: list.slice(0, 40),
      from: window.CodeMirror.Pos(cur.line, token.start + match.index),
      to: cur
    };
  }

  if (window.CodeMirror && window.CodeMirror.registerHelper) {
    window.CodeMirror.registerHelper('hint', 'stex', latexHint);
  }

  function showLatexHint() {
    if (cm && cm.showHint) cm.showHint({ hint: latexHint, completeSingle: false });
  }

  function initEditor() {
    const host = $('#editorHost');
    if (!host) return;

    if (!window.CodeMirror) {
      host.innerHTML =
        '<div class="doc-empty"><strong>Editor failed to load</strong>' +
        '<span>CodeMirror could not be fetched from the CDN. Check your connection and reload.</span></div>';
      toast('CodeMirror failed to load from the CDN.', 'error');
      return;
    }

    cm = window.CodeMirror(host, {
      value: activeProject().content,
      mode: 'stex',
      theme: 'midnight-lab',
      lineNumbers: true,
      lineWrapping: true,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      matchBrackets: true,
      autoCloseBrackets: true,
      styleActiveLine: true,
      viewportMargin: 40,
      extraKeys: {
        'Cmd-Enter': () => renderNow({ manual: true }),
        'Ctrl-Enter': () => renderNow({ manual: true }),
        'Cmd-S': () => {
          saveNow();
          toast('Saved locally', 'success');
        },
        'Ctrl-S': () => {
          saveNow();
          toast('Saved locally', 'success');
        },
        'Cmd-K': () => openNlp(),
        'Ctrl-K': () => openNlp(),
        'Ctrl-Space': showLatexHint,
        'Cmd-Space': showLatexHint,
        'Alt-/': showLatexHint,
        'Ctrl-F': 'findPersistent',
        'Cmd-F': 'findPersistent',
        'Ctrl-H': 'replace',
        'Cmd-Alt-F': 'replace',
        'Shift-Ctrl-F': 'replace',
        'F3': 'findPersistentNext',
        'Shift-F3': 'findPersistentPrev',
        'Tab': () => { if (!snippetTourJump(1)) cm.execCommand('defaultTab'); },
        'Shift-Tab': () => { if (!snippetTourJump(-1)) cm.execCommand('indentLess'); }
      }
    });

    cm.on('change', () => {
      markDirty();
      scheduleRender();
    });
    cm.on('cursorActivity', updateCursorPos);
    cm.on('mousedown', () => snippetTourEnd());
    updateCursorPos();
  }

  /* ------------------------------------------------------------------ *
   *  Symbol lab
   * ------------------------------------------------------------------ */
  const RECENT_KEY = 'latex-lab-recent-symbols-v1';
  const RECENT_LIMIT = 8;

  function readRecent() {
    try {
      const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      return Array.isArray(list)
        ? list.filter((item) => item && typeof item.insert === 'string' && item.insert).slice(0, RECENT_LIMIT)
        : [];
    } catch (_) {
      return [];
    }
  }

  function typesetSymbolMath(root) {
    if (!root) return;
    $$('[data-math]', root).forEach((el) => {
      const tex = el.getAttribute('data-math');
      if (!tex) return;
      if (window.katex) {
        try {
          el.innerHTML = window.katex.renderToString(expandPhysicsMacros(tex), Object.assign({}, KATEX_BASE, {
            displayMode: false
          }));
        } catch (_) {
          el.textContent = tex;
        }
      } else {
        el.textContent = tex;
      }
    });
  }

  function rememberSymbol(item, isMath) {
    if (!item || !item.insert) return;
    const entry = {
      insert: item.insert,
      label: item.label || item.display || item.insert,
      display: item.display || '',
      icon: item.icon || '',
      text: item.text || '',
      math: isMath !== false
    };
    const list = readRecent().filter((entryItem) => entryItem.insert !== entry.insert);
    list.unshift(entry);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_LIMIT)));
    } catch (_) { /* storage may be unavailable */ }
    renderRecent();
  }

  function announceSymbolInsert(item) {
    if (!window.matchMedia || !window.matchMedia('(max-width: 1100px)').matches) return;
    const label = String(item.label || item.display || item.insert || 'symbol').trim();
    toast('Inserted ' + label + ' at the cursor', 'success');
  }

  function renderRecent() {
    const panel = $('#recentPanel');
    const grid = $('#recentSymbols');
    if (!panel || !grid) return;
    const items = readRecent();
    const search = $('#symbolSearch');
    panel.hidden = items.length === 0 || !!(search && search.value.trim());
    if (!items.length) {
      grid.innerHTML = '';
      return;
    }
    grid.innerHTML = items.map((item, index) => {
      const tip = escapeHtml(String(item.insert).replace(/\n/g, ' '));
      const label = escapeHtml(item.label || item.insert);
      const base = 'type="button" class="sym-btn" data-recent-index="' + index +
        '" data-tip="' + tip + '" title="' + tip + '" aria-label="Insert ' + label + '"';
      if (item.icon) {
        return '<button ' + base + '><i data-lucide="' + item.icon + '"></i></button>';
      }
      if (item.text) {
        return '<button ' + base + '><span class="sym-label sym-text">' +
          escapeHtml(item.text) + '</span></button>';
      }
      return '<button ' + base + '><span class="sym-math" data-math="' +
        escapeHtml(item.display || item.insert) + '"></span></button>';
    }).join('');
    typesetSymbolMath(grid);
    refreshIcons();
  }

  function renderSymbols() {
    const host = $('#symbolGroups');
    if (!host) return;

    host.innerHTML = SYMBOL_GROUPS.map((group) => {
      const buttons = group.items
        .map((item, index) => {
          const label = escapeHtml(item.label || item.display || '');
          const tip = escapeHtml(item.insert.replace(/\n/g, ' '));
          const haystack = escapeHtml(
            ((item.label || '') + ' ' + (item.insert || '')).toLowerCase()
          );
          if (item.text) {
            return (
              '<button type="button" class="sym-btn has-label" data-group="' + group.id +
              '" data-index="' + index + '" data-tip="' + tip + '" data-search="' + haystack +
              '" title="' + tip + '" aria-label="Insert ' + label + '">' +
              '<span class="sym-label sym-text">' + escapeHtml(item.text) + '</span></button>'
            );
          }
          if (item.icon) {
            return (
              '<button type="button" class="sym-btn has-label" data-group="' + group.id +
              '" data-index="' + index + '" data-tip="' + tip + '" data-search="' + haystack +
              '" title="' + tip + '" aria-label="Insert ' + label + '">' +
              '<i data-lucide="' + item.icon + '"></i>' +
              '<span class="sym-label">' + label + '</span></button>'
            );
          }
          return (
            '<button type="button" class="sym-btn" data-group="' + group.id +
            '" data-index="' + index + '" data-tip="' + tip + '" data-search="' + haystack +
            '" title="' + tip + '" aria-label="Insert ' + label + '">' +
            '<span class="sym-math" data-math="' + escapeHtml(item.display) + '"></span></button>'
          );
        })
        .join('');

      return (
        '<details class="sym-group" data-kind="' + group.id + '" data-default-open="' +
        (group.open ? 'true' : 'false') + '"' + (group.open ? ' open' : '') + '>' +
        '<summary><span class="sym-title"><i data-lucide="' + group.icon + '"></i>' +
        escapeHtml(group.title) + '</span>' +
        '<span class="sym-count">' + group.items.length + '</span>' +
        '<i data-lucide="chevron-down" class="chev"></i></summary>' +
        '<div class="sym-grid">' + buttons + '</div></details>'
      );
    }).join('');

    refreshIcons();
    typesetSymbolMath(host);

    host.addEventListener('click', (event) => {
      const button = event.target.closest('.sym-btn');
      if (!button) return;
      const group = SYMBOL_GROUPS.find((g) => g.id === button.dataset.group);
      if (!group) return;
      const item = group.items[Number(button.dataset.index)];
      if (!item) return;
      const isMath = group.id !== 'structure' || item.math === true;
      insertSymbol(item, isMath);
      rememberSymbol(item, isMath);
      announceSymbolInsert(item);
    });
  }

  function filterSymbols(query) {
    /* Accept /sigma, \\sigma and sigma as the same search term. */
    const q = String(query || '').trim().toLowerCase().replace(/^[\\/]+/, '');
    $$('.sym-group').forEach((group) => {
      let matches = 0;
      $$('.sym-btn', group).forEach((btn) => {
        const show = !q || (btn.dataset.search || '').indexOf(q) !== -1;
        btn.hidden = !show;
        if (show) matches += 1;
      });
      group.hidden = matches === 0;
      group.open = q ? matches > 0 : group.dataset.defaultOpen === 'true';
    });
    const recent = $('#recentPanel');
    if (recent) recent.hidden = !!q || readRecent().length === 0;
  }

  /* ------------------------------------------------------------------ *
   *  Snippet and macro library
   * ------------------------------------------------------------------ */
  function readSnippets() {
    try {
      const list = JSON.parse(localStorage.getItem(SNIPPETS_KEY) || '[]');
      return Array.isArray(list)
        ? list.filter((item) => item && item.name && item.body).slice(0, SNIPPET_LIMIT)
        : [];
    } catch (_) {
      return [];
    }
  }

  function writeSnippets(list) {
    try {
      localStorage.setItem(SNIPPETS_KEY, JSON.stringify(list.slice(0, SNIPPET_LIMIT)));
    } catch (_) { /* storage may be unavailable */ }
  }

  function normalizeSnippetTrigger(value, name) {
    let trigger = String(value || '').trim();
    if (!trigger) trigger = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    trigger = trigger.replace(/^\\+/, '');
    return trigger ? '\\' + trigger : '';
  }

  function mathPreviewHtml(value, display) {
    const body = String(value || '').trim();
    if (!body || !window.katex) return '<pre class="snippet-code">' + escapeHtml(body) + '</pre>';
    let clean = body
      .replace(/^\$\$([\s\S]*)\$\$$/, '$1')
      .replace(/^\$([\s\S]*)\$$/, '$1')
      .replace(/^\\\[([\s\S]*)\\\]$/, '$1')
      .replace(/^\\\(([\s\S]*)\\\)$/, '$1')
      .trim();
    if (/\\newcommand|\\renewcommand|\\def\b/.test(clean)) {
      return '<pre class="snippet-code">' + escapeHtml(clean) + '</pre>';
    }
    try {
      return window.katex.renderToString(clean, {
        displayMode: Boolean(display),
        throwOnError: false,
        strict: false,
        macros: Object.assign({}, MACROS)
      });
    } catch (_) {
      return '<pre class="snippet-code">' + escapeHtml(clean) + '</pre>';
    }
  }

  function renderSnippetList() {
    const host = $('#snippetList');
    if (!host) return;
    const items = readSnippets();
    if (!items.length) {
      host.innerHTML = '<div class="panel-empty"><i data-lucide="library"></i><strong>No saved snippets</strong><span>Save an equation or macro above, then insert it from here.</span></div>';
      refreshIcons();
      return;
    }
    host.innerHTML = items.map((item) => {
      const kind = item.kind === 'macro' ? 'Macro' : 'Snippet';
      const display = /\$\$|\\begin\{(equation|align|gather|multline|pmatrix|bmatrix|vmatrix)/.test(item.body);
      return '<article class="snippet-card" data-snippet-card="' + escapeHtml(item.id) + '">' +
        '<div class="snippet-card-head"><strong>' + escapeHtml(item.name) + '</strong>' +
        '<span class="badge-soft">' + kind + '</span></div>' +
        '<div class="snippet-preview">' + mathPreviewHtml(item.body, display) + '</div>' +
        '<div class="snippet-card-foot"><code class="snippet-trigger">' + escapeHtml(item.trigger || '') + '</code>' +
        '<span class="snippet-actions"><button class="btn btn-ghost btn-xs" type="button" data-snippet-insert="' + escapeHtml(item.id) + '">Insert</button>' +
        '<button class="icon-btn icon-btn-danger" type="button" data-snippet-delete="' + escapeHtml(item.id) + '" aria-label="Delete ' + escapeHtml(item.name) + '"><i data-lucide="trash-2"></i></button></span></div>' +
        '</article>';
    }).join('');
    refreshIcons();
  }

  function openSnippets() {
    const name = $('#snippetName');
    const trigger = $('#snippetTrigger');
    const body = $('#snippetBody');
    if (name) name.value = '';
    if (trigger) trigger.value = '';
    if (body) body.value = cm ? cm.getSelection() : '';
    renderSnippetList();
    openModal('#snippetModal');
    setTimeout(() => { if (name) name.focus(); }, 40);
  }

  function saveSnippet() {
    const name = ($('#snippetName') && $('#snippetName').value.trim()) || '';
    const body = ($('#snippetBody') && $('#snippetBody').value.trim()) || '';
    if (!name || !body) {
      toast('Add a name and LaTeX body first', 'warn');
      return;
    }
    const trigger = normalizeSnippetTrigger($('#snippetTrigger') && $('#snippetTrigger').value, name);
    const kind = ($('#snippetKind') && $('#snippetKind').value) || 'snippet';
    const items = readSnippets();
    items.unshift({
      id: 's_' + Math.random().toString(36).slice(2, 9),
      name,
      trigger,
      body,
      kind,
      updatedAt: Date.now()
    });
    writeSnippets(items);
    $('#snippetName').value = '';
    $('#snippetTrigger').value = '';
    $('#snippetBody').value = '';
    renderSnippetList();
    toast('Snippet saved', 'success');
  }

  function insertSavedSnippet(id) {
    const item = readSnippets().find((entry) => entry.id === id);
    if (!item) return;
    closeModal('#snippetModal');
    insertSnippet(item.body);
    toast('Inserted ' + item.name, 'success');
  }

  function deleteSavedSnippet(id) {
    const items = readSnippets();
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    writeSnippets(items.filter((entry) => entry.id !== id));
    renderSnippetList();
    toast('Deleted ' + item.name, 'info');
  }

  /* ------------------------------------------------------------------ *
   *  Project images (data URLs kept inside the project record)
   * ------------------------------------------------------------------ */
  function imageBytes(images) {
    return Object.keys(images).reduce((sum, key) => sum + Math.round(images[key].length * 0.75), 0);
  }

  function openImages() {
    renderImageList();
    openModal('#imageModal');
  }

  function renderImageList() {
    const host = $('#imageList');
    if (!host) return;
    const images = projectImages();
    const keys = Object.keys(images);
    const meta = $('#imageMeta');
    if (meta) {
      const used = imageBytes(images);
      meta.textContent = keys.length + ' image' + (keys.length === 1 ? '' : 's') +
        ' · ' + (used < 1024 * 1024
          ? Math.round(used / 1024) + ' KB'
          : (used / 1024 / 1024).toFixed(1) + ' MB') +
        ' of ' + (IMAGE_TOTAL_BYTES / 1024 / 1024) + ' MB used';
    }
    if (!keys.length) {
      host.innerHTML = '<div class="panel-empty"><i data-lucide="image"></i><strong>No images attached</strong><span>Attach a PNG, JPEG, GIF or WebP, then reference it with \\includegraphics{filename}.</span></div>';
      refreshIcons();
      return;
    }
    host.innerHTML = keys.map((key) =>
      '<article class="image-card">' +
      '<img src="' + images[key] + '" alt="' + escapeHtml(key) + '" />' +
      '<div class="image-card-meta"><code>' + escapeHtml(key) + '</code>' +
      '<span>' + Math.round(images[key].length * 0.75 / 1024) + ' KB</span></div>' +
      '<div class="image-card-actions">' +
      '<button class="btn btn-ghost btn-xs" type="button" data-image-copy="' + escapeHtml(key) + '">Copy name</button>' +
      '<button class="btn btn-ghost btn-xs" type="button" data-image-delete="' + escapeHtml(key) + '">Remove</button>' +
      '</div></article>').join('');
    refreshIcons();
  }

  async function attachImageFiles(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    const images = projectImages();
    let bytes = imageBytes(images);
    let added = 0;
    for (const file of list) {
      if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) {
        toast(file.name + ' is not a PNG, JPEG, GIF or WebP.', 'warn');
        continue;
      }
      if (file.size > IMAGE_MAX_BYTES) {
        toast(file.name + ' is larger than 1.5 MB.', 'warn');
        continue;
      }
      if (Object.keys(images).length >= IMAGE_KEY_LIMIT) {
        toast('A project holds up to ' + IMAGE_KEY_LIMIT + ' images.', 'warn');
        break;
      }
      if (bytes + file.size > IMAGE_TOTAL_BYTES) {
        toast('Image storage is full (4 MB per project).', 'warn');
        break;
      }
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
      if (!IMAGE_DATA_URL.test(dataUrl)) {
        toast('Could not read ' + file.name + '.', 'error');
        continue;
      }
      const key = String(file.name || 'image').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 120);
      images[key] = dataUrl;
      bytes += file.size;
      added += 1;
    }
    if (added) {
      activeProject().images = images;
      persist();
      renderImageList();
      renderNow({ manual: true });
      toast(added + ' image' + (added === 1 ? '' : 's') + ' attached', 'success');
    } else {
      renderImageList();
    }
  }

  function deleteProjectImage(key) {
    const images = projectImages();
    if (!images[key]) return;
    delete images[key];
    persist();
    renderImageList();
    renderNow({ manual: true });
    toast('Removed ' + key, 'info');
  }

  /* ------------------------------------------------------------------ *
   *  Natural text → LaTeX converter
   * ------------------------------------------------------------------ */
  const SYMBOL_WORDS = [
    ['plus or minus', '\\pm'], ['minus or plus', '\\mp'],
    ['less than or equal to', '\\leq'], ['less than or equal', '\\leq'],
    ['greater than or equal to', '\\geq'], ['greater than or equal', '\\geq'],
    ['not equal to', '\\neq'], ['approximately equal to', '\\approx'],
    ['proportional to', '\\propto'], ['element of', '\\in'], ['belongs to', '\\in'],
    ['subset of', '\\subset'], ['for all', '\\forall'], ['there exists', '\\exists'],
    ['if and only if', '\\Leftrightarrow'], ['right arrow', '\\rightarrow'],
    ['left arrow', '\\leftarrow'], ['maps to', '\\mapsto'], ['dot product', '\\cdot'],
    ['cross product', '\\times'],
    ['infinity', '\\infty'], ['nabla', '\\nabla'], ['hbar', '\\hbar'],
    ['alpha', '\\alpha'], ['beta', '\\beta'], ['gamma', '\\gamma'], ['delta', '\\delta'],
    ['epsilon', '\\epsilon'], ['varepsilon', '\\varepsilon'], ['zeta', '\\zeta'],
    ['eta', '\\eta'], ['theta', '\\theta'], ['iota', '\\iota'], ['kappa', '\\kappa'],
    ['lambda', '\\lambda'], ['mu', '\\mu'], ['nu', '\\nu'], ['xi', '\\xi'],
    ['pi', '\\pi'], ['rho', '\\rho'], ['sigma', '\\sigma'], ['tau', '\\tau'],
    ['upsilon', '\\upsilon'], ['phi', '\\phi'], ['varphi', '\\varphi'], ['chi', '\\chi'],
    ['psi', '\\psi'], ['omega', '\\omega'],
    ['implies', '\\Rightarrow'], ['union', '\\cup'], ['intersection', '\\cap'],
    ['times', '\\times'], ['divided by', '\\div'], ['dot', '\\cdot'],
    ['inf', '\\infty'], ['degree', '^{\\circ}'], ['degrees', '^{\\circ}'],
    ['approximately', '\\approx'], ['equal to', '=']
  ];

  const FUNCTIONS = [
    'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
    'log', 'ln', 'exp', 'det', 'max', 'min', 'gcd', 'lim', 'sup'
  ];

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function applyPowers(input) {
    let s = input;
    s = s.replace(/([A-Za-z0-9)\]}]+)\s+to\s+the\s+(?:power\s+of\s+)?(?:minus|negative)\s+([A-Za-z0-9.]+)\s+squared\b/gi, '$1^{-$2^{2}}');
    s = s.replace(/([A-Za-z0-9)\]}]+)\s+to\s+the\s+(?:power\s+of\s+)?(?:minus|negative)\s+([A-Za-z0-9.]+)\s+cubed\b/gi, '$1^{-$2^{3}}');
    s = s.replace(/([A-Za-z0-9)\]}]+)\s+to\s+the\s+(?:power\s+of\s+)?(?:minus|negative)\s+([A-Za-z0-9.]+)\b/gi, '$1^{-$2}');
    s = s.replace(/([A-Za-z0-9)\]}]+)\s+squared\b/gi, '$1^{2}');
    s = s.replace(/([A-Za-z0-9)\]}]+)\s+cubed\b/gi, '$1^{3}');
    s = s.replace(
      /([A-Za-z0-9)\]}]+)\s+to\s+the\s+(?:power\s+of\s+|power\s+)?([A-Za-z0-9.+-]+)\b/gi,
      '$1^{$2}'
    );
    s = s.replace(/([A-Za-z0-9)\]}]+)\s+to\s+the\s+([A-Za-z0-9.+-]+)(?:st|nd|rd|th)?\s+power\b/gi, '$1^{$2}');
    return s;
  }

  function applySubscripts(input) {
    let s = input;
    s = s.replace(/([A-Za-z])\s+sub\s+([A-Za-z0-9]+)/gi, '$1_{$2}');
    return s;
  }

  function applyDecorators(input) {
    let s = input;
    s = s.replace(/\bvector\s+([A-Za-z])\b/gi, '\\vec{$1}');
    s = s.replace(/\b([A-Za-z])\s+hat\b/gi, '\\hat{$1}');
    s = s.replace(/\b([A-Za-z])\s+bar\b/gi, '\\bar{$1}');
    return s;
  }

  function applyFunctions(input) {
    const re = new RegExp('(?<![\\\\\\w])(' + FUNCTIONS.join('|') + ')(?![A-Za-z])', 'gi');
    return input.replace(re, (match, fn) => '\\' + fn.toLowerCase() + ' ');
  }

  function applySymbols(input) {
    const list = SYMBOL_WORDS.slice().sort((a, b) => b[0].length - a[0].length);
    let s = input;
    for (const [word, tex] of list) {
      const pattern = escapeRegExp(word).replace(/\s+/g, '\\s+');
      const re = new RegExp('(?<![\\\\\\w])' + pattern + '(?![A-Za-z])', 'gi');
      s = s.replace(re, tex);
    }
    return s;
  }

  function applyWordOperators(input) {
    let s = input;
    s = s.replace(/(?<![\\\w])(?:plus)(?![A-Za-z])/gi, '+');
    s = s.replace(/(?<![\\\w])(?:minus)(?![A-Za-z])/gi, '-');
    s = s.replace(/(?<![\\\w])(?:equals|is equal to)(?![A-Za-z])/gi, '=');
    s = s.replace(/(?<![\\\w])(?:greater than)(?![A-Za-z])/gi, '>');
    s = s.replace(/(?<![\\\w])(?:less than)(?![A-Za-z])/gi, '<');
    s = s.replace(/<=/g, '\\leq ');
    s = s.replace(/>=/g, '\\geq ');
    s = s.replace(/!=/g, '\\neq ');
    s = s.replace(/->|→/g, '\\to ');
    s = s.replace(/\*/g, '\\cdot ');
    return s;
  }

  function normalizeMathText(input) {
    let s = String(input || '');
    const map = [
      [/[×✕✖]/g, '*'], [/[÷∕]/g, '/'], [/[−–—]/g, '-'], [/²/g, '^2'], [/³/g, '^3'],
      [/√/g, 'sqrt '], [/π/g, ' pi '], [/∞/g, ' infinity '], [/≤/g, '<='],
      [/≥/g, '>='], [/≠/g, '!='], [/∑/g, 'sum '], [/∫/g, 'integral '],
      [/≈/g, ' approximately '], [/±/g, ' plus or minus ']
    ];
    map.forEach(([pattern, replacement]) => {
      s = s.replace(pattern, replacement);
    });
    return s;
  }

  function applyFractions(input) {
    let s = input;
    s = s.replace(/(?<![\w\\])(\d+)\s*\/\s*(\d+)(?![\w])/g, '\\frac{$1}{$2}');
    s = s.replace(/(?<![\w\\])([A-Za-z])\s*\/\s*(\d+)(?![\w])/g, '\\frac{$1}{$2}');
    return s;
  }

  function inferRunningIndex(latex) {
    const text = String(latex || '').replace(/\\[A-Za-z]+/g, ' ');
    const counts = {};
    const re = /(?<![A-Za-z\\])([A-Za-z])(?![A-Za-z])/g;
    let match;
    while ((match = re.exec(text))) {
      const letter = match[1];
      counts[letter] = (counts[letter] || 0) + 1;
    }
    const ranked = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return ranked.length ? ranked[0] : '';
  }

  function translate(input) {
    let s = String(input || '');
    s = applyPowers(s);
    s = applySubscripts(s);
    s = applyDecorators(s);
    s = applyFunctions(s);
    s = applySymbols(s);
    s = applyWordOperators(s);
    s = applyFractions(s);
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }

  function translateDifferential(expr) {
    let body = String(expr).trim();
    let diff = '';
    const trailing = /(?:^|\s)d\s*([A-Za-z])\s*$/i.exec(body);
    if (trailing) {
      diff = ' \\, d' + trailing[1];
      body = body.slice(0, trailing.index);
    }
    const translated = translate(body);
    return (translated + diff).trim();
  }

  function tidyLatex(input) {
    let s = String(input || '');
    s = s.replace(/\s+/g, ' ').trim();
    s = s.replace(/\s*\^\s*/g, '^');
    s = s.replace(/\s*_\s*/g, '_');
    s = s.replace(/\^([A-Za-z0-9])(?![A-Za-z0-9{])/g, '^{$1}');
    s = s.replace(/_([A-Za-z0-9])(?![A-Za-z0-9{])/g, '_{$1}');
    s = s.replace(/\s+([,;])/g, '$1');
    s = s.replace(/\s*([+\-=<>])\s*/g, '$1');
    s = s.replace(/[.。]\s*$/, '');
    s = s.replace(/\s{2,}/g, ' ').trim();
    return s;
  }

  function naturalToLatex(rawInput) {
    if (!rawInput || !rawInput.trim()) return '';
    let s = normalizeMathText(rawInput).trim().replace(/\s+/g, ' ');

    /* limits */
    s = s.replace(
      /\blimit\s+(?:as\s+)?([A-Za-z])\s+(?:approaches|goes\s+to|tends\s+to|->|→)\s+([^,;]+?)\s+of\s+/gi,
      (match, variable, target) =>
        '\\lim_{' + translate(variable) + ' \\to ' + translate(target) + '} '
    );

    /* derivatives */
    s = s.replace(
      /\b(second|third)?\s*(partial\s+)?derivative\s+of\s+(.+?)\s+with\s+respect\s+to\s+([A-Za-z])\b/gi,
      (match, order, partial, fn, variable) => {
        const ord = order ? (order.toLowerCase() === 'second' ? '^{2}' : '^{3}') : '';
        const d = partial ? '\\partial' : 'd';
        const denominator = partial ? '\\partial ' + variable + ord : 'd' + variable + ord;
        return (
          '\\frac{' + d + ord + ' ' + translate(fn) + '}{' + denominator + '}'
        );
      }
    );

    /* bounded operators */
    const ops = {
      'double integral': '\\iint',
      'triple integral': '\\iiint',
      'contour integral': '\\oint',
      integral: '\\int',
      summation: '\\sum',
      sum: '\\sum',
      product: '\\prod'
    };
    s = s.replace(
      /\b(double integral|triple integral|contour integral|integral|summation|sum|product)\s+(?:from|between)\s+(.+?)\s+to\s+(.+?)\s+of\s+([^,;]+)/gi,
      (match, op, lowerRaw, upperRaw, expr) => {
        const key = op.toLowerCase();
        let lower = lowerRaw.trim().replace(/^\(|\)$/g, '').trim();
        let index = '';
        const withIndex = /^([A-Za-z])\s*=\s*(.+)$/.exec(lower);
        if (withIndex) {
          index = withIndex[1];
          lower = withIndex[2];
        }
        const body = translateDifferential(expr);
        if (!index && (key === 'sum' || key === 'summation' || key === 'product')) {
          index = inferRunningIndex(body);
        }
        return (ops[key] || '\\sum') + '_{' + (index ? index + '=' : '') + translate(lower) +
          '}^{' + translate(upperRaw) + '}' + body;
      }
    );

    /* unbounded operators */
    s = s.replace(
      /\b(integral|sum|product)\s+of\s+([^,;]+)/gi,
      (match, op, expr) => ops[op.toLowerCase()] + ' ' + translateDifferential(expr)
    );

    /* roots */
    s = s.replace(/\bsqrt\s*\(([^()]*)\)/gi, (match, expr) =>
      '\\sqrt{' + translate(expr) + '}'
    );
    s = s.replace(
      /\b(?:square\s+root|sqrt|root)\s+of\s+(.+?)(?=\s+d\s*[A-Za-z]\s*(?:[,;]|$)|[,;]|$)/gi,
      (match, expr) => '\\sqrt{' + translate(expr) + '}'
    );

    /* named fractions */
    s = s.replace(
      /\bfraction\s+(.+?)\s+over\s+(.+?)(?=\s+(?:plus|minus|and)\b|[,;]|$)/gi,
      (match, numerator, denominator) =>
        '\\frac{' + translate(numerator) + '}{' + translate(denominator) + '}'
    );

    /* generic "A over B" */
    s = s.replace(
      /\b([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?)\s+over\s+([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?)(?=\s+(?:plus|minus)\b|[,;]|$)/gi,
      (match, numerator, denominator) =>
        '\\frac{' + translate(numerator) + '}{' + translate(denominator) + '}'
    );

    /* "A divided by B" */
    s = s.replace(
      /\b([A-Za-z0-9]+)\s+divided\s+by\s+([A-Za-z0-9]+)/gi,
      (match, numerator, denominator) =>
        '\\frac{' + translate(numerator) + '}{' + translate(denominator) + '}'
    );

    /* everything that is left */
    s = translate(s);
    return tidyLatex(s);
  }

  function leftoverWords(latex) {
    const withoutCommands = String(latex)
      .replace(/\\[,;:!]\s*d\s*\\?[A-Za-z]+\b/g, ' ')
      .replace(/\\[A-Za-z]+/g, ' ');
    const words = withoutCommands.match(/[A-Za-z]{2,}/g) || [];
    return Array.from(new Set(words.map((w) => w.toLowerCase()))).slice(0, 3);
  }

  /* ------------------------------------------------------------------ *
   *  Conversion modal
   * ------------------------------------------------------------------ */
  const NLP_EXAMPLES = [
    'summation from 0 to 5 of (k^2 + k + 17/6)',
    'integral from 0 to infinity of x squared dx',
    'sum from i=1 to n of i squared',
    'limit as x approaches 0 of sin x over x',
    'partial derivative of psi with respect to t',
    'sqrt of x squared plus y squared',
    'alpha times beta equals gamma'
  ];

  const AI_STORE_KEY = 'scidocs.ai.v1';
  const AI_DEFAULTS = {
    apiKey: '',
    model: 'google/gemini-3.5-flash-lite',
    baseUrl: 'https://openrouter.ai/api/v1',
    auto: true,
    instructions: ''
  };
  const AI_SYSTEM_PROMPT =
    'You are SciDocs AI, a precise math transcription engine. ' +
    'Convert plain-English mathematics into one LaTeX math expression. ' +
    'Return only the LaTeX code: no dollar signs, no code fences, no explanation. ' +
    'Use standard KaTeX-compatible commands and preserve fractions, integrals with limits, ' +
    'derivatives, roots, subscripts, superscripts, vectors, matrices and Greek letters. ' +
    'If the wording is ambiguous, choose the most standard mathematical reading. ' +
    'Examples: "e to the minus x squared" -> e^{-x^{2}}; ' +
    '"sum from i=1 to n of i squared" -> \\sum_{i=1}^{n} i^{2}; ' +
    '"partial derivative of psi with respect to t" -> \\frac{\\partial \\psi}{\\partial t}.';

  function readAiConfig() {
    try {
      const raw = JSON.parse(localStorage.getItem(AI_STORE_KEY) || '{}');
      if (raw && typeof raw === 'object') {
        return {
          apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : '',
          model: typeof raw.model === 'string' && raw.model.trim() ? raw.model.trim() : AI_DEFAULTS.model,
          baseUrl: typeof raw.baseUrl === 'string' && raw.baseUrl.trim()
            ? raw.baseUrl.trim().replace(/\/+$/, '')
            : AI_DEFAULTS.baseUrl,
          auto: raw.auto !== false,
          instructions: typeof raw.instructions === 'string' ? raw.instructions : ''
        };
      }
    } catch (_) { /* storage may be unavailable */ }
    return Object.assign({}, AI_DEFAULTS);
  }

  let aiConfig = readAiConfig();

  function persistAiConfig() {
    try { localStorage.setItem(AI_STORE_KEY, JSON.stringify(aiConfig)); } catch (_) { /* ignore */ }
  }

  function aiBadgeText() {
    if (!aiConfig.apiKey) return 'optional';
    return aiConfig.auto ? 'auto on' : 'key saved';
  }

  function syncAiBadge() {
    const state = $('#aiState');
    if (state) state.textContent = aiBadgeText();
  }

  function setNlpNote(text, kind) {
    const note = $('#nlpNote');
    if (!note) return;
    note.classList.remove('is-warn', 'is-busy', 'is-ai');
    if (kind) note.classList.add('is-' + kind);
    note.textContent = text;
  }

  function syncAiFields() {
    const key = $('#aiKey');
    const model = $('#aiModel');
    const base = $('#aiBase');
    const auto = $('#aiAuto');
    const instructions = $('#aiInstructions');
    if (key) key.value = aiConfig.apiKey;
    if (model) model.value = aiConfig.model;
    if (base) base.value = aiConfig.baseUrl;
    if (auto) auto.checked = Boolean(aiConfig.auto);
    if (instructions) instructions.value = aiConfig.instructions || '';
    syncAiBadge();
  }

  function cleanAiLatex(value) {
    let s = String(value || '').trim();
    s = s.replace(/^```(?:latex|tex|math)?\s*/i, '').replace(/```\s*$/, '').trim();
    s = s.replace(/^\\\[\s*([\s\S]*?)\s*\\\]$/, '$1');
    s = s.replace(/^\\\(\s*([\s\S]*?)\s*\\\)$/, '$1');
    s = s.replace(/^\$\$([\s\S]*?)\$\$$/, '$1');
    s = s.replace(/^\$([\s\S]*?)\$$/, '$1');
    s = s.replace(/^(?:latex|formula)\s*[:：]\s*/i, '').trim();
    return s;
  }

  function buildAiSystemPrompt() {
    const custom = (aiConfig.instructions || '').trim();
    if (!custom) return AI_SYSTEM_PROMPT;
    return AI_SYSTEM_PROMPT +
      '\n\nCustom instructions from this user (follow unless they conflict with returning only KaTeX-compatible LaTeX): ' +
      custom;
  }

  function aiLatexParseError(latex) {
    if (!window.katex) return '';
    try {
      window.katex.renderToString(latex, { throwOnError: true, strict: false, macros: MACROS });
      return '';
    } catch (err) {
      return err && err.message ? String(err.message) : 'Invalid LaTeX';
    }
  }

  async function requestAiCompletion(messages, signal) {
    const base = aiConfig.baseUrl.replace(/\/+$/, '');
    const response = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + aiConfig.apiKey
      },
      body: JSON.stringify({
        model: aiConfig.model,
        temperature: 0,
        max_tokens: 600,
        messages: messages
      }),
      signal: signal
    });

    if (!response.ok) {
      let detail = '';
      try {
        const body = await response.json();
        detail = body && body.error && body.error.message ? String(body.error.message) : '';
      } catch (_) { /* non-JSON error */ }
      const error = new Error('AI request failed (' + response.status + ')' +
        (detail ? ': ' + detail.slice(0, 140) : ''));
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const message = data && data.choices && data.choices[0] && data.choices[0].message;
    return message && (typeof message.content === 'string'
      ? message.content
      : Array.isArray(message.content)
        ? message.content.map((part) => (part && part.text) || '').join('')
        : '');
  }

  let aiRefineTimer = null;
  let aiRequestController = null;
  let aiRequestToken = 0;
  let lastAiText = '';

  function cancelAiRefine() {
    clearTimeout(aiRefineTimer);
    aiRefineTimer = null;
    if (aiRequestController) {
      const controller = aiRequestController;
      aiRequestController = null;
      controller.abort();
    }
    aiRequestToken += 1;
    const button = $('#nlpAi');
    if (button) {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  function scheduleAiRefine() {
    clearTimeout(aiRefineTimer);
    aiRefineTimer = null;
    if (!aiConfig.auto || !aiConfig.apiKey) return;
    const input = $('#nlpInput');
    if (!input) return;
    const text = input.value.trim();
    if (text.length < 3 || text === lastAiText) return;
    aiRefineTimer = setTimeout(() => {
      aiRefineTimer = null;
      refineNlpWithAi({ auto: true });
    }, 1000);
  }

  async function refineNlpWithAi(options) {
    const auto = Boolean(options && options.auto);
    const input = $('#nlpInput');
    const output = $('#nlpOutput');
    const button = $('#nlpAi');
    if (!input || !output) return;
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    clearTimeout(aiRefineTimer);
    aiRefineTimer = null;
    if (auto && !aiConfig.auto) return;

    if (!aiConfig.apiKey) {
      if (auto) return;
      const config = $('#aiConfig');
      if (config) config.open = true;
      const keyField = $('#aiKey');
      if (keyField) keyField.focus();
      setNlpNote('add an API key first', 'warn');
      return;
    }

    const draft = naturalToLatex(text);
    if (aiRequestController) aiRequestController.abort();
    const controller = new AbortController();
    aiRequestController = controller;
    const token = ++aiRequestToken;
    let timedOut = false;
    if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); }
    setNlpNote('asking AI…', 'busy');

    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 30000);
    const messages = [
      { role: 'system', content: buildAiSystemPrompt() },
      {
        role: 'user',
        content: 'Plain English: ' + text +
          '\n\nRule-based draft (may be imperfect): ' + (draft || '(none)')
      }
    ];

    try {
      let content = await requestAiCompletion(messages, controller.signal);
      let latex = cleanAiLatex(content);
      if (!latex) throw new Error('AI returned an empty result.');
      let parseError = aiLatexParseError(latex);

      /* one self-repair pass if the model produced invalid KaTeX */
      if (parseError) {
        if (token !== aiRequestToken || input.value.trim() !== text) return;
        messages.push({ role: 'assistant', content: latex });
        messages.push({
          role: 'user',
          content: 'That LaTeX failed to parse in KaTeX: ' + parseError.slice(0, 220) +
            '. Return only a corrected KaTeX-compatible expression, with no delimiters or explanation.'
        });
        content = await requestAiCompletion(messages, controller.signal);
        latex = cleanAiLatex(content);
        if (!latex) throw new Error('AI returned an empty result.');
        parseError = aiLatexParseError(latex);
        if (parseError) throw new Error('AI returned invalid LaTeX.');
      }

      if (token !== aiRequestToken) return;
      if (input.value.trim() !== text) return;

      lastAiText = text;
      output.textContent = latex;
      setNlpNote('AI refined · ' + aiConfig.model, 'ai');
    } catch (err) {
      if (token !== aiRequestToken) return;
      if (err && err.name === 'AbortError' && !timedOut) return;
      if (auto) {
        setNlpNote('AI unavailable · local draft', 'warn');
      } else {
        const message = timedOut
          ? 'AI request timed out'
          : (err && err.message ? err.message : 'AI request failed');
        setNlpNote(message.length > 90 ? message.slice(0, 87) + '…' : message, 'warn');
      }
    } finally {
      clearTimeout(timer);
      if (aiRequestController === controller) aiRequestController = null;
      if (button && token === aiRequestToken) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }
    }
  }

  async function testAiConnection() {
    const note = $('#aiConfigNote');
    const button = $('#aiTest');
    const key = $('#aiKey') ? $('#aiKey').value.trim() : '';
    const base = ($('#aiBase') && $('#aiBase').value.trim()
      ? $('#aiBase').value.trim()
      : AI_DEFAULTS.baseUrl).replace(/\/+$/, '');
    if (!key) {
      if (note) note.textContent = 'Add a key first.';
      return;
    }
    if (!/^https:\/\//i.test(base)) {
      if (note) note.textContent = 'Base URL must start with https://';
      return;
    }
    if (button) button.disabled = true;
    if (note) note.textContent = 'Testing…';
    try {
      const response = await fetch(base + '/models', {
        headers: { Authorization: 'Bearer ' + key }
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const count = data && Array.isArray(data.data) ? data.data.length : 0;
      if (note) note.textContent = 'Connected' + (count ? ' · ' + count + ' models' : '');
    } catch (err) {
      if (note) note.textContent = 'Test failed: ' + (err && err.message ? err.message : 'network error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  function updateNlpOutput() {
    const input = $('#nlpInput');
    const output = $('#nlpOutput');
    if (!input || !output) return;

    const latex = naturalToLatex(input.value);
    output.textContent = latex;
    const leftovers = latex ? leftoverWords(latex) : [];
    setNlpNote(
      !latex ? 'ready to insert' : leftovers.length
        ? 'kept as text: ' + leftovers.join(', ')
        : 'ready to insert',
      leftovers.length ? 'warn' : ''
    );
  }

  function openNlp() {
    const modal = $('#nlpModal');
    if (!modal) return;
    openModal('#nlpModal');
    updateNlpOutput();
    setTimeout(() => {
      const input = $('#nlpInput');
      if (input) input.focus();
    }, 40);
  }

  function insertNlp(mode) {
    const output = $('#nlpOutput');
    const latex = output ? output.textContent.trim() : '';
    if (!latex) {
      toast('Describe a formula first.', 'warn');
      return;
    }
    closeAllModals();
    if (!cm) return;
    if (mode === 'block') {
      insertSnippet('\n\\begin{equation}\n  ' + latex + '\n\\end{equation}\n');
    } else {
      insertSnippet('$' + latex + '$');
    }
  }

  /* ------------------------------------------------------------------ *
   *  Modal plumbing
   * ------------------------------------------------------------------ */
  let promptHandler = null;
  let confirmHandler = null;
  let lastFocused = null;
  const openModals = new Set();

  function openModal(selector) {
    const modal = typeof selector === 'string' ? $(selector) : selector;
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    openModals.add(modal);
    document.body.classList.add('modal-open');
    refreshIcons();
  }

  function closeModal(selector) {
    const modal = typeof selector === 'string' ? $(selector) : selector;
    if (!modal) return;
    modal.hidden = true;
    if (modal.id === 'historyModal') historyOpen = false;
    openModals.delete(modal);
    if (!openModals.size) {
      document.body.classList.remove('modal-open');
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }
  }

  function closeAllModals() {
    Array.from(openModals).forEach((modal) => closeModal(modal));
  }

  function openPrompt(options) {
    const opts = options || {};
    promptHandler = opts.onSubmit || null;
    $('#promptTitle').textContent = opts.title || 'Project';
    $('#promptSubtitle').textContent = opts.subtitle || '';
    $('#promptConfirm').textContent = opts.confirmLabel || 'Save';
    const input = $('#promptInput');
    input.value = opts.value || '';
    input.placeholder = opts.placeholder || '';
    $('#promptError').hidden = true;
    openModal('#promptModal');
    setTimeout(() => {
      input.focus();
      input.select();
    }, 40);
  }

  function submitPrompt() {
    const input = $('#promptInput');
    const value = input.value.trim();
    if (!value) {
      $('#promptError').hidden = false;
      input.focus();
      return;
    }
    const handler = promptHandler;
    closeModal('#promptModal');
    if (handler) handler(value);
  }

  function openConfirm(options) {
    const opts = options || {};
    confirmHandler = opts.onConfirm || null;
    $('#confirmTitle').textContent = opts.title || 'Are you sure?';
    $('#confirmMessage').textContent = opts.message || 'This cannot be undone.';
    $('#confirmDelete').textContent = opts.confirmLabel || 'Delete project';
    openModal('#confirmModal');
  }

  /* ------------------------------------------------------------------ *
   *  Project actions
   * ------------------------------------------------------------------ */
  function createProjectFlow() {
    openPrompt({
      title: 'New project',
      subtitle: 'A fresh LaTeX document, stored in this browser.',
      placeholder: 'Quantum Homework',
      confirmLabel: 'Create project',
      onSubmit: (name) => {
        saveNow();
        const project = {
          id: uid(),
          name,
          content: BLANK_DOC.replace(/\\title\{[^}]*\}/, '\\title{' + name.replace(/[{}]/g, '') + '}'),
          updatedAt: Date.now()
        };
        state.projects.unshift(project);
        state.activeId = project.id;
        persist();
        renderProjectSelect();
        if (cm) {
          cm.setValue(project.content);
          cm.clearHistory();
          cm.focus();
        }
        updateTabName();
        renderNow();
        toast('Created “' + name + '”', 'success');
      }
    });
  }

  function renameProjectFlow() {
    const project = activeProject();
    if (!project) return;
    openPrompt({
      title: 'Rename project',
      subtitle: 'The .tex filename follows the project name.',
      value: project.name,
      confirmLabel: 'Rename',
      onSubmit: (name) => {
        project.name = name;
        project.updatedAt = Date.now();
        persist();
        renderProjectSelect();
        updateTabName();
        toast('Renamed to “' + name + '”', 'success');
      }
    });
  }

  function deleteProjectFlow() {
    const project = activeProject();
    if (!project) return;
    openConfirm({
      title: 'Delete “' + project.name + '”?',
      message: 'The document and its source are removed from this browser. This cannot be undone.',
      confirmLabel: 'Delete project',
      onConfirm: () => {
        const index = state.projects.findIndex((p) => p.id === project.id);
        state.projects = state.projects.filter((p) => p.id !== project.id);

        if (!state.projects.length) {
          const fresh = {
            id: uid(),
            name: 'Starter Document',
            content: STARTER,
            updatedAt: Date.now()
          };
          state.projects.push(fresh);
        }

        idbAll('snapshots').then((snapshots) => {
          snapshots.filter((item) => item.projectId === project.id)
            .forEach((item) => idbDelete('snapshots', item.id));
        });

        const next = state.projects[Math.min(index, state.projects.length - 1)];
        state.activeId = next.id;
        persist();
        renderProjectSelect();
        if (cm) {
          cm.setValue(next.content);
          cm.clearHistory();
          cm.focus();
        }
        updateTabName();
        renderNow();
        toast('Project deleted', 'info');
      }
    });
  }

  /* ------------------------------------------------------------------ *
   *  Export & share
   * ------------------------------------------------------------------ */
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function downloadTex() {
    if (!cm) return;
    saveNow();
    const project = activeProject();
    const file = projectFileStem(project) + '.tex';
    const blob = new Blob([cm.getValue()], { type: 'application/x-tex;charset=utf-8' });
    triggerDownload(blob, file);
    toast('Downloaded ' + file, 'success');
  }

  function normalizeMathExpression(value) {
    let text = String(value || '').trim();
    if (!text) return '';
    text = text
      .replace(/^\${1,2}/, '')
      .replace(/\${1,2}$/, '')
      .replace(/^\\\[([\s\S]*)\\\]$/, '$1')
      .replace(/^\\\(([\s\S]*)\\\)$/, '$1')
      .trim();
    return text;
  }

  /* ------------------------------------------------------------------ *
   *  Bibliography panel
   * ------------------------------------------------------------------ */
  let bibSaveTimer = null;

  function renderBibLibrary() {
    const source = $('#bibSource');
    const entries = parseBibEntries(source ? source.value : readBibText());
    const count = $('#bibCount');
    if (count) count.textContent = entries.length + (entries.length === 1 ? ' entry' : ' entries');
    const list = $('#bibList');
    if (!list) return;
    if (!entries.length) {
      list.innerHTML = '<div class="panel-empty"><i data-lucide="book-marked"></i><strong>No bibliography yet</strong>' +
        '<span>Import a .bib file or paste BibTeX above, then cite entries with \\cite{key}.</span></div>';
      refreshIcons();
      return;
    }
    const counts = cm ? parseCitations(cm.getValue()).counts : new Map();
    list.innerHTML = entries.map((entry) => {
      const uses = counts.get(entry.key) || 0;
      return '<article class="bib-row">' +
        '<div class="bib-row-head"><code class="bib-key">' + escapeHtml(entry.key) + '</code>' +
        '<span class="badge-soft">' + escapeHtml(entry.type) + '</span></div>' +
        '<p class="bib-title">' + escapeHtml(entry.title || 'Untitled') + '</p>' +
        '<div class="bib-row-foot">' +
        '<span class="bib-meta">' + escapeHtml([bibAuthor(entry), entry.year].filter(Boolean).join(' · ') || 'No author') + '</span>' +
        '<span class="snippet-actions"><span class="bib-uses">' + uses + '×</span>' +
        '<button class="btn btn-ghost btn-xs" type="button" data-cite-key="' + escapeHtml(entry.key) + '">Cite</button></span>' +
        '</div></article>';
    }).join('');
    refreshIcons();
  }

  function openBibliography() {
    const source = $('#bibSource');
    if (source) source.value = readBibText();
    renderBibLibrary();
    openModal('#bibModal');
  }

  function saveBibField(quiet) {
    const source = $('#bibSource');
    if (!source) return false;
    const ok = writeBibText(source.value);
    renderBibLibrary();
    renderNow();
    if (!ok) toast('Bibliography could not be saved in this browser', 'warn');
    else if (!quiet) toast('Bibliography saved', 'success');
    return ok;
  }

  async function importBibFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast('That file is larger than 2 MB.', 'error');
      return;
    }
    try {
      const text = await file.text();
      const entries = parseBibEntries(text);
      if (!entries.length) {
        toast('No BibTeX entries found in ' + file.name, 'warn');
        return;
      }
      const source = $('#bibSource');
      if (source) source.value = text;
      saveBibField(true);
      toast('Imported ' + entries.length + ' entr' + (entries.length === 1 ? 'y' : 'ies') + ' from ' + file.name, 'success');
    } catch (_) {
      toast('Could not read that file.', 'error');
    }
  }

  function insertCitation(key) {
    if (!cm || !key) return;
    captureSnapshot('Before citation');
    cm.replaceSelection('\\cite{' + key + '}');
    cm.focus();
    closeModal('#bibModal');
    toast('Inserted \\cite{' + key + '}', 'success');
  }

  function mathMlMarkup(clean, display) {
    if (!window.katex || !clean) return '';
    try {
      const html = window.katex.renderToString(clean, {
        displayMode: Boolean(display),
        output: 'mathml',
        throwOnError: false,
        strict: false
      });
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const math = doc.querySelector('math');
      return math ? math.outerHTML : html;
    } catch (_) {
      return '';
    }
  }

  function mathMlBox(clean, display) {
    const mathml = mathMlMarkup(clean, display);
    if (!mathml) return null;
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:-9999px;top:0;display:block;width:max-content;margin:0;padding:0;' +
      'font-size:18px;line-height:1.25;white-space:nowrap;';
    host.innerHTML = mathml;
    const math = host.querySelector('math');
    if (math) {
      math.style.display = 'inline-block';
      math.style.margin = '0';
    }
    document.body.appendChild(host);
    const target = math || host;
    const ink = target.getBoundingClientRect();
    const hostBox = host.getBoundingClientRect();
    document.body.removeChild(host);
    const width = Math.ceil(Math.max(ink.width, hostBox.width));
    const height = Math.ceil(Math.max(ink.height, hostBox.height));
    if (!width || !height) return null;
    return { mathml, width, height };
  }

  function mathExportOptions() {
    const transparent = !!($('#mathExportTransparent') && $('#mathExportTransparent').checked);
    const scaleBox = $('#mathExportScale');
    const scale = Math.max(1, Math.min(3, Math.round(Number(scaleBox ? scaleBox.value : 2) || 2)));
    return { transparent, scale };
  }

  function mathSvgMarkup(clean, display) {
    const box = mathMlBox(clean, display);
    if (!box) return '';
    const options = mathExportOptions();
    const pad = 14;
    const width = box.width + pad * 2;
    const height = box.height + pad * 2;
    const background = options.transparent ? 'transparent' : '#ffffff';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height +
      '" viewBox="0 0 ' + width + ' ' + height + '">' +
      '<foreignObject x="0" y="0" width="100%" height="100%">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" style="box-sizing:border-box;width:100%;height:100%;' +
      'padding:' + pad + 'px;background:' + background + ';display:flex;align-items:center;justify-content:center;' +
      'color:#111827;font-family:serif;font-size:18px;line-height:1.25;">' +
      '<span style="display:inline-block;">' + box.mathml + '</span></div></foreignObject></svg>';
  }

  function renderMathExportPreview() {
    const source = $('#mathExportSource');
    const preview = $('#mathExportPreview');
    const note = $('#mathExportNote');
    if (!source || !preview) return;
    const clean = normalizeMathExpression(source.value);
    const display = !!($('#mathExportDisplay') && $('#mathExportDisplay').checked);
    if (!clean) {
      preview.innerHTML = '<span class="math-export-empty">Enter a formula to preview it.</span>';
      if (note) note.textContent = 'Select a formula in the editor, or edit it here.';
      return;
    }
    if (!window.katex) {
      preview.innerHTML = '<code>' + escapeHtml(clean) + '</code>';
      return;
    }
    try {
      preview.innerHTML = window.katex.renderToString(clean, {
        displayMode: display,
        throwOnError: false,
        strict: false
      });
      if (note) note.textContent = display ? 'Display math preview' : 'Inline math preview';
    } catch (err) {
      preview.innerHTML = '<span class="math-export-empty">Could not render this formula.</span>';
      if (note) note.textContent = 'Could not render this formula.';
    }
  }

  function openMathExport() {
    if (!cm) return;
    let source = cm.getSelection().trim();
    if (!source) {
      const cursor = cm.getCursor();
      source = (cm.getLine(cursor.line) || '').trim();
    }
    const input = $('#mathExportSource');
    if (input) input.value = source;
    const display = $('#mathExportDisplay');
    if (display) display.checked = /^\s*\$\$|^\\\[|\\begin\{/.test(source);
    renderMathExportPreview();
    openModal('#mathExportModal');
    setTimeout(() => { if (input) input.focus(); }, 40);
  }

  async function downloadMathSvg() {
    const clean = normalizeMathExpression($('#mathExportSource') ? $('#mathExportSource').value : '');
    const display = !!($('#mathExportDisplay') && $('#mathExportDisplay').checked);
    const svg = mathSvgMarkup(clean, display);
    if (!svg) {
      toast('Nothing to export', 'warn');
      return;
    }
    triggerDownload(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'scidocs-math.svg');
    toast('Downloaded SVG', 'success');
  }

  async function downloadMathPng() {
    const clean = normalizeMathExpression($('#mathExportSource') ? $('#mathExportSource').value : '');
    const display = !!($('#mathExportDisplay') && $('#mathExportDisplay').checked);
    const svg = mathSvgMarkup(clean, display);
    if (!svg) {
      toast('Nothing to export', 'warn');
      return;
    }
    try {
      /* A data URL avoids the tainted-image restrictions that blob URLs
         can hit for SVG documents containing foreignObject. */
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
      const options = mathExportOptions();
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * options.scale));
      canvas.height = Math.max(1, Math.round(image.height * options.scale));
      const context = canvas.getContext('2d');
      if (!options.transparent) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG encoding failed');
      triggerDownload(blob, 'scidocs-math.png');
      toast('Downloaded PNG', 'success');
    } catch (err) {
      console.warn('SciDocs: math PNG export failed', err);
      toast('PNG export is unavailable in this browser', 'warn');
    }
  }

  function importTexFile() {
    const input = $('#texFileInput');
    if (!input) return;
    input.value = '';
    input.click();
  }

  async function handleTexFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file || !cm) return;
    if (file.size > 2 * 1024 * 1024) {
      toast('That file is larger than 2 MB.', 'error');
      return;
    }
    try {
      const text = await file.text();
      if (!text.trim()) {
        toast('That file is empty.', 'warn');
        return;
      }
      if (cm.getValue().trim() && !window.confirm('Replace the current document with ' + file.name + '?')) return;
      captureSnapshot('Before import');
      cm.setValue(text);
      markDirty();
      renderNow({ manual: true });
      toast('Imported ' + file.name, 'success');
    } catch (_) {
      toast('Could not read that file.', 'error');
    }
  }

  function renderTemplates() {
    const host = $('#templateList');
    if (!host) return;
    host.innerHTML = PROJECT_TEMPLATES.map((template) =>
      '<button class="template-card" type="button" data-template="' + escapeHtml(template.id) + '">' +
        '<strong>' + escapeHtml(template.name) + '</strong>' +
        '<span>' + escapeHtml(template.description) + '</span>' +
      '</button>'
    ).join('');
  }

  function loadTemplate(id) {
    const template = PROJECT_TEMPLATES.find((entry) => entry.id === id);
    if (!template || !cm) return;
    if (cm.getValue().trim() &&
      !window.confirm('Replace the current document with the ' + template.name + ' template?')) {
      return;
    }
    captureSnapshot('Before template');
    cm.setValue(template.content);
    markDirty();
    renderNow({ manual: true });
    closeModal('#templateModal');
    toast(template.name + ' template loaded', 'success');
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_) { /* fall through */ }
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (_) {
      ok = false;
    }
    area.remove();
    return ok;
  }

  function toBase64Url(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(value) {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/') +
      '='.repeat((4 - value.length % 4) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function encodeSharePayload(payload) {
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    if (window.CompressionStream) {
      try {
        const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
        const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
        return 'z.' + toBase64Url(compressed);
      } catch (_) { /* fall back to uncompressed */ }
    }
    return 'u.' + toBase64Url(bytes);
  }

  async function decodeSharePayload(hash) {
    const raw = String(hash || '').replace(/^#share=/, '');
    const dot = raw.indexOf('.');
    if (dot < 1) return null;
    const mode = raw.slice(0, dot);
    const bytes = fromBase64Url(raw.slice(dot + 1));
    let text = '';
    if (mode === 'u') {
      text = new TextDecoder().decode(bytes);
    } else if (mode === 'z') {
      if (!window.DecompressionStream) return null;
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      text = await new Response(stream).text();
    } else {
      return null;
    }
    const payload = JSON.parse(text);
    if (!payload || typeof payload.content !== 'string') return null;
    if (payload.content.length > 1000000) return null;
    return {
      name: typeof payload.name === 'string' ? payload.name.slice(0, 80) : '',
      content: payload.content,
      images: sanitizeImages(payload.images),
      bib: typeof payload.bib === 'string' ? payload.bib.slice(0, 200000) : '',
      snippets: Array.isArray(payload.snippets) ? payload.snippets.slice(0, 60) : []
    };
  }

  /* The bibliography and snippet library are browser-wide, so backups and
     share links carry them along and merge anything the receiver lacks. */
  function mergeBibText(incoming) {
    const text = String(incoming || '').trim();
    if (!text) return false;
    const existing = readBibText();
    if (!existing.trim()) {
      writeBibText(text);
      return true;
    }
    const known = new Set(parseBibEntries(existing).map((entry) => entry.key));
    let added = '';
    const re = /@([A-Za-z]+)\s*([{(])/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const open = m.index + m[0].length - 1;
      const close = bibBlockEnd(text, open);
      if (close < 0) continue;
      const key = text.slice(open + 1, close).split(',')[0].trim();
      if (key && !known.has(key)) {
        known.add(key);
        added += text.slice(m.index, close + 1) + '\n';
      }
      re.lastIndex = close + 1;
    }
    if (!added) return false;
    writeBibText((existing.trim() + '\n\n' + added).slice(0, 200000));
    return true;
  }

  function mergeSnippets(incoming) {
    if (!Array.isArray(incoming) || !incoming.length) return 0;
    const items = readSnippets();
    const seen = new Set(items.map((item) => item.name + '\u0000' + item.body));
    let added = 0;
    incoming.slice(0, SNIPPET_LIMIT).forEach((raw) => {
      if (!raw || !raw.name || !raw.body) return;
      const signature = String(raw.name) + '\u0000' + String(raw.body);
      if (seen.has(signature)) return;
      seen.add(signature);
      items.push({
        id: 's_' + Math.random().toString(36).slice(2, 9),
        name: String(raw.name).slice(0, 60),
        trigger: normalizeSnippetTrigger(raw.trigger, raw.name),
        body: String(raw.body).slice(0, 4000),
        kind: raw.kind === 'macro' ? 'macro' : 'snippet',
        updatedAt: Date.now()
      });
      added += 1;
    });
    if (added) writeSnippets(items);
    return added;
  }

  async function shareDocument() {
    if (!cm) return;
    saveNow();
    const project = activeProject();
    const images = {};
    let imageChars = 0;
    let droppedImages = 0;
    Object.keys(projectImages()).forEach((key) => {
      const url = projectImages()[key];
      if (imageChars + url.length <= IMAGE_SHARE_BYTES) {
        images[key] = url;
        imageChars += url.length;
      } else {
        droppedImages += 1;
      }
    });
    const encoded = await encodeSharePayload({
      v: 2,
      name: projectFileStem(project),
      content: cm.getValue(),
      images,
      bib: readBibText().slice(0, 60000),
      snippets: readSnippets().slice(0, 40)
    });
    const url = location.origin + location.pathname + '#share=' + encoded;
    const ok = await copyText(url);
    if (!ok) {
      window.prompt('Copy this share link:', url);
      return;
    }
    if (droppedImages) {
      toast('Share link copied without ' + droppedImages + ' large image' +
        (droppedImages === 1 ? '' : 's') + ' — use a backup to move those.', 'warn');
    } else if (url.length > 50000) {
      toast('Share link copied — it is long, so .tex download may be better for very large documents.', 'warn');
    } else {
      toast('Share link copied — the document and its library are inside the link.', 'success');
    }
  }

  async function openSharedFromLocation() {
    if (!location.hash.startsWith('#share=')) return;
    try {
      const payload = await decodeSharePayload(location.hash);
      history.replaceState(null, '', location.pathname + location.search);
      if (!payload || !payload.content) {
        toast('That share link is invalid or too large.', 'warn');
        return;
      }
      const name = (payload.name || 'Shared Document') + ' (shared)';
      const project = {
        id: uid(),
        name,
        content: payload.content,
        images: sanitizeImages(payload.images),
        updatedAt: Date.now()
      };
      const libraryRestored = mergeBibText(payload.bib) || mergeSnippets(payload.snippets) > 0;
      state.projects.unshift(project);
      state.activeId = project.id;
      persist();
      renderProjectSelect();
      if (cm) {
        cm.setValue(project.content);
        cm.clearHistory();
        cm.focus();
      }
      updateTabName();
      renderNow();
      toast(libraryRestored
        ? 'Opened shared document with its bibliography and snippets'
        : 'Opened shared document', 'success');
    } catch (_) {
      history.replaceState(null, '', location.pathname + location.search);
      toast('Could not open that share link.', 'error');
    }
  }

  async function copySource() {
    if (!cm) return;
    const ok = await copyText(cm.getValue());
    toast(ok ? 'Raw LaTeX copied to clipboard' : 'Could not access the clipboard', ok ? 'success' : 'error');
  }

  async function copyFromModal() {
    const output = $('#nlpOutput');
    const latex = output ? output.textContent.trim() : '';
    if (!latex) {
      toast('Nothing to copy yet.', 'warn');
      return;
    }
    const ok = await copyText(latex);
    toast(ok ? 'LaTeX copied' : 'Could not access the clipboard', ok ? 'success' : 'error');
  }

  /* ------------------------------------------------------------------ *
   *  PDF export
   *
   *  The previous export rasterized the whole preview with html2canvas,
   *  which locks the main thread on some machines and left the toolbar
   *  stuck on “Rendering…”. This exporter never snapshots the page: the
   *  body text is written as real, selectable PDF text, figures are
   *  embedded from the attached image data, and formulas alone are
   *  rasterized — from MathJax's self-contained SVG output at 4×.
   * ------------------------------------------------------------------ */

  const PDF_LIBS = {
    jsPdf: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
    mathJax: 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js'
  };
  const PDF_PAGE = { width: 595.28, height: 841.89, margin: 56, footer: 24 };
  const PDF_MATH_SCALE = 4;
  const PDF_WINANSI = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
  const PDF_GREEK = {
    'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'ζ': 'zeta',
    'η': 'eta', 'θ': 'theta', 'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu',
    'ν': 'nu', 'ξ': 'xi', 'π': 'pi', 'ρ': 'rho', 'σ': 'sigma', 'τ': 'tau',
    'υ': 'upsilon', 'φ': 'phi', 'χ': 'chi', 'ψ': 'psi', 'ω': 'omega',
    'Γ': 'Gamma', 'Δ': 'Delta', 'Θ': 'Theta', 'Λ': 'Lambda', 'Ξ': 'Xi', 'Π': 'Pi',
    'Σ': 'Sigma', 'Υ': 'Upsilon', 'Φ': 'Phi', 'Ψ': 'Psi', 'Ω': 'Omega'
  };

  const pdfScripts = new Map();

  function loadPdfScript(url) {
    if (pdfScripts.has(url)) return pdfScripts.get(url);
    const pending = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        pdfScripts.delete(url);
        reject(new Error('Could not load ' + url));
      };
      document.head.appendChild(script);
    });
    pdfScripts.set(url, pending);
    return pending;
  }

  function ensureJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return loadPdfScript(PDF_LIBS.jsPdf).then(() => {
      if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF did not register');
      return window.jspdf.jsPDF;
    });
  }

  function ensureMathJax() {
    if (window.MathJax && window.MathJax.tex2svg) return Promise.resolve(window.MathJax);
    return loadPdfScript(PDF_LIBS.mathJax).then(() => {
      const mj = window.MathJax;
      if (!mj || !mj.tex2svg) throw new Error('MathJax did not register');
      if (mj.startup && mj.startup.promise) return mj.startup.promise.then(() => mj);
      return mj;
    });
  }

  /* WinAnsi (the standard PDF fonts) cannot encode every character a
     document can contain. Replace what has a sane plain-text form and fall
     back to a name, so a stray symbol never breaks the whole export. */
  function pdfSafeText(text) {
    let out = '';
    for (const ch of String(text)) {
      const code = ch.codePointAt(0);
      if (code === 0x2016) { out += '||'; continue; }
      if (code === 0x220e) { continue; }
      if (code === 0x2212) { out += '-'; continue; }
      if (code === 0x2192) { out += '->'; continue; }
      if (code === 0x2190) { out += '<-'; continue; }
      if (code === 0x2264) { out += '<='; continue; }
      if (code === 0x2265) { out += '>='; continue; }
      if (code === 0x2260) { out += '!='; continue; }
      if (code === 0x2248) { out += '~='; continue; }
      if (code === 0x221e) { out += 'inf'; continue; }
      if (code === 0x00a0) { out += ' '; continue; }
      if (code === 0x2032) { out += "'"; continue; }
      if (code === 0x2033) { out += '"'; continue; }
      if (code === 0x2026) { out += '...'; continue; }
      if (code < 32) { out += ' '; continue; }
      if (code <= 0x7e) { out += ch; continue; }
      if (code >= 0xa0 && code <= 0xff) { out += ch; continue; }
      if (PDF_WINANSI.indexOf(ch) >= 0) { out += ch; continue; }
      if (PDF_GREEK[ch]) { out += PDF_GREEK[ch]; continue; }
      out += '';
    }
    return out;
  }

  function pdfColorOf(css) {
    const match = /rgba?\(([^)]+)\)/.exec(css || '');
    if (!match) return null;
    const parts = match[1].split(',').map((part) => parseFloat(part));
    if (parts.length < 3 || parts.slice(0, 3).some((part) => !isFinite(part))) return null;
    return parts.slice(0, 3).map((part) => Math.max(0, Math.min(255, Math.round(part))));
  }

  /* Maps the computed style of a preview node onto a PDF font. */
  function pdfStyleOf(cs, scale) {
    const familyCss = String(cs.fontFamily || '').toLowerCase();
    let family = 'times';
    if (/mono|courier/.test(familyCss)) family = 'courier';
    else if (/jakarta|inter|sans-serif/.test(familyCss)) family = 'helvetica';
    const bold = (parseInt(cs.fontWeight, 10) || 400) >= 600;
    const italic = /italic|oblique/.test(cs.fontStyle || '');
    const fontStyle = bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal';
    const size = parseFloat(cs.fontSize);
    return {
      family,
      fontStyle,
      size: Math.max(5.5, (isFinite(size) ? size : 15) * scale),
      color: pdfColorOf(cs.color) || [17, 24, 39],
      rise: 0
    };
  }

  function pdfLineHeight(cs, style) {
    const raw = parseFloat(cs.lineHeight);
    if (isFinite(raw) && raw > 0) return raw;
    return style.size * 1.5;
  }

  function mathTexOf(el) {
    const annotation = el.querySelector('annotation[encoding="application/x-tex"]');
    if (annotation && annotation.textContent.trim()) return annotation.textContent;
    return (el.textContent || '').trim();
  }

  function baselineProbe(el) {
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;margin:0;padding:0;border:0;vertical-align:baseline';
    el.parentNode.insertBefore(probe, el);
    const rect = probe.getBoundingClientRect();
    probe.remove();
    return rect.bottom;
  }

  function svgAspect(svg) {
    const viewBox = svg.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map((part) => parseFloat(part));
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) return parts[3] / parts[2];
    }
    const w = parseFloat(svg.getAttribute('width'));
    const h = parseFloat(svg.getAttribute('height'));
    if (w > 0 && h > 0) return h / w;
    return 0.36;
  }

  function rasterizeMath(mathJax, tex, display, widthPt, heightPt) {
    const output = mathJax.tex2svg(tex, { display });
    const svg = output.querySelector('svg');
    if (!svg) return null;
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const width = Math.max(2, Math.ceil(widthPt * PDF_MATH_SCALE));
    const height = Math.max(2, Math.ceil(heightPt * PDF_MATH_SCALE));
    if (width * height > 24000000) return null;
    const markup = svg.outerHTML;
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        } catch (_) {
          resolve(null);
        }
      };
      image.onerror = () => resolve(null);
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
    });
  }

  function measureImage(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve({ w: image.naturalWidth || 0, h: image.naturalHeight || 0 });
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  const PDF_BLOCK_TAGS = new Set(['p', 'div', 'section', 'article', 'figure', 'figcaption', 'ul', 'ol', 'dl', 'table', 'pre', 'blockquote', 'nav', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr']);

  /* Builds the downloadable PDF for the compiled stage. */
  async function buildPdfBlob(paper, meta) {
    const JsPDF = await ensureJsPdf();
    const mathJax = await ensureMathJax();

    const paperStyle = getComputedStyle(paper);
    const padX = (parseFloat(paperStyle.paddingLeft) || 0) + (parseFloat(paperStyle.paddingRight) || 0);
    const contentPx = Math.max(120, (parseFloat(paperStyle.width) || paper.offsetWidth || 700) - padX);
    const scale = (PDF_PAGE.width - PDF_PAGE.margin * 2) / contentPx;

    const doc = new JsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true });
    if (meta) {
      doc.setProperties({
        title: pdfSafeText(meta.title || 'Untitled Document'),
        author: pdfSafeText(meta.author || ''),
        creator: 'SciDocs'
      });
    }

    /* Formulas and figure sizes are measured in the live preview DOM. */
    const mathImages = new Map();
    const mathCache = new Map();
    for (const el of Array.from(paper.querySelectorAll('.katex'))) {
      const tex = mathTexOf(el);
      if (!tex) continue;
      const display = !!el.closest('.eq-body');
      const box = el.getBoundingClientRect();
      if (!box.width) continue;
      const widthPt = Math.max(4, box.width * scale);
      const key = (display ? 'D|' : 'I|') + tex + '|' + Math.round(widthPt * 10);
      let entry = mathCache.get(key);
      if (entry === undefined) {
        const probe = mathJax.tex2svg(tex, { display }).querySelector('svg');
        const heightPt = Math.max(4, widthPt * (probe ? svgAspect(probe) : 0.36));
        entry = await rasterizeMath(mathJax, tex, display, widthPt, heightPt);
        entry = entry ? { data: entry, width: widthPt, height: heightPt } : null;
        mathCache.set(key, entry);
      }
      if (entry) {
        const baseline = baselineProbe(el);
        mathImages.set(el, {
          data: entry.data,
          width: entry.width,
          height: entry.height,
          descent: Math.max(0, Math.min(entry.height, (box.bottom - baseline) * scale))
        });
      }
    }

    const imageMetrics = new Map();
    for (const img of Array.from(paper.querySelectorAll('img'))) {
      const src = img.getAttribute('src') || '';
      if (!src.startsWith('data:image/')) continue;
      const size = await measureImage(src);
      if (size) imageMetrics.set(img, size);
    }

    const PAGE = PDF_PAGE;
    const LEFT = PAGE.margin;
    const WIDTH = PAGE.width - PAGE.margin * 2;
    const BOTTOM = PAGE.height - PAGE.margin - PAGE.footer;
    const state = { y: PAGE.margin };
    let pendingMarker = null;
    let pendingPrefix = null;

    function nextPage() {
      doc.addPage();
      state.y = PAGE.margin;
      pendingMarker = null;
    }

    function ensureSpace(height) {
      if (state.y + height > BOTTOM) nextPage();
    }

    function blank(amount) {
      if (!(amount > 0)) return;
      if (state.y > PAGE.margin + 0.5) state.y += amount;
    }

    function applyStyle(style) {
      doc.setFont(style.family, style.fontStyle);
      doc.setFontSize(style.size);
      doc.setTextColor(style.color[0], style.color[1], style.color[2]);
    }

    function widthOf(text, style) {
      applyStyle(style);
      return doc.getTextWidth(text);
    }

    function drawText(text, style, x, y) {
      if (!text) return;
      applyStyle(style);
      doc.text(text, x, y);
    }

    function drawMath(entry, x, baseline) {
      const top = baseline + entry.descent - entry.height;
      doc.addImage(entry.data, 'PNG', x, top, entry.width, entry.height);
    }

    /* ---- inline content --------------------------------------------- */

    function atomsFor(el) {
      const atoms = [];
      const walk = (node, style) => {
        for (const child of node.childNodes) {
          if (child.nodeType === 3) {
            const raw = pdfSafeText(child.nodeValue.replace(/\s+/g, ' '));
            if (!raw) continue;
            atoms.push({ kind: 'text', text: raw, style });
            continue;
          }
          if (child.nodeType !== 1) continue;
          const tag = child.tagName.toLowerCase();
          if (tag === 'br') {
            atoms.push({ kind: 'break' });
            continue;
          }
          if (child.classList.contains('katex')) {
            const entry = mathImages.get(child);
            if (entry) atoms.push({ kind: 'math', entry });
            else {
              const fallback = pdfSafeText(mathTexOf(child));
              if (fallback) atoms.push({ kind: 'text', text: fallback, style });
            }
            continue;
          }
          if (tag === 'img') continue;
          const next = pdfStyleOf(getComputedStyle(child), scale);
          if (tag === 'sup') next.rise = (style.rise || 0) + next.size * 0.34;
          if (tag === 'sub') next.rise = (style.rise || 0) - next.size * 0.16;
          if (child.classList.contains('doc-qed')) {
            atoms.push({ kind: 'qed', style: next });
            continue;
          }
          walk(child, next);
          /* the heading number is separated from its title by a margin */
          if (child.classList.contains('doc-h-num')) {
            atoms.push({ kind: 'text', text: ' ', style: next });
          }
        }
      };
      walk(el, pdfStyleOf(getComputedStyle(el), scale));
      return atoms;
    }

    function inlineWidth(atoms) {
      let total = 0;
      atoms.forEach((atom) => {
        if (atom.kind === 'text') total += widthOf(atom.text, atom.style);
        else if (atom.kind === 'math') total += atom.entry.width;
        else if (atom.kind === 'qed') total += widthOf('∎', atom.style) || 4;
      });
      return total;
    }

    function tokensFor(atoms) {
      const tokens = [];
      atoms.forEach((atom) => {
        if (atom.kind === 'break') {
          tokens.push({ type: 'break' });
          return;
        }
        if (atom.kind === 'math') {
          tokens.push({ type: 'word', parts: [{ atom, text: '', width: atom.entry.width }] });
          return;
        }
        if (atom.kind === 'qed') {
          tokens.push({ type: 'word', parts: [{ atom, text: '', width: 5 }] });
          return;
        }
        atom.text.split(/( +)/).forEach((piece) => {
          if (!piece) return;
          if (/^ +$/.test(piece)) {
            tokens.push({ type: 'space', width: widthOf(' ', atom.style) });
          } else {
            tokens.push({ type: 'word', parts: [{ atom, text: piece, width: widthOf(piece, atom.style) }] });
          }
        });
      });
      return tokens;
    }

    function splitOverlong(tokens, width) {
      const out = [];
      tokens.forEach((token) => {
        if (token.type !== 'word' || token.parts.length !== 1) {
          out.push(token);
          return;
        }
        const part = token.parts[0];
        /* Formulas and the QED mark have no text to split; pass them through. */
        if (part.atom.kind !== 'text') {
          out.push(token);
          return;
        }
        let chunk = '';
        let chunkWidth = 0;
        Array.from(part.text).forEach((ch) => {
          const w = widthOf(ch, part.atom.style);
          if (chunk && chunkWidth + w > width) {
            out.push({ type: 'word', parts: [{ atom: part.atom, text: chunk, width: chunkWidth }] });
            out.push({ type: 'break' });
            chunk = '';
            chunkWidth = 0;
          }
          chunk += ch;
          chunkWidth += w;
        });
        if (chunk) out.push({ type: 'word', parts: [{ atom: part.atom, text: chunk, width: chunkWidth }] });
      });
      return out;
    }

    function layoutLines(atoms, width) {
      const tokens = splitOverlong(tokensFor(atoms), width);
      const lines = [];
      let line = { parts: [], width: 0, gaps: 0 };
      let space = 0;

      const flush = () => {
        lines.push(line);
        line = { parts: [], width: 0, gaps: 0 };
        space = 0;
      };

      tokens.forEach((token) => {
        if (token.type === 'break') {
          flush();
          return;
        }
        if (token.type === 'space') {
          if (line.parts.length) space = Math.max(space, token.width);
          return;
        }
        const wordWidth = token.parts.reduce((sum, part) => sum + part.width, 0);
        if (line.parts.length && line.width + space + wordWidth > width + 0.2) flush();
        if (line.parts.length && space) {
          line.parts.push({ space });
          line.width += space;
          line.gaps += 1;
          space = 0;
        }
        token.parts.forEach((part) => {
          line.parts.push(part);
          line.width += part.width;
        });
      });
      flush();
      return lines;
    }

    function drawLines(lines, options) {
      const align = options.align || 'left';
      const justify = !!options.justify;
      const lineHeight = options.lineHeight || 12;
      lines.forEach((line, index) => {
        ensureSpace(lineHeight);
        const top = state.y;
        if (options.band) {
          doc.setFillColor(options.band[0], options.band[1], options.band[2]);
          doc.rect(options.x - 6, top, options.width + 12, lineHeight, 'F');
        }
        if (options.bar) {
          doc.setFillColor(options.bar[0], options.bar[1], options.bar[2]);
          doc.rect(options.x - 6, top, 2, lineHeight, 'F');
        }
        let x = options.x;
        if (align === 'center') x += (options.width - line.width) / 2;
        else if (align === 'right') x += options.width - line.width;
        const baseline = top + lineHeight * 0.72;
        if (pendingMarker && index === 0) {
          drawText(pendingMarker.text, pendingMarker.style, pendingMarker.x, baseline);
          pendingMarker = null;
        }
        const extra = justify && index < lines.length - 1 && line.gaps > 0
          ? Math.max(0, (options.width - line.width) / line.gaps)
          : 0;
        line.parts.forEach((part) => {
          if (part.space) {
            x += part.space + extra;
            return;
          }
          const atom = part.atom;
          if (atom.kind === 'text') {
            drawText(part.text, atom.style, x, baseline + atom.style.rise);
          } else if (atom.kind === 'math') {
            drawMath(atom.entry, x, baseline);
          } else if (atom.kind === 'qed') {
            doc.setFillColor(79, 70, 229);
            doc.rect(x, baseline - 4, 4.4, 4.4, 'F');
          }
          x += part.width;
        });
        state.y = top + lineHeight;
      });
    }

    function layoutParagraph(el, box, options) {
      const cs = getComputedStyle(el);
      let atoms = atomsFor(el);
      if (pendingPrefix) {
        atoms = pendingPrefix.concat(atoms);
        pendingPrefix = null;
      }
      if (!atoms.length) return;
      const style = pdfStyleOf(cs, scale);
      const lineHeight = pdfLineHeight(cs, style);
      const lines = layoutLines(atoms, box.width);
      const align = (options && options.align) || (/center/.test(cs.textAlign) ? 'center' : /right/.test(cs.textAlign) ? 'right' : 'left');
      const justify = !options && /justify/.test(cs.textAlign);
      drawLines(lines, {
        x: box.x,
        width: box.width,
        align,
        justify,
        lineHeight,
        band: box.band,
        bar: box.bar
      });
      blank((parseFloat(cs.marginBottom) || 0) * scale);
    }

    /* ---- block elements --------------------------------------------- */

    function layoutHeading(el, box) {
      const cs = getComputedStyle(el);
      const atoms = atomsFor(el);
      if (!atoms.length) return;
      const style = pdfStyleOf(cs, scale);
      const lineHeight = pdfLineHeight(cs, style);
      const lines = layoutLines(atoms, box.width);
      const before = (state.y > PAGE.margin + 0.5 ? Math.max(8, (parseFloat(cs.marginTop) || 0) * scale) : 0);
      ensureSpace(before + lines.length * lineHeight + lineHeight * 1.6);
      state.y += before;
      drawLines(lines, { x: box.x, width: box.width, lineHeight, align: 'left' });
      if (el.classList.contains('doc-h2') || (parseFloat(cs.borderBottomWidth) || 0) > 0) {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.6);
        doc.line(box.x, state.y + 1.5, box.x + box.width, state.y + 1.5);
        state.y += 3;
      }
      blank(Math.max(3, (parseFloat(cs.marginBottom) || 0) * scale * 0.7));
    }

    function layoutEquation(el, box) {
      const katex = el.querySelector('.eq-body .katex') || el.querySelector('.katex');
      const entry = katex ? mathImages.get(katex) : null;
      const numberEl = el.querySelector('.eq-number');
      const number = numberEl ? pdfSafeText(numberEl.textContent.trim()) : '';
      const numberWidth = number ? 26 : 0;
      const available = box.width - numberWidth;
      if (!entry) {
        const atoms = atomsFor(el);
        if (!atoms.length) return;
        const lines = layoutLines(atoms, box.width);
        drawLines(lines, { x: box.x, width: box.width, lineHeight: 14, align: 'center' });
        blank(8);
        return;
      }
      let width = entry.width;
      let height = entry.height;
      if (width > available) {
        const shrink = available / width;
        width *= shrink;
        height *= shrink;
      }
      state.y += 5;
      ensureSpace(height + 10);
      const x = box.x + (available - width) / 2;
      doc.addImage(entry.data, 'PNG', x, state.y, width, height);
      if (number) {
        const style = pdfStyleOf(getComputedStyle(numberEl), scale);
        drawText(number, style, box.x + box.width - widthOf(number, style), state.y + height * 0.62);
      }
      state.y += height + 9;
    }

    function layoutFigureMedia(el, box, caption) {
      const imgEl = el.querySelector('img');
      if (!imgEl) return;
      const src = imgEl.getAttribute('src') || '';
      if (!src.startsWith('data:image/')) return;
      const size = imageMetrics.get(imgEl);
      if (!size || !size.w) return;
      const inline = /width:\s*([\d.]+)%/.exec(imgEl.getAttribute('style') || '');
      let width = inline
        ? (parseFloat(inline[1]) / 100) * box.width
        : Math.min(size.w * scale, box.width);
      width = Math.max(24, Math.min(width, box.width));
      let height = width * (size.h / size.w);
      const limit = (BOTTOM - PAGE.margin) * 0.8;
      if (height > limit) {
        width *= limit / height;
        height = limit;
      }
      /* Reserve room for the caption so it never separates from the image */
      let reserve = 0;
      if (caption) {
        const captionCs = getComputedStyle(caption);
        const captionStyle = pdfStyleOf(captionCs, scale);
        const captionLines = layoutLines(atomsFor(caption), box.width);
        reserve = Math.min(140, captionLines.length * pdfLineHeight(captionCs, captionStyle) + 7);
      }
      ensureSpace(height + 8 + reserve);
      doc.addImage(src, /^data:image\/jpe?g/.test(src) ? 'JPEG' : 'PNG',
        box.x + (box.width - width) / 2, state.y, width, height);
      state.y += height + 7;
    }

    function layoutFigurePlaceholder(el, box) {
      const text = pdfSafeText(el.textContent.replace(/\s+/g, ' ').trim());
      const height = 54;
      state.y += 4;
      ensureSpace(height + 8);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.6);
      doc.setLineDashPattern([3, 3], 0);
      doc.rect(box.x, state.y, box.width, height, 'S');
      doc.setLineDashPattern([], 0);
      const style = pdfStyleOf(getComputedStyle(el), scale);
      style.color = [100, 116, 139];
      doc.setFont(style.family, style.fontStyle);
      doc.setFontSize(style.size);
      doc.text(text, box.x + box.width / 2, state.y + height / 2 + style.size * 0.35, {
        align: 'center',
        maxWidth: box.width - 16
      });
      state.y += height + 8;
    }

    function layoutFigure(el, box) {
      Array.from(el.children).forEach((child) => {
        const cls = child.classList;
        if (cls.contains('doc-figure-media')) layoutFigureMedia(child, box, el.querySelector('figcaption'));
        else if (cls.contains('doc-figure-box')) layoutFigurePlaceholder(child, box);
        else if (child.tagName.toLowerCase() === 'figcaption') layoutCaption(child, box);
        else layoutBlock(child, box);
      });
      blank(8);
    }

    function layoutCaption(el, box) {
      const cs = getComputedStyle(el);
      const atoms = atomsFor(el);
      if (!atoms.length) return;
      const style = pdfStyleOf(cs, scale);
      const lines = layoutLines(atoms, box.width);
      drawLines(lines, { x: box.x, width: box.width, lineHeight: pdfLineHeight(cs, style), align: 'center' });
      blank(7);
    }

    function layoutTable(el, box) {
      const rows = Array.from(el.rows || []);
      if (!rows.length) return;
      const padX = 5;
      const padY = 4;
      const grid = rows.map((row) => Array.from(row.cells).map((cell) => {
        const cs = getComputedStyle(cell);
        const atoms = atomsFor(cell);
        return {
          atoms,
          style: pdfStyleOf(cs, scale),
          lineHeight: pdfLineHeight(cs, pdfStyleOf(cs, scale)),
          span: Math.max(1, cell.colSpan || 1),
          align: cell.classList.contains('ta-c') ? 'center' : cell.classList.contains('ta-r') ? 'right' : 'left'
        };
      }));
      const columns = grid.reduce((max, row) => Math.max(max, row.reduce((n, cell) => n + cell.span, 0)), 1);
      const natural = new Array(columns).fill(40);
      grid.forEach((row) => {
        let col = 0;
        row.forEach((cell) => {
          if (cell.span === 1) natural[col] = Math.max(natural[col], inlineWidth(cell.atoms) + padX * 2);
          col += cell.span;
        });
      });
      let widths = natural.slice();
      const total = widths.reduce((sum, w) => sum + w, 0);
      if (total > box.width) {
        const shrink = box.width / total;
        widths = widths.map((w) => Math.max(26, w * shrink));
      }
      let tableWidth = widths.reduce((sum, w) => sum + w, 0);
      if (tableWidth > box.width) {
        widths = widths.map((w) => w * (box.width / tableWidth));
        tableWidth = box.width;
      }

      /* Measure every row before drawing so the table and its caption stay
         on the same page whenever they fit together. */
      const cellWidths = grid.map((row, rowIndex) => row.map((cell, index) => {
        let width = 0;
        for (let span = 0; span < cell.span; span += 1) width += widths[Math.min(widths.length - 1, index + span)] || widths[widths.length - 1];
        cell.boxWidth = Math.max(12, width - padX * 2);
        return width;
      }));
      const cellLines = grid.map((row) => row.map((cell) => layoutLines(cell.atoms, cell.boxWidth)));
      const rowHeights = cellLines.map((lines, rowIndex) => Math.max(
        12,
        ...lines.map((cellRow, index) => cellRow.length * grid[rowIndex][index].lineHeight + padY * 2)
      ));
      const tableHeight = rowHeights.reduce((sum, value) => sum + value, 0);
      if (tableHeight + 28 <= BOTTOM - PAGE.margin && state.y + 4 + tableHeight + 28 > BOTTOM) nextPage();
      state.y += 4;
      grid.forEach((row, rowIndex) => {
        const rowHeight = rowHeights[rowIndex];
        ensureSpace(rowHeight);
        const top = state.y;
        let x = box.x;
        row.forEach((cell, index) => {
          const width = cellWidths[rowIndex][index];
          if (rowIndex === 0) {
            doc.setFillColor(241, 245, 249);
            doc.rect(x, top, width, rowHeight, 'F');
          }
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.5);
          doc.rect(x, top, width, rowHeight, 'S');
          const lines = cellLines[rowIndex][index];
          lines.forEach((line, lineIndex) => {
            const baseline = top + padY + lineIndex * cell.lineHeight + cell.lineHeight * 0.72;
            let lineX = x + padX;
            if (cell.align === 'center') lineX = x + (width - line.width) / 2;
            else if (cell.align === 'right') lineX = x + width - padX - line.width;
            line.parts.forEach((part) => {
              if (part.space) {
                lineX += part.space;
                return;
              }
              if (part.atom.kind === 'text') drawText(part.text, part.atom.style, lineX, baseline + part.atom.style.rise);
              else if (part.atom.kind === 'math') drawMath(part.atom.entry, lineX, baseline);
              lineX += part.width;
            });
          });
          x += width;
        });
        state.y = top + rowHeight;
      });
      state.y += 6;
    }

    function layoutList(el, box) {
      const tag = el.tagName.toLowerCase();
      if (tag === 'dl') {
        Array.from(el.children).forEach((child) => {
          if (child.tagName.toLowerCase() === 'dt') {
            const cs = getComputedStyle(child);
            const atoms = atomsFor(child);
            const style = pdfStyleOf(cs, scale);
            drawLines(layoutLines(atoms, box.width), { x: box.x, width: box.width, lineHeight: pdfLineHeight(cs, style) });
          } else {
            layoutBlocks(child, { x: box.x + 14, width: box.width - 14, band: box.band, bar: box.bar });
          }
        });
        blank(6);
        return;
      }
      const ordered = tag === 'ol';
      Array.from(el.children).forEach((item, index) => {
        if (item.tagName.toLowerCase() !== 'li') return;
        const markerText = ordered ? (index + 1) + '.' : '•';
        const markerStyle = pdfStyleOf(getComputedStyle(item), scale);
        markerStyle.color = [79, 70, 229];
        const markerWidth = widthOf(markerText + '  ', markerStyle);
        const inner = { x: box.x + markerWidth, width: box.width - markerWidth, band: box.band, bar: box.bar };
        pendingMarker = { text: markerText, x: box.x, style: markerStyle };
        /* A list item holding only inline content has no element children, so
           it must be drawn as a paragraph instead of a block container. */
        const hasBlocks = Array.from(item.children).some((child) => PDF_BLOCK_TAGS.has(child.tagName.toLowerCase()));
        if (hasBlocks) layoutBlocks(item, inner);
        else layoutParagraph(item, inner);
        /* An item that starts with a figure or a formula never draws a text
           line, so the marker is simply dropped instead of leaking into the
           next item. */
        pendingMarker = null;
        blank(2);
      });
      blank((parseFloat(getComputedStyle(el).marginBottom) || 0) * scale * 0.6);
    }

    function layoutCode(el, box) {
      const cs = getComputedStyle(el);
      const style = pdfStyleOf(cs, scale);
      const padX = 7;
      const padY = 5;
      const innerWidth = box.width - padX * 2;
      const raw = el.textContent.replace(/\t/g, '    ').replace(/\r\n?/g, '\n');
      applyStyle(style);
      const lines = [];
      raw.split('\n').forEach((source) => {
        let current = '';
        Array.from(source).forEach((ch) => {
          if (current && doc.getTextWidth(current + ch) > innerWidth) {
            lines.push(current);
            current = '';
          }
          current += ch;
        });
        lines.push(current);
      });
      const lineHeight = style.size * 1.45;
      state.y += 4;
      lines.forEach((line) => {
        ensureSpace(lineHeight);
        doc.setFillColor(248, 250, 252);
        doc.rect(box.x, state.y, box.width, lineHeight, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(1.2);
        doc.line(box.x, state.y, box.x, state.y + lineHeight);
        drawText(line, style, box.x + padX, state.y + lineHeight * 0.74);
        state.y += lineHeight;
      });
      state.y += 6;
    }

    function layoutRule(box) {
      state.y += 8;
      ensureSpace(4);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.6);
      doc.line(box.x, state.y, box.x + box.width, state.y);
      state.y += 8;
    }

    function layoutTitleBlock(el, box) {
      Array.from(el.children).forEach((child) => {
        const cs = getComputedStyle(child);
        const atoms = atomsFor(child);
        if (!atoms.length) return;
        const style = pdfStyleOf(cs, scale);
        const lines = layoutLines(atoms, box.width);
        ensureSpace(lines.length * pdfLineHeight(cs, style) + 4);
        drawLines(lines, { x: box.x, width: box.width, lineHeight: pdfLineHeight(cs, style), align: 'center' });
        blank(4);
      });
      doc.setFillColor(99, 102, 241);
      doc.rect(box.x + box.width / 2 - 20, state.y + 2, 40, 2.2, 'F');
      state.y += 20;
    }

    function layoutToc(el, box) {
      Array.from(el.children).forEach((child) => {
        if (child.tagName.toLowerCase() === 'ol') {
          Array.from(child.children).forEach((item) => {
            const level = (function () {
              const match = /toc-([1-5])/.exec(item.className || '');
              return match ? Number(match[1]) : 1;
            })();
            const cs = getComputedStyle(item);
            const atoms = atomsFor(item);
            const style = pdfStyleOf(cs, scale);
            const indent = (level - 1) * 14;
            drawLines(layoutLines(atoms, box.width - indent), {
              x: box.x + indent,
              width: box.width - indent,
              lineHeight: pdfLineHeight(cs, style)
            });
          });
          blank(8);
          return;
        }
        const cs = getComputedStyle(child);
        const atoms = atomsFor(child);
        if (!atoms.length) return;
        const style = pdfStyleOf(cs, scale);
        drawLines(layoutLines(atoms, box.width), {
          x: box.x,
          width: box.width,
          lineHeight: pdfLineHeight(cs, style),
          align: 'center'
        });
        blank(4);
      });
    }

    function layoutBox(el, box, options) {
      const band = options.band;
      const bar = options.bar;
      const inner = {
        x: box.x + (options.pad || 0),
        width: box.width - (options.pad || 0) * 2,
        band,
        bar
      };
      if (options.title) {
        const titleEl = el.querySelector(options.title);
        if (titleEl) {
          const cs = getComputedStyle(titleEl);
          const atoms = atomsFor(titleEl);
          const style = pdfStyleOf(cs, scale);
          drawLines(layoutLines(atoms, inner.width), {
            x: inner.x,
            width: inner.width,
            lineHeight: pdfLineHeight(cs, style),
            align: 'center',
            band,
            bar
          });
          blank(4);
        }
      }
      Array.from(el.children).forEach((child) => {
        if (options.title && child.matches(options.title)) return;
        if (options.skip && child.matches(options.skip)) return;
        if (options.labelClass && child.classList.contains(options.labelClass)) {
          pendingPrefix = atomsFor(child);
          const style = pdfStyleOf(getComputedStyle(child), scale);
          pendingPrefix.push({ kind: 'text', text: ' ', style });
          return;
        }
        layoutBlock(child, inner);
      });
      blank(options.after === undefined ? 6 : options.after);
    }

    function layoutBlock(el, box) {
      const tag = el.tagName.toLowerCase();
      const cls = el.classList;
      if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6' || cls.contains('doc-h')) {
        layoutHeading(el, box);
        return;
      }
      if (cls.contains('eq-block')) { layoutEquation(el, box); return; }
      if (cls.contains('doc-titleblock')) { layoutTitleBlock(el, box); return; }
      if (cls.contains('doc-toc')) { layoutToc(el, box); return; }
      if (cls.contains('doc-theorem')) {
        layoutBox(el, box, { band: [248, 250, 252], bar: [99, 102, 241], pad: 10, labelClass: 'doc-theorem-label' });
        return;
      }
      if (cls.contains('doc-abstract')) {
        layoutBox(el, box, { band: [248, 250, 252], bar: [226, 232, 240], pad: 12, title: '.doc-abstract-title' });
        return;
      }
      if (cls.contains('doc-quote') || tag === 'blockquote') {
        layoutBox(el, box, { bar: [203, 213, 225], pad: 12 });
        return;
      }
      if (cls.contains('doc-table-wrap')) {
        Array.from(el.children).forEach((child) => layoutBlock(child, box));
        blank(6);
        return;
      }
      if (tag === 'table') { layoutTable(el, box); return; }
      if (cls.contains('doc-figure') || tag === 'figure') { layoutFigure(el, box); return; }
      if (cls.contains('doc-figure-media')) { layoutFigureMedia(el, box); return; }
      if (cls.contains('doc-figure-box')) { layoutFigurePlaceholder(el, box); return; }
      if (cls.contains('doc-caption') || tag === 'figcaption') { layoutCaption(el, box); return; }
      if (tag === 'ul' || tag === 'ol' || tag === 'dl') { layoutList(el, box); return; }
      if (tag === 'pre') { layoutCode(el, box); return; }
      if (tag === 'hr') { layoutRule(box); return; }
      if (tag === 'p') { layoutParagraph(el, box); return; }
      if (tag === 'nav' || tag === 'section' || cls.contains('doc-center') || cls.contains('doc-bibliography')) {
        layoutBlocks(el, cls.contains('doc-center') ? { ...box, align: 'center' } : box);
        blank(cls.contains('doc-bibliography') ? 2 : 4);
        return;
      }
      if (tag === 'div' && (cls.length === 0 || cls.contains('doc-empty'))) {
        layoutParagraph(el, box);
        return;
      }
      const hasBlocks = Array.from(el.children).some((child) => PDF_BLOCK_TAGS.has(child.tagName.toLowerCase()));
      if (hasBlocks) {
        layoutBlocks(el, box);
        return;
      }
      layoutParagraph(el, box);
    }

    function layoutBlocks(container, box) {
      Array.from(container.children).forEach((child) => layoutBlock(child, box || { x: LEFT, width: WIDTH }));
    }

    layoutBlocks(paper, { x: LEFT, width: WIDTH });

    /* Page numbers and a running title. */
    const pages = doc.getNumberOfPages();
    const title = meta && meta.title ? pdfSafeText(String(meta.title).replace(/<[^>]*>/g, '')) : '';
    for (let index = 1; index <= pages; index += 1) {
      doc.setPage(index);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(120, 130, 148);
      doc.text(String(index), PAGE.width / 2, PAGE.height - PAGE.margin * 0.5, { align: 'center' });
      if (title) {
        doc.text(title.length > 60 ? title.slice(0, 57) + '...' : title, PAGE.margin, PAGE.height - PAGE.margin * 0.5);
      }
    }

    return doc.output('blob');
  }

  async function exportPdf() {
    if (!cm) return;
    const button = $('#exportPdfBtn');
    const label = button ? button.querySelector('span') : null;
    const original = label ? label.textContent : 'Export PDF';
    const stage = $('#pdfStage');

    if (button) button.disabled = true;
    if (label) label.textContent = 'Rendering…';

    try {
      const result = compileDocument(cm.getValue());
      stage.innerHTML = '<article class="paper">' + (result.html || '') + '</article>';
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch (_) { /* ignore */ }
      }
      const project = activeProject();
      const filename = projectFileStem(project) + '.pdf';
      const blob = await buildPdfBlob(stage.firstElementChild, result.meta);
      triggerDownload(blob, filename);
      toast('PDF exported with selectable text, formulas and figures', 'success');
    } catch (err) {
      console.error('SciDocs: PDF export failed', err);
      toast('PDF export failed — opening the print dialog instead.', 'warn');
      window.print();
    } finally {
      stage.innerHTML = '';
      if (button) button.disabled = false;
      if (label) label.textContent = original;
    }
  }

  function printPreview() {
    renderNow();
    setTimeout(() => window.print(), 60);
  }

  /* ------------------------------------------------------------------ *
   *  Toasts
   * ------------------------------------------------------------------ */
  function toast(message, variant) {
    const host = $('#toasts');
    if (!host) return;
    const type = variant || 'info';
    const icons = {
      success: 'check-circle-2',
      warn: 'alert-circle',
      error: 'alert-triangle',
      info: 'sparkles'
    };
    const node = document.createElement('div');
    node.className = 'toast is-' + type;
    node.innerHTML =
      '<i data-lucide="' + (icons[type] || 'sparkles') + '"></i><span>' +
      escapeHtml(message) + '</span>';
    host.appendChild(node);
    refreshIcons();
    setTimeout(() => {
      node.classList.add('is-leaving');
      setTimeout(() => node.remove(), 200);
    }, 3200);
  }

  /* ------------------------------------------------------------------ *
   *  UI wiring
   * ------------------------------------------------------------------ */
  function bindUi() {
    $('#compileBtn').addEventListener('click', () => renderNow({ manual: true }));
    $('#exportPdfBtn').addEventListener('click', exportPdf);
    $('#printBtn').addEventListener('click', printPreview);
    $('#downloadTexBtn').addEventListener('click', downloadTex);
    $('#shareBtn').addEventListener('click', shareDocument);
    $('#importTexBtn').addEventListener('click', importTexFile);
    $('#texFileInput').addEventListener('change', handleTexFile);
    renderTemplates();
    $('#templatesBtn').addEventListener('click', () => openModal('#templateModal'));
    $('#scopeBtn').addEventListener('click', () => openModal('#scopeModal'));
    $('#guideBtn').addEventListener('click', () => openModal('#guideModal'));
    $('#guideScope').addEventListener('click', () => {
      closeModal('#guideModal');
      openModal('#scopeModal');
    });
    $('#templateList').addEventListener('click', (event) => {
      const button = event.target.closest('[data-template]');
      if (button) loadTemplate(button.dataset.template);
    });
    $('#copyBtn').addEventListener('click', copySource);
    $('#wrapInlineBtn').addEventListener('click', () => wrapMath('inline'));
    $('#wrapDisplayBtn').addEventListener('click', () => wrapMath('display'));
    $('#mathExportBtn').addEventListener('click', openMathExport);
    $('#problemsBtn').addEventListener('click', () => openProblems('problems'));
    $('#snippetsBtn').addEventListener('click', openSnippets);
    $('#imagesBtn').addEventListener('click', openImages);
    $('#imageAdd').addEventListener('click', () => {
      const input = $('#imageFile');
      if (input) { input.value = ''; input.click(); }
    });
    $('#imageFile').addEventListener('change', (event) => attachImageFiles(event.target.files));
    $('#imageList').addEventListener('click', (event) => {
      const remove = event.target.closest('[data-image-delete]');
      if (remove) { deleteProjectImage(remove.dataset.imageDelete); return; }
      const copy = event.target.closest('[data-image-copy]');
      if (!copy) return;
      copyText(copy.dataset.imageCopy).then((ok) =>
        toast(ok ? 'Image name copied' : 'Could not copy the name', ok ? 'success' : 'warn'));
    });
    $('#problemsTabs').addEventListener('click', (event) => {
      const tab = event.target.closest('[data-problems-tab]');
      if (!tab) return;
      problemsTab = tab.dataset.problemsTab;
      $$('#problemsTabs [data-problems-tab]').forEach((button) => {
        button.classList.toggle('is-active', button === tab);
      });
      renderProblemsView(problemDiagnostics());
    });
    $('#problemsRecompile').addEventListener('click', () => {
      renderProblemsView(problemDiagnostics());
      toast('Problems rechecked', 'info');
    });
    $('#problemsView').addEventListener('click', (event) => {
      const fix = event.target.closest('[data-fix-kind]');
      if (fix) {
        applyDiagnosticFix(fix.dataset.fixKind, fix.dataset.fixLine, fix.dataset.fixCommand);
        renderProblemsView(problemDiagnostics());
        return;
      }
      const jump = event.target.closest('[data-jump-line]');
      if (!jump) return;
      closeModal('#problemsModal');
      jumpToLine(Number(jump.dataset.jumpLine));
    });
    $('#snippetSave').addEventListener('click', saveSnippet);
    $('#snippetSelection').addEventListener('click', () => {
      const body = $('#snippetBody');
      if (body && cm) {
        body.value = cm.getSelection() || cm.getLine(cm.getCursor().line) || '';
        body.focus();
      }
    });
    $('#snippetList').addEventListener('click', (event) => {
      const insert = event.target.closest('[data-snippet-insert]');
      if (insert) {
        insertSavedSnippet(insert.dataset.snippetInsert);
        return;
      }
      const remove = event.target.closest('[data-snippet-delete]');
      if (remove) deleteSavedSnippet(remove.dataset.snippetDelete);
    });
    $('#mathExportSource').addEventListener('input', renderMathExportPreview);
    $('#mathExportDisplay').addEventListener('change', renderMathExportPreview);
    $('#mathCopyLatex').addEventListener('click', async () => {
      const clean = normalizeMathExpression($('#mathExportSource').value);
      if (!clean) return toast('Nothing to copy', 'warn');
      const ok = await copyText(clean);
      toast(ok ? 'LaTeX copied' : 'Could not copy LaTeX', ok ? 'success' : 'warn');
    });
    $('#mathCopyMathml').addEventListener('click', async () => {
      const clean = normalizeMathExpression($('#mathExportSource').value);
      const display = $('#mathExportDisplay').checked;
      const mathml = mathMlMarkup(clean, display);
      if (!mathml) return toast('Nothing to copy', 'warn');
      const ok = await copyText(mathml);
      toast(ok ? 'MathML copied' : 'Could not copy MathML', ok ? 'success' : 'warn');
    });
    $('#mathDownloadSvg').addEventListener('click', downloadMathSvg);
    $('#mathDownloadPng').addEventListener('click', downloadMathPng);
    $('#nlpBtn').addEventListener('click', openNlp);
    const findBtn = $('#findBtn');
    if (findBtn) {
      findBtn.addEventListener('click', () => {
        if (!cm) return;
        cm.focus();
        if (cm.execCommand) cm.execCommand('findPersistent');
      });
    }
    const bibBtn = $('#bibBtn');
    if (bibBtn) bibBtn.addEventListener('click', openBibliography);
    const bibSource = $('#bibSource');
    if (bibSource) {
      bibSource.addEventListener('input', () => {
        clearTimeout(bibSaveTimer);
        bibSaveTimer = setTimeout(() => saveBibField(true), 450);
      });
    }
    const bibImport = $('#bibImport');
    if (bibImport) {
      bibImport.addEventListener('click', () => {
        const input = $('#bibFileInput');
        if (input) { input.value = ''; input.click(); }
      });
    }
    const bibFile = $('#bibFileInput');
    if (bibFile) bibFile.addEventListener('change', importBibFile);
    const bibClear = $('#bibClear');
    if (bibClear) {
      bibClear.addEventListener('click', () => {
        if (!window.confirm('Remove every bibliography entry from this browser?')) return;
        writeBibText('');
        if (bibSource) bibSource.value = '';
        renderBibLibrary();
        renderNow();
        toast('Bibliography cleared', 'info');
      });
    }
    const bibList = $('#bibList');
    if (bibList) {
      bibList.addEventListener('click', (event) => {
        const cite = event.target.closest('[data-cite-key]');
        if (cite) insertCitation(cite.dataset.citeKey);
      });
    }

    const symbolSearch = $('#symbolSearch');
    if (symbolSearch) {
      const symbolClear = $('#symbolClear');
      const syncSymbolClear = () => {
        const hasQuery = !!symbolSearch.value;
        if (symbolClear) symbolClear.hidden = !hasQuery;
        const wrap = symbolSearch.closest('.sidebar-search');
        if (wrap) wrap.classList.toggle('has-query', hasQuery);
      };
      symbolSearch.addEventListener('input', () => {
        filterSymbols(symbolSearch.value);
        syncSymbolClear();
      });
      if (symbolClear) {
        symbolClear.addEventListener('click', () => {
          symbolSearch.value = '';
          filterSymbols('');
          syncSymbolClear();
          symbolSearch.focus();
        });
      }
      syncSymbolClear();
    }

    const recentGrid = $('#recentSymbols');
    if (recentGrid) {
      recentGrid.addEventListener('click', (event) => {
        const button = event.target.closest('.sym-btn');
        if (!button) return;
        const item = readRecent()[Number(button.dataset.recentIndex)];
        if (!item) return;
        const isMath = item.math !== false;
        insertSymbol(item, isMath);
        rememberSymbol(item, isMath);
        announceSymbolInsert(item);
      });
    }
    renderRecent();

    $('#projectSelect').addEventListener('change', (event) => {
      openProject(event.target.value);
    });

    $('#newProjectBtn').addEventListener('click', createProjectFlow);
    $('#renameProjectBtn').addEventListener('click', renameProjectFlow);
    $('#deleteProjectBtn').addEventListener('click', deleteProjectFlow);
    $('#historyBtn').addEventListener('click', openHistory);
    $('#snapshotBtn').addEventListener('click', async () => {
      const ok = await captureSnapshot('Manual snapshot');
      toast(ok ? 'Snapshot saved' : 'Nothing new to snapshot', ok ? 'success' : 'info');
      if (historyOpen) renderHistory();
    });
    $('#backupExport').addEventListener('click', exportBackup);
    $('#backupImport').addEventListener('click', importBackup);
    $('#backupFile').addEventListener('change', handleBackupFile);

    $('#sidebarToggle').addEventListener('click', () => {
      prefs.sidebarCollapsed = !prefs.sidebarCollapsed;
      document.body.classList.toggle('sidebar-collapsed', prefs.sidebarCollapsed);
      $('#sidebarToggle').setAttribute('aria-pressed', String(prefs.sidebarCollapsed));
      persistPrefs();
    });

    $('#promptConfirm').addEventListener('click', submitPrompt);
    $('#promptInput').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitPrompt();
      }
    });
    $('#confirmDelete').addEventListener('click', () => {
      const handler = confirmHandler;
      closeModal('#confirmModal');
      if (handler) handler();
    });

    /* natural text modal */
    const nlpInput = $('#nlpInput');
    const examplesHost = $('#nlpExamples');
    NLP_EXAMPLES.forEach((example) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'example-chip';
      chip.textContent = example;
      chip.addEventListener('click', () => {
        nlpInput.value = example;
        updateNlpOutput();
        scheduleAiRefine();
        nlpInput.focus();
      });
      examplesHost.appendChild(chip);
    });

    nlpInput.addEventListener('input', () => {
      updateNlpOutput();
      scheduleAiRefine();
    });
    nlpInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        insertNlp('inline');
      }
    });
    $('#nlpCopy').addEventListener('click', copyFromModal);
    $('#nlpInsert').addEventListener('click', () => insertNlp('inline'));
    $('#nlpInsertBlock').addEventListener('click', () => insertNlp('block'));

    /* optional AI refinement */
    syncAiFields();
    const nlpAi = $('#nlpAi');
    if (nlpAi) nlpAi.addEventListener('click', refineNlpWithAi);
    const aiSave = $('#aiSave');
    if (aiSave) aiSave.addEventListener('click', () => {
      const key = $('#aiKey') ? $('#aiKey').value.trim() : '';
      const model = $('#aiModel') && $('#aiModel').value.trim()
        ? $('#aiModel').value.trim()
        : AI_DEFAULTS.model;
      const base = ($('#aiBase') && $('#aiBase').value.trim()
        ? $('#aiBase').value.trim()
        : AI_DEFAULTS.baseUrl).replace(/\/+$/, '');
      const instructions = $('#aiInstructions') ? $('#aiInstructions').value.trim() : '';
      if (!/^https:\/\//i.test(base)) {
        if ($('#aiConfigNote')) $('#aiConfigNote').textContent = 'Base URL must start with https://';
        return;
      }
      aiConfig = {
        apiKey: key,
        model: model,
        baseUrl: base,
        auto: aiConfig.auto,
        instructions: instructions
      };
      lastAiText = '';
      persistAiConfig();
      syncAiFields();
      if ($('#aiConfigNote')) {
        $('#aiConfigNote').textContent = key ? 'Saved in this browser.' : 'No key saved.';
      }
      scheduleAiRefine();
    });
    const aiClear = $('#aiClear');
    if (aiClear) aiClear.addEventListener('click', () => {
      cancelAiRefine();
      aiConfig = {
        apiKey: '',
        model: aiConfig.model,
        baseUrl: aiConfig.baseUrl,
        auto: aiConfig.auto,
        instructions: aiConfig.instructions
      };
      lastAiText = '';
      persistAiConfig();
      syncAiFields();
      updateNlpOutput();
      if ($('#aiConfigNote')) $('#aiConfigNote').textContent = 'Key cleared.';
    });
    const aiTest = $('#aiTest');
    if (aiTest) aiTest.addEventListener('click', testAiConnection);
    const aiAuto = $('#aiAuto');
    if (aiAuto) aiAuto.addEventListener('change', () => {
      aiConfig.auto = aiAuto.checked;
      persistAiConfig();
      syncAiBadge();
      if (aiConfig.auto) {
        lastAiText = '';
        scheduleAiRefine();
      } else {
        cancelAiRefine();
        updateNlpOutput();
      }
    });

    const banner = $('#syntaxBanner');
    if (banner) {
      banner.addEventListener('click', (event) => {
        const fix = event.target.closest('[data-fix-kind]');
        if (fix && cm) {
          applyDiagnosticFix(fix.dataset.fixKind, fix.dataset.fixLine, fix.dataset.fixCommand);
          return;
        }
        const jump = event.target.closest('[data-jump-line]');
        if (!jump || !cm) return;
        jumpToLine(Number(jump.dataset.jumpLine));
      });
    }

    /* modal dismissal */
    document.addEventListener('click', (event) => {
      const closer = event.target.closest('[data-close-modal]');
      if (closer) {
        const modal = closer.closest('.modal-backdrop');
        if (modal) closeModal(modal);
        return;
      }
      if (event.target.classList && event.target.classList.contains('modal-backdrop')) {
        closeModal(event.target);
      }
    });

    document.addEventListener('keydown', (event) => {
      const mod = event.metaKey || event.ctrlKey;
      if (event.key === 'Escape' && openModals.size) {
        closeAllModals();
        return;
      }
      if (mod && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (!openModals.size) openNlp();
        return;
      }
      if (mod && event.key === 'Enter' && !openModals.size) {
        event.preventDefault();
        renderNow({ manual: true });
      }
    });

    window.addEventListener('beforeunload', () => {
      saveNow();
    });
  }

  /* ------------------------------------------------------------------ *
   *  Boot
   * ------------------------------------------------------------------ */
  async function init() {
    loadPrefs();
    await loadWorkspace();
    renderProjectSelect();
    renderSymbols();
    initEditor();
    bindUi();
    bindSheetEditing();
    updateTabName();
    if (cm) {
      renderNow();
      cm.focus();
    }
    refreshIcons();
    openSharedFromLocation();
    captureSnapshot('Opened');
  }

  function registerOffline() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('SciDocs: offline cache could not be installed', err);
    });
  }

  function boot() {
    registerOffline();
    init().catch((err) => {
      console.error('SciDocs: startup failed', err);
      toast('SciDocs could not open its local workspace. Reload the page.', 'error');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
