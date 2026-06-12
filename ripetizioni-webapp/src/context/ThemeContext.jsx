import { createContext, useContext, useState, useEffect } from "react";
import { applyTheme, DEFAULT_THEME } from "../theme/themes";

// Gestisce tema accent e modalità scura, con persistenza in localStorage
// (chiavi "tema" e "darkMode") e applicazione globale alle CSS variables.
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [tema, setTemaState] = useState(() => localStorage.getItem("tema") ?? DEFAULT_THEME);
  const [dark, setDarkState] = useState(() => localStorage.getItem("darkMode") === "true");

  // Applica all'avvio e ad ogni cambiamento
  useEffect(() => {
    applyTheme(tema, dark);
  }, [tema, dark]);

  function setTema(id) {
    setTemaState(id);
    localStorage.setItem("tema", id);
  }

  function setDark(value) {
    setDarkState(value);
    localStorage.setItem("darkMode", String(value));
  }

  return (
    <ThemeContext.Provider value={{ tema, dark, setTema, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
