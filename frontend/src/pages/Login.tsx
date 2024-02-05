import { Box, CircularProgress, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { queryBuilder } from "../plex/QuickFunctions";
import { useSearchParams } from "react-router-dom";
import { getAccessToken, getPin } from "../plex";

export default function Login() {
const [query] = useSearchParams();
  useEffect(() => {
    if(!query.has("pinID")) {
        (async () => {
            const res = await getPin();

            window.location.href = `https://app.plex.tv/auth/#!?clientID=${localStorage.getItem("clientID")}&context[device][product]=Plex%20Web&context[device][version]=4.118.0&context[device][platform]=Firefox&context[device][platformVersion]=122.0&context[device][device]=Linux&context[device][model]=bundled&context[device][screenResolution]=1920x945,1920x1080&context[device][layout]=desktop&context[device][protocol]=http&forwardUrl=${window.location.protocol}//${window.location.host}/login?pinID=${res.id}&code=${res.code}&language=en`;
        })()
    }

    if(query.has("pinID")) {
        (async () => {
            const res = await getAccessToken(query.get("pinID") as string);
            
            if(res.authToken) localStorage.setItem("accessToken", res.authToken);

            window.location.href = "/"
        })();
    }
  }, [query]);

  return (
    <Box sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
    }}>
      <CircularProgress />
      <Typography
        sx={{
          fontSize: "1rem",
          fontWeight: "bold",
        }}
      >
        Logging in...
      </Typography>
    </Box>
  );
}
