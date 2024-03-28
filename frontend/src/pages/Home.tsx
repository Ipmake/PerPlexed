import { Avatar, Box, Grid, Typography } from "@mui/material";
import React from "react";
import { useQuery } from "react-query";
import { getAllLibraries } from "../plex";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const libraries = useQuery("libraries", getAllLibraries);
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",

        pt: "64px",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          px: 6,
        }}
      >
        <Typography sx={{ mt: 2, fontSize: "2rem", fontWeight: "bold" }}>
          Libraries
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2, width: "100%" }}>
          {libraries.data
            ?.filter((e) => ["movie", "show"].includes(e.type))
            .map((library) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={library.key}>
                <Box
                  sx={{
                    width: "100%",
                    height: "auto",
                    aspectRatio: "21/9",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 2,
                    p: 2,
                    transition: "all 0.2s ease-in-out",
                    background: `
                    linear-gradient(90deg, #000000AA, #000000AA),
                    url(${localStorage.getItem("server")}${
                      library.art
                    }?X-Plex-Token=${localStorage.getItem("accessToken")})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",

                    userSelect: "none",
                    cursor: "pointer",

                    "&:hover": { transform: "scale(1.05)" },
                  }}
                  onClick={() => navigate(`/browse/${library.key}`)}
                >
                  <Avatar
                    variant="rounded"
                    src={`${localStorage.getItem("server")}${
                      library.thumb
                    }?X-Plex-Token=${localStorage.getItem("accessToken")}`}
                    sx={{ width: 100, height: 100 }}
                  />
                  <Typography sx={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: "white",
                    textShadow: "3px 3px 1px #232529",
                    mt: 1,
                  }}>{library.title}</Typography>
                </Box>
              </Grid>
            ))}
        </Grid>
      </Box>

      WIP
    </Box>
  );
}
