import { Alert, Box, CircularProgress, Collapse, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { queryBuilder } from "../plex/QuickFunctions";
import { useSearchParams } from "react-router-dom";
import { getAccessToken, getPin } from "../plex";
import axios from "axios";
import { getBackendURL } from "../backendURL";
import { XMLParser } from "fast-xml-parser";

export default function Login() {
  const [query] = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  useEffect(() => {
    if (!query.has("pinID")) {
      (async () => {
        const res = await getPin();

        window.location.href = `https://app.plex.tv/auth/#!?clientID=${localStorage.getItem(
          "clientID"
        )}&context[device][product]=Plex%20Web&context[device][version]=4.118.0&context[device][platform]=Firefox&context[device][platformVersion]=122.0&context[device][device]=Linux&context[device][model]=bundled&context[device][screenResolution]=1920x945,1920x1080&context[device][layout]=desktop&context[device][protocol]=${window.location.protocol.replace(
          ":",
          ""
        )}&forwardUrl=${window.location.protocol}//${
          window.location.host
        }/login?pinID=${res.id}&code=${res.code}&language=en`;
      })();
    }

    if (query.has("pinID")) {
      (async () => {
        const res = await getAccessToken(query.get("pinID") as string);

        // successful login

        if (!res.authToken) {
          setError("Failed to log in. Please try again.");
          return;
        }

        const server: string = (await axios.get(`${getBackendURL()}/server`)).data.trim();

        // check token validity against the server
        const tokenCheck = await axios.get(`${server}/?${queryBuilder({ "X-Plex-Token": res.authToken })}`).catch(() => {
          return { status: 401 };
        })

        if (tokenCheck.status === 200) {
          localStorage.setItem("accessToken", res.authToken);
          window.location.href = "/";
        }

        const serverID = (await axios.get(`${server}/identity`)).data.MediaContainer.machineIdentifier;

        const parser = new XMLParser({
          attributeNamePrefix: "",
          textNodeName: "value",
          ignoreAttributes: false,
          parseAttributeValue: true,
        });

        // try getting a shared server
        const sharedServersXML = await axios.get(`https://plex.tv/api/resources?${queryBuilder({ "X-Plex-Token": res.authToken })}`);

        const sharedServers = parser.parse(sharedServersXML.data)

        const targetServer = sharedServers.MediaContainer.Device.find((d: any) => d.clientIdentifier === serverID);

        if (!targetServer) return setError("You do not have access to this server.");

        localStorage.setItem("accessToken", targetServer.accessToken);

        window.location.href = "/";
      })();
    }
  }, [query]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Collapse in={Boolean(error)}>
        <Alert severity="error">
          {error}
        </Alert>
      </Collapse>
      {!error && (
        <>
          <CircularProgress />
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: "bold",
            }}
          >
            Logging in...
          </Typography>
        </>
      )}
    </Box>
  );
}
