import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { makeid, uuidv4 } from "./plex/QuickFunctions";

import "@fontsource-variable/quicksand";
import '@fontsource-variable/rubik';
import '@fontsource/ibm-plex-sans';
import '@fontsource-variable/inter';

if(!localStorage.getItem("clientID")) localStorage.setItem("clientID", makeid(24));

sessionStorage.setItem("sessionID", uuidv4());

let config: PerPlexed.ConfigOptions = {
  DISABLE_PROXY: false,
  DISABLE_NEVU_SYNC: false
};

(() => {
  if(!localStorage.getItem("config")) return
  config = JSON.parse(localStorage.getItem("config") as string) as PerPlexed.ConfigOptions;
})();

if(!localStorage.getItem("quality")) localStorage.setItem("quality", "12000");

export { config };

ReactDOM.render(
  <ThemeProvider
    theme={createTheme({
      palette: {
        mode: "dark",
        primary: {
          main: "#9950D9",
          dark: "#64229D", // 2E1246
          light: "#A15EEA",
        },
        secondary: {
          main: "#7C3AED",
        },
        background: {
          default: "#000000",
          paper: "#1A1A1A",
        },
        text: {
          primary: "#F4F8FF",
          secondary: "#F4F8FF",
        },
        success: {
          main: "#22C55E",
        },
        warning: {
          main: "#FACC15",
        },
        error: {
          main: "#EF4444"
        }
      },
      typography: {
        fontFamily: '"Inter Variable", sans-serif',
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              fontFamily: '"Inter Variable", sans-serif',
              borderRadius: "7px",
            },
          },
        },
        MuiBackdrop: {
          styleOverrides: {
            root: {
              height: "100vh",
            },
          },
        }
      }
    })}
  >
    <CssBaseline />
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </ThemeProvider>,
  document.getElementById("root")
);
