import { Box } from "@mui/material";
import axios from "axios";
import React, { useEffect, useRef } from "react";
import { create } from "zustand";
import { getBackendURL } from "../backendURL";
import Utility from "./Utility";

interface StartupState {
  loading: boolean;
  setLoading: (loading: boolean) => void;

  showDiagnostic: boolean;
  setShowDiagnostic: (showDiagnostic: boolean) => void;

  lastStatus?: PerPlexed.Status;
  setLastStatus: (status: PerPlexed.Status) => void;

  frontEndStatus?: PerPlexed.Status;
  setFrontEndStatus: (frontEndStatus: PerPlexed.Status) => void;
}

export const useStartupState = create<StartupState>((set) => ({
  loading: true,
  setLoading: (loading) => set({ loading }),

  showDiagnostic: false,
  setShowDiagnostic: (showDiagnostic) => set({ showDiagnostic }),

  lastStatus: undefined,
  setLastStatus: (lastStatus) => set({ lastStatus }),

  frontEndStatus: undefined,
  setFrontEndStatus: (frontEndStatus) => set({ frontEndStatus }),
}));

function Startup() {
  const {
    loading,
    showDiagnostic,
    setShowDiagnostic,
    lastStatus,
    setLastStatus,
    setLoading,
    frontEndStatus,
    setFrontEndStatus,
  } = useStartupState();

  const skipUpdates = useRef<boolean>(false);

  useEffect(() => {
    if (!loading || skipUpdates.current) return;

    const fetchStatus = async () => {
      const res = await axios
        .get(`${getBackendURL()}/status`, {
          timeout: 5000,
        })
        .then((res) => res.data as PerPlexed.Status)
        .catch(() => null);
      if (!res) {
        setFrontEndStatus({
          ready: false,
          error: true,
          message:
            "Frontend could not connect to the backend. Please check the backend logs for more information.",
        });
        return;
      }

      setLastStatus(res);
      if (res.error) setShowDiagnostic(true);
    };

    const interval = setInterval(fetchStatus, 2500);

    return () => {
      clearInterval(interval);
    };
  }, [loading, setFrontEndStatus, setLastStatus, setShowDiagnostic]);

  useEffect(() => {
    if (!lastStatus || skipUpdates.current) return;

    if (lastStatus.ready) {
      (async () => {
        skipUpdates.current = true;
        let reload = false;

        const config = await axios
          .get(`${getBackendURL()}/config`)
          .then((res) => res.data as PerPlexed.Config)
          .catch(() => null);

        if (!config) {
          setFrontEndStatus({
            ready: false,
            error: true,
            message:
              "Frontend could not retrieve the configuration from the backend. Please check the backend logs for more information.",
          });
          skipUpdates.current = false;
          return;
        }

        if (JSON.stringify(config.CONFIG) !== localStorage.getItem("config")) {
          localStorage.setItem("config", JSON.stringify(config.CONFIG));
          reload = true;
        }

        const getBestServer: () => Promise<string | null> = async () => {
          // if the current page is http then filter all https servers
          const servers = config.PLEX_SERVERS.filter((server) => {
            if (window.location.protocol === "http:") {
              if (server.startsWith("https:")) return false;
            }
            if (window.location.protocol === "https:") {
              if (server.startsWith("http:")) return false;
            }
            return true;
          });

          if (servers.length === 0) {
            setFrontEndStatus({
              ready: false,
              error: true,
              message:
                "No servers available for the current protocol. Due to the same-origin policy, the Plex server must be accessible over the same protocol as the PerPlexed frontend.",
            });
            return null;
          }

          const reachableServers = await Promise.all(
            servers.map((server) =>
              axios
                .get(`${server}/identity`, {
                  timeout: config.CONFIG.FRONTEND_SERVER_CHECK_TIMEOUT,
                })
                .then((res) => {
                  if(res.data?.MediaContainer?.machineIdentifier) return server;
                  return null;
                })
                .catch(() => null)
            )
          );

          // server priority goes from left to right from highest to lowest
          const bestServer = reachableServers.find((server) => server !== null);
          if (!bestServer) {
            setFrontEndStatus({
              ready: false,
              error: true,
              message:
                "No servers reachable. Please check the backend logs for more information.",
            });
            return null;
          }

          return bestServer;
        };

        const currServer = localStorage.getItem("server");
        const lastDeployId = localStorage.getItem("deploymentId");

        let bestServer: string | null = null;

        // if a server is defined in localStorage and the deploymentId is the same as the last one, only check the current server for reachability, otherwise get a new best server
        if (currServer && lastDeployId === config.DEPLOYMENTID) {
          // check if the current server is reachable, if not get a new best server
          const res = await axios
            .get(`${currServer}/identity`, {
              timeout: config.CONFIG.FRONTEND_SERVER_CHECK_TIMEOUT,
            })
            .then(() => currServer)
            .catch(() => null);

          if (res) bestServer = currServer;
          else bestServer = await getBestServer();
        } else {
          // get a new best server
          bestServer = await getBestServer();
        }

        if(bestServer !== currServer) reload = true;
        skipUpdates.current = false;

        if(bestServer) localStorage.setItem("server", bestServer);
        else return localStorage.removeItem("server");
        localStorage.setItem("deploymentId", config.DEPLOYMENTID);


        if (reload) return window.location.reload();
        else {
          setShowDiagnostic(false);
          setLoading(false);
        }
      })();
    }
  }, [
    lastStatus,
    setFrontEndStatus,
    setLastStatus,
    setLoading,
    setShowDiagnostic,
  ]);

  if (showDiagnostic || frontEndStatus) return <Utility />;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "black",
      }}
    >
      <img
        src="/plex.png"
        alt="Plex Logo"
        style={{ width: "35vw", height: "auto" }}
      />
    </Box>
  );
}

export default Startup;
