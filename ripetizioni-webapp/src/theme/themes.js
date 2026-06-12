// Sistema temi della webapp — ricostruito dalla versione online (18/04).
// 6 temi "accent" in modalità chiara + override per la modalità scura.
// Le variabili vengono applicate direttamente su :root via style.setProperty,
// e le preferenze sono salvate in localStorage (chiavi: "tema", "darkMode").

export const THEMES = [
  {
    id: "rosa", label: "Rosa", emoji: "🌸",
    vars: {
      "--color-bg": "#fdf6f7", "--color-surface": "#fff8f9", "--color-surface-2": "#fffbfc",
      "--color-surface-offset": "#f9eef0", "--color-border": "#f0dde0", "--color-divider": "#f5e5e8",
      "--color-text": "#2d1f22", "--color-text-muted": "#8a6a6e", "--color-text-faint": "#c4a8ac",
      "--color-primary": "#c9607a", "--color-primary-hover": "#b34e67", "--color-primary-active": "#9a3d55",
      "--color-primary-light": "#fce8ec", "--color-primary-pale": "#fdf0f2",
      "--color-secondary": "#b07ab5", "--color-secondary-light": "#f3e8f5",
      "--shadow-sm": "0 1px 3px rgba(180,80,100,0.08)", "--shadow-md": "0 4px 16px rgba(180,80,100,0.10)", "--shadow-lg": "0 12px 40px rgba(180,80,100,0.13)",
    },
  },
  {
    id: "lavanda", label: "Lavanda", emoji: "💜",
    vars: {
      "--color-bg": "#f7f5fd", "--color-surface": "#faf8ff", "--color-surface-2": "#fdfcff",
      "--color-surface-offset": "#ede8f9", "--color-border": "#ddd5f5", "--color-divider": "#e8e2f7",
      "--color-text": "#1e1a2e", "--color-text-muted": "#6e6585", "--color-text-faint": "#b0a8c8",
      "--color-primary": "#7c5cbf", "--color-primary-hover": "#6a49aa", "--color-primary-active": "#583895",
      "--color-primary-light": "#ede5f9", "--color-primary-pale": "#f5f0fd",
      "--color-secondary": "#c07ab5", "--color-secondary-light": "#f5e8f3",
      "--shadow-sm": "0 1px 3px rgba(100,70,180,0.08)", "--shadow-md": "0 4px 16px rgba(100,70,180,0.10)", "--shadow-lg": "0 12px 40px rgba(100,70,180,0.13)",
    },
  },
  {
    id: "menta", label: "Menta", emoji: "🌿",
    vars: {
      "--color-bg": "#f4faf6", "--color-surface": "#f8fcf9", "--color-surface-2": "#fbfefb",
      "--color-surface-offset": "#e6f4ea", "--color-border": "#cde8d4", "--color-divider": "#d8eede",
      "--color-text": "#182820", "--color-text-muted": "#537060", "--color-text-faint": "#9dc4a8",
      "--color-primary": "#3d9e6a", "--color-primary-hover": "#2e8a58", "--color-primary-active": "#237548",
      "--color-primary-light": "#d6f0e2", "--color-primary-pale": "#edf8f2",
      "--color-secondary": "#6aab9e", "--color-secondary-light": "#e0f4f1",
      "--shadow-sm": "0 1px 3px rgba(50,130,90,0.08)", "--shadow-md": "0 4px 16px rgba(50,130,90,0.10)", "--shadow-lg": "0 12px 40px rgba(50,130,90,0.13)",
    },
  },
  {
    id: "pesca", label: "Pesca", emoji: "🍑",
    vars: {
      "--color-bg": "#fdf8f4", "--color-surface": "#fffaf7", "--color-surface-2": "#fffcfa",
      "--color-surface-offset": "#faeee5", "--color-border": "#f0ddd0", "--color-divider": "#f5e5d8",
      "--color-text": "#2d1e14", "--color-text-muted": "#8a6a55", "--color-text-faint": "#c4a898",
      "--color-primary": "#d4784a", "--color-primary-hover": "#be6338", "--color-primary-active": "#a85029",
      "--color-primary-light": "#fce8db", "--color-primary-pale": "#fdf2eb",
      "--color-secondary": "#c4955a", "--color-secondary-light": "#f5eadb",
      "--shadow-sm": "0 1px 3px rgba(180,90,50,0.08)", "--shadow-md": "0 4px 16px rgba(180,90,50,0.10)", "--shadow-lg": "0 12px 40px rgba(180,90,50,0.13)",
    },
  },
  {
    id: "cielo", label: "Cielo", emoji: "🩵",
    vars: {
      "--color-bg": "#f4f8fd", "--color-surface": "#f8fbff", "--color-surface-2": "#fbfdff",
      "--color-surface-offset": "#e5eef8", "--color-border": "#cdddf0", "--color-divider": "#d8e8f5",
      "--color-text": "#141e2d", "--color-text-muted": "#4e6680", "--color-text-faint": "#96b0c8",
      "--color-primary": "#3a7abf", "--color-primary-hover": "#2a67aa", "--color-primary-active": "#1d5493",
      "--color-primary-light": "#dbeaf8", "--color-primary-pale": "#edf4fc",
      "--color-secondary": "#5a9ec4", "--color-secondary-light": "#ddeef8",
      "--shadow-sm": "0 1px 3px rgba(40,90,160,0.08)", "--shadow-md": "0 4px 16px rgba(40,90,160,0.10)", "--shadow-lg": "0 12px 40px rgba(40,90,160,0.13)",
    },
  },
  {
    id: "lilla", label: "Lilla", emoji: "🌷",
    vars: {
      "--color-bg": "#fdf5fb", "--color-surface": "#fff8fe", "--color-surface-2": "#fffbff",
      "--color-surface-offset": "#f8e8f5", "--color-border": "#ecd5e8", "--color-divider": "#f2e0ef",
      "--color-text": "#2a1525", "--color-text-muted": "#8a5e80", "--color-text-faint": "#c4a0ba",
      "--color-primary": "#c45fa0", "--color-primary-hover": "#ad4d8a", "--color-primary-active": "#963c75",
      "--color-primary-light": "#fbe6f5", "--color-primary-pale": "#fdf0fa",
      "--color-secondary": "#9c6abf", "--color-secondary-light": "#f0e5f8",
      "--shadow-sm": "0 1px 3px rgba(170,60,130,0.08)", "--shadow-md": "0 4px 16px rgba(170,60,130,0.10)", "--shadow-lg": "0 12px 40px rgba(170,60,130,0.13)",
    },
  },
];

// Override applicati sopra il tema accent quando la modalità scura è attiva.
// Nota: --color-primary resta quello dell'accent scelto (così il colore identitario si mantiene).
const DARK_OVERRIDES = {
  "--color-bg": "#1a1518", "--color-surface": "#201d1f", "--color-surface-2": "#252022",
  "--color-surface-offset": "#2a2527", "--color-border": "#3a3033", "--color-divider": "#302a2d",
  "--color-text": "#f0e8ea", "--color-text-muted": "#a08888", "--color-text-faint": "#6a5558",
  "--color-primary-light": "#2e2028", "--color-primary-pale": "#261e22",
  "--shadow-sm": "0 1px 3px rgba(0,0,0,0.25)", "--shadow-md": "0 4px 16px rgba(0,0,0,0.35)", "--shadow-lg": "0 12px 40px rgba(0,0,0,0.45)",
};

export const DEFAULT_THEME = "rosa";

/** Applica tema accent + eventuale modalità scura alle CSS variables di :root. */
export function applyTheme(temaId, dark) {
  const tema = THEMES.find((t) => t.id === temaId) ?? THEMES[0];
  const root = document.documentElement;
  Object.entries(tema.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  if (dark) {
    Object.entries(DARK_OVERRIDES).forEach(([k, v]) => root.style.setProperty(k, v));
  }
}
