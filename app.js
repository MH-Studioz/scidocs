/* =====================================================================
       SciDocs — 100% client-side scientific LaTeX IDE
   No backend, no build step. Everything runs in this tab.
   ===================================================================== */
(() => {
  'use strict';

  const R = String.raw;
  const CURSOR = '[[CURSOR]]';
  const STORE_KEY = 'latexlab.workspace.v1';
  const PREFS_KEY = 'latexlab.prefs.v1';

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
        { display: '\\frac{a}{b}', label: 'Fraction', insert: '\\frac{' + CURSOR + '}{}' },
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
        { display: 'x^2', label: 'Inline math', insert: '$' + CURSOR + '$' },
        { display: '\\sum_{i=1}^{n} x_i', label: 'Display math', insert: '$$' + CURSOR + '$$' },
        { display: '\\binom{n}{k}', label: 'Binomial', insert: '\\binom{' + CURSOR + '}{}' },
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
        { icon: 'braces', label: 'Cases', insert: '\n\\begin{cases}\n  ' + CURSOR + ' & x > 0 \\\\\n  0 & \\text{otherwise}\n\\end{cases}\n' },
        { icon: 'book-open', label: 'Theorem', insert: '\n\\begin{theorem}\n  ' + CURSOR + '\n\\end{theorem}\n' },
        { icon: 'book-open', label: 'Definition', insert: '\n\\begin{definition}\n  ' + CURSOR + '\n\\end{definition}\n' },
        { icon: 'check-circle-2', label: 'Proof', insert: '\n\\begin{proof}\n  ' + CURSOR + '\n\\end{proof}\n' },
        { icon: 'list', label: 'Description', insert: '\n\\begin{description}\n  \\item[' + CURSOR + '] Definition\n\\end{description}\n' },
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
  const prefs = { sidebarCollapsed: false };

  const activeProject = () =>
    state.projects.find((p) => p.id === state.activeId) || state.projects[0];

  /* ------------------------------------------------------------------ *
   *  localStorage persistence
   * ------------------------------------------------------------------ */
  function persist() {
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({ version: 1, activeId: state.activeId, projects: state.projects })
      );
    } catch (err) {
      console.warn('SciDocs: could not save workspace', err);
      toast('Could not save locally — browser storage is full or blocked.', 'error');
    }
  }

  function persistPrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (_) { /* ignore */ }
  }

  function loadWorkspace() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.projects) && data.projects.length) {
          let migrated = false;
          state.projects = data.projects.map((p) => {
            const saved = String(typeof p.content === 'string' ? p.content : '');
            const content = saved.replace(/in your browser by KaTeX/g, 'in your browser with LaTeX');
            if (content !== saved) migrated = true;
            return {
              id: String(p.id || uid()),
              name: String(p.name || 'Untitled Document'),
              content,
              updatedAt: Number(p.updatedAt) || Date.now()
            };
          });
          state.activeId = state.projects.some((p) => p.id === data.activeId)
            ? data.activeId
            : state.projects[0].id;
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
    const saveState = $('#saveState');
    if (saveState) saveState.textContent = 'Saved locally';
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
    return String(src).replace(/(^|[^\\])%[^\n]*/g, '$1');
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

  const BLOCK_RE = /\\begin\s*\{([A-Za-z*]+)\}|\\(maketitle|tableofcontents|newpage|clearpage|pagebreak|hrule|hrulefill)\b|\\(chapter|section|subsection|subsubsection|paragraph|subparagraph)(\*?)\s*(?:\[[^\]]*\]\s*)?\{/g;

  function makeCtx(meta) {
    return {
      meta: meta || {},
      errors: [],
      warnings: [],
      headings: [],
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
    const clean = expandPhysicsMacros(String(expr)
      .replace(/\\label\s*\{[^}]*\}/g, '')
      .replace(/\\(nonumber|notag)\b/g, ''))
      .trim();
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
    const text = String(raw);
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
      cite: (a) => hold('<span class="doc-cite">[' + escapeHtml(a) + ']</span>'),
      citep: (a) => hold('<span class="doc-cite">(' + escapeHtml(a) + ')</span>'),
      dna: (a) => hold(sequenceHtml(a, false, false)),
      rna: (a) => hold(sequenceHtml(a, false, true)),
      dnac: (a) => hold(sequenceHtml(a, true, false)),
      rnac: (a) => hold(sequenceHtml(a, true, true)),
      ref: (a) => hold('<span class="doc-ref">' + escapeHtml(a) + '</span>'),
      eqref: (a) => hold('<span class="doc-ref">(' + escapeHtml(a) + ')</span>'),
      label: () => hold(''),
      index: () => hold('')
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
      /\\(noindent|centering|raggedright|raggedleft|hfill|vfill|bigskip|medskip|smallskip|newpage|clearpage|pagebreak|linebreak|nopagebreak|break|small|footnotesize|scriptsize|normalsize|large|Large|LARGE|huge|Huge|bfseries|itshape|slshape|scshape|mdseries|upshape|rmfamily|sffamily|ttfamily|protect|relax)\b/g,
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

  function renderProse(text, ctx) {
    if (!text || !text.trim()) return '';
    const chunks = String(text).split(/\n\s*\n/);
    let out = '';
    for (const chunk of chunks) {
      const body = chunk.trim();
      if (!body) continue;
      const html = renderInline(body, ctx);
      if (!html) continue;
      out += '<p>' + html + '</p>';
    }
    return out;
  }

  function renderHeading(cmd, arg, ctx, numbered) {
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

    return (
      '<h' + level + ' class="doc-h doc-h' + level + '" id="' + id + '">' +
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
      if (started) items.push({ label, body: inner.slice(last, m.index) });
      started = true;
      label = m[1] || '';
      last = m.index + m[0].length;
    }
    if (started) items.push({ label, body: inner.slice(last) });
    return items;
  }

  function renderList(kind, inner, ctx) {
    const items = splitItems(inner);
    if (!items.length) return renderBlocks(inner, ctx);

    if (kind === 'dl') {
      return (
        '<dl>' +
        items
          .map(
            (it) =>
              '<dt>' + renderInline(it.label || 'Item', ctx) + '</dt>' +
              '<dd>' + renderBlocks(it.body, ctx) + '</dd>'
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
          return '<li>' + head + renderBlocks(it.body, ctx) + '</li>';
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
    const caption = grabArg(inner, 'caption') || '';
    let cleaned = removeArgCommand(inner, 'caption');
    const graphic = grabArg(cleaned, 'includegraphics');
    if (graphic) cleaned = removeArgCommand(cleaned, 'includegraphics');
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
      body = '<div class="doc-figure-box">' + escapeHtml(shorten(graphic, 64)) + '</div>' + body;
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

  function renderTheorem(name, inner, ctx) {
    let body = String(inner);
    let custom = '';
    const opt = /^\s*\[([^\]]*)\]/.exec(body);
    if (opt) {
      custom = opt[1];
      body = body.slice(opt[0].length);
    }
    return (
      '<div class="doc-theorem"><span class="doc-theorem-label">' +
      escapeHtml(THEOREM_ENVS[name] || name) +
      (custom ? ' (' + escapeHtml(custom) + ')' : '') +
      '</span>' + renderBlocks(body, ctx) + '</div>'
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

  function renderEnvironment(env, inner, ctx) {
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
        return renderList('ul', inner, ctx);
      case 'enumerate':
        return renderList('ol', inner, ctx);
      case 'description':
        return renderList('dl', inner, ctx);
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
          renderBlocks(inner, ctx) + '</div>'
        );
      case 'quote':
      case 'quotation':
      case 'verse':
        return '<blockquote class="doc-quote">' + renderBlocks(inner, ctx) + '</blockquote>';
      case 'center':
      case 'flushleft':
      case 'flushright':
        return '<div class="doc-center">' + renderBlocks(inner, ctx) + '</div>';
      case 'verbatim':
      case 'lstlisting':
      case 'minted':
        return '<pre class="doc-verbatim">' + escapeHtml(inner) + '</pre>';
      case 'minipage':
      case 'multicols':
        return '<div class="doc-center">' +
          renderBlocks(String(inner).replace(/^\s*\{[^}]*\}/, ''), ctx) + '</div>';
      case 'document':
        return renderBlocks(inner, ctx);
      default:
        break;
    }

    if (THEOREM_ENVS[env]) return renderTheorem(env, inner, ctx);
    return renderBlocks(inner, ctx);
  }

  function renderCommandBlock(cmd, ctx) {
    if (cmd === 'maketitle') return titleBlock(ctx.meta, ctx);
    if (cmd === 'tableofcontents') return renderToc(ctx);
    if (cmd === 'hrule' || cmd === 'hrulefill') return '<hr />';
    return '';
  }

  function renderBlocks(text, ctx) {
    const re = new RegExp(BLOCK_RE.source, 'g');
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
          out += renderProse(text.slice(last, m.index), ctx);
          out += renderProse(m[0], ctx);
          last = m.index + m[0].length;
          re.lastIndex = last;
          continue;
        }
        out += renderProse(text.slice(last, m.index), ctx);
        out += renderEnvironment(env, text.slice(innerStart, found.start), ctx);
        last = found.end;
        re.lastIndex = last;
        continue;
      }

      if (m[2]) {
        out += renderProse(text.slice(last, m.index), ctx);
        out += renderCommandBlock(m[2].toLowerCase(), ctx);
        last = m.index + m[0].length;
        re.lastIndex = last;
        continue;
      }

      if (m[3]) {
        const open = m.index + m[0].length - 1;
        const close = matchBrace(text, open);
        if (close < 0) continue;
        out += renderProse(text.slice(last, m.index), ctx);
        out += renderHeading(m[3].toLowerCase(), text.slice(open + 1, close), ctx, m[4] !== '*');
        last = close + 1;
        re.lastIndex = last;
      }
    }

    out += renderProse(text.slice(last), ctx);
    return out;
  }

  function collectUserMacros(src) {
    const macros = {};
    const defRe = /\\(newcommand|renewcommand|providecommand)\*?\s*\{?\s*\\([A-Za-z]+)\s*\}?\s*(?:\[(\d)\])?\s*\{/g;
    let m;
    while ((m = defRe.exec(src)) !== null) {
      const open = m.index + m[0].length - 1;
      const close = matchBrace(src, open);
      if (close < 0) continue;
      macros['\\' + m[2]] = src.slice(open + 1, close);
    }
    const defPlain = /\\def\s*\\([A-Za-z]+)\s*\{/g;
    while ((m = defPlain.exec(src)) !== null) {
      const open = m.index + m[0].length - 1;
      const close = matchBrace(src, open);
      if (close < 0) continue;
      macros['\\' + m[1]] = src.slice(open + 1, close);
    }
    const opRe = /\\DeclareMathOperator\*?\s*\{\\([A-Za-z]+)\}\s*\{([^{}]*)\}/g;
    while ((m = opRe.exec(src)) !== null) {
      macros['\\' + m[1]] = '\\operatorname{' + m[2] + '}';
    }
    return macros;
  }

  function compileDocument(source) {
    const src = stripComments(source);
    const ctx = makeCtx({});
    ctx.macros = collectUserMacros(src);

    const beginMatch = /\\begin\s*\{document\}/.exec(src);
    let preamble = '';
    let body = src;

    if (beginMatch) {
      preamble = src.slice(0, beginMatch.index);
      const after = src.slice(beginMatch.index + beginMatch[0].length);
      const endIdx = after.search(/\\end\s*\{document\}/);
      body = endIdx >= 0 ? after.slice(0, endIdx) : after;
    } else {
      const preambleLine = /^\s*\\(documentclass|usepackage|RequirePackage|newcommand|renewcommand|providecommand|DeclareMathOperator|DeclareRobustCommand|def|let|title|author|date|geometry|pagestyle|thispagestyle|setlength|addtolength|setcounter|bibliography|bibliographystyle|graphicspath|hypersetup|newtheorem)\b/;
      const lines = body.split('\n');
      const pre = [];
      const rest = [];
      lines.forEach((line) => (preambleLine.test(line) ? pre : rest).push(line));
      preamble = pre.join('\n');
      body = rest.join('\n');
    }

    ctx.meta = readMeta(preamble);

    if (/\\tableofcontents\b/.test(body)) {
      const probe = makeCtx(ctx.meta);
      renderBlocks(body, probe);
      ctx.headings = probe.headings;
    }

    let html = '';
    try {
      html = renderBlocks(body, ctx);
    } catch (err) {
      ctx.errors.push('Renderer stopped: ' + (err && err.message ? err.message : String(err)));
      html =
        '<div class="doc-empty"><strong>Render failed</strong><span>' +
        escapeHtml(String((err && err.message) || err)) + '</span></div>';
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
            hint: 'Remove it or add a matching “{” earlier.'
          });
          break;
        }
        braceStack.pop();
      }
    }
    if (braceStack.length && errors.length < 3) {
      errors.push({
        msg: braceStack.length + ' unclosed “{” — first on line ' + lineOf(text, braceStack[0]) + '.',
        hint: 'Every “{” needs a matching “}”.'
      });
    }

    /* math delimiters */
    let single = 0;
    let double = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\\') {
        i++;
        continue;
      }
      if (text[i] === '$') {
        if (text[i + 1] === '$') {
          double++;
          i++;
        } else {
          single++;
        }
      }
    }
    if (single % 2 === 1) {
      errors.push({
        msg: 'A “$” inline math delimiter is never closed.',
        hint: 'Pair each $…$; write \\$ for a literal dollar sign.'
      });
    }
    if (double % 2 === 1) {
      errors.push({
        msg: 'A “$$” display math delimiter is never closed.',
        hint: 'Display math needs both opening and closing $$.'
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
            hint: 'Add the opening environment or remove this line.'
          });
        } else if (top.env !== em[2]) {
          errors.push({
            msg: '\\end{' + em[2] + '} on line ' + line + ' closes \\begin{' + top.env + '} from line ' + top.line + '.',
            hint: 'Environments must nest in order.'
          });
        }
      }
    }
    envStack.slice(0, 2).forEach((open) => {
      errors.push({
        msg: '\\begin{' + open.env + '} on line ' + open.line + ' is never closed.',
        hint: 'Add \\end{' + open.env + '} to close it.'
      });
    });

    /* paired sizing commands */
    const lefts = (text.match(/\\left(?![A-Za-z])/g) || []).length;
    const rights = (text.match(/\\right(?![A-Za-z])/g) || []).length;
    if (lefts !== rights) {
      warnings.push(
        '\\left and \\right are unbalanced (' + lefts + ' vs ' + rights + '). LaTeX may reject the expression.'
      );
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
      ctx.warnings.forEach((msg) => {
        if (!warnings.includes(msg)) warnings.push(msg);
      });
    }

    let level = 'is-ok';
    let icon = 'check-circle-2';
    let title = 'Syntax OK';
    let detail = 'Braces, math delimiters and environments are balanced.';
    let hint = '';

    if (errors.length) {
      level = 'is-error';
      icon = 'alert-triangle';
      title = errors.length + ' syntax issue' + (errors.length === 1 ? '' : 's');
      detail = errors[0].msg;
      hint = errors[0].hint || '';
      if (errors.length > 1) detail += ' (+' + (errors.length - 1) + ' more)';
    } else if (warnings.length) {
      level = 'is-warn';
      icon = 'alert-circle';
      title = 'Heads up';
      detail = warnings[0];
      if (warnings.length > 1) detail += ' (+' + (warnings.length - 1) + ' more)';
    }

    banner.className = 'syntax-banner ' + level;
    banner.innerHTML =
      '<i data-lucide="' + icon + '"></i>' +
      '<div class="syntax-copy"><strong>' + escapeHtml(title) + '</strong>' +
      '<span>' + escapeHtml(detail) +
      (hint ? ' <span class="banner-hint">' + escapeHtml(hint) + '</span>' : '') +
      '</span></div>';
    banner.title = errors.concat(warnings.map((w) => ({ msg: w }))).map((e) => e.msg).join('\n');
    refreshIcons();

    const badge = $('#liveBadge');
    if (badge) badge.classList.toggle('is-warn', errors.length > 0 || warnings.length > 0);
    const status = $('#renderStatus');
    if (status) status.textContent = errors.length ? 'Needs attention' : 'Live';
  }

  function renderNow(options) {
    if (!cm) return;
    const opts = options || {};
    const preview = $('#preview');
    if (!preview) return;

    const started = performance.now();
    const result = compileDocument(cm.getValue());

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

    const eqTag = $('#equationTag');
    if (eqTag) {
      const eq = result.ctx.counters.equation;
      eqTag.textContent = eq + (eq === 1 ? ' equation' : ' equations');
    }

    updateStats();

    if (opts.manual) {
      toast('Compiled in ' + ms + ' ms', result.ctx.errors.length ? 'warn' : 'success');
    }
  }

  const scheduleRender = debounce(() => renderNow(), 240);

  /* ------------------------------------------------------------------ *
   *  Editor
   * ------------------------------------------------------------------ */
  function insertSnippet(snippet) {
    if (!cm) return;
    const doc = cm.getDoc();
    const from = doc.getCursor('from');
    const selection = doc.getSelection();
    const marker = snippet.indexOf(CURSOR);
    let text = snippet;
    let offset;

    if (marker >= 0 && selection) {
      text = snippet.slice(0, marker) + selection + snippet.slice(marker + CURSOR.length);
      offset = marker + selection.length;
    } else {
      text = snippet.split(CURSOR).join('');
      offset = marker >= 0 ? marker : text.length;
    }

    const startIndex = doc.indexFromPos(from);
    doc.replaceSelection(text, 'end');
    doc.setCursor(doc.posFromIndex(startIndex + offset));
    cm.focus();
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
        'Ctrl-K': () => openNlp()
      }
    });

    cm.on('change', () => {
      markDirty();
      scheduleRender();
    });
    cm.on('cursorActivity', updateCursorPos);
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

  function rememberSymbol(item) {
    if (!item || !item.insert) return;
    const entry = {
      insert: item.insert,
      label: item.label || item.display || item.insert,
      display: item.display || '',
      icon: item.icon || '',
      text: item.text || ''
    };
    const list = readRecent().filter((entryItem) => entryItem.insert !== entry.insert);
    list.unshift(entry);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_LIMIT)));
    } catch (_) { /* storage may be unavailable */ }
    renderRecent();
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
      insertSnippet(item.insert);
      rememberSymbol(item);
    });
  }

  function filterSymbols(query) {
    const q = String(query || '').trim().toLowerCase();
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
    baseUrl: 'https://openrouter.ai/api/v1'
  };
  const AI_SYSTEM_PROMPT =
    'You convert plain-English mathematics into one LaTeX math expression. ' +
    'Return only the LaTeX code: no dollar signs, no code fences, no explanation. ' +
    'Use standard KaTeX-compatible commands and preserve fractions, integrals with limits, ' +
    'derivatives, roots, subscripts, superscripts, vectors and Greek letters. ' +
    'If the wording is ambiguous, choose the most standard mathematical reading.';

  function readAiConfig() {
    try {
      const raw = JSON.parse(localStorage.getItem(AI_STORE_KEY) || '{}');
      if (raw && typeof raw === 'object') {
        return {
          apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : '',
          model: typeof raw.model === 'string' && raw.model.trim() ? raw.model.trim() : AI_DEFAULTS.model,
          baseUrl: typeof raw.baseUrl === 'string' && raw.baseUrl.trim()
            ? raw.baseUrl.trim().replace(/\/+$/, '')
            : AI_DEFAULTS.baseUrl
        };
      }
    } catch (_) { /* storage may be unavailable */ }
    return Object.assign({}, AI_DEFAULTS);
  }

  let aiConfig = readAiConfig();

  function persistAiConfig() {
    try { localStorage.setItem(AI_STORE_KEY, JSON.stringify(aiConfig)); } catch (_) { /* ignore */ }
  }

  function syncAiFields() {
    const key = $('#aiKey');
    const model = $('#aiModel');
    const base = $('#aiBase');
    const state = $('#aiState');
    if (key) key.value = aiConfig.apiKey;
    if (model) model.value = aiConfig.model;
    if (base) base.value = aiConfig.baseUrl;
    if (state) state.textContent = aiConfig.apiKey ? 'key saved' : 'optional';
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

  async function refineNlpWithAi() {
    const input = $('#nlpInput');
    const output = $('#nlpOutput');
    const note = $('#nlpNote');
    const button = $('#nlpAi');
    if (!input || !output) return;
    const text = input.value.trim();
    if (!text) { input.focus(); return; }

    if (!aiConfig.apiKey) {
      const config = $('#aiConfig');
      if (config) config.open = true;
      const keyField = $('#aiKey');
      if (keyField) keyField.focus();
      if (note) {
        note.classList.remove('is-ai', 'is-busy');
        note.classList.add('is-warn');
        note.textContent = 'add an API key first';
      }
      return;
    }

    const draft = naturalToLatex(text);
    if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); }
    if (note) {
      note.classList.remove('is-warn', 'is-ai');
      note.classList.add('is-busy');
      note.textContent = 'asking AI…';
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
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
          messages: [
            { role: 'system', content: AI_SYSTEM_PROMPT },
            {
              role: 'user',
              content: 'Plain English: ' + text +
                '\n\nRule-based draft (may be imperfect): ' + (draft || '(none)')
            }
          ]
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        let detail = '';
        try {
          const body = await response.json();
          detail = body && body.error && body.error.message ? String(body.error.message) : '';
        } catch (_) { /* non-JSON error */ }
        throw new Error('AI request failed (' + response.status + ')' +
          (detail ? ': ' + detail.slice(0, 140) : ''));
      }

      const data = await response.json();
      const message = data && data.choices && data.choices[0] && data.choices[0].message;
      const content = message && (typeof message.content === 'string'
        ? message.content
        : Array.isArray(message.content)
          ? message.content.map((part) => (part && part.text) || '').join('')
          : '');
      const latex = cleanAiLatex(content);
      if (!latex) throw new Error('AI returned an empty result.');

      if (window.katex) {
        window.katex.renderToString(latex, { throwOnError: true, strict: false, macros: MACROS });
      }

      output.textContent = latex;
      if (note) {
        note.classList.remove('is-warn', 'is-busy');
        note.classList.add('is-ai');
        note.textContent = 'AI refined · ' + aiConfig.model;
      }
    } catch (err) {
      if (note) {
        note.classList.remove('is-busy', 'is-ai');
        note.classList.add('is-warn');
        const message = err && err.name === 'AbortError'
          ? 'AI request timed out'
          : (err && err.message ? err.message : 'AI request failed');
        note.textContent = message.length > 90 ? message.slice(0, 87) + '…' : message;
      }
    } finally {
      clearTimeout(timer);
      if (button) { button.disabled = false; button.removeAttribute('aria-busy'); }
    }
  }

  function updateNlpOutput() {
    const input = $('#nlpInput');
    const output = $('#nlpOutput');
    const note = $('#nlpNote');
    if (!input || !output) return;

    const latex = naturalToLatex(input.value);
    output.textContent = latex;

    if (note) {
      const leftovers = latex ? leftoverWords(latex) : [];
      note.classList.remove('is-ai', 'is-busy');
      note.classList.toggle('is-warn', leftovers.length > 0);
      note.textContent = !latex
        ? 'ready to insert'
        : leftovers.length
          ? 'kept as text: ' + leftovers.join(', ')
          : 'ready to insert';
    }
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

  async function exportPdf() {
    if (!cm) return;
    const button = $('#exportPdfBtn');
    const label = button ? button.querySelector('span') : null;
    const original = label ? label.textContent : 'Export PDF';

    if (typeof window.html2pdf === 'undefined') {
      toast('PDF engine is still loading — opening the print dialog instead.', 'warn');
      window.print();
      return;
    }

    if (button) button.disabled = true;
    if (label) label.textContent = 'Rendering…';

    const stage = $('#pdfStage');
    try {
      const result = compileDocument(cm.getValue());
      stage.innerHTML = '<article class="paper">' + (result.html || '') + '</article>';
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch (_) { /* ignore */ }
      }
      await new Promise((resolve) => setTimeout(resolve, 80));

      await window
        .html2pdf()
        .set({
          margin: 0,
          filename: projectFileStem(activeProject()) + '.pdf',
          image: { type: 'jpeg', quality: 0.96 },
          html2canvas: {
            scale: 1.6,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            windowWidth: 794,
            ignoreElements: (node) =>
              node.classList && node.classList.contains('katex-mathml')
          },
          jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css'] }
        })
        .from(stage.firstElementChild)
        .save();

      toast('PDF exported', 'success');
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
    $('#copyBtn').addEventListener('click', copySource);
    $('#wrapInlineBtn').addEventListener('click', () => insertSnippet('$' + CURSOR + '$'));
    $('#wrapDisplayBtn').addEventListener('click', () => insertSnippet('$$' + CURSOR + '$$'));
    $('#nlpBtn').addEventListener('click', openNlp);

    const symbolSearch = $('#symbolSearch');
    if (symbolSearch) {
      symbolSearch.addEventListener('input', () => filterSymbols(symbolSearch.value));
    }

    const recentGrid = $('#recentSymbols');
    if (recentGrid) {
      recentGrid.addEventListener('click', (event) => {
        const button = event.target.closest('.sym-btn');
        if (!button) return;
        const item = readRecent()[Number(button.dataset.recentIndex)];
        if (!item) return;
        insertSnippet(item.insert);
        rememberSymbol(item);
      });
    }
    renderRecent();

    $('#projectSelect').addEventListener('change', (event) => {
      openProject(event.target.value);
    });

    $('#newProjectBtn').addEventListener('click', createProjectFlow);
    $('#renameProjectBtn').addEventListener('click', renameProjectFlow);
    $('#deleteProjectBtn').addEventListener('click', deleteProjectFlow);

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
        nlpInput.focus();
      });
      examplesHost.appendChild(chip);
    });

    nlpInput.addEventListener('input', updateNlpOutput);
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
      if (!/^https:\/\//i.test(base)) {
        if ($('#aiConfigNote')) $('#aiConfigNote').textContent = 'Base URL must start with https://';
        return;
      }
      aiConfig = { apiKey: key, model: model, baseUrl: base };
      persistAiConfig();
      syncAiFields();
      if ($('#aiConfigNote')) {
        $('#aiConfigNote').textContent = key ? 'Saved in this browser.' : 'No key saved.';
      }
    });
    const aiClear = $('#aiClear');
    if (aiClear) aiClear.addEventListener('click', () => {
      aiConfig = { apiKey: '', model: aiConfig.model, baseUrl: aiConfig.baseUrl };
      persistAiConfig();
      syncAiFields();
      if ($('#aiConfigNote')) $('#aiConfigNote').textContent = 'Key cleared.';
    });

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
  function init() {
    loadPrefs();
    loadWorkspace();
    renderProjectSelect();
    renderSymbols();
    initEditor();
    bindUi();
    updateTabName();
    if (cm) {
      renderNow();
      cm.focus();
    }
    refreshIcons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
