import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import React from "react";
import { useParams } from "react-router-dom";
import { getLibraryDir } from "../plex";
import { useQuery } from "react-query";
import MovieItem from "../components/MovieItem";

export default function Library() {
  const { libraryKey, dir, subdir } = useParams() as {
    libraryKey: string;
    dir: string;
    subdir?: string;
  };

  const results = useQuery(
    ["library", { query: dir, libraryKey: Number(libraryKey), subdir: subdir }],
    () => getLibraryDir(Number(libraryKey), dir, subdir)
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        width: "100%",
        height: "fit-content",
        mt: "64px",
        px: 6,
        
        pt: 4,
        pb: 2,
      }}
    >
      {results.isLoading && <CircularProgress />}
      {results.isError && <Typography>Error</Typography>}

      {results.isSuccess && (
        <>
          <Typography variant="h3" sx={{ mt: 2 }}>
            {results.data.library} - {results.data.title}
          </Typography>
          {!results && <CircularProgress sx={{ mt: 4 }} />}
          <Grid container spacing={2} sx={{ mt: 2, width: "100%" }}>
            {results &&
              results.data.Metadata.map((item) => (
                <Grid item key={item.ratingKey} xl={3} lg={4} md={6} sm={12} xs={12}>
                  <MovieItem
                    item={item}
                  />
                </Grid>
              ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
