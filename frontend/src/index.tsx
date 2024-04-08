import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { makeid, uuidv4 } from "./plex/QuickFunctions";
import axios from "axios";
import { getBackendURL } from "./backendURL";

if(!localStorage.getItem("clientID")) localStorage.setItem("clientID", makeid(24));

sessionStorage.setItem("sessionID", uuidv4());

(async () => {
  let reload = false;

  const config = await axios.get(`${getBackendURL()}/config`);
  if(config.data.PLEX_SERVER !== localStorage.getItem("server")) {
    localStorage.setItem("server", config.data.PLEX_SERVER);
    reload = true;
  }

  if(JSON.stringify(config.data.CONFIG) !== localStorage.getItem("config")) {
    localStorage.setItem("config", JSON.stringify(config.data.CONFIG));
    reload = true;
  }

  if(reload) return window.location.reload();
})();

interface ConfigInterface {
  [key: string]: any;
}

let config: ConfigInterface;

(() => {
  if(!localStorage.getItem("config")) return
  config = JSON.parse(localStorage.getItem("config") as string) as ConfigInterface;
})();

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
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
            },
          },
        },
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
