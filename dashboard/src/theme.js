import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// Color design tokens export
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
      primary: {
        100: "#6D7B8D", //RatGray Color for the LigthMode
        200: "#8C8C8C", // DARK
        300: "#999999", // NEUTRAL
        400: "#4C787E", // LIGHT
      },
      greenAccent: {
        100: "#6CC417", // GreenAccent
      },
      redAccent: {
        100: "#e74c3c", // RedAccent
      },
      }
    : {  //Light Mode
      primary: {
        100: "#E5E4E2", //Platinum Dark
      },
      greenAccent: {
        100: "#56ab2f", // Dark GreenAccent
      },
      redAccent: {
        100: "#f8dcdb",
      },  
      }),
});

// MUI theme settings
export const themeSettings = (mode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode: mode,
      ...(mode === "light"
        ? {
            // Palette values for dark mode
            primary: {
              main: colors.primary[100],
            },
            secondary: {
              main: colors.greenAccent[100],
            },
            neutral: {
              dark: colors.primary[100],
              main: colors.primary[100],
              light: colors.primary[200],
            },
            background: {
              default: colors.primary[100],
            },
          }
        : {
            // Palette values for light mode
            primary: {
              main: colors.primary[100], // REDACCENT
            },
            secondary: {
              main: colors.greenAccent[100],
            },
            neutral: {
              dark: colors.primary[100],
              main: colors.primary[200],
              light: colors.greenAccent[100],
            },
            background: {
              default: colors.primary[100], // #f7f7f7 LightGrayColor
            },
          }),
    },
    typography: {
      fontFamily: ["Roboto", "sans-serif"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Roboto", "sans-serif"].join(","),
        fontSize: 40,
      },
      h2: {
        fontFamily: ["Roboto", "sans-serif"].join(","),
        fontSize: 32,
      },
      h3: {
        fontFamily: ["Roboto", "sans-serif"].join(","),
        fontSize: 24,
      },
      h4: {
        fontFamily: ["Roboto", "sans-serif"].join(","),
        fontSize: 20,
      },
      h5: {
        fontFamily: ["Roboto", "sans-serif"].join(","),
        fontSize: 16,
      },
      h6: {
        fontFamily: ["Roboto", "sans-serif"].join(","),
        fontSize: 14,
      },
    },
  };
};

// Context for color mode
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export const useMode = () => {
  const [mode, setMode] = useState("dark");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    []
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return [theme, colorMode];
};
