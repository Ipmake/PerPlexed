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
  DISABLE_PERPLEXED_SYNC: false
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
          main: "#e6a104",
        },
        secondary: {
          main: "#3f51b5",
        },
        background: {
          default: "#000000",
          paper: "#000000",
        },
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
