import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { makeid } from "./plex/QuickFunctions";
import axios from "axios";

if(!localStorage.getItem("clientID")) localStorage.setItem("clientID", makeid(10));

(async () => {
  const server = await axios.get("/server");
  if(server.data !== localStorage.getItem("server")) {
    localStorage.setItem("server", server.data);
    window.location.reload();
  }
})();

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
