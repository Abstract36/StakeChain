import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// Design tokens shared with the landing page (website/index.html)
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        bg: "#0b0e1a",
        surface: "#141a2e",
        surface2: "#1b2340",
        border: "#273055",
        text: "#e8ecf8",
        muted: "#9aa3c0",
        accent: "#7c8cff",
        green: "#4ade80",
        red: "#f87171",
        // legacy keys kept for old scenes
        primary: { 100: "#141a2e", 200: "#1b2340", 300: "#273055", 400: "#0b0e1a" },
        greenAccent: { 100: "#4ade80" },
        redAccent: { 100: "#f87171" },
      }
    : {
        bg: "#f6f7fb",
        surface: "#ffffff",
        surface2: "#eef1f9",
        border: "#e3e7f2",
        text: "#16203c",
        muted: "#5a6482",
        accent: "#5262e0",
        green: "#15803d",
        red: "#b91c1c",
        primary: { 100: "#ffffff", 200: "#eef1f9", 300: "#e3e7f2", 400: "#f6f7fb" },
        greenAccent: { 100: "#15803d" },
        redAccent: { 100: "#b91c1c" },
      }),
});

export const themeSettings = (mode) => {
  const c = tokens(mode);
  return {
    palette: {
      mode,
      primary: { main: c.accent },
      secondary: { main: c.green },
      success: { main: c.green },
      error: { main: c.red },
      divider: c.border,
      background: { default: c.bg, paper: c.surface },
      text: { primary: c.text, secondary: c.muted },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily:
        'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      h3: { fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" },
      h5: { fontSize: 18, fontWeight: 600 },
      h6: {
        fontSize: 15,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: c.muted,
      },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${c.border}`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 14, boxShadow: "none" },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 10, paddingInline: 18 },
          containedPrimary: { color: "#0b0e1a" },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: c.border },
          head: {
            color: c.muted,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:hover": { backgroundColor: `${c.accent}0f` },
            "&:last-child td": { borderBottom: 0 },
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 12 } },
      },
    },
  };
};

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

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
