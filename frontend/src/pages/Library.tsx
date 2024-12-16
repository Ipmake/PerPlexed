import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getLibraryDir, getLibraryMeta, getSearch } from "../plex";
import { MovieItem } from "../components/MetaScreen";
import { queryBuilder } from "../plex/QuickFunctions";
import { useQuery } from "react-query";

export default function Library() {
  const { libraryKey, dir, subdir } = useParams() as {
    libraryKey: string;
    dir: string;
    subdir?: string;
  };
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

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
                <Grid item key={item.ratingKey} xs={3}>
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
