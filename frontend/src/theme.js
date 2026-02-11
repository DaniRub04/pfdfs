import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#120a2a", // morado profundo
      paper: "rgba(255,255,255,0.06)",
    },
    text: {
      primary: "rgba(255,255,255,0.92)",
      secondary: "rgba(255,255,255,0.72)",
    },
    primary: {
      main: "#2dd4bf", // teal neon
    },
    secondary: {
      main: "#a855f7", // morado neon suave
    },
    error: {
      main: "#ff3b81", // rosa retro
    },
    warning: {
      main: "#ffb703", // amarillo vintage
    },
    info: {
      main: "#38bdf8", // azul eléctrico
    },
    success: {
      main: "#22c55e",
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
    button: { textTransform: "none", fontWeight: 900 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(10, 10, 28, 0.72)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.10)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          background: "rgba(255,255,255,0.04)",
        },
        notchedOutline: {
          borderColor: "rgba(255,255,255,0.14)",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          background: "rgba(10, 10, 28, 0.92)",
          backdropFilter: "blur(10px)",
        },
      },
    },
  },
});
